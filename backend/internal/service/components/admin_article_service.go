package components

import (
	"bruska/internal/store"
	"bruska/internal/store/repositories"
	"context"
	"fmt"
	"strings"
	"sync"
	"time"
)

type AdminArticleEvent struct {
	Type      string    `json:"type"`
	ArticleID int       `json:"articleId"`
	Title     string    `json:"title,omitempty"`
	At        time.Time `json:"at"`
}

type AdminArticleService interface {
	List(ctx context.Context) []repositories.Article
	ByID(ctx context.Context, id int) (repositories.Article, bool)
	Create(ctx context.Context, draft repositories.ArticleDraft) (repositories.Article, error)
	Update(ctx context.Context, id int, draft repositories.ArticleDraft) (repositories.Article, bool, error)
	Delete(ctx context.Context, id int) (bool, error)
	Subscribe() (int, <-chan AdminArticleEvent)
	Unsubscribe(id int)
}

type adminArticleService struct {
	store       store.Store
	subscribers map[int]chan AdminArticleEvent
	nextID      int
	mu          sync.RWMutex
}

func NewAdminArticleService(store store.Store) AdminArticleService {
	return &adminArticleService{
		store:       store,
		subscribers: make(map[int]chan AdminArticleEvent),
		nextID:      1,
	}
}

func (s *adminArticleService) List(ctx context.Context) []repositories.Article {
	return s.store.Content().Articles(ctx)
}

func (s *adminArticleService) ByID(ctx context.Context, id int) (repositories.Article, bool) {
	return s.store.Content().ArticleByID(ctx, id)
}

func (s *adminArticleService) Create(ctx context.Context, draft repositories.ArticleDraft) (repositories.Article, error) {
	draft = normalizeDraft(draft)
	if err := validateDraft(draft); err != nil {
		return repositories.Article{}, err
	}

	article, err := s.store.Content().CreateArticle(ctx, draft)
	if err != nil {
		return repositories.Article{}, err
	}

	s.broadcast(AdminArticleEvent{Type: "created", ArticleID: article.ID, Title: article.Title, At: time.Now().UTC()})
	return article, nil
}

func (s *adminArticleService) Update(ctx context.Context, id int, draft repositories.ArticleDraft) (repositories.Article, bool, error) {
	draft = normalizeDraft(draft)
	if err := validateDraft(draft); err != nil {
		return repositories.Article{}, false, err
	}

	article, updated, err := s.store.Content().UpdateArticle(ctx, id, draft)
	if err != nil {
		return repositories.Article{}, false, err
	}
	if !updated {
		return repositories.Article{}, false, nil
	}

	s.broadcast(AdminArticleEvent{Type: "updated", ArticleID: article.ID, Title: article.Title, At: time.Now().UTC()})
	return article, true, nil
}

func (s *adminArticleService) Delete(ctx context.Context, id int) (bool, error) {
	deleted, err := s.store.Content().DeleteArticle(ctx, id)
	if err != nil {
		return false, err
	}
	if deleted {
		s.broadcast(AdminArticleEvent{Type: "deleted", ArticleID: id, At: time.Now().UTC()})
	}
	return deleted, nil
}

func (s *adminArticleService) Subscribe() (int, <-chan AdminArticleEvent) {
	s.mu.Lock()
	defer s.mu.Unlock()

	subscriberID := s.nextID
	s.nextID++

	ch := make(chan AdminArticleEvent, 8)
	s.subscribers[subscriberID] = ch

	return subscriberID, ch
}

func (s *adminArticleService) Unsubscribe(id int) {
	s.mu.Lock()
	defer s.mu.Unlock()

	ch, ok := s.subscribers[id]
	if !ok {
		return
	}

	delete(s.subscribers, id)
	close(ch)
}

func (s *adminArticleService) broadcast(event AdminArticleEvent) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	for _, ch := range s.subscribers {
		select {
		case ch <- event:
		default:
		}
	}
}

func validateDraft(draft repositories.ArticleDraft) error {
	if strings.TrimSpace(draft.Title) == "" {
		return fmt.Errorf("title is required")
	}
	if strings.TrimSpace(draft.Preview) == "" {
		return fmt.Errorf("preview is required")
	}
	return nil
}

func normalizeDraft(draft repositories.ArticleDraft) repositories.ArticleDraft {
	if draft.Blocks == nil {
		draft.Blocks = []repositories.ArticlePart{}
	}
	return draft
}
