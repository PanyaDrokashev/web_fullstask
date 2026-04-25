package firebaseauth

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"strings"

	"bruska/pkg/logging"

	firebase "firebase.google.com/go/v4"
	"firebase.google.com/go/v4/auth"
	"google.golang.org/api/option"
)

type Config struct {
	ProjectID          string
	ClientEmail        string
	PrivateKey         string
	PrivateKeyID       string
	ClientID           string
	AdminUIDs          string
	ServiceAccountPath string
}

type User struct {
	UID   string
	Email string
	Name  string
	Role  string
}

type Client interface {
	Enabled() bool
	VerifyIDToken(ctx context.Context, idToken string) (User, error)
}

type noopClient struct{}

func (noopClient) Enabled() bool {
	return false
}

func (noopClient) VerifyIDToken(_ context.Context, _ string) (User, error) {
	return User{}, fmt.Errorf("firebase auth is disabled")
}

type firebaseClient struct {
	auth      *auth.Client
	adminUIDs map[string]struct{}
}

func New(cfg Config) Client {
	adminUIDs := parseAdminUIDs(cfg.AdminUIDs)

	var (
		opt option.ClientOption
		err error
	)

	if strings.TrimSpace(cfg.ServiceAccountPath) != "" {
		opt = option.WithCredentialsFile(strings.TrimSpace(cfg.ServiceAccountPath))
	} else {
		credentialsJSON, buildErr := buildCredentialsJSON(cfg)
		if buildErr != nil {
			logging.Warnf("firebase auth disabled: %v", buildErr)
			return noopClient{}
		}
		opt = option.WithCredentialsJSON(credentialsJSON)
	}

	app, err := firebase.NewApp(context.Background(), &firebase.Config{ProjectID: strings.TrimSpace(cfg.ProjectID)}, opt)
	if err != nil {
		logging.Errorf("init firebase app: %v", err)
		return noopClient{}
	}

	authClient, err := app.Auth(context.Background())
	if err != nil {
		logging.Errorf("init firebase auth client: %v", err)
		return noopClient{}
	}

	return &firebaseClient{
		auth:      authClient,
		adminUIDs: adminUIDs,
	}
}

func (c *firebaseClient) Enabled() bool {
	return c != nil && c.auth != nil
}

func (c *firebaseClient) VerifyIDToken(ctx context.Context, idToken string) (User, error) {
	if !c.Enabled() {
		return User{}, fmt.Errorf("firebase auth is disabled")
	}

	token := strings.TrimSpace(idToken)
	if token == "" {
		return User{}, fmt.Errorf("empty id token")
	}

	decoded, err := c.auth.VerifyIDToken(ctx, token)
	if err != nil {
		return User{}, fmt.Errorf("verify firebase id token: %w", err)
	}

	user := User{
		UID:  decoded.UID,
		Role: "user",
	}

	if email, ok := decoded.Claims["email"].(string); ok {
		user.Email = strings.TrimSpace(email)
	}
	if name, ok := decoded.Claims["name"].(string); ok {
		user.Name = strings.TrimSpace(name)
	}

	if role, ok := decoded.Claims["role"].(string); ok {
		if strings.TrimSpace(role) != "" {
			user.Role = strings.ToLower(strings.TrimSpace(role))
		}
	}

	if adminClaim, ok := decoded.Claims["admin"].(bool); ok && adminClaim {
		user.Role = "admin"
	}

	if _, ok := c.adminUIDs[user.UID]; ok {
		user.Role = "admin"
	}

	return user, nil
}

func parseAdminUIDs(raw string) map[string]struct{} {
	result := make(map[string]struct{})
	for _, part := range strings.Split(raw, ",") {
		uid := strings.TrimSpace(part)
		if uid == "" {
			continue
		}
		result[uid] = struct{}{}
	}
	return result
}

func buildCredentialsJSON(cfg Config) ([]byte, error) {
	projectID := strings.TrimSpace(cfg.ProjectID)
	clientEmail := strings.TrimSpace(cfg.ClientEmail)
	privateKey := strings.TrimSpace(cfg.PrivateKey)

	if projectID == "" || clientEmail == "" || privateKey == "" {
		return nil, fmt.Errorf("missing firebase credentials env vars")
	}

	privateKey = strings.ReplaceAll(privateKey, `\n`, "\n")

	payload := map[string]string{
		"type":                        "service_account",
		"project_id":                  projectID,
		"private_key_id":              strings.TrimSpace(cfg.PrivateKeyID),
		"private_key":                 privateKey,
		"client_email":                clientEmail,
		"client_id":                   strings.TrimSpace(cfg.ClientID),
		"auth_uri":                    "https://accounts.google.com/o/oauth2/auth",
		"token_uri":                   "https://oauth2.googleapis.com/token",
		"auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
	}

	return json.Marshal(payload)
}

func LoadServiceAccountFromFile(path string) (Config, error) {
	content, err := os.ReadFile(path)
	if err != nil {
		return Config{}, err
	}

	var parsed struct {
		ProjectID    string `json:"project_id"`
		ClientEmail  string `json:"client_email"`
		PrivateKey   string `json:"private_key"`
		PrivateKeyID string `json:"private_key_id"`
		ClientID     string `json:"client_id"`
	}
	if err = json.Unmarshal(content, &parsed); err != nil {
		return Config{}, err
	}

	return Config{
		ProjectID:    parsed.ProjectID,
		ClientEmail:  parsed.ClientEmail,
		PrivateKey:   parsed.PrivateKey,
		PrivateKeyID: parsed.PrivateKeyID,
		ClientID:     parsed.ClientID,
	}, nil
}
