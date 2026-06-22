const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface RequestOptions extends RequestInit {
  params?: Record<string, string>;
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { params, headers, ...customOptions } = options;

  let url = `${API_URL}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams(params);
    url += `?${searchParams.toString()}`;
  }

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const defaultHeaders: Record<string, string> = {};
  if (!(customOptions.body instanceof FormData)) {
    defaultHeaders['Content-Type'] = 'application/json';
  }

  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const mergedHeaders = {
    ...defaultHeaders,
    ...headers,
  };

  // If uploading files with FormData, the browser must set the boundary boundary automatically.
  // We must not specify a manual Content-Type header.
  if (customOptions.body instanceof FormData) {
    delete (mergedHeaders as Record<string, string>)['Content-Type'];
  }

  const config: RequestInit = {
    ...customOptions,
    headers: mergedHeaders,
  };

  try {
    const response = await fetch(url, config);

    if (response.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }

    if (!response.ok) {
      let errorMessage = 'Đã xảy ra lỗi hệ thống';
      let errorDetails: unknown = null;

      try {
        const errorJson = await response.json() as { message?: string; error?: { message?: string; details?: unknown }; details?: unknown };
        errorMessage = errorJson.message || errorJson.error?.message || errorMessage;
        errorDetails = errorJson.error?.details || errorJson.details || null;
      } catch {
        // Fallback
      }

      throw new ApiError(response.status, errorMessage, errorDetails);
    }

    const text = await response.text();
    return text ? (JSON.parse(text) as T) : ({} as T);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new Error('Không thể kết nối tới máy chủ');
  }
}

export const apiClient = {
  get: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'GET' }),
  post: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body instanceof FormData ? body : (body ? JSON.stringify(body) : undefined),
    }),
  put: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body instanceof FormData ? body : (body ? JSON.stringify(body) : undefined),
    }),
  patch: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body instanceof FormData ? body : (body ? JSON.stringify(body) : undefined),
    }),
  delete: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'DELETE' }),
};
