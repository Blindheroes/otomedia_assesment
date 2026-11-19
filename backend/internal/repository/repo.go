package repository

import (
	"context"
	"errors"

	"github.com/Blindheroes/taskapp/internal/model"
)

var ErrDuplicateTitle = errors.New("duplicate title")

type TaskRepo interface {
	List(ctx context.Context, f model.TaskFilter) ([]model.Task, int64, error)
	GetByID(ctx context.Context, id uint64) (*model.Task, error)
	Create(ctx context.Context, in model.CreateTaskInput) (*model.Task, error)
	Update(ctx context.Context, id uint64, in model.UpdateTaskInput) (*model.Task, error)
	SoftDelete(ctx context.Context, id uint64) (bool, error)
}
