package errors

import "net/http"

type HTTPError struct {
	Code       string
	StatusCode int
	RU         string
	EN         string
}

var (
	ErrValidationFailed = HTTPError{
		Code:       "validation_error",
		StatusCode: http.StatusUnprocessableEntity,
		RU:         "ошибка валидации входных данных",
		EN:         "input data validation error",
	}
	ErrNotFound = HTTPError{
		Code:       "not_found",
		StatusCode: http.StatusNotFound,
		RU:         "ресурс не найден",
		EN:         "resource not found",
	}
)
