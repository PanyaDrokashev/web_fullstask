package server

import (
	"bruska/internal/store/repositories"
	"fmt"
	"mime"
	"mime/multipart"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strconv"
	"strings"

	"github.com/gofiber/fiber/v2"
)

func (s *Server) adminProducts(c *fiber.Ctx) error {
	return c.Status(http.StatusOK).JSON(s.svc.AdminProducts().List(c.UserContext()))
}

func (s *Server) adminProductByID(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "invalid product id"})
	}

	product, ok := s.svc.AdminProducts().ByID(c.UserContext(), id)
	if !ok {
		return c.Status(http.StatusNotFound).JSON(fiber.Map{"error": "product not found"})
	}

	return c.Status(http.StatusOK).JSON(product)
}

func (s *Server) createAdminProduct(c *fiber.Ctx) error {
	var draft repositories.ProductDraft
	if err := c.BodyParser(&draft); err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "invalid request payload"})
	}

	product, err := s.svc.AdminProducts().Create(c.UserContext(), draft)
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(http.StatusCreated).JSON(product)
}

func (s *Server) uploadAdminProductColorImage(c *fiber.Ctx) error {
	dir := strings.TrimSpace(c.FormValue("dir"))
	color := strings.TrimSpace(c.FormValue("color"))
	if !catalogDirPattern.MatchString(dir) {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "invalid dir"})
	}
	if color == "" || strings.Contains(color, "/") || strings.Contains(color, "..") {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "invalid color"})
	}

	file, err := c.FormFile("image")
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "image is required"})
	}

	ext := strings.ToLower(filepath.Ext(file.Filename))
	switch ext {
	case ".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg":
	default:
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "unsupported image extension"})
	}

	fileName := color + ext
	storageKey := filepath.ToSlash(filepath.Join("catalog", dir, fileName))
	path, uploadErr := s.uploadImage(c, file, storageKey, filepath.Join("assets", "catalog", dir, fileName), "/bruska/assets/catalog/"+dir+"/"+url.PathEscape(fileName))
	if uploadErr != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": uploadErr.Error()})
	}

	return c.Status(http.StatusCreated).JSON(fiber.Map{
		"path": path,
	})
}

func (s *Server) uploadAdminProductPreviewImage(c *fiber.Ctx) error {
	dir := strings.TrimSpace(c.FormValue("dir"))
	if !catalogDirPattern.MatchString(dir) {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "invalid dir"})
	}

	file, err := c.FormFile("image")
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "preview image is required"})
	}

	ext := strings.ToLower(filepath.Ext(file.Filename))
	switch ext {
	case ".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg":
	default:
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "unsupported image extension"})
	}

	fileName := dir + ext
	storageKey := filepath.ToSlash(filepath.Join("catalog", dir, fileName))
	path, uploadErr := s.uploadImage(c, file, storageKey, filepath.Join("assets", "catalog", dir, fileName), "/catalog/"+dir+"/"+url.PathEscape(fileName))
	if uploadErr != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": uploadErr.Error()})
	}

	return c.Status(http.StatusCreated).JSON(fiber.Map{
		"path": path,
	})
}

func (s *Server) deleteAdminProduct(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "invalid product id"})
	}

	deleted, err := s.svc.AdminProducts().Delete(c.UserContext(), id)
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}
	if !deleted {
		return c.Status(http.StatusNotFound).JSON(fiber.Map{"error": "product not found"})
	}

	return c.SendStatus(http.StatusNoContent)
}

func (s *Server) uploadImage(c *fiber.Ctx, file *multipart.FileHeader, storageKey, localPath, localPublicPath string) (string, error) {
	if s.objectStorage != nil && s.objectStorage.Enabled() {
		src, err := file.Open()
		if err != nil {
			return "", fmt.Errorf("failed to open image: %w", err)
		}
		defer src.Close()

		contentType := strings.TrimSpace(file.Header.Get("Content-Type"))
		if contentType == "" {
			if detected := mime.TypeByExtension(strings.ToLower(filepath.Ext(file.Filename))); detected != "" {
				contentType = detected
			} else {
				contentType = "application/octet-stream"
			}
		}

		publicURL, err := s.objectStorage.Upload(c.UserContext(), storageKey, contentType, src, file.Size)
		if err != nil {
			return "", fmt.Errorf("failed to upload image to object storage: %w", err)
		}
		return publicURL, nil
	}

	dirPath := filepath.Dir(localPath)
	if err := os.MkdirAll(dirPath, 0o755); err != nil {
		return "", fmt.Errorf("failed to create product assets dir: %w", err)
	}

	if err := c.SaveFile(file, localPath); err != nil {
		return "", fmt.Errorf("failed to save image: %w", err)
	}

	return localPublicPath, nil
}
