package objectstorage

import (
	"context"
	"fmt"
	"io"
	"mime"
	"net/url"
	"path"
	"path/filepath"
	"sort"
	"strings"

	"bruska/pkg/logging"

	"github.com/aws/aws-sdk-go-v2/aws"
	awsconfig "github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/aws/aws-sdk-go-v2/service/s3/types"
)

type Config struct {
	Endpoint      string
	Region        string
	Bucket        string
	KeyID         string
	SecretKey     string
	PublicBaseURL string
	UsePathStyle  bool
}

type Client interface {
	Enabled() bool
	Upload(ctx context.Context, key, contentType string, body io.Reader, size int64) (string, error)
	ListImageURLs(ctx context.Context, prefix string) ([]string, error)
	FindImageURLByBaseName(ctx context.Context, prefix, baseName string) (string, bool, error)
}

type noopClient struct{}

func (noopClient) Enabled() bool {
	return false
}

func (noopClient) Upload(_ context.Context, _ string, _ string, _ io.Reader, _ int64) (string, error) {
	return "", fmt.Errorf("object storage is disabled")
}

func (noopClient) ListImageURLs(_ context.Context, _ string) ([]string, error) {
	return nil, fmt.Errorf("object storage is disabled")
}

func (noopClient) FindImageURLByBaseName(_ context.Context, _ string, _ string) (string, bool, error) {
	return "", false, fmt.Errorf("object storage is disabled")
}

type s3Client struct {
	bucket        string
	publicBaseURL string
	api           *s3.Client
}

func New(cfg Config) Client {
	if strings.TrimSpace(cfg.Bucket) == "" || strings.TrimSpace(cfg.KeyID) == "" || strings.TrimSpace(cfg.SecretKey) == "" {
		logging.Warn("object storage is not configured; uploads fall back to local filesystem")
		return noopClient{}
	}

	awsCfg, err := awsconfig.LoadDefaultConfig(
		context.Background(),
		awsconfig.WithRegion(strings.TrimSpace(cfg.Region)),
		awsconfig.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(strings.TrimSpace(cfg.KeyID), strings.TrimSpace(cfg.SecretKey), "")),
	)
	if err != nil {
		logging.Errorf("init object storage config: %v", err)
		return noopClient{}
	}

	api := s3.NewFromConfig(awsCfg, func(options *s3.Options) {
		endpoint := strings.TrimSpace(cfg.Endpoint)
		if endpoint != "" {
			options.BaseEndpoint = aws.String(endpoint)
		}
		options.UsePathStyle = cfg.UsePathStyle
	})

	publicBaseURL := strings.TrimSpace(cfg.PublicBaseURL)
	if publicBaseURL == "" {
		normalizedEndpoint := strings.TrimRight(strings.TrimSpace(cfg.Endpoint), "/")
		if normalizedEndpoint != "" {
			publicBaseURL = normalizedEndpoint + "/" + strings.TrimSpace(cfg.Bucket)
		}
	}

	return &s3Client{
		bucket:        strings.TrimSpace(cfg.Bucket),
		publicBaseURL: strings.TrimRight(publicBaseURL, "/"),
		api:           api,
	}
}

func (c *s3Client) Enabled() bool {
	return c != nil && c.api != nil && c.bucket != ""
}

func (c *s3Client) Upload(ctx context.Context, key, contentType string, body io.Reader, _ int64) (string, error) {
	if !c.Enabled() {
		return "", fmt.Errorf("object storage is disabled")
	}

	normalizedKey := normalizeObjectKey(key)
	if normalizedKey == "" {
		return "", fmt.Errorf("empty object key")
	}

	if strings.TrimSpace(contentType) == "" {
		ext := strings.ToLower(filepath.Ext(normalizedKey))
		if detected := mime.TypeByExtension(ext); detected != "" {
			contentType = detected
		} else {
			contentType = "application/octet-stream"
		}
	}

	_, err := c.api.PutObject(ctx, &s3.PutObjectInput{
		Bucket:      aws.String(c.bucket),
		Key:         aws.String(normalizedKey),
		Body:        body,
		ContentType: aws.String(contentType),
		ACL:         types.ObjectCannedACLPublicRead,
	})
	if err != nil {
		return "", fmt.Errorf("put object %s: %w", normalizedKey, err)
	}

	return c.objectURL(normalizedKey), nil
}

func (c *s3Client) ListImageURLs(ctx context.Context, prefix string) ([]string, error) {
	if !c.Enabled() {
		return nil, fmt.Errorf("object storage is disabled")
	}

	normalizedPrefix := normalizeObjectKey(prefix)
	if normalizedPrefix != "" && !strings.HasSuffix(normalizedPrefix, "/") {
		normalizedPrefix += "/"
	}

	out, err := c.api.ListObjectsV2(ctx, &s3.ListObjectsV2Input{
		Bucket: aws.String(c.bucket),
		Prefix: aws.String(normalizedPrefix),
	})
	if err != nil {
		return nil, fmt.Errorf("list objects by prefix %s: %w", normalizedPrefix, err)
	}

	urls := make([]string, 0, len(out.Contents))
	for _, obj := range out.Contents {
		if obj.Key == nil {
			continue
		}

		key := strings.TrimSpace(*obj.Key)
		if !isImageExtension(strings.ToLower(filepath.Ext(key))) {
			continue
		}
		urls = append(urls, c.objectURL(key))
	}

	sort.Strings(urls)
	return urls, nil
}

func (c *s3Client) FindImageURLByBaseName(ctx context.Context, prefix, baseName string) (string, bool, error) {
	if !c.Enabled() {
		return "", false, fmt.Errorf("object storage is disabled")
	}

	images, err := c.ListImageURLs(ctx, prefix)
	if err != nil {
		return "", false, err
	}

	normalizedName := strings.TrimSpace(baseName)
	for _, imageURL := range images {
		parsed, parseErr := url.Parse(imageURL)
		if parseErr != nil {
			continue
		}

		name := path.Base(parsed.Path)
		if name == "" {
			continue
		}

		stem := strings.TrimSuffix(name, filepath.Ext(name))
		if stem == normalizedName {
			return imageURL, true, nil
		}
	}

	return "", false, nil
}

func (c *s3Client) objectURL(key string) string {
	normalizedKey := normalizeObjectKey(key)
	if c.publicBaseURL == "" {
		return "/" + normalizedKey
	}
	return c.publicBaseURL + "/" + escapeObjectKey(normalizedKey)
}

func normalizeObjectKey(key string) string {
	trimmed := strings.TrimSpace(strings.ReplaceAll(key, "\\", "/"))
	trimmed = strings.TrimPrefix(trimmed, "/")
	trimmed = path.Clean("/" + trimmed)
	if trimmed == "/" {
		return ""
	}
	return strings.TrimPrefix(trimmed, "/")
}

func escapeObjectKey(key string) string {
	parts := strings.Split(key, "/")
	for i := range parts {
		parts[i] = url.PathEscape(parts[i])
	}
	return strings.Join(parts, "/")
}

func isImageExtension(ext string) bool {
	switch ext {
	case ".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg":
		return true
	default:
		return false
	}
}
