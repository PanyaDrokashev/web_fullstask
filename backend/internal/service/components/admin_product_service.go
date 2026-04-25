package components

import (
	"bruska/internal/store"
	"bruska/internal/store/repositories"
	"context"
	"fmt"
	"strings"
)

type AdminProductService interface {
	List(ctx context.Context) []repositories.CatalogItem
	ByID(ctx context.Context, id int) (repositories.CatalogItem, bool)
	Create(ctx context.Context, draft repositories.ProductDraft) (repositories.CatalogItem, error)
	Delete(ctx context.Context, id int) (bool, error)
}

type adminProductService struct {
	store store.Store
}

func NewAdminProductService(store store.Store) AdminProductService {
	return &adminProductService{store: store}
}

func (s *adminProductService) List(ctx context.Context) []repositories.CatalogItem {
	return s.store.Content().Catalog(ctx)
}

func (s *adminProductService) ByID(ctx context.Context, id int) (repositories.CatalogItem, bool) {
	return s.store.Content().CatalogByID(ctx, id)
}

func (s *adminProductService) Create(ctx context.Context, draft repositories.ProductDraft) (repositories.CatalogItem, error) {
	if err := validateProductDraft(draft); err != nil {
		return repositories.CatalogItem{}, err
	}

	return s.store.Content().CreateProduct(ctx, draft)
}

func (s *adminProductService) Delete(ctx context.Context, id int) (bool, error) {
	return s.store.Content().DeleteProduct(ctx, id)
}

func validateProductDraft(draft repositories.ProductDraft) error {
	if strings.TrimSpace(draft.Title) == "" {
		return fmt.Errorf("title is required")
	}
	if strings.TrimSpace(draft.Dir) == "" {
		return fmt.Errorf("dir is required")
	}
	if strings.TrimSpace(draft.PriceTag) == "" {
		return fmt.Errorf("priceTag is required")
	}
	if len(draft.Colors) == 0 && draft.BasePrice <= 0 {
		return fmt.Errorf("basePrice must be greater than 0")
	}
	for _, color := range draft.Colors {
		if strings.TrimSpace(color.Tag) == "" {
			return fmt.Errorf("color tag is required")
		}
		if color.Price <= 0 {
			return fmt.Errorf("color price must be greater than 0")
		}
	}
	if draft.OnPallet <= 0 {
		return fmt.Errorf("onPallet must be greater than 0")
	}
	if draft.Weight <= 0 {
		return fmt.Errorf("weight must be greater than 0")
	}
	if draft.Length <= 0 || draft.Width <= 0 || draft.Height <= 0 {
		return fmt.Errorf("length, width and height must be greater than 0")
	}
	return nil
}
