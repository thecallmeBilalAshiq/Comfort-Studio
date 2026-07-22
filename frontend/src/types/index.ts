export interface User {
  id: number;
  name: string;
  email: string;
  isAdmin: boolean;
  provider?: string;
  avatar?: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  image: string;
  subcategories?: Subcategory[];
  productCount?: number;
}

export interface Subcategory {
  id?: number;
  categoryId?: number;
  name: string;
  slug: string;
  image?: string;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  originalPrice: number | null;
  image: string;
  categoryId: number;
  subcategoryId: number;
  stock: number;
  rating: number;
  reviewCount: number;
  badge: string;
  featured: number;
  categoryName?: string;
  categorySlug?: string;
  subcategoryName?: string;
  subcategorySlug?: string;
  related?: Product[];
  galleryImages?: string[];
  colors?: { name: string; hex: string }[];
  sizes?: { name: string; priceModifier: number }[];
  storageOptions?: { name: string; priceModifier: number }[];
  mattressOptions?: { name: string; priceModifier: number }[];
}

export interface Banner {
  id: number;
  title: string;
  subtitle: string;
  image: string;
  bgColor: string;
  textColor: string;
  active: number;
  sortOrder: number;
}

export interface ScrollBanner {
  id: number;
  text: string;
  bgColor: string;
  textColor: string;
  speed: number;
  active: number;
  sortOrder: number;
}

export interface Review {
  id: number;
  productId: number;
  userId: number;
  rating: number;
  comment: string;
  adminReply: string;
  adminReplyDate: string;
  createdAt: string;
  userName?: string;
}

export interface ReviewStats {
  reviews: Review[];
  count: number;
  avgRating: number;
}

export interface CartItem {
  id: number;
  userId: number;
  productId: number;
  quantity: number;
  name: string;
  image: string;
  price: number;
  slug: string;
  stock?: number;
  selectedSize?: string;
  selectedColor?: string;
  selectedStorage?: string;
  selectedMattress?: string;
}

export interface Order {
  id: number;
  userId: number;
  orderNumber?: string;
  total: number;
  shipping: number;
  status: string;
  shippingName: string;
  shippingEmail: string;
  shippingPhone: string;
  shippingCity: string;
  shippingPostalCode: string;
  createdAt: string;
  paymentScreenshot?: string;
  items?: OrderItem[];
}

export interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  quantity: number;
  price: number;
  name: string;
  image: string;
  slug: string;
  selectedSize?: string;
  selectedColor?: string;
  selectedStorage?: string;
  selectedMattress?: string;
}

export interface FooterData {
  tagline: string;
  copyright: string;
  contact: { address: string; phone: string; email: string; hours: string };
  socialLinks: { icon: string; url: string }[];
  quickLinks: { label: string; href: string }[];
  customerService: { label: string; href: string }[];
  paymentIcons: string[];
}

export interface AdminStats {
  totalRevenue: number;
  totalProducts: number;
  totalOrders: number;
  totalUsers: number;
  pendingOrders: number;
  totalCategories: number;
  totalReviews: number;
  avgRating: number;
  recentOrders: Order[];
}

export interface ContactMessage {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  read: number;
  createdAt: string;
}
