package components

import (
	"bruska/internal/store"
	"bruska/internal/store/repositories"
	"context"
)

type ContentService interface {
	Layout(ctx context.Context, isAuthorized bool, userName string) repositories.LayoutData
	Home(ctx context.Context) repositories.HomeData
	ProductPage(ctx context.Context) repositories.ProductPageData
	Catalog(ctx context.Context) []repositories.CatalogItem
	CatalogByID(ctx context.Context, id int) (repositories.CatalogItem, bool)
	Articles(ctx context.Context) []repositories.Article
	ArticleByID(ctx context.Context, id int) (repositories.Article, bool)
	Users(ctx context.Context) ([]repositories.User, error)
	RegisterUser(ctx context.Context, draft repositories.UserDraft) (repositories.User, error)
	AuthenticateUser(ctx context.Context, loginOrEmail, password string) (repositories.User, bool, error)
}

type contentService struct {
	store store.Store
}

func NewContentService(store store.Store) ContentService {
	return &contentService{store: store}
}

func (s *contentService) Layout(ctx context.Context, isAuthorized bool, userName string) repositories.LayoutData {
	return s.store.Content().Layout(ctx, isAuthorized, userName)
}

func (s *contentService) Home(ctx context.Context) repositories.HomeData {
	return s.store.Content().Home(ctx)
}

func (s *contentService) ProductPage(ctx context.Context) repositories.ProductPageData {
	return s.store.Content().ProductPage(ctx)
}

func (s *contentService) Catalog(ctx context.Context) []repositories.CatalogItem {
	return s.store.Content().Catalog(ctx)
}

func (s *contentService) CatalogByID(ctx context.Context, id int) (repositories.CatalogItem, bool) {
	return s.store.Content().CatalogByID(ctx, id)
}

func (s *contentService) Articles(ctx context.Context) []repositories.Article {
	return s.store.Content().Articles(ctx)
}

func (s *contentService) ArticleByID(ctx context.Context, id int) (repositories.Article, bool) {
	return s.store.Content().ArticleByID(ctx, id)
}

func (s *contentService) Users(ctx context.Context) ([]repositories.User, error) {
	return s.store.Content().Users(ctx)
}

func (s *contentService) RegisterUser(ctx context.Context, draft repositories.UserDraft) (repositories.User, error) {
	return s.store.Content().RegisterUser(ctx, draft)
}

func (s *contentService) AuthenticateUser(ctx context.Context, loginOrEmail, password string) (repositories.User, bool, error) {
	return s.store.Content().AuthenticateUser(ctx, loginOrEmail, password)
}
