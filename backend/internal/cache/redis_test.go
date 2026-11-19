package cache_test

import (
	"context"
	"testing"
	"time"

	"github.com/alicebob/miniredis/v2"
	"github.com/redis/go-redis/v9"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/Blindheroes/taskapp/internal/cache"
)

func newTestCache(t *testing.T) cache.Cache {
	t.Helper()
	mr, err := miniredis.Run()
	require.NoError(t, err)
	t.Cleanup(mr.Close)

	rdb := redis.NewClient(&redis.Options{Addr: mr.Addr()})
	t.Cleanup(func() { _ = rdb.Close() })

	return cache.NewRedis(rdb)
}

func TestRedisCache_SetGet(t *testing.T) {
	c := newTestCache(t)
	ctx := context.Background()

	type payload struct {
		Name  string `json:"name"`
		Count int    `json:"count"`
	}
	in := payload{Name: "hello", Count: 42}
	require.NoError(t, c.Set(ctx, "test:key", in, time.Minute))

	var out payload
	hit, err := c.Get(ctx, "test:key", &out)
	require.NoError(t, err)
	assert.True(t, hit)
	assert.Equal(t, in, out)
}

func TestRedisCache_GetMiss(t *testing.T) {
	c := newTestCache(t)
	var out string
	hit, err := c.Get(context.Background(), "missing", &out)
	require.NoError(t, err)
	assert.False(t, hit)
}

func TestRedisCache_DeleteByPrefix(t *testing.T) {
	c := newTestCache(t)
	ctx := context.Background()

	for _, k := range []string{"tasks:list:a", "tasks:list:b", "tasks:list:c", "other:x"} {
		require.NoError(t, c.Set(ctx, k, "v", time.Minute))
	}
	require.NoError(t, c.DeleteByPrefix(ctx, "tasks:list:"))

	var out string
	for _, k := range []string{"tasks:list:a", "tasks:list:b", "tasks:list:c"} {
		hit, err := c.Get(ctx, k, &out)
		require.NoError(t, err)
		assert.False(t, hit, "key %q should have been invalidated", k)
	}

	// Unrelated prefix must survive
	hit, err := c.Get(ctx, "other:x", &out)
	require.NoError(t, err)
	assert.True(t, hit)
}