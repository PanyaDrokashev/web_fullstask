FROM golang:1.25-alpine AS builder
WORKDIR /src
RUN apk add --no-cache make git ca-certificates tzdata && update-ca-certificates

ENV GOPROXY=https://proxy.golang.org,direct
COPY go.mod go.sum ./
RUN --mount=type=cache,target=/go/pkg/mod go mod download

COPY . .
ARG MAKE_TARGET=build
RUN --mount=type=cache,target=/go/pkg/mod \
    --mount=type=cache,target=/root/.cache/go-build \
    make ${MAKE_TARGET}

FROM alpine:3.23
ENV TZ=Europe/Moscow
RUN apk add --no-cache tzdata ca-certificates && \
    cp /usr/share/zoneinfo/$TZ /etc/localtime && \
    echo $TZ > /etc/timezone && \
    update-ca-certificates && \
    addgroup -g 1001 app && \
    adduser -u 1001 -G app -D app

WORKDIR /app
COPY --from=builder /src/bin/bruska ./bruska
COPY --from=builder --chown=app:app /src/assets ./assets
COPY --from=builder --chown=app:app /src/docs ./docs
USER app
EXPOSE 8080
CMD ["./bruska"]
