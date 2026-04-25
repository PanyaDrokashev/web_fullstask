package repositories

import "context"

type HealthRepository interface {
	Status(ctx context.Context) string
}

type healthRepository struct{}

func NewHealthRepository() HealthRepository {
	return &healthRepository{}
}

func (r *healthRepository) Status(_ context.Context) string {
	return "ok"
}
