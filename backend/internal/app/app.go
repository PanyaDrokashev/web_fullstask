package app

import (
	"context"
	"fmt"
	"net"
	"os/signal"
	"syscall"
	"time"

	"bruska/internal/config"
	"bruska/internal/server"
	"bruska/pkg/logging"

	"golang.org/x/sync/errgroup"
)

type App struct {
	srv *server.Server

	onStart []StarterFunc
	onStop  []StopperFunc
}

const (
	startTimeout = time.Second * 10
	stopTimeout  = time.Second * 5
)

func New(srv *server.Server, onStart []StarterFunc, onStop []StopperFunc) *App {
	return &App{srv: srv, onStart: onStart, onStop: onStop}
}

func (a *App) Init() error {
	startTime := time.Now()
	fmt.Println("starting app...")

	gracefulCtx, _ := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)

	startCtx, cancel := context.WithTimeout(gracefulCtx, startTimeout)
	defer cancel()

	for i := range a.onStart {
		err := a.onStart[i](startCtx)
		if err != nil {
			return err
		}
	}

	runG, runCtx := errgroup.WithContext(gracefulCtx)
	runG.Go(func() error {
		return a.srv.Start(runCtx)
	})

	runG.Go(a.GracefulShutdown(runCtx, stopTimeout))
	config.InitServer()
	waitForPort(config.Server.Port)
	logging.WithField("name", "rest-server").Info("started")

	took := time.Since(startTime)
	logging.WithField(logging.LogFieldDurationMs, took.Milliseconds()).Info("application started")

	return runG.Wait()
}

func (a *App) GracefulShutdown(ctx context.Context, timeout time.Duration) func() error {
	return func() error {
		<-ctx.Done()
		logging.Info("processing graceful shutdown...")

		shutdownCtx, cancel := context.WithTimeout(ctx, timeout)
		defer cancel()

		err := a.srv.Stop(shutdownCtx)
		if err != nil {
			return err
		}
		logging.WithField("name", "rest-server").Info("stopped")

		for i := len(a.onStop) - 1; i >= 0; i-- {
			err = a.onStop[i](shutdownCtx)
			if err != nil {
				return err
			}
		}

		logging.Info("gracefully stopped app")
		return nil
	}
}

func waitForPort(port string) {
	d := &net.Dialer{}
	backoff := 50 * time.Millisecond
	const (
		attemptTimeout = 300 * time.Millisecond
		maxBackoff     = 500 * time.Millisecond
	)

	for {
		ctx, cancel := context.WithTimeout(context.Background(), attemptTimeout)
		conn, err := d.DialContext(ctx, "tcp", ":"+port)
		cancel()

		if err == nil {
			_ = conn.Close()
			return
		}

		time.Sleep(backoff)
		if backoff < maxBackoff {
			backoff *= 2
			if backoff > maxBackoff {
				backoff = maxBackoff
			}
		}
	}
}
