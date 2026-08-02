import type { ApiError } from '../types/auth.types'
import type { Sale, SaleListResponse } from '../types/product.types'

type SalePayload = Omit<Sale, 'id' | 'companyId' | 'total' | 'perSaleProfit' | 'createdAt' | 'updatedAt'>

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

const normalizeSaleList = (data: Record<string, unknown>): SaleListResponse => {
  const sales = Array.isArray(data.sale)
    ? data.sale
    : Array.isArray(data.sales)
      ? data.sales
      : Array.isArray(data)
        ? data
        : []

  return {
    sale: sales,
    total: typeof data.total === 'number' ? data.total : sales.length,
    page: typeof data.page === 'number' ? data.page : 1,
    limit: typeof data.limit === 'number' ? data.limit : sales.length,
  }
}

export const saleApi = {
  list: (params?: { search?: string; partyId?: number; sizeId?: number; colorId?: number; supplierId?: number; startDate?: string; endDate?: string; page?: number; limit?: number }) => {
    const query = new URLSearchParams()
    if (params?.search) query.append('search', params.search)
    if (params?.partyId) query.append('partyId', String(params.partyId))
    if (params?.sizeId) query.append('sizeId', String(params.sizeId))
    if (params?.colorId) query.append('colorId', String(params.colorId))
    if (params?.supplierId) query.append('supplierId', String(params.supplierId))
    if (params?.startDate) query.append('startDate', params.startDate)
    if (params?.endDate) query.append('endDate', params.endDate)
    if (params?.page) query.append('page', String(params.page))
    if (params?.limit) query.append('limit', String(params.limit))
    const qs = query.toString()
    return request<Record<string, unknown>>(`/sales${qs ? `?${qs}` : ''}`).then(normalizeSaleList)
  },
  get: (id: number) => request<{ sale: Sale }>(`/sales/${id}`).then((res) => res.sale),
  create: (payload: SalePayload) => request<Sale>('/sales', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }),
  update: (id: number, payload: Partial<SalePayload>) => request<Sale>(`/sales/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }),
  remove: (id: number) => request<{ message: string }>(`/sales/${id}`, { method: 'DELETE' }),
}
