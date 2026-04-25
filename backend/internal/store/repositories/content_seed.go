package repositories

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"sort"
)

func SeedContent(ctx context.Context, db *sql.DB) error {
	if db == nil {
		return nil
	}

	var count int
	if err := db.QueryRowContext(ctx, `SELECT COUNT(*) FROM products`).Scan(&count); err != nil {
		return fmt.Errorf("count products: %w", err)
	}
	if count > 0 {
		return nil
	}

	catalog := mustDecode[[]CatalogItem](catalogJSON, "catalog")
	articles := mustDecode[[]Article](articlesJSON, "articles")
	navItems := mustDecode[[]NavItem](navItemsJSON, "nav-items")

	tx, err := db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("begin seed tx: %w", err)
	}
	defer func() {
		if err != nil {
			_ = tx.Rollback()
		}
	}()

	categories := make(map[string]int)
	for _, item := range catalog {
		category := item.Tag
		if category == "" {
			category = "Прочее"
		}
		if _, ok := categories[category]; ok {
			continue
		}
		var categoryID int
		if err = tx.QueryRowContext(ctx, `
			INSERT INTO product_categories(name)
			VALUES ($1)
			ON CONFLICT(name) DO UPDATE SET name = EXCLUDED.name
			RETURNING id
		`, category).Scan(&categoryID); err != nil {
			return fmt.Errorf("upsert category %s: %w", category, err)
		}
		categories[category] = categoryID
	}

	for _, item := range catalog {
		category := item.Tag
		if category == "" {
			category = "Прочее"
		}
		categoryID := categories[category]

		if _, err = tx.ExecContext(ctx, `
			INSERT INTO products(
				id, category_id, tag, title, dir, img, price_tag, with_btn, is_available, on_pallet, weight
			)
			VALUES($1, $2, NULLIF($3, ''), $4, $5, $6, $7, $8, $9, $10, $11)
			ON CONFLICT(id) DO UPDATE SET
				category_id = EXCLUDED.category_id,
				tag = EXCLUDED.tag,
				title = EXCLUDED.title,
				dir = EXCLUDED.dir,
				img = EXCLUDED.img,
				price_tag = EXCLUDED.price_tag,
				with_btn = EXCLUDED.with_btn,
				is_available = EXCLUDED.is_available,
				on_pallet = EXCLUDED.on_pallet,
				weight = EXCLUDED.weight
		`, item.ID, categoryID, item.Tag, item.Title, item.Dir, item.Img, item.PriceTag, item.WithBtn, item.IsAvailable, item.OnPallet, item.Weight); err != nil {
			return fmt.Errorf("upsert product %d: %w", item.ID, err)
		}

		for idx, color := range item.Colors {
			if _, err = tx.ExecContext(ctx, `
				INSERT INTO product_colors(product_id, tag, position)
				VALUES($1, $2, $3)
				ON CONFLICT(product_id, tag) DO UPDATE SET position = EXCLUDED.position
			`, item.ID, color.Tag, idx); err != nil {
				return fmt.Errorf("insert product color %d: %w", item.ID, err)
			}
		}

		for idx, size := range item.Sizes {
			if _, err = tx.ExecContext(ctx, `
				INSERT INTO product_sizes(product_id, length, width, height, position)
				VALUES($1, $2, $3, $4, $5)
			`, item.ID, size.Length, size.Width, size.Height, idx); err != nil {
				return fmt.Errorf("insert product size %d: %w", item.ID, err)
			}
		}

		priceTags := make([]string, 0, len(item.Price))
		for tag := range item.Price {
			priceTags = append(priceTags, tag)
		}
		sort.Strings(priceTags)
		for idx, tag := range priceTags {
			if _, err = tx.ExecContext(ctx, `
				INSERT INTO product_prices(product_id, color_tag, amount, position)
				VALUES($1, $2, $3, $4)
				ON CONFLICT(product_id, color_tag) DO UPDATE SET amount = EXCLUDED.amount, position = EXCLUDED.position
			`, item.ID, tag, item.Price[tag], idx); err != nil {
				return fmt.Errorf("insert product price %d: %w", item.ID, err)
			}
		}

		for idx, body := range item.Description {
			if _, err = tx.ExecContext(ctx, `
				INSERT INTO product_descriptions(product_id, body, position)
				VALUES($1, $2, $3)
			`, item.ID, body, idx); err != nil {
				return fmt.Errorf("insert product description %d: %w", item.ID, err)
			}
		}
	}

	for _, item := range articles {
		blocksJSON, marshalErr := json.Marshal(item.Content)
		if marshalErr != nil {
			return fmt.Errorf("marshal article blocks %d: %w", item.ID, marshalErr)
		}

		if _, err = tx.ExecContext(ctx, `
			INSERT INTO articles(id, title, preview, blocks_json)
			VALUES($1, $2, $3, $4)
			ON CONFLICT(id) DO UPDATE SET
				title = EXCLUDED.title,
				preview = EXCLUDED.preview,
				blocks_json = EXCLUDED.blocks_json
		`, item.ID, item.Title, item.Preview, blocksJSON); err != nil {
			return fmt.Errorf("insert article %d: %w", item.ID, err)
		}

		for idx, part := range item.Content {
			var rawItems []byte
			if part.Items != nil {
				rawItems, err = json.Marshal(part.Items)
				if err != nil {
					return fmt.Errorf("marshal article items %d: %w", item.ID, err)
				}
			}

			if _, err = tx.ExecContext(ctx, `
				INSERT INTO article_blocks(article_id, block_type, content, items_json, position)
				VALUES($1, $2, NULLIF($3, ''), $4, $5)
			`, item.ID, part.Type, part.Content, rawItems, idx); err != nil {
				return fmt.Errorf("insert article block %d: %w", item.ID, err)
			}
		}
	}

	for idx, item := range navItems {
		if _, err = tx.ExecContext(ctx, `
			INSERT INTO nav_items(label, href, icon, position)
			VALUES($1, $2, $3, $4)
		`, item.Label, item.Href, item.Icon, idx); err != nil {
			return fmt.Errorf("insert nav item: %w", err)
		}
	}

	if err = tx.Commit(); err != nil {
		return fmt.Errorf("commit seed tx: %w", err)
	}

	return nil
}
