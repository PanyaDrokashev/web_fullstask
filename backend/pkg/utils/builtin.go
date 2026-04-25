package utils

func Pointer[T comparable](val T) *T {
	return &val
}
