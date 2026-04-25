package context

import (
	"bruska/pkg/constants"
	"bruska/pkg/logging"
	"context"
)

type ctxKey string

var ctxKeyLang ctxKey = "language"

func GetLanguage(ctx context.Context) constants.Language {
	if val, exists := ctx.Value(ctxKeyLang).(constants.Language); exists {
		return val
	}

	logging.WithContext(ctx).Warn("No lang found in context")
	return constants.RU
}

func WithLanguage(ctx context.Context, lang constants.Language) context.Context {
	return context.WithValue(ctx, ctxKeyLang, lang)
}
