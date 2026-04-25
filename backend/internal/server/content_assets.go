package server

import (
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"regexp"
	"sort"
	"strings"

	"github.com/gofiber/fiber/v2"
	"golang.org/x/text/unicode/norm"
)

var catalogDirPattern = regexp.MustCompile(`^[a-zA-Z0-9_-]+$`)
var catalogImageExtensions = []string{".jpeg", ".jpg", ".png", ".webp", ".gif", ".svg"}

func (s *Server) catalogSlidesContent(c *fiber.Ctx) error {
	dir := strings.TrimSpace(c.Params("dir"))
	if !catalogDirPattern.MatchString(dir) {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "invalid catalog dir"})
	}

	if s.objectStorage != nil && s.objectStorage.Enabled() {
		images, err := s.objectStorage.ListImageURLs(c.UserContext(), filepath.ToSlash(filepath.Join("catalog", dir)))
		if err != nil {
			return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "failed to read catalog dir"})
		}
		if len(images) == 0 {
			return c.Status(http.StatusNotFound).JSON(fiber.Map{"error": "catalog dir not found"})
		}
		return c.Status(http.StatusOK).JSON(images)
	}

	slidesDir := filepath.Join("assets", "catalog", dir)
	entries, err := os.ReadDir(slidesDir)
	if err != nil {
		if os.IsNotExist(err) {
			return c.Status(http.StatusNotFound).JSON(fiber.Map{"error": "catalog dir not found"})
		}
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "failed to read catalog dir"})
	}

	images := make([]string, 0)
	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}

		name := entry.Name()
		ext := strings.ToLower(filepath.Ext(name))
		switch ext {
		case ".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg":
			images = append(images, "/bruska/assets/catalog/"+dir+"/"+url.PathEscape(name))
		}
	}

	sort.Strings(images)
	return c.Status(http.StatusOK).JSON(images)
}

func (s *Server) catalogColorImageContent(c *fiber.Ctx) error {
	dir := strings.TrimSpace(c.Params("dir"))
	color := strings.TrimSpace(c.Params("color"))
	if decoded, err := url.PathUnescape(color); err == nil {
		color = decoded
	}
	color = strings.TrimSuffix(color, filepath.Ext(color))
	color = strings.TrimSpace(color)

	if !catalogDirPattern.MatchString(dir) {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "invalid catalog dir"})
	}
	if color == "" || strings.Contains(color, "/") || strings.Contains(color, "..") {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "invalid color"})
	}

	if s.objectStorage != nil && s.objectStorage.Enabled() {
		publicURL, found, err := s.objectStorage.FindImageURLByBaseName(c.UserContext(), filepath.ToSlash(filepath.Join("catalog", dir)), color)
		if err != nil {
			return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "failed to resolve color image"})
		}
		if found {
			return c.Redirect(publicURL, http.StatusTemporaryRedirect)
		}
		return c.Status(http.StatusNotFound).JSON(fiber.Map{"error": "color image not found"})
	}

	baseDir := filepath.Join("assets", "catalog", dir)
	imagePath, ok := findCatalogColorImage(baseDir, color)
	if ok {
		return c.SendFile(imagePath, true)
	}

	return c.Status(http.StatusNotFound).JSON(fiber.Map{"error": "color image not found"})
}

func (s *Server) catalogPreviewImageContent(c *fiber.Ctx) error {
	dir := strings.TrimSpace(c.Params("dir"))
	if !catalogDirPattern.MatchString(dir) {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "invalid catalog dir"})
	}

	if s.objectStorage != nil && s.objectStorage.Enabled() {
		publicURL, found, err := s.objectStorage.FindImageURLByBaseName(c.UserContext(), filepath.ToSlash(filepath.Join("catalog", dir)), dir)
		if err != nil {
			return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "failed to resolve preview image"})
		}
		if found {
			return c.Redirect(publicURL, http.StatusTemporaryRedirect)
		}
		return c.Status(http.StatusNotFound).JSON(fiber.Map{"error": "preview image not found"})
	}

	baseDir := filepath.Join("assets", "catalog", dir)
	imagePath, ok := findCatalogColorImage(baseDir, dir)
	if ok {
		return c.SendFile(imagePath, true)
	}

	return c.Status(http.StatusNotFound).JSON(fiber.Map{"error": "preview image not found"})
}

func findCatalogColorImage(baseDir, color string) (string, bool) {
	for _, ext := range catalogImageExtensions {
		path := filepath.Join(baseDir, color+ext)
		if _, err := os.Stat(path); err == nil {
			return path, true
		}
	}

	entries, err := os.ReadDir(baseDir)
	if err != nil {
		return "", false
	}

	targetNFC := norm.NFC.String(strings.TrimSpace(color))
	targetNFD := norm.NFD.String(strings.TrimSpace(color))
	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}

		name := entry.Name()
		ext := strings.ToLower(filepath.Ext(name))
		isImage := false
		for _, allowedExt := range catalogImageExtensions {
			if ext == allowedExt {
				isImage = true
				break
			}
		}
		if !isImage {
			continue
		}

		stem := strings.TrimSpace(strings.TrimSuffix(name, filepath.Ext(name)))
		stemNFC := norm.NFC.String(stem)
		stemNFD := norm.NFD.String(stem)
		if stemNFC == targetNFC || stemNFC == targetNFD || stemNFD == targetNFC || stemNFD == targetNFD {
			return filepath.Join(baseDir, name), true
		}
	}

	return "", false
}
