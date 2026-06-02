/* User and Auth Types */
export type UserRole = "buyer" | "seller" | "admin";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  companyId?: string | null;
  avatar?: string;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface Company {
  id: string;
  name: string;
  description?: string | null;
  logoUrl?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  _count?: {
    products?: number;
    orders?: number;
    users?: number;
  };
}

export interface CompanyRegistrationInput {
  name: string;
  description?: string;
  logoUrl?: string;
  email: string;
  phone?: string;
  address?: string;
}

/* Product Types */
export interface ProductSize {
  size: string;
  stock: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  sizes: ProductSize[];
  sellerId: string;
  sellerName: string;
  sellerLogo?: string | null;
  category: string;
  rating: number;
  reviewCount: number;
  createdAt: string;
}

/* Cart Types */
export interface CartItem {
  productId: string;
  product: Product;
  size: string;
  quantity: number;
  price: number;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
}

/* Order Types */
export type OrderStatus =
  | "pending"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export interface OrderItem {
  productId: string;
  productName: string;
  size: string;
  quantity: number;
  price: number;
  image: string;
}

export interface Order {
  id: string;
  buyerId: string;
  sellerId: string;
  items: OrderItem[];
  status: OrderStatus;
  subtotal: number;
  tax: number;
  total: number;
  shippingAddress: ShippingAddress;
  createdAt: string;
  updatedAt: string;
}

export interface SellerOrder {
  id: string;
  buyerName: string;
  buyerEmail: string;
  status: OrderStatus;
  total: number;
  date: string;
  items: Array<{
    productId: string;
    productName: string;
    size: string;
    quantity: number;
    price: number;
    image: string;
  }>;
}

/* Shipping and Checkout Types */
export interface ShippingAddress {
  fullName: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface CheckoutSession {
  cartItems: CartItem[];
  shippingAddress: ShippingAddress | null;
  paymentMethod: string | null;
  subtotal: number;
  tax: number;
  total: number;
}

/* Search and Filter Types */
export interface SearchFilters {
  category?: string;
  priceMin?: number;
  priceMax?: number;
  size?: string;
  sortBy?: "latest" | "price-low" | "price-high" | "rating";
  search?: string;
}

/* API Response Types */
export interface ApiResponse<T> {
  data: T;
  error: string | null;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
