package repositories

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
)

func (r *contentRepository) CreateArticle(ctx context.Context, draft ArticleDraft) (Article, error) {
	if r.db == nil {
		return Article{}, errors.New("database is not configured")
	}

	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return Article{}, fmt.Errorf("begin transaction: %w", err)
	}

	defer func() {
		if err != nil {
			_ = tx.Rollback()
		}
	}()

	var id int
	if err = tx.QueryRowContext(ctx, `SELECT COALESCE(MAX(id), 0) + 1 FROM articles`).Scan(&id); err != nil {
		return Article{}, fmt.Errorf("select next article id: %w", err)
	}

	blocksJSON, err := json.Marshal(draft.Blocks)
	if err != nil {
		return Article{}, fmt.Errorf("marshal article blocks: %w", err)
	}

	if _, err = tx.ExecContext(ctx, `INSERT INTO articles(id, title, preview, blocks_json) VALUES($1, $2, $3, $4)`, id, draft.Title, draft.Preview, blocksJSON); err != nil {
		return Article{}, fmt.Errorf("insert article: %w", err)
	}

	if err = tx.Commit(); err != nil {
		return Article{}, fmt.Errorf("commit transaction: %w", err)
	}

	return r.articleByIDFromDB(ctx, id)
}

func (r *contentRepository) UpdateArticle(ctx context.Context, id int, draft ArticleDraft) (Article, bool, error) {
	if r.db == nil {
		return Article{}, false, errors.New("database is not configured")
	}

	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return Article{}, false, fmt.Errorf("begin transaction: %w", err)
	}

	defer func() {
		if err != nil {
			_ = tx.Rollback()
		}
	}()

	blocksJSON, err := json.Marshal(draft.Blocks)
	if err != nil {
		return Article{}, false, fmt.Errorf("marshal article blocks: %w", err)
	}

	res, err := tx.ExecContext(ctx, `UPDATE articles SET title = $1, preview = $2, blocks_json = $3 WHERE id = $4`, draft.Title, draft.Preview, blocksJSON, id)
	if err != nil {
		return Article{}, false, fmt.Errorf("update article: %w", err)
	}

	affected, err := res.RowsAffected()
	if err != nil {
		return Article{}, false, fmt.Errorf("read updated rows: %w", err)
	}
	if affected == 0 {
		if rbErr := tx.Rollback(); rbErr != nil {
			return Article{}, false, fmt.Errorf("rollback transaction: %w", rbErr)
		}
		return Article{}, false, nil
	}

	if err = tx.Commit(); err != nil {
		return Article{}, false, fmt.Errorf("commit transaction: %w", err)
	}

	article, err := r.articleByIDFromDB(ctx, id)
	if err != nil {
		return Article{}, false, err
	}

	return article, true, nil
}

func (r *contentRepository) DeleteArticle(ctx context.Context, id int) (bool, error) {
	if r.db == nil {
		return false, errors.New("database is not configured")
	}

	res, err := r.db.ExecContext(ctx, `DELETE FROM articles WHERE id = $1`, id)
	if err != nil {
		return false, fmt.Errorf("delete article: %w", err)
	}

	affected, err := res.RowsAffected()
	if err != nil {
		return false, fmt.Errorf("read deleted rows: %w", err)
	}

	return affected > 0, nil
}

func (r *contentRepository) articleByIDFromDB(ctx context.Context, id int) (Article, error) {
	if r.db == nil {
		return Article{}, errors.New("database is not configured")
	}

	var article Article
	var blocksRaw []byte
	if err := r.db.QueryRowContext(ctx, `SELECT id, title, preview, blocks_json FROM articles WHERE id = $1`, id).Scan(&article.ID, &article.Title, &article.Preview, &blocksRaw); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return Article{}, err
		}
		return Article{}, fmt.Errorf("load article: %w", err)
	}

	decodedBlocks, decodeErr := decodeArticleBlocks(blocksRaw)
	if decodeErr != nil {
		return Article{}, decodeErr
	}
	if len(decodedBlocks) > 0 {
		article.Content = decodedBlocks
		return article, nil
	}

	rows, err := r.db.QueryContext(ctx, `
		SELECT block_type, COALESCE(content, ''), items_json
		FROM article_blocks
		WHERE article_id = $1
		ORDER BY position, id
	`, id)
	if err != nil {
		return Article{}, fmt.Errorf("load article blocks: %w", err)
	}
	defer rows.Close()

	article.Content = make([]ArticlePart, 0)
	for rows.Next() {
		var part ArticlePart
		var itemsRaw []byte
		if err = rows.Scan(&part.Type, &part.Content, &itemsRaw); err != nil {
			return Article{}, fmt.Errorf("scan article block: %w", err)
		}

		if len(itemsRaw) > 0 {
			var decoded any
			if unmarshalErr := json.Unmarshal(itemsRaw, &decoded); unmarshalErr == nil {
				part.Items = decoded
			}
		}

		article.Content = append(article.Content, part)
	}

	if err = rows.Err(); err != nil {
		return Article{}, fmt.Errorf("iterate article blocks: %w", err)
	}

	return article, nil
}

func decodeArticleBlocks(raw []byte) ([]ArticlePart, error) {
	if len(raw) == 0 || string(raw) == "null" {
		return []ArticlePart{}, nil
	}

	var parts []ArticlePart
	if err := json.Unmarshal(raw, &parts); err != nil {
		return nil, fmt.Errorf("decode article blocks json: %w", err)
	}

	if parts == nil {
		return []ArticlePart{}, nil
	}

	return parts, nil
}
