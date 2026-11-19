package service_test

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/alicebob/miniredis/v2" // NEW
	"github.com/redis/go-redis/v9"     // NEW
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/Blindheroes/taskapp/internal/apperr"
	"github.com/Blindheroes/taskapp/internal/cache"
	"github.com/Blindheroes/taskapp/internal/model"
	"github.com/Blindheroes/taskapp/internal/repository"
	"github.com/Blindheroes/taskapp/internal/service"
)

// ---------- test doubles ----------

type spyCache struct{ deletes []string }

func (s *spyCache) Get(_ context.Context, _ string, _ any) (bool, error) { return false, nil }
func (s *spyCache) Set(_ context.Context, _ string, _ any, _ time.Duration) error { return nil }
func (s *spyCache) Delete(_ context.Context, keys ...string) error {
	s.deletes = append(s.deletes, keys...)
	return nil
}
func (s *spyCache) DeleteByPrefix(_ context.Context, p string) error {
	s.deletes = append(s.deletes, "prefix:"+p)
	return nil
}

type mockRepo struct {
	listFn       func(context.Context, model.TaskFilter) ([]model.Task, int64, error)
	getFn        func(context.Context, uint64) (*model.Task, error)
	createFn     func(context.Context, model.CreateTaskInput) (*model.Task, error)
	updateFn     func(context.Context, uint64, model.UpdateTaskInput) (*model.Task, error)
	softDeleteFn func(context.Context, uint64) (bool, error)
}

func (m *mockRepo) List(ctx context.Context, f model.TaskFilter) ([]model.Task, int64, error) {
	return m.listFn(ctx, f)
}
func (m *mockRepo) GetByID(ctx context.Context, id uint64) (*model.Task, error) {
	return m.getFn(ctx, id)
}
func (m *mockRepo) Create(ctx context.Context, in model.CreateTaskInput) (*model.Task, error) {
	return m.createFn(ctx, in)
}
func (m *mockRepo) Update(ctx context.Context, id uint64, in model.UpdateTaskInput) (*model.Task, error) {
	return m.updateFn(ctx, id, in)
}
func (m *mockRepo) SoftDelete(ctx context.Context, id uint64) (bool, error) {
	return m.softDeleteFn(ctx, id)
}

func newSvc(r *mockRepo, c *spyCache) *service.TaskService { return service.NewTaskService(r, c) }

// ---------- tests: search ----------

func TestList_Search_PassesKeywordAndPagination(t *testing.T) {
	var captured model.TaskFilter
	r := &mockRepo{
		listFn: func(_ context.Context, f model.TaskFilter) ([]model.Task, int64, error) {
			captured = f
			return []model.Task{{ID: 1, Title: "buy milk"}}, 1, nil
		},
	}
	svc := newSvc(r, &spyCache{})

	res, err := svc.List(context.Background(), model.TaskFilter{Keyword: "milk", Page: 2, Limit: 5})
	require.NoError(t, err)
	assert.Equal(t, "milk", captured.Keyword)
	assert.Equal(t, 2, captured.Page)
	assert.Equal(t, 5, captured.Limit)
	assert.Equal(t, 1, len(res.Items))
	assert.Equal(t, int64(1), res.Meta.Total)
	assert.Equal(t, 1, res.Meta.TotalPages)
}

func TestList_InvalidStatus_ReturnsValidation(t *testing.T) {
	svc := newSvc(&mockRepo{listFn: func(context.Context, model.TaskFilter) ([]model.Task, int64, error) {
		t.Fatal("repo should not be called")
		return nil, 0, nil
	}}, &spyCache{})

	_, err := svc.List(context.Background(), model.TaskFilter{Status: "blocked"})
	var appErr *apperr.Error
	require.True(t, errors.As(err, &appErr))
	assert.Equal(t, apperr.CodeValidation, appErr.Code)
}

// ---------- tests: update ----------

func TestUpdate_NotFound(t *testing.T) {
	r := &mockRepo{updateFn: func(context.Context, uint64, model.UpdateTaskInput) (*model.Task, error) {
		return nil, nil
	}}
	svc := newSvc(r, &spyCache{})

	title := "new"
	_, err := svc.Update(context.Background(), 99, model.UpdateTaskInput{Title: &title})
	var appErr *apperr.Error
	require.True(t, errors.As(err, &appErr))
	assert.Equal(t, apperr.CodeNotFound, appErr.Code)
}

func TestUpdate_DuplicateTitle_ReturnsConflict(t *testing.T) {
	r := &mockRepo{updateFn: func(context.Context, uint64, model.UpdateTaskInput) (*model.Task, error) {
		return nil, repository.ErrDuplicateTitle
	}}
	svc := newSvc(r, &spyCache{})

	title := "dup"
	_, err := svc.Update(context.Background(), 1, model.UpdateTaskInput{Title: &title})
	var appErr *apperr.Error
	require.True(t, errors.As(err, &appErr))
	assert.Equal(t, apperr.CodeConflict, appErr.Code)
	assert.Equal(t, 409, appErr.Status)
}

// ---------- tests: cache invalidation ----------

func TestCreate_InvalidatesListCache(t *testing.T) {
	r := &mockRepo{createFn: func(_ context.Context, in model.CreateTaskInput) (*model.Task, error) {
		return &model.Task{ID: 1, Title: in.Title}, nil
	}}
	c := &spyCache{}
	svc := newSvc(r, c)

	_, err := svc.Create(context.Background(), model.CreateTaskInput{Title: "x"})
	require.NoError(t, err)
	assert.Equal(t, []string{"prefix:tasks:list:"}, c.deletes)
}

func TestUpdate_InvalidatesListCache(t *testing.T) {
	r := &mockRepo{updateFn: func(context.Context, uint64, model.UpdateTaskInput) (*model.Task, error) {
		return &model.Task{ID: 1}, nil
	}}
	c := &spyCache{}
	svc := newSvc(r, c)

	title := "y"
	_, err := svc.Update(context.Background(), 1, model.UpdateTaskInput{Title: &title})
	require.NoError(t, err)
	assert.Equal(t, []string{"prefix:tasks:list:"}, c.deletes)
}

func TestDelete_InvalidatesListCache(t *testing.T) {
	r := &mockRepo{softDeleteFn: func(context.Context, uint64) (bool, error) { return true, nil }}
	c := &spyCache{}
	svc := newSvc(r, c)

	require.NoError(t, svc.Delete(context.Background(), 1))
	assert.Equal(t, []string{"prefix:tasks:list:"}, c.deletes)
}

func TestDelete_NotFound(t *testing.T) {
	r := &mockRepo{softDeleteFn: func(context.Context, uint64) (bool, error) { return false, nil }}
	svc := newSvc(r, &spyCache{})

	err := svc.Delete(context.Background(), 42)
	var appErr *apperr.Error
	require.True(t, errors.As(err, &appErr))
	assert.Equal(t, apperr.CodeNotFound, appErr.Code)
}


func TestList_CacheHit_ThenInvalidatedByUpdate(t *testing.T) {
	mr, err := miniredis.Run()
	require.NoError(t, err)
	t.Cleanup(mr.Close)
	rdb := redis.NewClient(&redis.Options{Addr: mr.Addr()})
	t.Cleanup(func() { _ = rdb.Close() })

	repoCalls := 0
	r := &mockRepo{
		listFn: func(context.Context, model.TaskFilter) ([]model.Task, int64, error) {
			repoCalls++
			return []model.Task{{ID: 1, Title: "x"}}, 1, nil
		},
		updateFn: func(context.Context, uint64, model.UpdateTaskInput) (*model.Task, error) {
			return &model.Task{ID: 1}, nil
		},
	}
	svc := service.NewTaskService(r, cache.NewRedis(rdb))
	ctx := context.Background()
	f := model.TaskFilter{Page: 1, Limit: 10}

	// 1st call -> miss, repo hit
	_, err = svc.List(ctx, f)
	require.NoError(t, err)
	assert.Equal(t, 1, repoCalls)

	// 2nd call -> hit, repo NOT called
	_, err = svc.List(ctx, f)
	require.NoError(t, err)
	assert.Equal(t, 1, repoCalls, "second call must be served by cache")

	// Update -> invalidates
	title := "y"
	_, err = svc.Update(ctx, 1, model.UpdateTaskInput{Title: &title})
	require.NoError(t, err)

	// 3rd call -> miss again, repo called again
	_, err = svc.List(ctx, f)
	require.NoError(t, err)
	assert.Equal(t, 2, repoCalls, "cache must be invalidated after update")
}

func TestList_DifferentQueryParamsUseDifferentCacheKeys(t *testing.T) {
	mr, err := miniredis.Run()
	require.NoError(t, err)
	t.Cleanup(mr.Close)
	rdb := redis.NewClient(&redis.Options{Addr: mr.Addr()})
	t.Cleanup(func() { _ = rdb.Close() })

	var capturedFilters []model.TaskFilter
	r := &mockRepo{
		listFn: func(_ context.Context, f model.TaskFilter) ([]model.Task, int64, error) {
			capturedFilters = append(capturedFilters, f)
			return []model.Task{}, 0, nil
		},
	}
	svc := service.NewTaskService(r, cache.NewRedis(rdb))
	ctx := context.Background()

	_, _ = svc.List(ctx, model.TaskFilter{Page: 1, Limit: 10, Status: "todo"})
	_, _ = svc.List(ctx, model.TaskFilter{Page: 1, Limit: 10, Status: "done"})   // different status
	_, _ = svc.List(ctx, model.TaskFilter{Page: 2, Limit: 10, Status: "todo"})   // different page
	_, _ = svc.List(ctx, model.TaskFilter{Page: 1, Limit: 10, Status: "todo"})   // SAME as 1st -> cache hit

	// 4 requests, but repo only called 3 times (4th is cache hit)
	assert.Equal(t, 3, len(capturedFilters))
}