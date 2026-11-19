package handler

import (
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"

	"github.com/Blindheroes/taskapp/internal/apperr"
	"github.com/Blindheroes/taskapp/internal/model"
	"github.com/Blindheroes/taskapp/internal/service"
)

type TaskHandler struct{ svc *service.TaskService }

func NewTaskHandler(svc *service.TaskService) *TaskHandler { return &TaskHandler{svc: svc} }

func (h *TaskHandler) Register(r *gin.RouterGroup) {
	g := r.Group("/tasks")
	g.GET("", h.List)
	g.GET("/:id", h.Get)
	g.POST("", h.Create)
	g.PUT("/:id", h.Update)
	g.DELETE("/:id", h.Delete)
}

func (h *TaskHandler) List(c *gin.Context) {
	f := model.TaskFilter{
		Status:   c.Query("status"),
		Keyword:  c.Query("keyword"),
		Assignee: c.Query("assignee"),
		Sort:     c.Query("sort"),
	}
	// support both "sort=created_at:desc" and "sort=created_at&order=desc"
	if f.Sort != "" && !strings.Contains(f.Sort, ":") {
		if ord := c.Query("order"); ord != "" {
			f.Sort = f.Sort + ":" + ord
		}
	}
	f.Page, _ = strconv.Atoi(c.DefaultQuery("page", "1"))
	f.Limit, _ = strconv.Atoi(c.DefaultQuery("limit", "10"))

	res, err := h.svc.List(c.Request.Context(), f)
	if err != nil {
		_ = c.Error(err)
		return
	}
	c.JSON(http.StatusOK, res)
}

func (h *TaskHandler) Get(c *gin.Context) {
	id, err := parseID(c)
	if err != nil {
		_ = c.Error(err)
		return
	}
	t, err := h.svc.GetByID(c.Request.Context(), id)
	if err != nil {
		_ = c.Error(err)
		return
	}
	c.JSON(http.StatusOK, t)
}

func (h *TaskHandler) Create(c *gin.Context) {
	var in model.CreateTaskInput
	if err := c.ShouldBindJSON(&in); err != nil {
		_ = c.Error(apperr.Validation("invalid request body", map[string]string{"body": err.Error()}))
		return
	}
	t, err := h.svc.Create(c.Request.Context(), in)
	if err != nil {
		_ = c.Error(err)
		return
	}
	c.JSON(http.StatusCreated, t)
}

func (h *TaskHandler) Update(c *gin.Context) {
	id, err := parseID(c)
	if err != nil {
		_ = c.Error(err)
		return
	}
	var in model.UpdateTaskInput
	if err := c.ShouldBindJSON(&in); err != nil {
		_ = c.Error(apperr.Validation("invalid request body", map[string]string{"body": err.Error()}))
		return
	}
	t, err := h.svc.Update(c.Request.Context(), id, in)
	if err != nil {
		_ = c.Error(err)
		return
	}
	c.JSON(http.StatusOK, t)
}

func (h *TaskHandler) Delete(c *gin.Context) {
	id, err := parseID(c)
	if err != nil {
		_ = c.Error(err)
		return
	}
	if err := h.svc.Delete(c.Request.Context(), id); err != nil {
		_ = c.Error(err)
		return
	}
	c.Status(http.StatusNoContent)
}

func parseID(c *gin.Context) (uint64, error) {
	raw := c.Param("id")
	id, err := strconv.ParseUint(raw, 10, 64)
	if err != nil || id == 0 {
		return 0, apperr.Validation("invalid task id", map[string]string{"id": raw})
	}
	return id, nil
}
