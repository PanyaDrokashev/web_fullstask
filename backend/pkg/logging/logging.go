package logging

import (
	"context"
	"fmt"
	stdlog "log"
	"sync"

	"go.uber.org/zap"
)

const LogFieldDurationMs = "duration_ms"

type Entry struct {
	prefix string
}

var (
	loggerOnce sync.Once
	logger     *zap.Logger
)

func zapLogger() *zap.Logger {
	loggerOnce.Do(func() {
		l, err := zap.NewProduction()
		if err != nil {
			stdlog.Printf("failed to init zap logger: %v", err)
			l = zap.NewNop()
		}
		logger = l
	})
	return logger
}

func Sugared() *zap.SugaredLogger {
	return zapLogger().Sugar()
}

func WithField(key string, value any) *Entry {
	return &Entry{prefix: fmt.Sprintf("[%s=%v] ", key, value)}
}

func WithContext(_ context.Context) *Entry {
	return &Entry{}
}

func (e *Entry) Info(msg string) {
	Info(e.prefix + msg)
}

func (e *Entry) Warn(msg string) {
	Warn(e.prefix + msg)
}

func (e *Entry) Error(msg string) {
	Error(e.prefix + msg)
}

func Info(args ...any) {
	stdlog.Print(fmt.Sprint(args...))
}

func Infof(format string, args ...any) {
	stdlog.Printf(format, args...)
}

func Warn(args ...any) {
	stdlog.Print("WARN: ", fmt.Sprint(args...))
}

func Warnf(format string, args ...any) {
	stdlog.Printf("WARN: "+format, args...)
}

func Error(args ...any) {
	stdlog.Print("ERROR: ", fmt.Sprint(args...))
}

func Errorf(format string, args ...any) {
	stdlog.Printf("ERROR: "+format, args...)
}

func Fatal(args ...any) {
	stdlog.Fatal(args...)
}

func Fatalf(format string, args ...any) {
	stdlog.Fatalf(format, args...)
}
