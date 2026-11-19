import type {
  ApiErrorBody,
  Category,
  CategoryProducts,
  HealthResponse,
  Product,
} from '@catalogue/shared';

/** Thrown for any failed API call, carrying the server's error code when there is one. */
export class ApiClientError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/** The ONLY place in the web app that calls fetch. Relative /api: same origin, no CORS. */
async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      ...init,
      headers: {
        Accept: 'application/json',
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      },
    });
  } catch {
    throw new ApiClientError(0, 'NETWORK_ERROR', 'Could not reach the server. Please try again.');
  }

  const body: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const error = (body as ApiErrorBody | null)?.error;
    throw new ApiClientError(
      res.status,
      error?.code ?? 'UNKNOWN',
      error?.message ?? `Request failed (${res.status})`,
      error?.details,
    );
  }
  return body as T;
}

export const apiClient = {
  health: () => request<HealthResponse>('/health'),
  getCategories: () => request<Category[]>('/categories'),
  getCategoryProducts: (slug: string) =>
    request<CategoryProducts>(`/categories/${encodeURIComponent(slug)}/products`),
  getFeatured: () => request<Product[]>('/products/featured'),
  getProduct: (id: number) => request<Product>(`/products/${id}`),
};
