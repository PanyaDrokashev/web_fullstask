package repositories

import (
	"context"
	"errors"
	"fmt"
	"strings"
)

func (r *contentRepository) CreateProduct(ctx context.Context, draft ProductDraft) (CatalogItem, error) {
	if r.db == nil {
		return CatalogItem{}, errors.New("database is not configured")
	}

	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return CatalogItem{}, fmt.Errorf("begin transaction: %w", err)
	}

	defer func() {
		if err != nil {
			_ = tx.Rollback()
		}
	}()

	categoryName := strings.TrimSpace(draft.Category)
	if categoryName == "" {
		categoryName = "Прочее"
	}

	var categoryID int
	if err = tx.QueryRowContext(ctx, `
		INSERT INTO product_categories(name)
		VALUES($1)
		ON CONFLICT(name) DO UPDATE SET name = EXCLUDED.name
		RETURNING id
	`, categoryName).Scan(&categoryID); err != nil {
		return CatalogItem{}, fmt.Errorf("upsert category: %w", err)
	}

	var productID int
	if err = tx.QueryRowContext(ctx, `SELECT COALESCE(MAX(id), 0) + 1 FROM products`).Scan(&productID); err != nil {
		return CatalogItem{}, fmt.Errorf("select next product id: %w", err)
	}

	if _, err = tx.ExecContext(ctx, `
		INSERT INTO products(
			id, category_id, tag, title, dir, img, price_tag, with_btn, is_available, on_pallet, weight
		)
		VALUES($1, $2, NULLIF($3, ''), $4, $5, $6, $7, $8, $9, $10, $11)
	`, productID, categoryID, categoryName, draft.Title, draft.Dir, draft.Img, draft.PriceTag, draft.WithBtn, draft.IsAvailable, draft.OnPallet, draft.Weight); err != nil {
		return CatalogItem{}, fmt.Errorf("insert product: %w", err)
	}

	colors := draft.Colors
	if len(colors) == 0 {
		color := strings.TrimSpace(draft.Color)
		if color == "" {
			color = "Серый"
		}
		price := draft.BasePrice
		if price <= 0 {
			price = 1
		}
		colors = []ProductColorDraft{{Tag: color, Price: price}}
	}

	insertedColors := 0
	for idx, colorDraft := range colors {
		tag := strings.TrimSpace(colorDraft.Tag)
		if tag == "" {
			continue
		}

		if _, err = tx.ExecContext(ctx, `
			INSERT INTO product_colors(product_id, tag, position)
			VALUES($1, $2, $3)
		`, productID, tag, idx); err != nil {
			return CatalogItem{}, fmt.Errorf("insert product color: %w", err)
		}

		if _, err = tx.ExecContext(ctx, `
			INSERT INTO product_prices(product_id, color_tag, amount, position)
			VALUES($1, $2, $3, $4)
		`, productID, tag, colorDraft.Price, idx); err != nil {
			return CatalogItem{}, fmt.Errorf("insert product price: %w", err)
		}
		insertedColors++
	}

	if insertedColors == 0 {
		return CatalogItem{}, fmt.Errorf("at least one color is required")
	}

	if _, err = tx.ExecContext(ctx, `
		INSERT INTO product_sizes(product_id, length, width, height, position)
		VALUES($1, $2, $3, $4, 0)
	`, productID, draft.Length, draft.Width, draft.Height); err != nil {
		return CatalogItem{}, fmt.Errorf("insert product size: %w", err)
	}

	description := strings.TrimSpace(draft.Description)
	if description != "" {
		if _, err = tx.ExecContext(ctx, `
			INSERT INTO product_descriptions(product_id, body, position)
			VALUES($1, $2, 0)
		`, productID, description); err != nil {
			return CatalogItem{}, fmt.Errorf("insert product description: %w", err)
		}
	}

	if err = tx.Commit(); err != nil {
		return CatalogItem{}, fmt.Errorf("commit transaction: %w", err)
	}

	product, ok := r.CatalogByID(ctx, productID)
	if !ok {
		return CatalogItem{}, fmt.Errorf("created product not found")
	}

	return product, nil
}

func (r *contentRepository) DeleteProduct(ctx context.Context, id int) (bool, error) {
	if r.db == nil {
		return false, errors.New("database is not configured")
	}

	res, err := r.db.ExecContext(ctx, `DELETE FROM products WHERE id = $1`, id)
	if err != nil {
		return false, fmt.Errorf("delete product: %w", err)
	}

	affected, err := res.RowsAffected()
	if err != nil {
		return false, fmt.Errorf("read deleted rows: %w", err)
	}

	return affected > 0, nil
}
