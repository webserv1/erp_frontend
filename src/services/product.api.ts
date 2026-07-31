import type { ApiError } from '../types/auth.types'
import type { Brand, Category, Color, Product, ProductListResponse, Size } from '../types/product.types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

if (!API_BASE_URL) {
  throw new Error('VITE_API_BASE_URL is missing. Add it to your .env file.')
}

const request = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
  const token = localStorage.getItem('erp_access_token')
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: 'include',
    ...options,
    headers: {
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw data as ApiError
  return data as T
}

const masterApi = <T>(path: string) => ({
  list: () => request<{ masters: T[] }>(path).then((res) => res.masters),
  create: (payload: { name: string; status: string }) => request<T>(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }),
  update: (id: number, payload: { name: string; status: string }) => request<T>(`${path}/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }),
  remove: (id: number) => request<{ message: string }>(`${path}/${id}`, { method: 'DELETE' }),
})

export const productApi = {
  products: {
    list: (params?: { search?: string; categoryId?: number; brandId?: number; colorId?: number; sizeId?: number; status?: boolean; page?: number; limit?: number }) => {
      const query = new URLSearchParams()
      if (params?.search) query.append('search', params.search)
      if (params?.categoryId) query.append('categoryId', String(params.categoryId))
      if (params?.brandId) query.append('brandId', String(params.brandId))
      if (params?.colorId) query.append('colorId', String(params.colorId))
      if (params?.sizeId) query.append('sizeId', String(params.sizeId))
      if (params?.status !== undefined) query.append('status', String(params.status))
      if (params?.page) query.append('page', String(params.page))
      if (params?.limit) query.append('limit', String(params.limit))
      const qs = query.toString()
      return request<ProductListResponse>(`/products${qs ? `?${qs}` : ''}`)
    },
    get: (id: number) => request<{ product: Product }>(`/products/${id}`).then((res) => res.product),
    create: (formData: FormData) => request<Product>('/products', { method: 'POST', body: formData }),
    update: (id: number, formData: FormData) => request<Product>(`/products/${id}`, { method: 'PUT', body: formData }),
    remove: (id: number) => request<{ message: string }>(`/products/${id}`, { method: 'DELETE' }),
  },
  categories: masterApi<Category>('/product-masters/categories'),
  brands: masterApi<Brand>('/product-masters/brands'),
  colors: masterApi<Color>('/product-masters/colors'),
  sizes: masterApi<Size>('/product-masters/sizes'),
}
