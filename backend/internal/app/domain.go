package app

import "context"

type (
	StarterFunc func(ctx context.Context) error
	StopperFunc func(ctx context.Context) error
)
