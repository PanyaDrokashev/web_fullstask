package server

import (
	"net/http"
	"strings"

	"bruska/internal/infrastructure/firebaseauth"

	"github.com/gofiber/fiber/v2"
)

const authUserContextKey = "auth_user"

func (s *Server) authSession(c *fiber.Ctx) error {
	user, ok := currentAuthUser(c)
	if !ok {
		return c.Status(http.StatusUnauthorized).JSON(fiber.Map{"error": "unauthorized"})
	}

	displayName := strings.TrimSpace(user.Name)
	if displayName == "" {
		displayName = user.Email
	}

	return c.Status(http.StatusOK).JSON(fiber.Map{
		"uid":   user.UID,
		"email": user.Email,
		"name":  displayName,
		"role":  user.Role,
	})
}

func (s *Server) authMiddleware(c *fiber.Ctx) error {
	if _, ok := s.authenticate(c); !ok {
		return nil
	}
	return c.Next()
}

func (s *Server) adminMiddleware(c *fiber.Ctx) error {
	user, ok := s.authenticate(c)
	if !ok {
		return nil
	}

	if strings.ToLower(strings.TrimSpace(user.Role)) != "admin" {
		return c.Status(http.StatusForbidden).JSON(fiber.Map{"error": "forbidden"})
	}
	return c.Next()
}

func (s *Server) authenticate(c *fiber.Ctx) (firebaseauth.User, bool) {
	if s.firebaseAuth == nil || !s.firebaseAuth.Enabled() {
		_ = c.Status(http.StatusUnauthorized).JSON(fiber.Map{"error": "firebase auth is not configured"})
		return firebaseauth.User{}, false
	}

	token := extractBearerToken(c)
	if token == "" {
		_ = c.Status(http.StatusUnauthorized).JSON(fiber.Map{"error": "missing bearer token"})
		return firebaseauth.User{}, false
	}

	user, err := s.firebaseAuth.VerifyIDToken(c.UserContext(), token)
	if err != nil {
		_ = c.Status(http.StatusUnauthorized).JSON(fiber.Map{"error": "invalid auth token"})
		return firebaseauth.User{}, false
	}

	c.Locals(authUserContextKey, user)
	return user, true
}

func currentAuthUser(c *fiber.Ctx) (firebaseauth.User, bool) {
	v := c.Locals(authUserContextKey)
	if v == nil {
		return firebaseauth.User{}, false
	}
	user, ok := v.(firebaseauth.User)
	return user, ok
}

func extractBearerToken(c *fiber.Ctx) string {
	authHeader := strings.TrimSpace(c.Get("Authorization"))
	if strings.HasPrefix(strings.ToLower(authHeader), "bearer ") {
		return strings.TrimSpace(authHeader[len("Bearer "):])
	}

	if queryToken := strings.TrimSpace(c.Query("access_token")); queryToken != "" {
		return queryToken
	}

	return ""
}
