package store

import (
	"database/sql"

	"bruska/internal/store/repositories"
)

//go:generate mockery --name=Store --with-expecter
type Store interface {
	Health() repositories.HealthRepository
	Content() repositories.ContentRepository
}

type sqlStore struct {
	healthRepository  repositories.HealthRepository
	contentRepository repositories.ContentRepository
}

func New(db *sql.DB) Store {
	var store sqlStore
	store.healthRepository = repositories.NewHealthRepository()
	store.contentRepository = repositories.NewContentRepository(db)
	return &store
}

func (s *sqlStore) Health() repositories.HealthRepository   { return s.healthRepository }
func (s *sqlStore) Content() repositories.ContentRepository { return s.contentRepository }
