package utils

import (
	"net/http"
	"net/url"
	"strconv"
	"strings"
)

func ParseMultipleInts(vals []string) []int {
	out := make([]int, 0, len(vals))
	for _, s := range vals {
		s = strings.TrimSpace(s)
		if s == "" {
			continue
		}
		if n, err := strconv.Atoi(s); err == nil {
			out = append(out, n)
		}
	}
	return out
}

func ParseMultipleStrings(vals []string) []string {
	out := make([]string, 0, len(vals))
	for _, s := range vals {
		if v := strings.TrimSpace(s); v != "" {
			out = append(out, v)
		}
	}
	return out
}

func ParseURLParams(r *http.Request) url.Values {
	return r.URL.Query()
}

func ParseIntWithDefault(value string, defaultValue int) int {
	if value == "" {
		return defaultValue
	}
	result, err := strconv.Atoi(value)
	if err != nil {
		return defaultValue
	}
	return result
}

func ParseBool(value string) bool {
	if value == "" {
		return false
	}
	result, err := strconv.ParseBool(value)
	if err != nil {
		return false
	}
	return result
}
