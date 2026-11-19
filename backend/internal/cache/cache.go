package cache

import (
	"context"
	"time"
)

// Cache is the boundary the service uses. Task 1 uses Noop.
// Task 2 will provide a Redis implementation â€” no service changes needed.
type Cache interface {
	Get(ctx context.Context, key string, dest any) (bool, error)
	Set(ctx context.Context, key string, value any, ttl time.Duration) error
	Delete(ctx context.Context, keys ...string) error
	DeleteByPrefix(ctx context.Context, prefix string) error
}

type noop struct{}

func NewNoop() Cache { return noop{} }

func (noop) Get(_ context.Context, _ string, _ any) (bool, error)      { return false, nil }
func (noop) Set(_ context.Context, _ string, _ any, _ time.Duration) error { return nil }
func (noop) Delete(_ context.Context, _ ...string) error               { return nil }
func (noop) DeleteByPrefix(_ context.Context, _ string) error          { return nil }
