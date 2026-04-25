package postgres

import (
	"context"
	"database/sql"
	"fmt"
)

type migration struct {
	version int
	name    string
	sql     string
}

const schemaMigrationsDDL = `
CREATE TABLE IF NOT EXISTS schema_migrations (
    version INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
`

var migrations = []migration{
	{
		version: 1,
		name:    "create_content_schema",
		sql: `
CREATE TABLE IF NOT EXISTS product_categories (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY,
    category_id INTEGER NOT NULL REFERENCES product_categories(id),
    tag TEXT,
    title TEXT NOT NULL,
    dir TEXT NOT NULL UNIQUE,
    img TEXT NOT NULL DEFAULT '',
    price_tag TEXT NOT NULL,
    with_btn BOOLEAN NOT NULL DEFAULT FALSE,
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    on_pallet NUMERIC(10,2) NOT NULL,
    weight NUMERIC(10,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS product_colors (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    tag TEXT NOT NULL,
    position INTEGER NOT NULL,
    UNIQUE(product_id, tag)
);

CREATE TABLE IF NOT EXISTS product_sizes (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    length INTEGER NOT NULL,
    width INTEGER NOT NULL,
    height INTEGER NOT NULL,
    position INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS product_prices (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    color_tag TEXT NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    position INTEGER NOT NULL,
    UNIQUE(product_id, color_tag)
);

CREATE TABLE IF NOT EXISTS product_descriptions (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    position INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS articles (
    id INTEGER PRIMARY KEY,
    title TEXT NOT NULL,
    preview TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS article_blocks (
    id SERIAL PRIMARY KEY,
    article_id INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    block_type TEXT NOT NULL,
    content TEXT,
    items_json JSONB,
    position INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS nav_items (
    id SERIAL PRIMARY KEY,
    label TEXT NOT NULL,
    href TEXT NOT NULL,
    icon TEXT,
    position INTEGER NOT NULL
);
`,
	},
	{
		version: 2,
		name:    "add_article_blocks_json",
		sql: `
ALTER TABLE articles
ADD COLUMN IF NOT EXISTS blocks_json JSONB NOT NULL DEFAULT '[]'::jsonb;

WITH grouped AS (
    SELECT
        ab.article_id,
        jsonb_agg(
            jsonb_strip_nulls(
                jsonb_build_object(
                    'type', ab.block_type,
                    'content', NULLIF(ab.content, ''),
                    'items', ab.items_json
                )
            )
            ORDER BY ab.position, ab.id
        ) AS blocks_json
    FROM article_blocks ab
    GROUP BY ab.article_id
)
UPDATE articles a
SET blocks_json = g.blocks_json
FROM grouped g
WHERE a.id = g.article_id
  AND (a.blocks_json = '[]'::jsonb OR a.blocks_json IS NULL);
`,
	},
	{
		version: 3,
		name:    "create_users_table",
		sql: `
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    login TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO users(name, login, email, password, role)
VALUES('Admin', 'admin', 'admin@bruska.local', 'admin', 'admin')
ON CONFLICT(login) DO NOTHING;
`,
	},
}

func runMigrations(ctx context.Context, db *sql.DB) error {
	if _, err := db.ExecContext(ctx, schemaMigrationsDDL); err != nil {
		return fmt.Errorf("ensure schema_migrations table: %w", err)
	}

	for _, m := range migrations {
		var exists int
		err := db.QueryRowContext(ctx, "SELECT 1 FROM schema_migrations WHERE version = $1", m.version).Scan(&exists)
		if err == nil {
			continue
		}
		if err != nil && err != sql.ErrNoRows {
			return fmt.Errorf("check migration %d: %w", m.version, err)
		}

		tx, err := db.BeginTx(ctx, nil)
		if err != nil {
			return fmt.Errorf("begin migration %d: %w", m.version, err)
		}

		if _, err = tx.ExecContext(ctx, m.sql); err != nil {
			_ = tx.Rollback()
			return fmt.Errorf("execute migration %d (%s): %w", m.version, m.name, err)
		}

		if _, err = tx.ExecContext(ctx, "INSERT INTO schema_migrations(version, name) VALUES($1, $2)", m.version, m.name); err != nil {
			_ = tx.Rollback()
			return fmt.Errorf("persist migration %d: %w", m.version, err)
		}

		if err = tx.Commit(); err != nil {
			return fmt.Errorf("commit migration %d: %w", m.version, err)
		}
	}

	return nil
}
