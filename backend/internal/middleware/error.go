package middleware

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/Blindheroes/taskapp/internal/apperr"
)

// ErrorHandler converts any error pushed via c.Error(err) into the
// canonical {"error": {...}} JSON shape.
// 5xx bodies are sanitized â€” details are logged server-side only.
func ErrorHandler() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Next()

		if c.Writer.Written() || len(c.Errors) == 0 {
			return
		}

		appErr := apperr.From(c.Errors.Last().Err)

		if appErr.Status >= http.StatusInternalServerError {
			log.Printf("[ERROR] %s %s: %v", c.Request.Method, c.Request.URL.Path, appErr.Err)
			appErr = apperr.Internal(nil)
		}

		c.JSON(appErr.Status, gin.H{"error": appErr})
	}
}
