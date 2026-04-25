package repositories

import (
	"context"
	"database/sql"
	_ "embed"
	"encoding/json"
	"fmt"

	"bruska/pkg/logging"
)

//go:embed data/catalog.json
var catalogJSON string

//go:embed data/articles.json
var articlesJSON string

//go:embed data/nav-items.json
var navItemsJSON string

type CatalogColor struct {
	Tag string `json:"tag"`
}

type CatalogSize struct {
	Length int `json:"length"`
	Width  int `json:"width"`
	Height int `json:"height"`
}

type CatalogItem struct {
	ID           int                `json:"id"`
	Tag          string             `json:"tag,omitempty"`
	Title        string             `json:"title"`
	Dir          string             `json:"dir"`
	Img          string             `json:"img"`
	SliderImages []string           `json:"sliderImages"`
	Price        map[string]float64 `json:"price"`
	PriceTag     string             `json:"priceTag"`
	WithBtn      bool               `json:"withBtn,omitempty"`
	Colors       []CatalogColor     `json:"colors"`
	Sizes        []CatalogSize      `json:"sizes"`
	Description  []string           `json:"description"`
	IsAvailable  bool               `json:"isAvailable"`
	OnPallet     float64            `json:"onPallet"`
	Weight       float64            `json:"weight"`
}

type ProductDraft struct {
	Category    string              `json:"category"`
	Title       string              `json:"title"`
	Dir         string              `json:"dir"`
	Img         string              `json:"img"`
	PriceTag    string              `json:"priceTag"`
	BasePrice   float64             `json:"basePrice"`
	Color       string              `json:"color"`
	Colors      []ProductColorDraft `json:"colors"`
	Description string              `json:"description"`
	OnPallet    float64             `json:"onPallet"`
	Weight      float64             `json:"weight"`
	Length      int                 `json:"length"`
	Width       int                 `json:"width"`
	Height      int                 `json:"height"`
	WithBtn     bool                `json:"withBtn"`
	IsAvailable bool                `json:"isAvailable"`
}

type ProductColorDraft struct {
	Tag   string  `json:"tag"`
	Price float64 `json:"price"`
}

type ArticlePart struct {
	Type    string `json:"type"`
	Content string `json:"content,omitempty"`
	Items   any    `json:"items,omitempty"`
}

type Article struct {
	ID      int           `json:"id"`
	Title   string        `json:"title"`
	Preview string        `json:"preview"`
	Content []ArticlePart `json:"content"`
}

type ArticleDraft struct {
	Title   string        `json:"title"`
	Preview string        `json:"preview"`
	Blocks  []ArticlePart `json:"blocks"`
}

type User struct {
	ID    int    `json:"id"`
	Name  string `json:"name"`
	Login string `json:"login"`
	Email string `json:"email"`
	Role  string `json:"role"`
}

type UserDraft struct {
	Name     string `json:"name"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

type NavItem struct {
	Label string  `json:"label"`
	Href  string  `json:"href"`
	Icon  *string `json:"icon"`
}

type SessionInfo struct {
	IsAuthorized  bool   `json:"isAuthorized"`
	DisplayName   string `json:"displayName,omitempty"`
	PrimaryText   string `json:"primaryText"`
	PrimaryLink   string `json:"primaryLink"`
	SecondaryText string `json:"secondaryText,omitempty"`
	SecondaryLink string `json:"secondaryLink,omitempty"`
}

type FooterContact struct {
	Type   string   `json:"type"`
	Title  string   `json:"title"`
	Value  string   `json:"value,omitempty"`
	Values []string `json:"values,omitempty"`
	Link   string   `json:"link,omitempty"`
}

type FooterDoc struct {
	Title string `json:"title"`
	Path  string `json:"path"`
	File  string `json:"file"`
}

type FooterData struct {
	Description string          `json:"description"`
	Brand       string          `json:"brand"`
	Contacts    []FooterContact `json:"contacts"`
	Docs        []FooterDoc     `json:"docs"`
	Copyright   string          `json:"copyright"`
}

type LayoutData struct {
	SiteName        string      `json:"siteName"`
	SiteDescription string      `json:"siteDescription"`
	NavItems        []NavItem   `json:"navItems"`
	Session         SessionInfo `json:"session"`
	Footer          FooterData  `json:"footer"`
}

type HomeInfoCard struct {
	IconKey string `json:"iconKey"`
	Title   string `json:"title"`
	Text    string `json:"text"`
}

type HomeData struct {
	HeroTitle    string         `json:"heroTitle"`
	HeroSubtitle string         `json:"heroSubtitle"`
	HeroLeadText string         `json:"heroLeadText"`
	InfoLeadText string         `json:"infoLeadText"`
	InfoCards    []HomeInfoCard `json:"infoCards"`
}

type ServicesCard struct {
	Title string   `json:"title"`
	Text  string   `json:"text,omitempty"`
	Items []string `json:"items,omitempty"`
}

type ProductPageData struct {
	PackingParagraphs []string       `json:"packingParagraphs"`
	ServicesTitle     string         `json:"servicesTitle"`
	ServicesCards     []ServicesCard `json:"servicesCards"`
}

type ContentRepository interface {
	Layout(ctx context.Context, isAuthorized bool, userName string) LayoutData
	Home(ctx context.Context) HomeData
	ProductPage(ctx context.Context) ProductPageData
	Catalog(ctx context.Context) []CatalogItem
	CatalogByID(ctx context.Context, id int) (CatalogItem, bool)
	Articles(ctx context.Context) []Article
	ArticleByID(ctx context.Context, id int) (Article, bool)
	CreateArticle(ctx context.Context, draft ArticleDraft) (Article, error)
	UpdateArticle(ctx context.Context, id int, draft ArticleDraft) (Article, bool, error)
	DeleteArticle(ctx context.Context, id int) (bool, error)
	CreateProduct(ctx context.Context, draft ProductDraft) (CatalogItem, error)
	DeleteProduct(ctx context.Context, id int) (bool, error)
	Users(ctx context.Context) ([]User, error)
	RegisterUser(ctx context.Context, draft UserDraft) (User, error)
	AuthenticateUser(ctx context.Context, loginOrEmail, password string) (User, bool, error)
}

type contentRepository struct {
	db               *sql.DB
	fallbackCatalog  []CatalogItem
	fallbackArticles []Article
	fallbackNavItems []NavItem
}

func NewContentRepository(db *sql.DB) ContentRepository {
	return &contentRepository{
		db:               db,
		fallbackCatalog:  mustDecode[[]CatalogItem](catalogJSON, "catalog"),
		fallbackArticles: mustDecode[[]Article](articlesJSON, "articles"),
		fallbackNavItems: mustDecode[[]NavItem](navItemsJSON, "nav-items"),
	}
}

func mustDecode[T any](raw, title string) T {
	var v T
	if err := json.Unmarshal([]byte(raw), &v); err != nil {
		panic(fmt.Sprintf("failed to decode %s content: %v", title, err))
	}
	return v
}

func (r *contentRepository) Layout(ctx context.Context, isAuthorized bool, userName string) LayoutData {
	session := SessionInfo{
		IsAuthorized:  false,
		PrimaryText:   "Войти",
		PrimaryLink:   "/contacts",
		SecondaryText: "Регистрация",
		SecondaryLink: "/contacts",
	}
	if isAuthorized {
		displayName := "Пользователь"
		if userName != "" {
			displayName = userName
		}
		session = SessionInfo{
			IsAuthorized:  true,
			DisplayName:   displayName,
			PrimaryText:   "Профиль",
			PrimaryLink:   "/contacts",
			SecondaryText: "Выйти",
			SecondaryLink: "/",
		}
	}

	return LayoutData{
		SiteName:        "Bruska",
		SiteDescription: "Описание",
		NavItems:        r.navItems(ctx),
		Session:         session,
		Footer: FooterData{
			Description: "Производство и продажа тротуарной плитки, бордюров и плитки для мощения.",
			Brand:       "Бренд компании СКУ-22",
			Contacts: []FooterContact{
				{Type: "email", Title: "Почта", Value: "M.k@sku-22.ru", Link: "mailto:M.k@sku-22.ru"},
				{Type: "phone", Title: "Телефоны", Values: []string{"+7 (927) 730-16-01", "+7 (919) 810-37-77"}},
				{Type: "address", Title: "Адрес", Value: "улица 22-го Партсъезда, 2А, К4, Самара, 443080", Link: "https://yandex.ru/maps/-/CLCU6Mlw"},
			},
			Docs: []FooterDoc{
				{Title: "Политика конфиденциальности", Path: "/files/confidentials.pdf", File: "Политика конфиденциальности.pdf"},
				{Title: "Политика безопасности", Path: "/files/userAgreement.pdf", File: "Политика безопасности.pdf"},
			},
			Copyright: "© 2025 Bruska",
		},
	}
}

func (r *contentRepository) Home(_ context.Context) HomeData {
	return HomeData{
		HeroTitle:    "Брусчатка, бордюры и тротуарная плитка",
		HeroSubtitle: "Производство в Самарской области",
		HeroLeadText: "Собственные карьеры и материалы. Надёжно, быстро, с контролем качества.",
		InfoLeadText: "BRUSKA — это современное решение для благоустройства частных и общественных территорий, где каждый элемент мощения становится частью уникального дизайна. BRUSKA сочетает высокие стандарты производства, инновационные технологии и богатую цветовую палитру, чтобы создавать продукцию, соответствующую самым строгим требованиям архитекторов и дизайнеров.",
		InfoCards: []HomeInfoCard{
			{IconKey: "person-worker", Title: "Собственные карьеры", Text: "Добыча и обработка сырья используемого в производстве, производится на нашем предприятии."},
			{IconKey: "bulb", Title: "Контроль качества", Text: "Каждая партия плитки проходит строгий контроль качества, что гарантирует соответствие продукции высоким стандартам надежности и эстетики."},
			{IconKey: "cube", Title: "Доставка и логистика", Text: "Собственный и партнерский логистический транспорт. Прямые поставки без посредников."},
			{IconKey: "layers", Title: "Широкий ассортимент", Text: "Брусчатка, бордюры, тротуарная плитка - уникальные формы и цвета."},
		},
	}
}

func (r *contentRepository) ProductPage(_ context.Context) ProductPageData {
	return ProductPageData{
		PackingParagraphs: []string{
			"Брусчатка упаковывается на поддоны, что обеспечивает безопасную транспортировку и сохранность изделий. Из-за большого веса бетонных плиток коробки или ящики использовать нельзя — они не выдержат нагрузку. Для дополнительной защиты и надежности поддоны оборачиваются стрейч-пленкой.",
			"Знание характеристик упаковки важно перед покупкой. Это позволяет правильно рассчитать расходы на транспортировку и разгрузку, спланировать работу и избежать лишних затрат и усилий.",
		},
		ServicesTitle: "Транспортные услуги",
		ServicesCards: []ServicesCard{
			{
				Title: "Доставка",
				Items: []string{
					"Собственный парк грузовых авто.",
					"Машины грузоподъемностью 30-40 тонн.",
					"Доставка по г. Самаре и области.",
					"Срок поставки – от 1 дня.",
				},
			},
			{
				Title: "Аренда + Ремонт",
				Text:  "Компания «СКУ-22» предоставляет в аренду самосвалы и спецтехнику для реализации проектов дорожного или иного строительства. Ремонт автомобилей: HOWO, FAW, DAF, SCANIA, MAN, XCMG, XGMA, Lonking, МАЗ, КАМАЗ. Капитальный ремонт двигателей, ремонт ходовой части, тормозных систем, рулевого управления, сцепления. Сварочные работы: ремонт кабин, усиление рамы, шасси, кузова.",
			},
		},
	}
}

func (r *contentRepository) Catalog(ctx context.Context) []CatalogItem {
	if catalog, ok := r.catalogFromDB(ctx); ok {
		return catalog
	}
	return r.fallbackCatalog
}

func (r *contentRepository) CatalogByID(ctx context.Context, id int) (CatalogItem, bool) {
	catalog := r.Catalog(ctx)
	for i := range catalog {
		if catalog[i].ID == id {
			return catalog[i], true
		}
	}
	return CatalogItem{}, false
}

func (r *contentRepository) Articles(ctx context.Context) []Article {
	if articles, ok := r.articlesFromDB(ctx); ok {
		return articles
	}
	return r.fallbackArticles
}

func (r *contentRepository) ArticleByID(ctx context.Context, id int) (Article, bool) {
	articles := r.Articles(ctx)
	for i := range articles {
		if articles[i].ID == id {
			return articles[i], true
		}
	}
	return Article{}, false
}

func (r *contentRepository) navItems(ctx context.Context) []NavItem {
	if r.db == nil {
		return r.fallbackNavItems
	}

	rows, err := r.db.QueryContext(ctx, `SELECT label, href, icon FROM nav_items ORDER BY position, id`)
	if err != nil {
		logging.Errorf("load nav items from db: %v", err)
		return r.fallbackNavItems
	}
	defer rows.Close()

	result := make([]NavItem, 0)
	for rows.Next() {
		var item NavItem
		var icon sql.NullString
		if err = rows.Scan(&item.Label, &item.Href, &icon); err != nil {
			logging.Errorf("scan nav item: %v", err)
			return r.fallbackNavItems
		}
		if icon.Valid {
			v := icon.String
			item.Icon = &v
		}
		result = append(result, item)
	}

	if err = rows.Err(); err != nil {
		logging.Errorf("iterate nav items: %v", err)
		return r.fallbackNavItems
	}
	if len(result) == 0 {
		return r.fallbackNavItems
	}
	return result
}

func (r *contentRepository) catalogFromDB(ctx context.Context) ([]CatalogItem, bool) {
	if r.db == nil {
		return nil, false
	}

	type productRow struct {
		ID          int
		Tag         string
		Title       string
		Dir         string
		Img         string
		PriceTag    string
		WithBtn     bool
		IsAvailable bool
		OnPallet    float64
		Weight      float64
	}

	productRows, err := r.db.QueryContext(ctx, `
		SELECT id, COALESCE(tag, ''), title, dir, img, price_tag, with_btn, is_available, on_pallet, weight
		FROM products
		ORDER BY id
	`)
	if err != nil {
		logging.Errorf("load products from db: %v", err)
		return nil, false
	}
	defer productRows.Close()

	products := make([]productRow, 0)
	ids := make([]int, 0)
	for productRows.Next() {
		var row productRow
		if err = productRows.Scan(&row.ID, &row.Tag, &row.Title, &row.Dir, &row.Img, &row.PriceTag, &row.WithBtn, &row.IsAvailable, &row.OnPallet, &row.Weight); err != nil {
			logging.Errorf("scan product: %v", err)
			return nil, false
		}
		products = append(products, row)
		ids = append(ids, row.ID)
	}
	if err = productRows.Err(); err != nil {
		logging.Errorf("iterate products: %v", err)
		return nil, false
	}
	if len(products) == 0 {
		return nil, false
	}

	colors := make(map[int][]CatalogColor)
	sizes := make(map[int][]CatalogSize)
	prices := make(map[int]map[string]float64)
	descriptions := make(map[int][]string)

	colorRows, err := r.db.QueryContext(ctx, `SELECT product_id, tag FROM product_colors ORDER BY product_id, position, id`)
	if err != nil {
		logging.Errorf("load product colors: %v", err)
		return nil, false
	}
	defer colorRows.Close()
	for colorRows.Next() {
		var productID int
		var tag string
		if err = colorRows.Scan(&productID, &tag); err != nil {
			logging.Errorf("scan product color: %v", err)
			return nil, false
		}
		colors[productID] = append(colors[productID], CatalogColor{Tag: tag})
	}

	sizeRows, err := r.db.QueryContext(ctx, `SELECT product_id, length, width, height FROM product_sizes ORDER BY product_id, position, id`)
	if err != nil {
		logging.Errorf("load product sizes: %v", err)
		return nil, false
	}
	defer sizeRows.Close()
	for sizeRows.Next() {
		var productID int
		var size CatalogSize
		if err = sizeRows.Scan(&productID, &size.Length, &size.Width, &size.Height); err != nil {
			logging.Errorf("scan product size: %v", err)
			return nil, false
		}
		sizes[productID] = append(sizes[productID], size)
	}

	priceRows, err := r.db.QueryContext(ctx, `SELECT product_id, color_tag, amount FROM product_prices ORDER BY product_id, position, id`)
	if err != nil {
		logging.Errorf("load product prices: %v", err)
		return nil, false
	}
	defer priceRows.Close()
	for priceRows.Next() {
		var productID int
		var tag string
		var amount float64
		if err = priceRows.Scan(&productID, &tag, &amount); err != nil {
			logging.Errorf("scan product price: %v", err)
			return nil, false
		}
		if prices[productID] == nil {
			prices[productID] = map[string]float64{}
		}
		prices[productID][tag] = amount
	}

	descriptionRows, err := r.db.QueryContext(ctx, `SELECT product_id, body FROM product_descriptions ORDER BY product_id, position, id`)
	if err != nil {
		logging.Errorf("load product descriptions: %v", err)
		return nil, false
	}
	defer descriptionRows.Close()
	for descriptionRows.Next() {
		var productID int
		var body string
		if err = descriptionRows.Scan(&productID, &body); err != nil {
			logging.Errorf("scan product description: %v", err)
			return nil, false
		}
		descriptions[productID] = append(descriptions[productID], body)
	}

	catalog := make([]CatalogItem, 0, len(ids))
	for _, p := range products {
		productColors := colors[p.ID]
		if productColors == nil {
			productColors = []CatalogColor{}
		}

		productSizes := sizes[p.ID]
		if productSizes == nil {
			productSizes = []CatalogSize{}
		}

		productPrices := prices[p.ID]
		if productPrices == nil {
			productPrices = map[string]float64{}
		}

		productDescriptions := descriptions[p.ID]
		if productDescriptions == nil {
			productDescriptions = []string{}
		}

		catalog = append(catalog, CatalogItem{
			ID:           p.ID,
			Tag:          p.Tag,
			Title:        p.Title,
			Dir:          p.Dir,
			Img:          p.Img,
			SliderImages: []string{},
			Price:        productPrices,
			PriceTag:     p.PriceTag,
			WithBtn:      p.WithBtn,
			Colors:       productColors,
			Sizes:        productSizes,
			Description:  productDescriptions,
			IsAvailable:  p.IsAvailable,
			OnPallet:     p.OnPallet,
			Weight:       p.Weight,
		})
	}

	return catalog, true
}

func (r *contentRepository) articlesFromDB(ctx context.Context) ([]Article, bool) {
	if r.db == nil {
		return nil, false
	}

	articleRows, err := r.db.QueryContext(ctx, `SELECT id, title, preview, blocks_json FROM articles ORDER BY id`)
	if err != nil {
		logging.Errorf("load articles from db: %v", err)
		return nil, false
	}
	defer articleRows.Close()

	articlesMap := make(map[int]Article)
	articleHasJSONBlocks := make(map[int]bool)
	order := make([]int, 0)
	for articleRows.Next() {
		var item Article
		var blocksRaw []byte
		if err = articleRows.Scan(&item.ID, &item.Title, &item.Preview, &blocksRaw); err != nil {
			logging.Errorf("scan article: %v", err)
			return nil, false
		}
		decodedBlocks, decodeErr := decodeArticleBlocks(blocksRaw)
		if decodeErr != nil {
			logging.Errorf("decode article blocks: %v", decodeErr)
			return nil, false
		}
		item.Content = decodedBlocks
		articleHasJSONBlocks[item.ID] = len(decodedBlocks) > 0
		articlesMap[item.ID] = item
		order = append(order, item.ID)
	}
	if err = articleRows.Err(); err != nil {
		logging.Errorf("iterate articles: %v", err)
		return nil, false
	}
	if len(order) == 0 {
		return nil, false
	}

	blockRows, err := r.db.QueryContext(ctx, `
		SELECT article_id, block_type, COALESCE(content, ''), items_json
		FROM article_blocks
		ORDER BY article_id, position, id
	`)
	if err != nil {
		logging.Errorf("load article blocks: %v", err)
		return nil, false
	}
	defer blockRows.Close()

	for blockRows.Next() {
		var articleID int
		var part ArticlePart
		var itemsRaw []byte
		if err = blockRows.Scan(&articleID, &part.Type, &part.Content, &itemsRaw); err != nil {
			logging.Errorf("scan article block: %v", err)
			return nil, false
		}

		if len(itemsRaw) > 0 {
			var decoded any
			if err = json.Unmarshal(itemsRaw, &decoded); err == nil {
				part.Items = decoded
			}
		}

		article := articlesMap[articleID]
		if articleHasJSONBlocks[articleID] {
			continue
		}
		article.Content = append(article.Content, part)
		articlesMap[articleID] = article
	}
	if err = blockRows.Err(); err != nil {
		logging.Errorf("iterate article blocks: %v", err)
		return nil, false
	}

	result := make([]Article, 0, len(order))
	for _, articleID := range order {
		result = append(result, articlesMap[articleID])
	}

	return result, true
}
