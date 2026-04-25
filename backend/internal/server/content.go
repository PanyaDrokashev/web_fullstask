package server

import (
	"net/http"
	"strconv"

	"github.com/gofiber/fiber/v2"
)

func (s *Server) layoutContent(c *fiber.Ctx) error {
	isAuthorized := c.QueryBool("authorized", false)
	userName := c.Query("user", "")

	data := s.svc.Content().Layout(c.UserContext(), isAuthorized, userName)
	return c.Status(http.StatusOK).JSON(data)
}

func (s *Server) homeContent(c *fiber.Ctx) error {
	return c.Status(http.StatusOK).JSON(s.svc.Content().Home(c.UserContext()))
}

func (s *Server) productPageContent(c *fiber.Ctx) error {
	return c.Status(http.StatusOK).JSON(s.svc.Content().ProductPage(c.UserContext()))
}

func (s *Server) catalogContent(c *fiber.Ctx) error {
	return c.Status(http.StatusOK).JSON(s.svc.Content().Catalog(c.UserContext()))
}

func (s *Server) catalogByIDContent(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "invalid catalog id"})
	}

	item, ok := s.svc.Content().CatalogByID(c.UserContext(), id)
	if !ok {
		return c.Status(http.StatusNotFound).JSON(fiber.Map{"error": "catalog item not found"})
	}

	return c.Status(http.StatusOK).JSON(item)
}

func (s *Server) articlesContent(c *fiber.Ctx) error {
	return c.Status(http.StatusOK).JSON(s.svc.Content().Articles(c.UserContext()))
}

func (s *Server) articleByIDContent(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "invalid article id"})
	}

	article, ok := s.svc.Content().ArticleByID(c.UserContext(), id)
	if !ok {
		return c.Status(http.StatusNotFound).JSON(fiber.Map{"error": "article not found"})
	}

	return c.Status(http.StatusOK).JSON(article)
}
