package config

import (
	"bufio"
	"os"
	"strings"
	"time"

	"bruska/pkg/logging"

	"github.com/caarlos0/env/v6"
)

var (
	App     app
	Server  server
	DB      database
	Storage storage
	Auth    auth
)

type (
	app struct {
		Env string `env:"ENV" envDefault:"local"`
	}

	server struct {
		Port         string        `env:"HTTP_PORT" envDefault:"8080"`
		StartTimeout time.Duration `env:"START_TIMEOUT" envDefault:"100ms"`
	}

	database struct {
		URL          string        `env:"DATABASE_URL" envDefault:"postgres://bruska:bruska@localhost:5432/bruska?sslmode=disable"`
		PingTimeout  time.Duration `env:"DATABASE_PING_TIMEOUT" envDefault:"5s"`
		MaxOpenConns int           `env:"DATABASE_MAX_OPEN_CONNS" envDefault:"10"`
		MaxIdleConns int           `env:"DATABASE_MAX_IDLE_CONNS" envDefault:"5"`
	}

	storage struct {
		Endpoint      string `env:"S3_ENDPOINT" envDefault:"https://storage.yandexcloud.net"`
		Region        string `env:"S3_REGION" envDefault:"ru-central1"`
		Bucket        string `env:"S3_BUCKET" envDefault:""`
		KeyID         string `env:"KEY_ID" envDefault:""`
		SecretKey     string `env:"SECRET_KEY" envDefault:""`
		PublicBaseURL string `env:"S3_PUBLIC_BASE_URL" envDefault:""`
		UsePathStyle  bool   `env:"S3_USE_PATH_STYLE" envDefault:"true"`
	}

	auth struct {
		FirebaseProjectID       string `env:"FIREBASE_PROJECT_ID" envDefault:""`
		FirebaseClientEmail     string `env:"FIREBASE_CLIENT_EMAIL" envDefault:""`
		FirebasePrivateKey      string `env:"FIREBASE_PRIVATE_KEY" envDefault:""`
		FirebasePrivateKeyID    string `env:"FIREBASE_PRIVATE_KEY_ID" envDefault:""`
		FirebaseClientID        string `env:"FIREBASE_CLIENT_ID" envDefault:""`
		FirebaseAdminUIDs       string `env:"FIREBASE_ADMIN_UIDS" envDefault:""`
		FirebaseServiceAcctPath string `env:"FIREBASE_SERVICE_ACCOUNT_PATH" envDefault:""`
	}
)

func InitApp() {
	loadDotEnv(".env")

	if err := env.Parse(&App); err != nil {
		logging.Fatalf("failed to app config: %s", err.Error())
	}
}

func InitServer() {
	if err := env.Parse(&Server); err != nil {
		logging.Fatalf("failed to server config: %s", err.Error())
	}
}

func InitDB() {
	if err := env.Parse(&DB); err != nil {
		logging.Fatalf("failed to db config: %s", err.Error())
	}
}

func InitStorage() {
	if err := env.Parse(&Storage); err != nil {
		logging.Fatalf("failed to storage config: %s", err.Error())
	}
}

func InitAuth() {
	if err := env.Parse(&Auth); err != nil {
		logging.Fatalf("failed to auth config: %s", err.Error())
	}
}

func loadDotEnv(path string) {
	file, err := os.Open(path)
	if err != nil {
		return
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}

		parts := strings.SplitN(line, "=", 2)
		if len(parts) != 2 {
			continue
		}

		key := strings.TrimSpace(parts[0])
		value := strings.TrimSpace(parts[1])
		if key == "" {
			continue
		}

		value = strings.Trim(value, `"'`)
		if _, exists := os.LookupEnv(key); exists {
			continue
		}

		if setErr := os.Setenv(key, value); setErr != nil {
			logging.Warnf("failed to set env %s from %s: %v", key, path, setErr)
		}
	}

	if scanErr := scanner.Err(); scanErr != nil {
		logging.Warnf("failed to read %s: %v", path, scanErr)
	}
}
