package main

import (
	"context"
	"database/sql"
	"fmt"
	"mime"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"time"

	"bruska/internal/config"
	"bruska/internal/infrastructure/objectstorage"

	_ "github.com/jackc/pgx/v5/stdlib"
)

type uploadResult struct {
	StorageKey string
	PublicURL  string
	Dir        string
	FileName   string
}

func main() {
	config.InitApp()
	config.InitDB()
	config.InitStorage()

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
	defer cancel()

	storage := objectstorage.New(objectstorage.Config{
		Endpoint:      config.Storage.Endpoint,
		Region:        config.Storage.Region,
		Bucket:        config.Storage.Bucket,
		KeyID:         config.Storage.KeyID,
		SecretKey:     config.Storage.SecretKey,
		PublicBaseURL: config.Storage.PublicBaseURL,
		UsePathStyle:  config.Storage.UsePathStyle,
	})
	if !storage.Enabled() {
		panic("object storage is not configured")
	}

	db, err := sql.Open("pgx", config.DB.URL)
	if err != nil {
		panic(fmt.Errorf("open db: %w", err))
	}
	defer db.Close()

	if err = db.PingContext(ctx); err != nil {
		panic(fmt.Errorf("ping db: %w", err))
	}

	results, err := uploadCatalogAssets(ctx, storage, filepath.Join("assets", "catalog"))
	if err != nil {
		panic(err)
	}
	if len(results) == 0 {
		fmt.Println("no catalog assets found to upload")
		return
	}

	previewByDir := make(map[string]string)
	for _, item := range results {
		stem := strings.TrimSuffix(item.FileName, filepath.Ext(item.FileName))
		if stem == item.Dir {
			previewByDir[item.Dir] = item.PublicURL
		}
	}

	updated, err := updateProductImages(ctx, db, previewByDir)
	if err != nil {
		panic(err)
	}

	fmt.Printf("uploaded assets: %d\n", len(results))
	fmt.Printf("products updated: %d\n", updated)
}

func uploadCatalogAssets(ctx context.Context, storage objectstorage.Client, catalogRoot string) ([]uploadResult, error) {
	entries := make([]string, 0)
	err := filepath.WalkDir(catalogRoot, func(path string, d os.DirEntry, walkErr error) error {
		if walkErr != nil {
			return walkErr
		}
		if d.IsDir() {
			return nil
		}

		ext := strings.ToLower(filepath.Ext(d.Name()))
		if !isImageExt(ext) {
			return nil
		}

		entries = append(entries, path)
		return nil
	})
	if err != nil {
		return nil, fmt.Errorf("walk %s: %w", catalogRoot, err)
	}

	sort.Strings(entries)
	results := make([]uploadResult, 0, len(entries))
	for _, fullPath := range entries {
		rel, err := filepath.Rel(catalogRoot, fullPath)
		if err != nil {
			return nil, fmt.Errorf("build relative path for %s: %w", fullPath, err)
		}

		rel = filepath.ToSlash(rel)
		parts := strings.Split(rel, "/")
		if len(parts) < 2 {
			continue
		}
		dir := parts[0]
		fileName := parts[len(parts)-1]

		storageKey := filepath.ToSlash(filepath.Join("catalog", rel))
		contentType := mime.TypeByExtension(strings.ToLower(filepath.Ext(fileName)))
		if contentType == "" {
			contentType = "application/octet-stream"
		}

		f, err := os.Open(fullPath)
		if err != nil {
			return nil, fmt.Errorf("open %s: %w", fullPath, err)
		}

		stat, statErr := f.Stat()
		if statErr != nil {
			_ = f.Close()
			return nil, fmt.Errorf("stat %s: %w", fullPath, statErr)
		}

		publicURL, uploadErr := storage.Upload(ctx, storageKey, contentType, f, stat.Size())
		closeErr := f.Close()
		if uploadErr != nil {
			return nil, fmt.Errorf("upload %s: %w", fullPath, uploadErr)
		}
		if closeErr != nil {
			return nil, fmt.Errorf("close %s: %w", fullPath, closeErr)
		}

		results = append(results, uploadResult{
			StorageKey: storageKey,
			PublicURL:  publicURL,
			Dir:        dir,
			FileName:   fileName,
		})
	}

	return results, nil
}

func updateProductImages(ctx context.Context, db *sql.DB, previewByDir map[string]string) (int64, error) {
	if len(previewByDir) == 0 {
		return 0, nil
	}

	tx, err := db.BeginTx(ctx, nil)
	if err != nil {
		return 0, fmt.Errorf("begin tx: %w", err)
	}
	defer func() {
		_ = tx.Rollback()
	}()

	var updated int64
	for dir, previewURL := range previewByDir {
		res, execErr := tx.ExecContext(ctx, `UPDATE products SET img = $1 WHERE dir = $2`, previewURL, dir)
		if execErr != nil {
			return 0, fmt.Errorf("update product img for dir=%s: %w", dir, execErr)
		}
		affected, affErr := res.RowsAffected()
		if affErr != nil {
			return 0, fmt.Errorf("rows affected for dir=%s: %w", dir, affErr)
		}
		updated += affected
	}

	if err = tx.Commit(); err != nil {
		return 0, fmt.Errorf("commit tx: %w", err)
	}

	return updated, nil
}

func isImageExt(ext string) bool {
	switch ext {
	case ".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg":
		return true
	default:
		return false
	}
}
