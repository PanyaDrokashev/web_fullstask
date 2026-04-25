package server

import (
	"fmt"
	"time"

	"bruska/pkg/logging"

	"github.com/gofiber/fiber/v2"
)

func elapsedTimeMiddleware() fiber.Handler {
	return func(c *fiber.Ctx) error {
		started := time.Now()
		err := c.Next()

		elapsed := time.Since(started)
		c.Set("X-Elapsed-Time", fmt.Sprintf("%dms", elapsed.Milliseconds()))
		logging.Infof("%s %s -> %d (%dms)", c.Method(), c.OriginalURL(), c.Response().StatusCode(), elapsed.Milliseconds())
		return err
	}
}

func withCacheControl(next fiber.Handler, value string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		if c.Method() == fiber.MethodGet {
			c.Set("Cache-Control", value)
		}
		return next(c)
	}
}
