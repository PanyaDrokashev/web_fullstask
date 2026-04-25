export interface ICatalogColors {
  tag: string;
}

export interface ICatalogSize {
  length: number;
  width: number;
  height: number;
}

export interface ICatalogItem {
  id: number;
  tag?: string;
  title: string;
  dir: string;
  img: string;
  sliderImages: string[];
  price: Record<string, number>;
  priceTag: string;
  withBtn?: boolean;
  colors: ICatalogColors[];
  sizes: ICatalogSize[];
  description: string[];
  isAvailable: boolean;
  onPallet: number;
  weight: number;
}

export interface IArticlePart {
  type: "text" | "heading" | "image" | "list" | "ordered-list" | "preview";
  content?: string;
  items?: Array<
    | string
    | {
        heading?: string;
        text?: string;
        items?: IArticlePart[];
      }
  >;
}

export interface IArticle {
  id: number;
  title: string;
  preview: string;
  content: IArticlePart[];
}

export interface IArticleDraft {
  title: string;
  preview: string;
  blocks: IArticlePart[];
}

export interface IAdminArticleEvent {
  type: "created" | "updated" | "deleted";
  articleId: number;
  title?: string;
  at: string;
}

export interface IProductDraft {
  category: string;
  title: string;
  dir: string;
  img: string;
  priceTag: string;
  basePrice: number;
  color: string;
  colors: Array<{
    tag: string;
    price: number;
  }>;
  description: string;
  onPallet: number;
  weight: number;
  length: number;
  width: number;
  height: number;
  withBtn: boolean;
  isAvailable: boolean;
}

export type NavIconKey = "shopping" | "shopping-basket" | null;

export interface INavItem {
  label: string;
  href: string;
  icon: NavIconKey;
}

export interface ISessionInfo {
  isAuthorized: boolean;
  displayName?: string;
  primaryText: string;
  primaryLink: string;
  secondaryText?: string;
  secondaryLink?: string;
}

export interface IFooterContact {
  type: "email" | "phone" | "address";
  title: string;
  value?: string;
  values?: string[];
  link?: string;
}

export interface IFooterDoc {
  title: string;
  path: string;
  file: string;
}

export interface IFooterData {
  description: string;
  brand: string;
  contacts: IFooterContact[];
  docs: IFooterDoc[];
  copyright: string;
}

export interface ILayoutData {
  siteName: string;
  siteDescription: string;
  navItems: INavItem[];
  session: ISessionInfo;
  footer: IFooterData;
}

export interface IHomeInfoCardData {
  iconKey: "person-worker" | "bulb" | "cube" | "layers";
  title: string;
  text: string;
}

export interface IHomeData {
  heroTitle: string;
  heroSubtitle: string;
  heroLeadText: string;
  infoLeadText: string;
  infoCards: IHomeInfoCardData[];
}

export interface IServicesCardData {
  title: string;
  text?: string;
  items?: string[];
}

export interface IProductPageData {
  packingParagraphs: string[];
  servicesTitle: string;
  servicesCards: IServicesCardData[];
}

export interface IUser {
  id: number;
  name: string;
  login: string;
  email: string;
  role: "admin" | "user" | string;
}
