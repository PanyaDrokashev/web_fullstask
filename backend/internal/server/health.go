package server

import (
	"net/http"

	"github.com/gofiber/fiber/v2"
)

func (s *Server) healthcheck(c *fiber.Ctx) error {
	status := s.svc.Health().Status(c.UserContext())
	return c.Status(http.StatusOK).JSON(fiber.Map{"status": status})
}
