package repository_test

import (
	"context"
	"database/sql"
	"testing"
	"time"

	"github.com/DATA-DOG/go-sqlmock"
	mysqldrv "github.com/go-sql-driver/mysql"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/Blindheroes/taskapp/internal/model"
	"github.com/Blindheroes/taskapp/internal/repository"
)

func newMock(t *testing.T) (*sql.DB, sqlmock.Sqlmock) {
	t.Helper()
	db, mock, err := sqlmock.New()
	require.NoError(t, err)
	t.Cleanup(func() { _ = db.Close() })
	return db, mock
}

// fixtureTime returns a fixed timestamp used in row fixtures.
// Using real time.Time (not a string) because sqlmock returns raw values
// verbatim without running the driver's parseTime conversion.
func fixtureTime() time.Time {
	return time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC)
}

func TestList_AppliesFiltersAndSortWhitelist(t *testing.T) {
	db, mock := newMock(t)
	repo := repository.NewMySQLTaskRepo(db)

	f := model.TaskFilter{Status: "todo", Keyword: "buy", Assignee: "alice", Page: 2, Limit: 5, Sort: "title:asc"}
	f.Normalize()

	ts := fixtureTime()

	// COUNT query
	mock.ExpectQuery(`SELECT COUNT\(\*\) FROM tasks WHERE deleted_at IS NULL AND status = \? AND \(title LIKE \? OR description LIKE \?\) AND assignee = \?`).
		WithArgs("todo", "%buy%", "%buy%", "alice").
		WillReturnRows(sqlmock.NewRows([]string{"c"}).AddRow(12))

	// SELECT query: sort MUST be "title ASC" (whitelist), limit/offset applied
	mock.ExpectQuery(`SELECT id, title, description, status, assignee, created_at, updated_at FROM tasks .* ORDER BY title ASC LIMIT \? OFFSET \?`).
		WithArgs("todo", "%buy%", "%buy%", "alice", 5, 5).
		WillReturnRows(sqlmock.NewRows([]string{
			"id", "title", "description", "status", "assignee", "created_at", "updated_at",
		}).AddRow(3, "buy milk", "2L", "todo", "alice", ts, ts))

	items, total, err := repo.List(context.Background(), f)
	require.NoError(t, err)
	assert.Equal(t, int64(12), total)
	require.Len(t, items, 1)
	assert.Equal(t, "buy milk", items[0].Title)
	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestList_InvalidSortFallsBackToDefault(t *testing.T) {
	db, mock := newMock(t)
	repo := repository.NewMySQLTaskRepo(db)

	// Malicious sort input -- whitelist must reject it and fall back.
	f := model.TaskFilter{Page: 1, Limit: 10, Sort: "id; DROP TABLE tasks"}
	f.Normalize()

	mock.ExpectQuery(`SELECT COUNT\(\*\) FROM tasks WHERE deleted_at IS NULL`).
		WillReturnRows(sqlmock.NewRows([]string{"c"}).AddRow(0))

	mock.ExpectQuery(`ORDER BY created_at DESC`).
		WithArgs(10, 0).
		WillReturnRows(sqlmock.NewRows([]string{
			"id", "title", "description", "status", "assignee", "created_at", "updated_at",
		}))

	_, _, err := repo.List(context.Background(), f)
	require.NoError(t, err)
	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestSoftDelete_NotFound(t *testing.T) {
	db, mock := newMock(t)
	repo := repository.NewMySQLTaskRepo(db)

	mock.ExpectExec(`UPDATE tasks SET deleted_at = CURRENT_TIMESTAMP WHERE id = \? AND deleted_at IS NULL`).
		WithArgs(uint64(99)).
		WillReturnResult(sqlmock.NewResult(0, 0)) // 0 rows affected

	ok, err := repo.SoftDelete(context.Background(), 99)
	require.NoError(t, err)
	assert.False(t, ok)
	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestUpdate_DuplicateTitleMapsToConflict(t *testing.T) {
	db, mock := newMock(t)
	repo := repository.NewMySQLTaskRepo(db)

	ts := fixtureTime()

	// existence check (GetByID)
	mock.ExpectQuery(`SELECT id, title.*WHERE id = \? AND deleted_at IS NULL`).
		WithArgs(uint64(1)).
		WillReturnRows(sqlmock.NewRows([]string{
			"id", "title", "description", "status", "assignee", "created_at", "updated_at",
		}).AddRow(1, "old", "", "todo", "", ts, ts))

	// update attempt -> MySQL 1062 must surface as ErrDuplicateTitle
	mock.ExpectExec(`UPDATE tasks SET title = \? WHERE id = \? AND deleted_at IS NULL`).
		WithArgs("new", uint64(1)).
		WillReturnError(&mysqldrv.MySQLError{Number: 1062, Message: "Duplicate entry"})

	title := "new"
	_, err := repo.Update(context.Background(), 1, model.UpdateTaskInput{Title: &title})
	require.ErrorIs(t, err, repository.ErrDuplicateTitle)
	assert.NoError(t, mock.ExpectationsWereMet())
}