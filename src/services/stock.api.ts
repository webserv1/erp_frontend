import type { ApiError } from '../types/auth.types'
import type { Stock, StockListResponse } from '../types/product.types'

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

const normalizeStockList = (data: Record<string, unknown>): StockListResponse => {
  const stocks = Array.isArray(data.stock)
    ? data.stock
    : Array.isArray(data.stocks)
      ? data.stocks
      : Array.isArray(data)
        ? data
        : []

  return {
    stock: stocks,
    total: typeof data.total === 'number' ? data.total : stocks.length,
    page: typeof data.page === 'number' ? data.page : 1,
    limit: typeof data.limit === 'number' ? data.limit : stocks.length,
  }
}

export const stockApi = {
  list: (params?: { search?: string; sizeId?: number; status?: boolean; page?: number; limit?: number }) => {
    const query = new URLSearchParams()
    if (params?.search) query.append('search', params.search)
    if (params?.sizeId) query.append('sizeId', String(params.sizeId))
    if (params?.status !== undefined) query.append('status', String(params.status))
    if (params?.page) query.append('page', String(params.page))
    if (params?.limit) query.append('limit', String(params.limit))
    const qs = query.toString()
    return request<Record<string, unknown>>(`/stock${qs ? `?${qs}` : ''}`).then(normalizeStockList)
  },
  get: (id: number) => request<{ stock: Stock }>(`/stock/${id}`).then((res) => res.stock),
  create: (payload: Omit<Stock, 'id' | 'companyId' | 'balanceStock' | 'saleValue' | 'createdAt' | 'updatedAt'>) => request<Stock>('/stock', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }),
  update: (id: number, payload: Partial<Omit<Stock, 'id' | 'companyId' | 'balanceStock' | 'saleValue' | 'createdAt' | 'updatedAt'>>) => request<Stock>(`/stock/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }),
  remove: (id: number) => request<{ message: string }>(`/stock/${id}`, { method: 'DELETE' }),
}
