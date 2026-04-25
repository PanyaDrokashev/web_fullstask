# Tutorial: Новый Go-сервис с архитектурой bruska

Этот README — пошаговый гайд, как развернуть **новый проект** с той же архитектурой:
- `layered architecture` (delivery / use-case / infrastructure);
- `ports & adapters` (все интеграции через интерфейсы);
- явный `lifecycle` (`Start/Stop`) через контейнер;
- два входа в use-case: HTTP и scheduler.

## 1. Что вы строите (архитектурные абстракции)

Целевая модель:
1. **Delivery adapters**: HTTP и cron-триггер.
2. **Application layer**: use-case сервисы.
3. **Ports**: интерфейсы доступа к данным и внешним API.
4. **Infrastructure adapters**: PostgreSQL-репозиторий и HTTP-клиент внешней системы.
5. **Composition root**: контейнер, который собирает зависимости и управляет запуском/остановкой.

Главный принцип:
- бизнес-логика не знает о Fiber/pgx/http-client напрямую, только об интерфейсах.

## 2. Подготовка окружения

Требования:
- `Go 1.25+`
- `Docker` + `docker compose` (для локального стенда)
- `make` (опционально)

Инициализация нового проекта:

```bash
mkdir my-service && cd my-service
go mod init my-service
```

## 3. Создайте каркас директорий

```text
cmd/my-service/main.go
internal/
  app/
  config/
  container/
  server/
  scheduler/
  service/components/
  store/repositories/
  entity/
pkg/
  external/        # клиент внешнего API
  errs/
  errors/
  constants/
  context/
  utils/
migrations/
docs/
```

## 4. Опишите домен и порты (сначала абстракции)

Сначала пишите контракты, не реализации.

Пример:

```go
// internal/service/components/sync_service.go
type SyncService interface {
    Run(ctx context.Context) error
}

// internal/store/repositories/sync_repository.go
type SyncRepository interface {
    FetchItems(ctx context.Context) ([]entity.SyncItem, error)
}

// pkg/external/client.go
type Client interface {
    Push(ctx context.Context, payload []entity.Payload) error
}
```

Зачем так:
- легко тестировать use-case моками;
- легко менять инфраструктуру без переписывания application-слоя.

## 5. Реализуйте use-case слой

В `internal/service/components`:
1. внедрите `repository` и `external client` через интерфейсы;
2. реализуйте оркестрацию: `fetch -> transform -> push`;
3. верните ошибку наверх, не прячьте ее внутри delivery-слоя.

Рекомендация:
- use-case не должен зависеть от `fiber.Ctx`, SQL-запросов и конкретных HTTP-библиотек.

## 6. Реализуйте инфраструктурные адаптеры

### PostgreSQL repository

В `internal/store/repositories`:
- SQL-запросы, сканирование строк, маппинг в `entity`.

### Внешний HTTP client

В `pkg/external/client.go`:
- формирование запроса к внешнему API;
- проверка HTTP-статуса;
- возврат ошибок в унифицированном формате.

## 7. Реализуйте delivery-слой

### HTTP adapter (`internal/server`)

Минимум:
- `/healthcheck`
- `/api/v1/<feature>/run` (ручной запуск use-case)

Middleware:
- recovery;
- логирование;
- локализация (опционально).

### Scheduler adapter (`internal/scheduler`)

Минимум:
- немедленный запуск `task()` при старте;
- периодический запуск по `EXAMUS_SYNC_TIMEOUT` (или своему ENV).

Важно:
- scheduler должен вызывать **тот же use-case**, что и HTTP route.

## 8. Соберите композицию зависимостей (DI контейнер)

В `internal/container`:
1. singleton-компоненты через `sync.Once`;
2. фабрики: `PostgresClient()`, `ExternalClient()`, `Store()`, `Service()`, `Server()`, `Scheduler()`;
3. регистрация lifecycle:
   - starters: `db`, `scheduler`;
   - stoppers: в обратном порядке.

Смысл:
- единая точка сборки архитектуры;
- предсказуемый порядок запуска/остановки.

## 9. Реализуйте lifecycle приложения

В `internal/app`:
- `Init()`:
  - выполняет все `onStart`;
  - запускает HTTP server;
  - обрабатывает `SIGINT/SIGTERM`;
  - делает graceful shutdown (`Stop` + `onStop`).

Таймауты:
- `startTimeout` и `stopTimeout` держите явными константами.

## 10. Подключите конфигурацию через ENV

В `internal/config/env.go`:
- структура `App`, `Server`, `Postgres`, `External`, `Feature`;
- `InitXxx()` функции для парсинга env;
- метод `DSN()` для PostgreSQL.

Минимальный набор переменных:

| ENV | Назначение | Default |
|---|---|---|
| `ENV` | окружение | `local` |
| `HTTP_PORT` | порт сервера | `8080` |
| `POSTGRES_HOST` | хост БД | `localhost` |
| `POSTGRES_PORT` | порт БД | `5432` |
| `POSTGRES_USER` | пользователь БД | `app` |
| `POSTGRES_PASSWORD` | пароль БД | - |
| `POSTGRES_DB` | имя БД | `app` |
| `POSTGRES_SSL_MODE` | SSL mode | `disable` |
| `EXTERNAL_URL` | URL внешнего API | - |
| `EXTERNAL_TOKEN` | токен внешнего API | - |
| `SYNC_TIMEOUT_MIN` | период scheduler, мин | `10` |

## 11. Поднимите локальный стенд

Создайте `docker-compose.yml`:
- `db` (postgres)
- `my-service`
- дополнительные сервисы по необходимости

Запуск:

```bash
docker compose up --build
```

Проверка:

```bash
curl -i http://localhost:8080/my-service/healthcheck
curl -i http://localhost:8080/my-service/api/v1/sync/run
```

## 12. Точка входа приложения

`cmd/my-service/main.go` должен делать только orchestration:
1. `config.InitApp()`
2. `log.InitLogging(...)`
3. `container.New("my-service")`
4. `app.New(...).Init()`

Никакой бизнес-логики в `main`.

## 13. Добавьте Makefile и базовый CI

Минимальный `Makefile`:
- `build`
- `test`
- `lint`

Минимальный pipeline:
- lint;
- unit tests;
- build docker image.

## 14. Чеклист готовности архитектуры

Проект собран корректно, если:
1. use-case не зависит от Fiber/pgx/http-пакетов;
2. все внешние интеграции спрятаны за интерфейсами;
3. один и тот же use-case вызывается из HTTP и scheduler;
4. зависимости создаются в `container`, а не в handler/service;
5. graceful shutdown останавливает scheduler и сервер без гонок.

## 15. Как масштабировать этот шаблон

Чтобы добавить новую фичу:
1. новый порт в `service/components`;
2. новый adapter в `store/repositories` или `pkg/<integration>`;
3. регистрация в `service.Store` и `container`;
4. новый route или новая periodic task.

Так вы расширяете систему без разрыва архитектурных границ.
