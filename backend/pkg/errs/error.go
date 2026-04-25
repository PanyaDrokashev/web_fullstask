package errs

import (
	"errors"
	"fmt"

	"bruska/pkg/utils"
)

type ErrorType error

var (
	ErrDatabase   ErrorType = errors.New("DATABASE ERROR")
	ErrExternal   ErrorType = errors.New("EXTERNAL ERROR")
	ErrInternal   ErrorType = errors.New("INTERNAL ERROR")
	ErrBadRequest ErrorType = errors.New("BAD REQUEST ERROR")
	ErrNotFound   ErrorType = errors.New("NOT FOUND ERROR")
	ErrForbidden  ErrorType = errors.New("FORBIDDEN ERROR")
)

type Error struct {
	Type    ErrorType
	Message string
	Err     error
}

func NewError(errorType ErrorType, err error, message string) *Error {
	return &Error{
		Type:    errorType,
		Message: message,
		Err:     err,
	}
}

func (e *Error) Error() string {
	if e.Err != nil {
		return fmt.Sprintf("%s: %s (%v)", e.Type.Error(), e.Message, e.Err)
	}

	return fmt.Sprintf("%s: %s", e.Type.Error(), e.Message)
}

func (e *Error) ResponseMessage() *string {
	return utils.Pointer(fmt.Sprintf("%s: %s", e.Type.Error(), e.Message))
}

func (e *Error) Unwrap() error {
	return e.Err
}

func (e *Error) Is(err error) bool {
	return e.Type == err
}

func NewDatabaseError(err error, message string) error {
	return NewError(ErrDatabase, err, message)
}

func NewExternalError(err error, message string) error {
	return NewError(ErrExternal, err, message)
}

func NewInternalError(err error, message string) error {
	return NewError(ErrInternal, err, message)
}

func NewBadRequestError(err error, message string) error {
	return NewError(ErrBadRequest, err, message)
}

func NewNotFoundError(err error, message string) error {
	return NewError(ErrNotFound, err, message)
}

func NewForbiddenError(message string) error {
	return NewError(ErrForbidden, nil, message)
}
