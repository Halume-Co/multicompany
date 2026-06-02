import {
  ApiResponse,
  Company,
  CompanyRegistrationInput,
  Order,
  PaginatedResponse,
  Product,
  SellerOrder,
  User,
} from "./types";

export interface Category {
  id: string;
  name: string;
}

const BASE_URL = resolveBaseUrl();

interface AuthPayload {
  user: User;
}

export async function fetchAPI<T>(
  endpoint: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const contentType = response.headers.get("content-type") || "";
      const errorData = contentType.includes("application/json")
        ? await response.json().catch(() => ({}))
        : { message: await response.text().catch(() => "") };

      return {
        data: null as T,
        error: errorData.message || `HTTP ${response.status}`,
        success: false,
      };
    }

    const data = await response.json().catch(() => null);
    return {
      data: data as T,
      error: null,
      success: true,
    };
  } catch (error) {
    return {
      data: null as T,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      success: false,
    };
  }
}

function resolveBaseUrl(): string {
  const configuredBaseUrl = process.env.NEXT_PUBLIC_API_URL?.trim();

  if (configuredBaseUrl) {
    return configuredBaseUrl;
  }

  if (typeof window !== "undefined") {
    const { protocol, hostname, port } = window.location;
    const isLocalHost = hostname === "localhost" || hostname === "127.0.0.1";

    if (isLocalHost) {
      if (port === "3001") {
        return `${protocol}//${hostname}:3000`;
      }

      if (port === "3000") {
        return `${protocol}//${hostname}:3001`;
      }
    }
  }

  return "http://localhost:3001";
}

export async function getProducts(
  filters?: Record<string, string | number | undefined>
): Promise<ApiResponse<Product[]>> {
  const searchParams = new URLSearchParams();

  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });
  }

  const query = searchParams.toString();
  return fetchAPI<Product[]>(`/products${query ? `?${query}` : ""}`);
}

export async function getProduct(id: string): Promise<ApiResponse<Product>> {
  return fetchAPI<Product>(`/products/${id}`);
}

export async function searchProducts(
  query: string
): Promise<ApiResponse<Product[]>> {
  return getProducts({ search: query });
}

export async function getCategories(): Promise<ApiResponse<Category[]>> {
  return fetchAPI<Category[]>("/products/categories");
}

export async function getOrder(id: string): Promise<ApiResponse<Order>> {
  return fetchAPI<Order>(`/orders/${id}`);
}

export async function getUserOrders(): Promise<ApiResponse<Order[]>> {
  return fetchAPI<Order[]>("/orders");
}

export async function createOrder(orderData: {
  notes?: string;
}): Promise<ApiResponse<{ 
  message: string;
  ordersCreated: number;
  grandTotal: number;
  orders: SellerOrder[];
}>> {
  return fetchAPI<{ 
    message: string;
    ordersCreated: number;
    grandTotal: number;
    orders: SellerOrder[];
  }>("/checkout", {
    method: "POST",
    body: JSON.stringify(orderData),
  });
}

export async function getSellerProducts(
  companyId: string
): Promise<ApiResponse<Product[]>> {
  return getProducts({ companyId });
}

export async function createProduct(
  productData: Record<string, unknown>
): Promise<ApiResponse<Product>> {
  return fetchAPI<Product>("/products", {
    method: "POST",
    body: JSON.stringify(productData),
  });
}

export async function updateProduct(
  productId: string,
  productData: Record<string, unknown>
): Promise<ApiResponse<Product>> {
  return fetchAPI<Product>(`/products/${productId}`, {
    method: "PUT",
    body: JSON.stringify(productData),
  });
}

export async function deleteProduct(
  productId: string
): Promise<ApiResponse<{ message: string }>> {
  return fetchAPI<{ message: string }>(`/products/${productId}`, {
    method: "DELETE",
  });
}

export async function getSellerOrders(): Promise<ApiResponse<SellerOrder[]>> {
  return fetchAPI<SellerOrder[]>("/seller/orders");
}

export async function updateOrderStatus(
  orderId: string,
  status: string
): Promise<ApiResponse<SellerOrder>> {
  return fetchAPI<SellerOrder>(`/seller/orders/${orderId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status: status.toUpperCase() }),
  });
}

export async function getCompany(id: string): Promise<ApiResponse<Company>> {
  return fetchAPI<Company>(`/companies/${id}`);
}

export async function getMyCompany(): Promise<ApiResponse<Company>> {
  return fetchAPI<Company>("/companies/me", {
    cache: "no-store",
  });
}

export async function updateMyCompany(
  data: Partial<CompanyRegistrationInput>
): Promise<ApiResponse<Company>> {
  return fetchAPI<Company>("/companies/me", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function registerCompany(
  companyData: CompanyRegistrationInput
): Promise<ApiResponse<Company>> {
  return fetchAPI<Company>("/companies/register", {
    method: "POST",
    body: JSON.stringify(companyData),
  });
}

export async function loginUser(
  email: string,
  password: string
): Promise<ApiResponse<AuthPayload>> {
  return fetchAPI<AuthPayload>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function registerUser(
  email: string,
  password: string,
  name: string,
  role: "buyer" | "seller"
): Promise<ApiResponse<AuthPayload>> {
  return fetchAPI<AuthPayload>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password, name, role }),
  });
}

export async function getCurrentUser(): Promise<ApiResponse<AuthPayload>> {
  return fetchAPI<AuthPayload>("/auth/me", {
    cache: "no-store",
  });
}

export async function logoutUser(): Promise<ApiResponse<{ success: boolean }>> {
  return fetchAPI<{ success: boolean }>("/auth/logout", {
    method: "POST",
  });
}

export async function createCheckoutSession(
  orderData: Record<string, unknown>
): Promise<ApiResponse<PaginatedResponse<Order>>> {
  return fetchAPI<PaginatedResponse<Order>>("/checkout", {
    method: "POST",
    body: JSON.stringify(orderData),
  });
}
