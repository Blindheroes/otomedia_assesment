package main

import (
	"context"
	"errors"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"

	"github.com/Blindheroes/taskapp/internal/cache"
	"github.com/Blindheroes/taskapp/internal/config"
	"github.com/Blindheroes/taskapp/internal/db"
	"github.com/Blindheroes/taskapp/internal/handler"
	"github.com/Blindheroes/taskapp/internal/middleware"
	"github.com/Blindheroes/taskapp/internal/repository"
	"github.com/Blindheroes/taskapp/internal/service"
)

func main() {
	cfg := config.Load()

	database, err := db.NewMySQL(cfg.DBDSN)
	if err != nil {
		log.Fatalf("db: %v", err)
	}
	defer database.Close()

	// Task 2: Redis-backed cache
	rdb := redis.NewClient(&redis.Options{Addr: cfg.RedisAddr})
	defer rdb.Close()
	if err := rdb.Ping(context.Background()).Err(); err != nil {
		log.Fatalf("redis: %v", err)
	}
	c := cache.NewRedis(rdb)

	repo := repository.NewMySQLTaskRepo(database)
	svc := service.NewTaskService(repo, c)
	taskHandler := handler.NewTaskHandler(svc)

	r := gin.New()
	r.Use(gin.Logger(), gin.Recovery(), middleware.ErrorHandler())

	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	api := r.Group("/api")
	taskHandler.Register(api)

	srv := &http.Server{
		Addr:              ":" + cfg.Port,
		Handler:           r,
		ReadHeaderTimeout: 10 * time.Second,
	}

	go func() {
		log.Printf("server running on http://localhost:%s", cfg.Port)
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Fatalf("server error: %v", err)
		}
	}()

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)
	<-stop

	log.Println("shutting down...")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	_ = srv.Shutdown(ctx)
	log.Println("server stopped")
}