package repositories

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"regexp"
	"strings"
)

var loginSanitizePattern = regexp.MustCompile(`[^a-z0-9_]`)

func (r *contentRepository) Users(ctx context.Context) ([]User, error) {
	if r.db == nil {
		return nil, errors.New("database is not configured")
	}

	rows, err := r.db.QueryContext(ctx, `
		SELECT id, name, login, email, role
		FROM users
		ORDER BY id
	`)
	if err != nil {
		return nil, fmt.Errorf("load users: %w", err)
	}
	defer rows.Close()

	result := make([]User, 0)
	for rows.Next() {
		var user User
		if err = rows.Scan(&user.ID, &user.Name, &user.Login, &user.Email, &user.Role); err != nil {
			return nil, fmt.Errorf("scan user: %w", err)
		}
		result = append(result, user)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate users: %w", err)
	}

	return result, nil
}

func (r *contentRepository) RegisterUser(ctx context.Context, draft UserDraft) (User, error) {
	if r.db == nil {
		return User{}, errors.New("database is not configured")
	}

	name := strings.TrimSpace(draft.Name)
	email := strings.ToLower(strings.TrimSpace(draft.Email))
	password := strings.TrimSpace(draft.Password)

	if name == "" {
		return User{}, fmt.Errorf("name is required")
	}
	if email == "" || !strings.Contains(email, "@") {
		return User{}, fmt.Errorf("email is invalid")
	}
	if len(password) < 4 {
		return User{}, fmt.Errorf("password must be at least 4 characters")
	}

	login, err := r.nextAvailableLogin(ctx, email)
	if err != nil {
		return User{}, err
	}

	var user User
	if err = r.db.QueryRowContext(ctx, `
		INSERT INTO users(name, login, email, password, role)
		VALUES($1, $2, $3, $4, 'user')
		RETURNING id, name, login, email, role
	`, name, login, email, password).Scan(&user.ID, &user.Name, &user.Login, &user.Email, &user.Role); err != nil {
		if strings.Contains(strings.ToLower(err.Error()), "users_email_key") {
			return User{}, fmt.Errorf("user with this email already exists")
		}
		if strings.Contains(strings.ToLower(err.Error()), "users_login_key") {
			return User{}, fmt.Errorf("user with this login already exists")
		}
		return User{}, fmt.Errorf("insert user: %w", err)
	}

	return user, nil
}

func (r *contentRepository) AuthenticateUser(ctx context.Context, loginOrEmail, password string) (User, bool, error) {
	if r.db == nil {
		return User{}, false, errors.New("database is not configured")
	}

	identity := strings.ToLower(strings.TrimSpace(loginOrEmail))
	pass := strings.TrimSpace(password)
	if identity == "" || pass == "" {
		return User{}, false, nil
	}

	var user User
	var storedPassword string
	err := r.db.QueryRowContext(ctx, `
		SELECT id, name, login, email, role, password
		FROM users
		WHERE lower(login) = $1 OR lower(email) = $1
		LIMIT 1
	`, identity).Scan(&user.ID, &user.Name, &user.Login, &user.Email, &user.Role, &storedPassword)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return User{}, false, nil
		}
		return User{}, false, fmt.Errorf("find user by identity: %w", err)
	}

	if storedPassword != pass {
		return User{}, false, nil
	}

	return user, true, nil
}

func (r *contentRepository) nextAvailableLogin(ctx context.Context, email string) (string, error) {
	base := strings.Split(email, "@")[0]
	base = strings.ToLower(strings.TrimSpace(base))
	base = loginSanitizePattern.ReplaceAllString(base, "_")
	base = strings.Trim(base, "_")
	if base == "" {
		base = "user"
	}

	candidate := base
	counter := 1
	for {
		var exists int
		err := r.db.QueryRowContext(ctx, `SELECT 1 FROM users WHERE login = $1`, candidate).Scan(&exists)
		if errors.Is(err, sql.ErrNoRows) {
			return candidate, nil
		}
		if err != nil {
			return "", fmt.Errorf("check login availability: %w", err)
		}

		counter++
		candidate = fmt.Sprintf("%s%d", base, counter)
	}
}
