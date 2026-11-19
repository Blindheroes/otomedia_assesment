package repository

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strings"

	mysqldrv "github.com/go-sql-driver/mysql"

	"github.com/Blindheroes/taskapp/internal/model"
)

type MySQLTaskRepo struct{ db *sql.DB }

func NewMySQLTaskRepo(db *sql.DB) *MySQLTaskRepo { return &MySQLTaskRepo{db: db} }

// sortableColumns is a hard whitelist â€” anything else is silently dropped.
// This prevents SQL injection via the `sort` query param.
var sortableColumns = map[string]string{
	"id":         "id",
	"title":      "title",
	"status":     "status",
	"assignee":   "assignee",
	"created_at": "created_at",
	"updated_at": "updated_at",
}

func buildOrderBy(sort string) string {
	var clauses []string
	for _, part := range strings.Split(sort, ",") {
		part = strings.TrimSpace(part)
		if part == "" {
			continue
		}
		segs := strings.SplitN(part, ":", 2)
		col := strings.TrimSpace(segs[0])
		dir := "ASC"
		if len(segs) == 2 && strings.EqualFold(strings.TrimSpace(segs[1]), "desc") {
			dir = "DESC"
		}
		if real, ok := sortableColumns[col]; ok {
			clauses = append(clauses, real+" "+dir)
		}
	}
	if len(clauses) == 0 {
		clauses = []string{"created_at DESC"}
	}
	return "ORDER BY " + strings.Join(clauses, ", ")
}

func (r *MySQLTaskRepo) List(ctx context.Context, f model.TaskFilter) ([]model.Task, int64, error) {
	where := []string{"deleted_at IS NULL"}
	args := []any{}

	if f.Status != "" {
		where = append(where, "status = ?")
		args = append(args, f.Status)
	}
	if f.Keyword != "" {
		where = append(where, "(title LIKE ? OR description LIKE ?)")
		kw := "%" + f.Keyword + "%"
		args = append(args, kw, kw)
	}
	if f.Assignee != "" {
		where = append(where, "assignee = ?")
		args = append(args, f.Assignee)
	}

	whereSQL := "WHERE " + strings.Join(where, " AND ")

	var total int64
	if err := r.db.QueryRowContext(ctx, "SELECT COUNT(*) FROM tasks "+whereSQL, args...).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("count tasks: %w", err)
	}

	q := fmt.Sprintf(
		"SELECT id, title, description, status, assignee, created_at, updated_at FROM tasks %s %s LIMIT ? OFFSET ?",
		whereSQL, buildOrderBy(f.Sort),
	)
	args = append(args, f.Limit, f.Offset())

	rows, err := r.db.QueryContext(ctx, q, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("list tasks: %w", err)
	}
	defer rows.Close()

	items := make([]model.Task, 0, f.Limit)
	for rows.Next() {
		t, err := scanTask(rows)
		if err != nil {
			return nil, 0, err
		}
		items = append(items, t)
	}
	return items, total, rows.Err()
}

func (r *MySQLTaskRepo) GetByID(ctx context.Context, id uint64) (*model.Task, error) {
	q := `SELECT id, title, description, status, assignee, created_at, updated_at
	      FROM tasks WHERE id = ? AND deleted_at IS NULL`
	row := r.db.QueryRowContext(ctx, q, id)
	t, err := scanTask(row)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("get task: %w", err)
	}
	return &t, nil
}

func (r *MySQLTaskRepo) Create(ctx context.Context, in model.CreateTaskInput) (*model.Task, error) {
	status := in.Status
	if status == "" {
		status = model.StatusTodo
	}
	res, err := r.db.ExecContext(ctx,
		`INSERT INTO tasks (title, description, status, assignee) VALUES (?, ?, ?, ?)`,
		in.Title, in.Description, status, in.Assignee,
	)
	if err != nil {
		if isDuplicate(err) {
			return nil, ErrDuplicateTitle
		}
		return nil, fmt.Errorf("insert task: %w", err)
	}
	id, _ := res.LastInsertId()
	return r.GetByID(ctx, uint64(id))
}

func (r *MySQLTaskRepo) Update(ctx context.Context, id uint64, in model.UpdateTaskInput) (*model.Task, error) {
	// Existence check (also handles "already deleted" correctly).
	existing, err := r.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if existing == nil {
		return nil, nil
	}

	var sets []string
	var args []any
	if in.Title != nil {
		sets = append(sets, "title = ?")
		args = append(args, *in.Title)
	}
	if in.Description != nil {
		sets = append(sets, "description = ?")
		args = append(args, *in.Description)
	}
	if in.Status != nil {
		sets = append(sets, "status = ?")
		args = append(args, *in.Status)
	}
	if in.Assignee != nil {
		sets = append(sets, "assignee = ?")
		args = append(args, *in.Assignee)
	}
	if len(sets) == 0 {
		return existing, nil // nothing to update â€” return current state
	}

	args = append(args, id)
	q := "UPDATE tasks SET " + strings.Join(sets, ", ") + " WHERE id = ? AND deleted_at IS NULL"
	if _, err := r.db.ExecContext(ctx, q, args...); err != nil {
		if isDuplicate(err) {
			return nil, ErrDuplicateTitle
		}
		return nil, fmt.Errorf("update task: %w", err)
	}
	return r.GetByID(ctx, id)
}

func (r *MySQLTaskRepo) SoftDelete(ctx context.Context, id uint64) (bool, error) {
	res, err := r.db.ExecContext(ctx,
		`UPDATE tasks SET deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND deleted_at IS NULL`, id)
	if err != nil {
		return false, fmt.Errorf("soft delete task: %w", err)
	}
	n, _ := res.RowsAffected()
	return n > 0, nil
}

// --- helpers ---

type rowScanner interface {
	Scan(dest ...any) error
}

func scanTask(s rowScanner) (model.Task, error) {
	var (
		t        model.Task
		desc     sql.NullString
		assignee sql.NullString
	)
	if err := s.Scan(&t.ID, &t.Title, &desc, &t.Status, &assignee, &t.CreatedAt, &t.UpdatedAt); err != nil {
		return model.Task{}, err
	}
	t.Description = desc.String
	t.Assignee = assignee.String
	return t, nil
}

func isDuplicate(err error) bool {
	var me *mysqldrv.MySQLError
	return errors.As(err, &me) && me.Number == 1062
}
