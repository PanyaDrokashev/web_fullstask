package utils

import (
	"regexp"
	"strings"
)

func PrepareSearchQuery(raw *string) string {
	if raw == nil {
		return ""
	}

	temp := strings.ToLower(*raw)
	temp = escapeQueryChars(temp)
	split := strings.Fields(temp)
	noSpace := make([]string, 0)
	for i := range split {
		if split[i] != "" {
			noSpace = append(noSpace, split[i])
		}
	}

	for i := range noSpace {
		noSpace[i] += ":*"
	}

	joined := strings.Join(noSpace, "&")
	return strings.ReplaceAll(strings.ReplaceAll(joined, "(", "\\("), ")", "\\)")
}

func escapeQueryChars(query string) string {
	specialChars := []string{":", "*", "&", "|", "!", "(", ")", "'", "\"", "\\", "/", ","}

	re := regexp.MustCompile("[" + regexp.QuoteMeta(strings.Join(specialChars, "")) + "]")

	sanitizedQuery := re.ReplaceAllString(query, " ")

	sanitizedQuery = strings.Join(strings.Fields(sanitizedQuery), " ")

	return sanitizedQuery
}
