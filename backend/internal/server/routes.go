package server

import (
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cache"
	"github.com/gofiber/fiber/v2/middleware/etag"
)

func (s *Server) initRoutes() {
	app := s.app.Group("/bruska")
	app.Static("/assets", "./assets")
	app.Static("/swagger", "./docs/swagger")
	app.Get("/swagger", func(c *fiber.Ctx) error {
		return c.Redirect("/bruska/swagger/index.html", 302)
	})
	app.Get("/healthcheck", s.healthcheck)
	app.All("/graphql", s.graphql)
	app.Get("/auth/session", s.authMiddleware, s.authSession)

	content := app.Group("/content", etag.New())
	publicCache := "public, max-age=3600, must-revalidate"
	content.Get("/layout", withCacheControl(s.layoutContent, "private, no-store"))
	content.Get("/home", withCacheControl(s.homeContent, publicCache))
	content.Get("/product-page", withCacheControl(s.productPageContent, publicCache))
	content.Get(
		"/catalog",
		withCacheControl(cache.New(cache.Config{Expiration: 5 * time.Second}), publicCache),
		s.catalogContent,
	)
	content.Get("/catalog/slides/:dir", withCacheControl(s.catalogSlidesContent, publicCache))
	content.Get("/catalog/preview/:dir", withCacheControl(s.catalogPreviewImageContent, publicCache))
	content.Get("/catalog/color-image/:dir/:color", withCacheControl(s.catalogColorImageContent, publicCache))
	content.Get("/catalog/:id", withCacheControl(s.catalogByIDContent, publicCache))
	content.Get("/articles", withCacheControl(s.articlesContent, publicCache))
	content.Get("/articles/:id", withCacheControl(s.articleByIDContent, publicCache))

	admin := app.Group("/admin", s.adminMiddleware)
	admin.Get("/articles", s.adminArticles)
	admin.Get("/articles/events", s.adminArticlesEvents)
	admin.Get("/articles/:id", s.adminArticleByID)
	admin.Post("/articles", s.createAdminArticle)
	admin.Patch("/articles/:id", s.updateAdminArticle)
	admin.Delete("/articles/:id", s.deleteAdminArticle)
	admin.Get("/products", s.adminProducts)
	admin.Get("/products/:id", s.adminProductByID)
	admin.Post("/products", s.createAdminProduct)
	admin.Post("/products/preview-image", s.uploadAdminProductPreviewImage)
	admin.Post("/products/color-image", s.uploadAdminProductColorImage)
	admin.Delete("/products/:id", s.deleteAdminProduct)
}
