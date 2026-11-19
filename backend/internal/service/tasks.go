package service

import (
	"context"
	"errors"
	"fmt"
	"net/url"
	"time"

	"github.com/Blindheroes/taskapp/internal/apperr"
	"github.com/Blindheroes/taskapp/internal/cache"
	"github.com/Blindheroes/taskapp/internal/model"
	"github.com/Blindheroes/taskapp/internal/repository"
)

const (
	listCachePrefix = "tasks:list:"
	listCacheTTL    = 120 * time.Second ) 
	

type TaskService struct {
	repo  repository.TaskRepo
	cache cache.Cache
}

func NewTaskService(repo repository.TaskRepo, c cache.Cache) *TaskService {
	return &TaskService{repo: repo, cache: c}
}


func buildListCacheKey(f model.TaskFilter) string {
	return fmt.Sprintf(
		"%sstatus=%s&keyword=%s&assignee=%s&page=%d&limit=%d&sort=%s",
		listCachePrefix,
		url.QueryEscape(f.Status),
		url.QueryEscape(f.Keyword),
		url.QueryEscape(f.Assignee),
		f.Page,
		f.Limit,
		url.QueryEscape(f.Sort),
	)
}

func (s *TaskService) List(ctx context.Context, f model.TaskFilter) (model.TaskListResult, error) {
	f.Normalize()

	if f.Status != "" && !model.TaskStatus(f.Status).IsValid() {
		return model.TaskListResult{}, apperr.Validation("invalid status", map[string]string{
			"status": "must be one of: todo, in_progress, done",
		})
	}

	// --- Task 2: cache read ---
	key := buildListCacheKey(f)
	var cached model.TaskListResult
	if hit, err := s.cache.Get(ctx, key, &cached); err == nil && hit {
		return cached, nil
	}

	items, total, err := s.repo.List(ctx, f)
	if err != nil {
		return model.TaskListResult{}, apperr.Internal(err)
	}

	totalPages := 0
	if f.Limit > 0 {
		totalPages = int((total + int64(f.Limit) - 1) / int64(f.Limit))
	}
	result := model.TaskListResult{
		Items: items,
		Meta: model.Pagination{
			Page: f.Page, Limit: f.Limit, Total: total, TotalPages: totalPages,
		},
	}

	// --- Task 2: cache write (ignore failures — Redis being down must not fail the request) ---
	_ = s.cache.Set(ctx, key, result, listCacheTTL)

	return result, nil
}

func (s *TaskService) GetByID(ctx context.Context, id uint64) (*model.Task, error) {
	t, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, apperr.Internal(err)
	}
	if t == nil {
		return nil, apperr.NotFound("task not found")
	}
	return t, nil
}

func (s *TaskService) Create(ctx context.Context, in model.CreateTaskInput) (*model.Task, error) {
	if in.Status == "" {
		in.Status = model.StatusTodo
	}
	if !in.Status.IsValid() {
		return nil, apperr.Validation("invalid status", map[string]string{
			"status": "must be one of: todo, in_progress, done",
		})
	}

	t, err := s.repo.Create(ctx, in)
	if err != nil {
		if errors.Is(err, repository.ErrDuplicateTitle) {
			return nil, apperr.Conflict("a task with this title already exists")
		}
		return nil, apperr.Internal(err)
	}
	_ = s.cache.DeleteByPrefix(ctx, listCachePrefix)
	return t, nil
}

func (s *TaskService) Update(ctx context.Context, id uint64, in model.UpdateTaskInput) (*model.Task, error) {
	if in.Status != nil && !in.Status.IsValid() {
		return nil, apperr.Validation("invalid status", map[string]string{
			"status": "must be one of: todo, in_progress, done",
		})
	}

	t, err := s.repo.Update(ctx, id, in)
	if err != nil {
		if errors.Is(err, repository.ErrDuplicateTitle) {
			return nil, apperr.Conflict("a task with this title already exists")
		}
		return nil, apperr.Internal(err)
	}
	if t == nil {
		return nil, apperr.NotFound("task not found")
	}
	_ = s.cache.DeleteByPrefix(ctx, listCachePrefix)
	return t, nil
}

func (s *TaskService) Delete(ctx context.Context, id uint64) error {
	ok, err := s.repo.SoftDelete(ctx, id)
	if err != nil {
		return apperr.Internal(err)
	}
	if !ok {
		return apperr.NotFound("task not found")
	}
	_ = s.cache.DeleteByPrefix(ctx, listCachePrefix)
	return nil
}