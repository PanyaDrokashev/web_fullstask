BIN := bin/bruska

.PHONY: build

build:
	@echo ">> building binary"
	mkdir -p bin
	GOPROXY=https://proxy.golang.org,direct CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o $(BIN) ./cmd/bruska
