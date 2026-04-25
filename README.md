# Описание проекта и требований к приложению

Репозиторий представляет собой связку фронт + бек для сайта по продаже брусчатки.

## Стек

Фронт: React + Next + TS
Бек: Go + Postgres
Развертывание: VPS Beget + Docker

## Доступы чтобы поиграться

Креды админа:
test@mail.ru
testpassword

Можно создать/удалить статью, создать/удалить товар через панель управления. Так же зарегестрировать нового пользователя

По кнопке логина (вверху в шапке) можно зарегестрироваться на сайте через почта + пароль либо чреез Goggle аккаунт, но у обычного пользователя нет никаких действий (только плашка вверху сайта)

## Выполнение требований лаб

### Лаб1

- Сервис развернут на VPS Beget
- Шаблонизированы некоторые части приложения (напр. элементы хедера, повторяющиеся элементы, статьи и каталог)

### Лаб2

Развернута база данных

#### Основные сущности

1. `product_categories`
2. `products`
3. `product_colors`
4. `product_prices`
5. `product_sizes`
6. `product_descriptions`
7. `articles`
8. `article_blocks`
9. `nav_items`

#### Ключевые связи

1. `product_categories (1) -> (N) products`
2. `products (1) -> (N) product_colors`
3. `products (1) -> (N) product_prices`
4. `products (1) -> (N) product_sizes`
5. `products (1) -> (N) product_descriptions`
6. `articles (1) -> (N) article_blocks`

### Лаб3

Добавлены CRUD-операции для статей на backend:

- `GET /bruska/admin/articles`
- `GET /bruska/admin/articles/:id`
- `POST /bruska/admin/articles`
- `PATCH /bruska/admin/articles/:id`
- `DELETE /bruska/admin/articles/:id`

(в дальнейшем было изменено на GraphQL)

- Добавлена серверная бизнес-логика в сервисе:
  - валидация данных статьи;
  - создание/обновление/удаление;
  - генерация доменных событий изменения коллекции.

- Реализован SSE-эндпоинт:
  - `GET /bruska/admin/articles/events`

- Добавлена клиентская поддержка SSE через `EventSource`:
  - в админском списке статей отображаются живые уведомления о создании/изменении/удалении;
  - список автоматически обновляется при событии.

- Реализованы отдельные многостраничные формы для CRUD на frontend:
  - `GET /admin/articles`
  - `GET /admin/articles/add`
  - `GET /admin/articles/:id/edit`

### Лаб4

- Добавлена спецификация OpenAPI 3.0:
  - `backend/docs/swagger/openapi.yaml`

Ссылка на свагу: http://91.229.91.164:8080/bruska/swagger/index.html

### Лаб5

-Добавлен GraphQL endpoint и песочница:

  - `GET/POST /bruska/graphql`
  - в `GET` режиме открывается GraphiQL-песочница

- Реализована GraphQL-схема с `Query` и `Mutation` для предметной области:

  - каталог и статьи;
  - админские мутации статей/товаров;
  - пользователи: регистрация и логин

- Добавлена регистрация и авторизация пользователей в БД:
  - новая таблица `users` (миграция v3),
  - seed админа: `admin/admin`.

### Лаб6

1. Измерение времени обработки запроса:

- Добавлен middleware `backend/internal/server/middleware.go`.
- Для всех HTTP-запросов выставляется заголовок `X-Elapsed-Time`.
- Время и статус также пишутся в лог сервера.

2. Кэширование REST API:

- Для `/bruska/content/*` включена генерация `ETag`.
- Для контентных GET-эндпоинтов выставляется `Cache-Control: public, max-age=3600, must-revalidate`.
- Для `/bruska/content/catalog` добавлено server-side in-memory кэширование с TTL `5s`.

3. Загрузка файлов в Object Storage:

- Добавлен инфраструктурный модуль `backend/internal/infrastructure/objectstorage/client.go`
- Upload-эндпоинты админки загружают файлы в Yandex Object Storage и возвращают публичный URL.
- Эндпоинты контент-ассетов (`slides`, `preview`, `color-image`) работают с Object Storage (fallback на локальные файлы сохранен).

### Лаб7

1. Backend: аутентификация Firebase ID Token (Bearer)

- Добавлен инфраструктурный модуль Firebase Admin SDK:
  - `backend/internal/infrastructure/firebaseauth/client.go`
- Верификация токена на backend через `Authorization: Bearer <idToken>`.
- Поддержка роли `admin`:
  - через claim `role=admin` / `admin=true`
  - и через allowlist UID в `FIREBASE_ADMIN_UIDS`.

2. Frontend: вход через Firebase

- Добавлен Firebase Web SDK + клиентская инициализация:
  - `frontend/shared/firebase/client.ts`
  - `frontend/shared/firebase/token.ts`
- Обновлена страница логина:
  - `frontend/app/admin-login/AdminLoginForm.tsx`
  - вход через Email/Password и Google.
- Обновлён `POST /api/admin-login`:
  - принимает Bearer токен
  - проверяет его через backend `/auth/session`
  - выставляет cookies `bruska_authorized`, `bruska_user`, `bruska_role`, `bruska_uid`.
