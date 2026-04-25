package postgres

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"bruska/internal/config"
	"bruska/internal/store/repositories"

	_ "github.com/jackc/pgx/v5/stdlib"
)

type Client struct {
	db *sql.DB
}

func New(dsn string) (*Client, error) {
	db, err := sql.Open("pgx", dsn)
	if err != nil {
		return nil, fmt.Errorf("open postgres: %w", err)
	}

	db.SetMaxOpenConns(config.DB.MaxOpenConns)
	db.SetMaxIdleConns(config.DB.MaxIdleConns)
	db.SetConnMaxLifetime(5 * time.Minute)
	return &Client{db: db}, nil
}

func (c *Client) Start(ctx context.Context) error {
	pingCtx, cancel := context.WithTimeout(ctx, config.DB.PingTimeout)
	defer cancel()

	if err := c.db.PingContext(pingCtx); err != nil {
		return fmt.Errorf("ping postgres: %w", err)
	}

	if err := runMigrations(ctx, c.db); err != nil {
		return err
	}

	if err := repositories.SeedContent(ctx, c.db); err != nil {
		return fmt.Errorf("seed content: %w", err)
	}

	return nil
}

func (c *Client) Stop(_ context.Context) error {
	if c.db == nil {
		return nil
	}
	return c.db.Close()
}

func (c *Client) DB() *sql.DB {
	return c.db
}
