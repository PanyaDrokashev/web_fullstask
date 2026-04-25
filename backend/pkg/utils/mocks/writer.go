package mocks

import (
	"context"

	"github.com/stretchr/testify/mock"
)

type MockWriter struct {
	mock.Mock
}

func (m *MockWriter) LogRecord(_ any, _ any) {}

func (m *MockWriter) Start(_ context.Context) error {
	return nil
}

func (m *MockWriter) Stop(_ context.Context) error {
	return nil
}
