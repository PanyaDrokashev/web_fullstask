package service

import (
	"bruska/internal/service/components"
	"bruska/internal/store"
)

//go:generate mockery --name=Store --with-expecter
type Store interface {
	Health() components.HealthService
	Content() components.ContentService
	AdminArticles() components.AdminArticleService
	AdminProducts() components.AdminProductService
}

type serviceStore struct {
	health        components.HealthService
	content       components.ContentService
	adminArticles components.AdminArticleService
	adminProducts components.AdminProductService
}

func NewServiceStore(store store.Store) Store {
	return &serviceStore{
		health:        components.NewHealthService(store),
		content:       components.NewContentService(store),
		adminArticles: components.NewAdminArticleService(store),
		adminProducts: components.NewAdminProductService(store),
	}
}

func (s *serviceStore) Health() components.HealthService {
	return s.health
}

func (s *serviceStore) Content() components.ContentService {
	return s.content
}

func (s *serviceStore) AdminArticles() components.AdminArticleService {
	return s.adminArticles
}

func (s *serviceStore) AdminProducts() components.AdminProductService {
	return s.adminProducts
}
