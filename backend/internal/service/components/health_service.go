package components

import (
	"bruska/internal/store"
	"context"
)

type HealthService interface {
	Status(ctx context.Context) string
}

type healthService struct {
	store store.Store
}

func NewHealthService(store store.Store) HealthService {
	return &healthService{store: store}
}

func (s *healthService) Status(ctx context.Context) string {
	return s.store.Health().Status(ctx)
}
