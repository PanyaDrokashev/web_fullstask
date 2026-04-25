# ЛР2: Доменная модель и реляционная БД (BRUSKA)

## Описание доменной области
Проект BRUSKA — это витрина и контентный API для компании по производству и продаже тротуарной плитки, бордюров и сопутствующих материалов. Основные бизнес-объекты домена — каталог продукции, характеристики товаров (цвета, цены, размеры), статьи и структурированные блоки статей, а также навигационные элементы сайта.

## Выделенные сущности
1. `product_categories` — категории продукции.
2. `products` — карточки товаров каталога.
3. `product_colors` — доступные цвета товара.
4. `product_prices` — цены товара по цветам.
5. `product_sizes` — размерные характеристики товара.
6. `product_descriptions` — абзацы описания товара.
7. `articles` — статьи.
8. `article_blocks` — блоки контента внутри статьи.
9. `nav_items` — пункты меню сайта.

Минимальное требование ЛР (5+ сущностей со связями) выполнено.

## ER-диаграмма
Диаграмма в формате Mermaid: [ERD.mmd](./ERD.mmd)

```mermaid
erDiagram
    PRODUCT_CATEGORY ||--o{ PRODUCT : includes
    PRODUCT ||--o{ PRODUCT_COLOR : has
    PRODUCT ||--o{ PRODUCT_SIZE : has
    PRODUCT ||--o{ PRODUCT_PRICE : has
    PRODUCT ||--o{ PRODUCT_DESCRIPTION : has
    ARTICLE ||--o{ ARTICLE_BLOCK : consists_of
```

## Что реализовано в коде
1. Подключён PostgreSQL в backend через `DATABASE_URL`.
2. Добавлен инфраструктурный слой БД:
   - `backend/internal/store/postgres/client.go`
   - `backend/internal/store/postgres/migrations.go`
3. Реализован механизм миграций через таблицу `schema_migrations`.
4. Реализован сидер данных из существующих JSON в SQL-таблицы:
   - `backend/internal/store/repositories/content_seed.go`
5. Контентный репозиторий переведён на чтение из PostgreSQL (с fallback на JSON):
   - `backend/internal/store/repositories/content_repository.go`
6. Подключение БД встроено в lifecycle приложения (`Start/Stop`):
   - `backend/internal/container/container.go`
   - `backend/internal/config/env.go`
   - `backend/internal/store/store.go`

## ЛР3: CRUD + SSE для статей

Добавлен выделенный поддомен администрирования статей с бизнес-логикой в сервисном слое и realtime-оповещениями через Server-Sent Events.

### Backend API (admin/articles)

- `GET /bruska/admin/articles`
- `GET /bruska/admin/articles/:id`
- `POST /bruska/admin/articles`
- `PATCH /bruska/admin/articles/:id`
- `DELETE /bruska/admin/articles/:id`
- `GET /bruska/admin/articles/events` (SSE)

### Frontend страницы админки

- `GET /admin/articles` — список статей, удаление, live-уведомления по SSE
- `GET /admin/articles/add` — отдельная страница создания
- `GET /admin/articles/:id/edit` — отдельная страница редактирования

## ЛР4: REST API и OpenAPI/Swagger

Добавлена спецификация OpenAPI и подключен Swagger UI для существующих REST-эндпоинтов backend.

- OpenAPI файл: `backend/docs/swagger/openapi.yaml`
- Swagger UI: `GET /bruska/swagger` (редирект на `/bruska/swagger/index.html`)

Документация включает:
- теги по модулям (`health`, `content`, `admin-articles`, `admin-products`);
- описание запросов/ответов;
- схемы DTO в `components.schemas`;
- коды статусов (`200/201/204/400/404/500`) для соответствующих endpoints.

## Локальный запуск через Docker (весь проект)
Из корня репозитория:

```bash
docker compose up --build
```

Будут подняты:
- `db` (PostgreSQL, порт `5432`)
- `backend` (Fiber API, порт `8080`)
- `frontend` (Next.js, порт `3000`)

Проверка API:

```bash
curl http://localhost:8080/bruska/healthcheck
curl http://localhost:8080/bruska/content/catalog
```

Открыть сайт:

```bash
http://localhost:3000
```

## Прод-сборка frontend: важная переменная
Для production обязательно задавайте `NEXT_PUBLIC_BACKEND_API_URL` перед сборкой frontend-образа, иначе в клиентский бандл попадет `localhost`.

Пример для сервера с IP `91.229.91.164`:

```bash
export NEXT_PUBLIC_BACKEND_API_URL=http://91.229.91.164:8080/bruska
docker compose build --no-cache frontend
docker compose up -d frontend
```

Проверить значение внутри compose можно командой:

```bash
docker compose config | grep NEXT_PUBLIC_BACKEND_API_URL
```

## Запуск только backend-части
Можно запустить compose внутри `backend/`:

```bash
cd backend
docker compose up --build
```

## Переменные окружения backend
- `DATABASE_URL` (например `postgres://bruska:bruska@db:5432/bruska?sslmode=disable`)
- `HTTP_PORT` (по умолчанию `8080`)
- `DATABASE_PING_TIMEOUT` (по умолчанию `5s`)
- `DATABASE_MAX_OPEN_CONNS` (по умолчанию `10`)
- `DATABASE_MAX_IDLE_CONNS` (по умолчанию `5`)
