import type { ApiError } from '../types/auth.types'
import type { Supplier, SupplierListResponse } from '../types/product.types'

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

const normalizeSupplierList = (data: Record<string, unknown>): SupplierListResponse => {
  const suppliers = Array.isArray(data.supplier)
    ? data.supplier
    : Array.isArray(data.suppliers)
      ? data.suppliers
      : Array.isArray(data)
        ? data
        : []

  return {
    supplier: suppliers,
    total: typeof data.total === 'number' ? data.total : suppliers.length,
    page: typeof data.page === 'number' ? data.page : 1,
    limit: typeof data.limit === 'number' ? data.limit : suppliers.length,
  }
}

export const supplierApi = {
  list: (params?: { search?: string; status?: boolean; page?: number; limit?: number }) => {
    const query = new URLSearchParams()
    if (params?.search) query.append('search', params.search)
    if (params?.status !== undefined) query.append('status', String(params.status))
    if (params?.page) query.append('page', String(params.page))
    if (params?.limit) query.append('limit', String(params.limit))
    const qs = query.toString()
    return request<Record<string, unknown>>(`/suppliers${qs ? `?${qs}` : ''}`).then(normalizeSupplierList)
  },
  get: (id: number) => request<{ supplier: Supplier }>(`/suppliers/${id}`).then((res) => res.supplier),
  create: (payload: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>) => request<Supplier>('/suppliers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }),
  update: (id: number, payload: Partial<Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>>) => request<Supplier>(`/suppliers/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }),
  remove: (id: number) => request<{ message: string }>(`/suppliers/${id}`, { method: 'DELETE' }),
}
