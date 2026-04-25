package server

import (
	"bruska/internal/infrastructure/firebaseauth"
	"bruska/internal/infrastructure/objectstorage"
	"bruska/internal/service"
	"bruska/pkg/logging"
	"context"
	"fmt"
	"net/http"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/recover"
)

type Server struct {
	port           string
	svc            service.Store
	objectStorage  objectstorage.Client
	firebaseAuth   firebaseauth.Client
	app            *fiber.App
	graphqlHandler http.Handler
}

func New(port string, svc service.Store, objectStorage objectstorage.Client, firebaseAuth firebaseauth.Client) *Server {
	srv := Server{port: port, svc: svc, objectStorage: objectStorage, firebaseAuth: firebaseAuth}

	cfg := fiber.Config{
		DisableStartupMessage: true,
		CaseSensitive:         true,
		StrictRouting:         false,
		ReadBufferSize:        10240,
	}

	app := fiber.New(cfg)
	app.Use(recover.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
		AllowMethods: "GET,POST,PATCH,DELETE,OPTIONS",
	}))
	app.Use(elapsedTimeMiddleware())

	srv.app = app
	srv.initGraphQL()
	srv.initRoutes()
	return &srv
}

func (s *Server) App() *fiber.App {
	return s.app
}

func (s *Server) Start(_ context.Context) error {
	logging.Infof("starting server with port: %s", s.port)
	if err := s.app.Listen(":" + s.port); err != nil {
		return fmt.Errorf("HTTP server stopped execution: %w", err)
	}
	return nil
}

func (s *Server) Stop(ctx context.Context) error {
	return s.app.ShutdownWithContext(ctx)
}

func (s *Server) Name() string {
	return "rest-server"
}
