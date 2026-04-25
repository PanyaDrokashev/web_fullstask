package server

import (
	"bruska/internal/store/repositories"
	"encoding/json"
	"fmt"
	"math"
	"net/http"
	"strconv"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/adaptor"
	"github.com/graphql-go/graphql"
	"github.com/graphql-go/graphql/language/ast"
	"github.com/graphql-go/graphql/language/parser"
	"github.com/graphql-go/graphql/language/source"
	"github.com/graphql-go/handler"
)

const (
	maxGraphQLQueryDepth      = 8
	maxGraphQLQueryComplexity = 300
)

type graphqlCatalogConnection struct {
	Items  []repositories.CatalogItem
	Total  int
	Offset int
	Limit  int
}

type graphqlArticleConnection struct {
	Items  []repositories.Article
	Total  int
	Offset int
	Limit  int
}

type graphqlUserConnection struct {
	Items  []repositories.User
	Total  int
	Offset int
	Limit  int
}

type graphqlAuthPayload struct {
	Authorized bool
	User       repositories.User
}

type graphqlPriceEntry struct {
	Tag    string
	Amount float64
}

func (s *Server) initGraphQL() {
	priceType := graphql.NewObject(graphql.ObjectConfig{
		Name: "ProductPrice",
		Fields: graphql.Fields{
			"tag":    &graphql.Field{Type: graphql.NewNonNull(graphql.String)},
			"amount": &graphql.Field{Type: graphql.NewNonNull(graphql.Float)},
		},
	})

	catalogColorType := graphql.NewObject(graphql.ObjectConfig{
		Name: "CatalogColor",
		Fields: graphql.Fields{
			"tag": &graphql.Field{Type: graphql.NewNonNull(graphql.String)},
		},
	})

	catalogSizeType := graphql.NewObject(graphql.ObjectConfig{
		Name: "CatalogSize",
		Fields: graphql.Fields{
			"length": &graphql.Field{Type: graphql.NewNonNull(graphql.Int)},
			"width":  &graphql.Field{Type: graphql.NewNonNull(graphql.Int)},
			"height": &graphql.Field{Type: graphql.NewNonNull(graphql.Int)},
		},
	})

	catalogItemType := graphql.NewObject(graphql.ObjectConfig{
		Name: "CatalogItem",
		Fields: graphql.Fields{
			"id":           &graphql.Field{Type: graphql.NewNonNull(graphql.Int)},
			"tag":          &graphql.Field{Type: graphql.String},
			"title":        &graphql.Field{Type: graphql.NewNonNull(graphql.String)},
			"dir":          &graphql.Field{Type: graphql.NewNonNull(graphql.String)},
			"img":          &graphql.Field{Type: graphql.NewNonNull(graphql.String)},
			"sliderImages": &graphql.Field{Type: graphql.NewList(graphql.NewNonNull(graphql.String))},
			"priceTag":     &graphql.Field{Type: graphql.NewNonNull(graphql.String)},
			"withBtn":      &graphql.Field{Type: graphql.NewNonNull(graphql.Boolean)},
			"colors":       &graphql.Field{Type: graphql.NewList(graphql.NewNonNull(catalogColorType))},
			"sizes":        &graphql.Field{Type: graphql.NewList(graphql.NewNonNull(catalogSizeType))},
			"description":  &graphql.Field{Type: graphql.NewList(graphql.NewNonNull(graphql.String))},
			"isAvailable":  &graphql.Field{Type: graphql.NewNonNull(graphql.Boolean)},
			"onPallet":     &graphql.Field{Type: graphql.NewNonNull(graphql.Float)},
			"weight":       &graphql.Field{Type: graphql.NewNonNull(graphql.Float)},
			"prices": &graphql.Field{
				Type: graphql.NewList(graphql.NewNonNull(priceType)),
				Resolve: func(p graphql.ResolveParams) (any, error) {
					item, ok := p.Source.(repositories.CatalogItem)
					if !ok {
						return []graphqlPriceEntry{}, nil
					}
					result := make([]graphqlPriceEntry, 0, len(item.Price))
					for tag, amount := range item.Price {
						result = append(result, graphqlPriceEntry{Tag: tag, Amount: amount})
					}
					return result, nil
				},
			},
		},
	})

	articlePartType := graphql.NewObject(graphql.ObjectConfig{
		Name: "ArticlePart",
		Fields: graphql.Fields{
			"type":    &graphql.Field{Type: graphql.NewNonNull(graphql.String)},
			"content": &graphql.Field{Type: graphql.String},
			"itemsJson": &graphql.Field{
				Type: graphql.String,
				Resolve: func(p graphql.ResolveParams) (any, error) {
					part, ok := p.Source.(repositories.ArticlePart)
					if !ok || part.Items == nil {
						return "", nil
					}
					raw, err := json.Marshal(part.Items)
					if err != nil {
						return "", nil
					}
					return string(raw), nil
				},
			},
		},
	})

	articleType := graphql.NewObject(graphql.ObjectConfig{
		Name: "Article",
		Fields: graphql.Fields{
			"id":      &graphql.Field{Type: graphql.NewNonNull(graphql.Int)},
			"title":   &graphql.Field{Type: graphql.NewNonNull(graphql.String)},
			"preview": &graphql.Field{Type: graphql.NewNonNull(graphql.String)},
			"content": &graphql.Field{
				Type: graphql.NewList(graphql.NewNonNull(articlePartType)),
				Resolve: func(p graphql.ResolveParams) (any, error) {
					article, ok := p.Source.(repositories.Article)
					if !ok {
						return []repositories.ArticlePart{}, nil
					}
					fullArticle, exists := s.svc.Content().ArticleByID(p.Context, article.ID)
					if !exists {
						return []repositories.ArticlePart{}, nil
					}
					return fullArticle.Content, nil
				},
			},
		},
	})

	userType := graphql.NewObject(graphql.ObjectConfig{
		Name: "User",
		Fields: graphql.Fields{
			"id":    &graphql.Field{Type: graphql.NewNonNull(graphql.Int)},
			"name":  &graphql.Field{Type: graphql.NewNonNull(graphql.String)},
			"login": &graphql.Field{Type: graphql.NewNonNull(graphql.String)},
			"email": &graphql.Field{Type: graphql.NewNonNull(graphql.String)},
			"role":  &graphql.Field{Type: graphql.NewNonNull(graphql.String)},
			"displayName": &graphql.Field{
				Type: graphql.NewNonNull(graphql.String),
				Resolve: func(p graphql.ResolveParams) (any, error) {
					user, ok := p.Source.(repositories.User)
					if !ok {
						return "", nil
					}
					if strings.TrimSpace(user.Name) != "" {
						return user.Name, nil
					}
					return user.Login, nil
				},
			},
		},
	})

	catalogConnectionType := graphql.NewObject(graphql.ObjectConfig{
		Name: "CatalogConnection",
		Fields: graphql.Fields{
			"items":  &graphql.Field{Type: graphql.NewList(graphql.NewNonNull(catalogItemType))},
			"total":  &graphql.Field{Type: graphql.NewNonNull(graphql.Int)},
			"offset": &graphql.Field{Type: graphql.NewNonNull(graphql.Int)},
			"limit":  &graphql.Field{Type: graphql.NewNonNull(graphql.Int)},
		},
	})

	articleConnectionType := graphql.NewObject(graphql.ObjectConfig{
		Name: "ArticleConnection",
		Fields: graphql.Fields{
			"items":  &graphql.Field{Type: graphql.NewList(graphql.NewNonNull(articleType))},
			"total":  &graphql.Field{Type: graphql.NewNonNull(graphql.Int)},
			"offset": &graphql.Field{Type: graphql.NewNonNull(graphql.Int)},
			"limit":  &graphql.Field{Type: graphql.NewNonNull(graphql.Int)},
		},
	})

	userConnectionType := graphql.NewObject(graphql.ObjectConfig{
		Name: "UserConnection",
		Fields: graphql.Fields{
			"items":  &graphql.Field{Type: graphql.NewList(graphql.NewNonNull(userType))},
			"total":  &graphql.Field{Type: graphql.NewNonNull(graphql.Int)},
			"offset": &graphql.Field{Type: graphql.NewNonNull(graphql.Int)},
			"limit":  &graphql.Field{Type: graphql.NewNonNull(graphql.Int)},
		},
	})

	authPayloadType := graphql.NewObject(graphql.ObjectConfig{
		Name: "AuthPayload",
		Fields: graphql.Fields{
			"authorized": &graphql.Field{Type: graphql.NewNonNull(graphql.Boolean)},
			"user":       &graphql.Field{Type: userType},
		},
	})

	articlePartInput := graphql.NewInputObject(graphql.InputObjectConfig{
		Name: "ArticlePartInput",
		Fields: graphql.InputObjectConfigFieldMap{
			"type":      &graphql.InputObjectFieldConfig{Type: graphql.NewNonNull(graphql.String)},
			"content":   &graphql.InputObjectFieldConfig{Type: graphql.String},
			"itemsJson": &graphql.InputObjectFieldConfig{Type: graphql.String},
		},
	})

	articleDraftInput := graphql.NewInputObject(graphql.InputObjectConfig{
		Name: "ArticleDraftInput",
		Fields: graphql.InputObjectConfigFieldMap{
			"title":   &graphql.InputObjectFieldConfig{Type: graphql.NewNonNull(graphql.String)},
			"preview": &graphql.InputObjectFieldConfig{Type: graphql.NewNonNull(graphql.String)},
			"blocks":  &graphql.InputObjectFieldConfig{Type: graphql.NewList(graphql.NewNonNull(articlePartInput))},
		},
	})

	productColorInput := graphql.NewInputObject(graphql.InputObjectConfig{
		Name: "ProductColorInput",
		Fields: graphql.InputObjectConfigFieldMap{
			"tag":   &graphql.InputObjectFieldConfig{Type: graphql.NewNonNull(graphql.String)},
			"price": &graphql.InputObjectFieldConfig{Type: graphql.NewNonNull(graphql.Float)},
		},
	})

	productDraftInput := graphql.NewInputObject(graphql.InputObjectConfig{
		Name: "ProductDraftInput",
		Fields: graphql.InputObjectConfigFieldMap{
			"category":    &graphql.InputObjectFieldConfig{Type: graphql.String},
			"title":       &graphql.InputObjectFieldConfig{Type: graphql.NewNonNull(graphql.String)},
			"dir":         &graphql.InputObjectFieldConfig{Type: graphql.NewNonNull(graphql.String)},
			"img":         &graphql.InputObjectFieldConfig{Type: graphql.String},
			"priceTag":    &graphql.InputObjectFieldConfig{Type: graphql.NewNonNull(graphql.String)},
			"basePrice":   &graphql.InputObjectFieldConfig{Type: graphql.Float},
			"color":       &graphql.InputObjectFieldConfig{Type: graphql.String},
			"colors":      &graphql.InputObjectFieldConfig{Type: graphql.NewList(graphql.NewNonNull(productColorInput))},
			"description": &graphql.InputObjectFieldConfig{Type: graphql.String},
			"onPallet":    &graphql.InputObjectFieldConfig{Type: graphql.NewNonNull(graphql.Float)},
			"weight":      &graphql.InputObjectFieldConfig{Type: graphql.NewNonNull(graphql.Float)},
			"length":      &graphql.InputObjectFieldConfig{Type: graphql.NewNonNull(graphql.Int)},
			"width":       &graphql.InputObjectFieldConfig{Type: graphql.NewNonNull(graphql.Int)},
			"height":      &graphql.InputObjectFieldConfig{Type: graphql.NewNonNull(graphql.Int)},
			"withBtn":     &graphql.InputObjectFieldConfig{Type: graphql.Boolean},
			"isAvailable": &graphql.InputObjectFieldConfig{Type: graphql.Boolean},
		},
	})

	registerUserInput := graphql.NewInputObject(graphql.InputObjectConfig{
		Name: "RegisterUserInput",
		Fields: graphql.InputObjectConfigFieldMap{
			"name":     &graphql.InputObjectFieldConfig{Type: graphql.NewNonNull(graphql.String)},
			"email":    &graphql.InputObjectFieldConfig{Type: graphql.NewNonNull(graphql.String)},
			"password": &graphql.InputObjectFieldConfig{Type: graphql.NewNonNull(graphql.String)},
		},
	})

	loginInput := graphql.NewInputObject(graphql.InputObjectConfig{
		Name: "LoginInput",
		Fields: graphql.InputObjectConfigFieldMap{
			"loginOrEmail": &graphql.InputObjectFieldConfig{Type: graphql.NewNonNull(graphql.String)},
			"password":     &graphql.InputObjectFieldConfig{Type: graphql.NewNonNull(graphql.String)},
		},
	})

	queryType := graphql.NewObject(graphql.ObjectConfig{
		Name: "Query",
		Fields: graphql.Fields{
			"catalog": &graphql.Field{
				Type: catalogConnectionType,
				Args: graphql.FieldConfigArgument{
					"offset": &graphql.ArgumentConfig{Type: graphql.Int, DefaultValue: 0},
					"limit":  &graphql.ArgumentConfig{Type: graphql.Int, DefaultValue: 20},
				},
				Resolve: func(p graphql.ResolveParams) (any, error) {
					all := s.svc.Content().Catalog(p.Context)
					offset, limit := normalizePageArgs(p.Args)
					items := paginateSlice(all, offset, limit)
					return graphqlCatalogConnection{Items: items, Total: len(all), Offset: offset, Limit: limit}, nil
				},
			},
			"catalogById": &graphql.Field{
				Type: catalogItemType,
				Args: graphql.FieldConfigArgument{
					"id": &graphql.ArgumentConfig{Type: graphql.NewNonNull(graphql.Int)},
				},
				Resolve: func(p graphql.ResolveParams) (any, error) {
					id, _ := p.Args["id"].(int)
					item, ok := s.svc.Content().CatalogByID(p.Context, id)
					if !ok {
						return nil, nil
					}
					return item, nil
				},
			},
			"articles": &graphql.Field{
				Type: articleConnectionType,
				Args: graphql.FieldConfigArgument{
					"offset": &graphql.ArgumentConfig{Type: graphql.Int, DefaultValue: 0},
					"limit":  &graphql.ArgumentConfig{Type: graphql.Int, DefaultValue: 20},
				},
				Resolve: func(p graphql.ResolveParams) (any, error) {
					all := s.svc.Content().Articles(p.Context)
					offset, limit := normalizePageArgs(p.Args)
					items := paginateSlice(all, offset, limit)
					return graphqlArticleConnection{Items: items, Total: len(all), Offset: offset, Limit: limit}, nil
				},
			},
			"articleById": &graphql.Field{
				Type: articleType,
				Args: graphql.FieldConfigArgument{
					"id": &graphql.ArgumentConfig{Type: graphql.NewNonNull(graphql.Int)},
				},
				Resolve: func(p graphql.ResolveParams) (any, error) {
					id, _ := p.Args["id"].(int)
					article, ok := s.svc.Content().ArticleByID(p.Context, id)
					if !ok {
						return nil, nil
					}
					return article, nil
				},
			},
			"users": &graphql.Field{
				Type: userConnectionType,
				Args: graphql.FieldConfigArgument{
					"offset": &graphql.ArgumentConfig{Type: graphql.Int, DefaultValue: 0},
					"limit":  &graphql.ArgumentConfig{Type: graphql.Int, DefaultValue: 20},
				},
				Resolve: func(p graphql.ResolveParams) (any, error) {
					all, err := s.svc.Content().Users(p.Context)
					if err != nil {
						return nil, err
					}
					offset, limit := normalizePageArgs(p.Args)
					items := paginateSlice(all, offset, limit)
					return graphqlUserConnection{Items: items, Total: len(all), Offset: offset, Limit: limit}, nil
				},
			},
		},
	})

	mutationType := graphql.NewObject(graphql.ObjectConfig{
		Name: "Mutation",
		Fields: graphql.Fields{
			"registerUser": &graphql.Field{
				Type: userType,
				Args: graphql.FieldConfigArgument{
					"input": &graphql.ArgumentConfig{Type: graphql.NewNonNull(registerUserInput)},
				},
				Resolve: func(p graphql.ResolveParams) (any, error) {
					input, _ := p.Args["input"].(map[string]any)
					draft := repositories.UserDraft{
						Name:     asString(input["name"]),
						Email:    asString(input["email"]),
						Password: asString(input["password"]),
					}
					return s.svc.Content().RegisterUser(p.Context, draft)
				},
			},
			"loginUser": &graphql.Field{
				Type: authPayloadType,
				Args: graphql.FieldConfigArgument{
					"input": &graphql.ArgumentConfig{Type: graphql.NewNonNull(loginInput)},
				},
				Resolve: func(p graphql.ResolveParams) (any, error) {
					input, _ := p.Args["input"].(map[string]any)
					user, ok, err := s.svc.Content().AuthenticateUser(
						p.Context,
						asString(input["loginOrEmail"]),
						asString(input["password"]),
					)
					if err != nil {
						return nil, err
					}
					if !ok {
						return graphqlAuthPayload{Authorized: false}, nil
					}
					return graphqlAuthPayload{Authorized: true, User: user}, nil
				},
			},
			"createArticle": &graphql.Field{
				Type: articleType,
				Args: graphql.FieldConfigArgument{
					"input": &graphql.ArgumentConfig{Type: graphql.NewNonNull(articleDraftInput)},
				},
				Resolve: func(p graphql.ResolveParams) (any, error) {
					input, _ := p.Args["input"].(map[string]any)
					draft := repositories.ArticleDraft{
						Title:   asString(input["title"]),
						Preview: asString(input["preview"]),
						Blocks:  mapArticleBlocksInput(input["blocks"]),
					}
					return s.svc.AdminArticles().Create(p.Context, draft)
				},
			},
			"updateArticle": &graphql.Field{
				Type: articleType,
				Args: graphql.FieldConfigArgument{
					"id":    &graphql.ArgumentConfig{Type: graphql.NewNonNull(graphql.Int)},
					"input": &graphql.ArgumentConfig{Type: graphql.NewNonNull(articleDraftInput)},
				},
				Resolve: func(p graphql.ResolveParams) (any, error) {
					id, _ := p.Args["id"].(int)
					input, _ := p.Args["input"].(map[string]any)
					draft := repositories.ArticleDraft{
						Title:   asString(input["title"]),
						Preview: asString(input["preview"]),
						Blocks:  mapArticleBlocksInput(input["blocks"]),
					}
					article, updated, err := s.svc.AdminArticles().Update(p.Context, id, draft)
					if err != nil {
						return nil, err
					}
					if !updated {
						return nil, nil
					}
					return article, nil
				},
			},
			"deleteArticle": &graphql.Field{
				Type: graphql.NewNonNull(graphql.Boolean),
				Args: graphql.FieldConfigArgument{
					"id": &graphql.ArgumentConfig{Type: graphql.NewNonNull(graphql.Int)},
				},
				Resolve: func(p graphql.ResolveParams) (any, error) {
					id, _ := p.Args["id"].(int)
					return s.svc.AdminArticles().Delete(p.Context, id)
				},
			},
			"createProduct": &graphql.Field{
				Type: catalogItemType,
				Args: graphql.FieldConfigArgument{
					"input": &graphql.ArgumentConfig{Type: graphql.NewNonNull(productDraftInput)},
				},
				Resolve: func(p graphql.ResolveParams) (any, error) {
					input, _ := p.Args["input"].(map[string]any)
					draft := repositories.ProductDraft{
						Category:    asString(input["category"]),
						Title:       asString(input["title"]),
						Dir:         asString(input["dir"]),
						Img:         asString(input["img"]),
						PriceTag:    asString(input["priceTag"]),
						BasePrice:   asFloat(input["basePrice"]),
						Color:       asString(input["color"]),
						Colors:      mapProductColorsInput(input["colors"]),
						Description: asString(input["description"]),
						OnPallet:    asFloat(input["onPallet"]),
						Weight:      asFloat(input["weight"]),
						Length:      asInt(input["length"]),
						Width:       asInt(input["width"]),
						Height:      asInt(input["height"]),
						WithBtn:     asBool(input["withBtn"]),
						IsAvailable: asBoolDefault(input["isAvailable"], true),
					}
					return s.svc.AdminProducts().Create(p.Context, draft)
				},
			},
			"deleteProduct": &graphql.Field{
				Type: graphql.NewNonNull(graphql.Boolean),
				Args: graphql.FieldConfigArgument{
					"id": &graphql.ArgumentConfig{Type: graphql.NewNonNull(graphql.Int)},
				},
				Resolve: func(p graphql.ResolveParams) (any, error) {
					id, _ := p.Args["id"].(int)
					return s.svc.AdminProducts().Delete(p.Context, id)
				},
			},
		},
	})

	schema, err := graphql.NewSchema(graphql.SchemaConfig{
		Query:    queryType,
		Mutation: mutationType,
	})
	if err != nil {
		panic(fmt.Errorf("create graphql schema: %w", err))
	}

	s.graphqlHandler = handler.New(&handler.Config{
		Schema:   &schema,
		Pretty:   true,
		GraphiQL: true,
	})
}

func (s *Server) graphql(c *fiber.Ctx) error {
	query, err := graphqlQueryFromRequest(c)
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	if strings.TrimSpace(query) != "" {
		depth, complexity, err := estimateGraphQLComplexity(query)
		if err != nil {
			return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "invalid GraphQL query"})
		}
		if depth > maxGraphQLQueryDepth {
			return c.Status(http.StatusBadRequest).JSON(fiber.Map{
				"error": fmt.Sprintf("query depth exceeds limit (%d > %d)", depth, maxGraphQLQueryDepth),
			})
		}
		if complexity > maxGraphQLQueryComplexity {
			return c.Status(http.StatusBadRequest).JSON(fiber.Map{
				"error": fmt.Sprintf("query complexity exceeds limit (%d > %d)", complexity, maxGraphQLQueryComplexity),
			})
		}
	}

	return adaptor.HTTPHandler(s.graphqlHandler)(c)
}

func graphqlQueryFromRequest(c *fiber.Ctx) (string, error) {
	if c.Method() == fiber.MethodGet {
		return c.Query("query"), nil
	}

	contentType := strings.ToLower(c.Get("Content-Type"))
	if strings.HasPrefix(contentType, "application/graphql") {
		return string(c.Body()), nil
	}

	var payload struct {
		Query string `json:"query"`
	}
	if err := json.Unmarshal(c.Body(), &payload); err != nil {
		return "", fmt.Errorf("invalid GraphQL body")
	}
	return payload.Query, nil
}

func estimateGraphQLComplexity(query string) (int, int, error) {
	src := source.NewSource(&source.Source{Body: []byte(query), Name: "GraphQL request"})
	doc, err := parser.Parse(parser.ParseParams{Source: src})
	if err != nil {
		return 0, 0, err
	}

	fragments := map[string]*ast.FragmentDefinition{}
	for _, def := range doc.Definitions {
		if f, ok := def.(*ast.FragmentDefinition); ok {
			fragments[f.Name.Value] = f
		}
	}

	maxDepth := 0
	totalCost := 0
	for _, def := range doc.Definitions {
		op, ok := def.(*ast.OperationDefinition)
		if !ok {
			continue
		}
		depth, cost := estimateSelectionSet(op.SelectionSet, fragments, 1)
		if depth > maxDepth {
			maxDepth = depth
		}
		totalCost += cost
	}

	return maxDepth, totalCost, nil
}

func estimateSelectionSet(set *ast.SelectionSet, fragments map[string]*ast.FragmentDefinition, depth int) (int, int) {
	if set == nil {
		return depth, 1
	}

	maxDepth := depth
	totalCost := 0

	for _, sel := range set.Selections {
		switch node := sel.(type) {
		case *ast.Field:
			if node.Name != nil && strings.HasPrefix(node.Name.Value, "__") {
				totalCost += 1
				continue
			}

			fieldDepth, fieldCost := estimateSelectionSet(node.SelectionSet, fragments, depth+1)
			if fieldDepth > maxDepth {
				maxDepth = fieldDepth
			}

			multiplier := 1
			fieldName := ""
			if node.Name != nil {
				fieldName = node.Name.Value
			}
			if isListField(fieldName) {
				limit := argInt(node.Arguments, "limit", 20)
				multiplier = clamp(limit, 1, 50)
			}

			totalCost += 1 + multiplier*fieldCost
		case *ast.FragmentSpread:
			if node.Name == nil {
				continue
			}
			fragment := fragments[node.Name.Value]
			if fragment == nil {
				continue
			}
			fragDepth, fragCost := estimateSelectionSet(fragment.SelectionSet, fragments, depth+1)
			if fragDepth > maxDepth {
				maxDepth = fragDepth
			}
			totalCost += fragCost
		case *ast.InlineFragment:
			inlineDepth, inlineCost := estimateSelectionSet(node.SelectionSet, fragments, depth+1)
			if inlineDepth > maxDepth {
				maxDepth = inlineDepth
			}
			totalCost += inlineCost
		}
	}

	if totalCost == 0 {
		totalCost = 1
	}

	return maxDepth, totalCost
}

func isListField(name string) bool {
	switch name {
	case "catalog", "articles", "users", "items", "colors", "sizes", "prices", "content":
		return true
	default:
		return false
	}
}

func argInt(args []*ast.Argument, name string, fallback int) int {
	for _, arg := range args {
		if arg.Name == nil || arg.Name.Value != name || arg.Value == nil {
			continue
		}
		switch v := arg.Value.(type) {
		case *ast.IntValue:
			n, err := strconv.Atoi(v.Value)
			if err == nil {
				return n
			}
		case *ast.Variable:
			return fallback
		}
	}
	return fallback
}

func clamp(v, minV, maxV int) int {
	if v < minV {
		return minV
	}
	if v > maxV {
		return maxV
	}
	return v
}

func normalizePageArgs(args map[string]any) (int, int) {
	offset := asInt(args["offset"])
	limit := asInt(args["limit"])
	if offset < 0 {
		offset = 0
	}
	if limit <= 0 {
		limit = 20
	}
	if limit > 100 {
		limit = 100
	}
	return offset, limit
}

func paginateSlice[T any](items []T, offset, limit int) []T {
	if len(items) == 0 || offset >= len(items) {
		return []T{}
	}
	end := int(math.Min(float64(len(items)), float64(offset+limit)))
	return items[offset:end]
}

func mapArticleBlocksInput(value any) []repositories.ArticlePart {
	raw, ok := value.([]any)
	if !ok {
		return []repositories.ArticlePart{}
	}

	result := make([]repositories.ArticlePart, 0, len(raw))
	for _, item := range raw {
		m, ok := item.(map[string]any)
		if !ok {
			continue
		}
		part := repositories.ArticlePart{
			Type:    asString(m["type"]),
			Content: asString(m["content"]),
		}
		itemsJSON := asString(m["itemsJson"])
		if strings.TrimSpace(itemsJSON) != "" {
			var decoded any
			if err := json.Unmarshal([]byte(itemsJSON), &decoded); err == nil {
				part.Items = decoded
			}
		}
		result = append(result, part)
	}

	return result
}

func mapProductColorsInput(value any) []repositories.ProductColorDraft {
	raw, ok := value.([]any)
	if !ok {
		return []repositories.ProductColorDraft{}
	}

	result := make([]repositories.ProductColorDraft, 0, len(raw))
	for _, item := range raw {
		m, ok := item.(map[string]any)
		if !ok {
			continue
		}
		result = append(result, repositories.ProductColorDraft{
			Tag:   asString(m["tag"]),
			Price: asFloat(m["price"]),
		})
	}
	return result
}

func asString(value any) string {
	s, _ := value.(string)
	return strings.TrimSpace(s)
}

func asFloat(value any) float64 {
	switch v := value.(type) {
	case float64:
		return v
	case float32:
		return float64(v)
	case int:
		return float64(v)
	case int32:
		return float64(v)
	case int64:
		return float64(v)
	default:
		return 0
	}
}

func asInt(value any) int {
	switch v := value.(type) {
	case int:
		return v
	case int32:
		return int(v)
	case int64:
		return int(v)
	case float64:
		return int(v)
	default:
		return 0
	}
}

func asBool(value any) bool {
	v, _ := value.(bool)
	return v
}

func asBoolDefault(value any, fallback bool) bool {
	if value == nil {
		return fallback
	}
	v, ok := value.(bool)
	if !ok {
		return fallback
	}
	return v
}
