package server

import (
	"bruska/internal/store/repositories"
	"bufio"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/gofiber/fiber/v2"
)

func (s *Server) adminArticles(c *fiber.Ctx) error {
	return c.Status(http.StatusOK).JSON(s.svc.AdminArticles().List(c.UserContext()))
}

func (s *Server) adminArticleByID(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "invalid article id"})
	}

	article, ok := s.svc.AdminArticles().ByID(c.UserContext(), id)
	if !ok {
		return c.Status(http.StatusNotFound).JSON(fiber.Map{"error": "article not found"})
	}

	return c.Status(http.StatusOK).JSON(article)
}

func (s *Server) createAdminArticle(c *fiber.Ctx) error {
	var draft repositories.ArticleDraft
	if err := c.BodyParser(&draft); err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "invalid request payload"})
	}

	article, err := s.svc.AdminArticles().Create(c.UserContext(), draft)
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(http.StatusCreated).JSON(article)
}

func (s *Server) updateAdminArticle(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "invalid article id"})
	}

	var draft repositories.ArticleDraft
	if err = c.BodyParser(&draft); err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "invalid request payload"})
	}

	article, updated, err := s.svc.AdminArticles().Update(c.UserContext(), id, draft)
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}
	if !updated {
		return c.Status(http.StatusNotFound).JSON(fiber.Map{"error": "article not found"})
	}

	return c.Status(http.StatusOK).JSON(article)
}

func (s *Server) deleteAdminArticle(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "invalid article id"})
	}

	deleted, err := s.svc.AdminArticles().Delete(c.UserContext(), id)
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}
	if !deleted {
		return c.Status(http.StatusNotFound).JSON(fiber.Map{"error": "article not found"})
	}

	return c.SendStatus(http.StatusNoContent)
}

func (s *Server) adminArticlesEvents(c *fiber.Ctx) error {
	c.Set("Content-Type", "text/event-stream")
	c.Set("Cache-Control", "no-cache")
	c.Set("Connection", "keep-alive")
	c.Set("X-Accel-Buffering", "no")

	subscriberID, events := s.svc.AdminArticles().Subscribe()
	done := c.Context().Done()

	c.Context().SetBodyStreamWriter(func(w *bufio.Writer) {
		defer s.svc.AdminArticles().Unsubscribe(subscriberID)

		keepAliveTicker := time.NewTicker(20 * time.Second)
		defer keepAliveTicker.Stop()

		for {
			select {
			case event, ok := <-events:
				if !ok {
					return
				}

				payload, err := json.Marshal(event)
				if err != nil {
					continue
				}

				_, _ = fmt.Fprintf(w, "event: article\ndata: %s\n\n", payload)
				if err = w.Flush(); err != nil {
					return
				}
			case <-keepAliveTicker.C:
				_, _ = w.WriteString(": keep-alive\n\n")
				if err := w.Flush(); err != nil {
					return
				}
			case <-done:
				return
			}
		}
	})

	return nil
}
