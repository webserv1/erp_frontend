import type { ApiError } from '../types/auth.types'
import type { Purchase, PurchaseListResponse } from '../types/product.types'

type PurchasePayload = Omit<Purchase, 'id' | 'companyId' | 'createdById' | 'createdAt' | 'updatedAt'>

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

const normalizePurchaseList = (data: Record<string, unknown>): PurchaseListResponse => {
  const purchases = Array.isArray(data.purchase)
    ? data.purchase
    : Array.isArray(data.purchases)
      ? data.purchases
      : Array.isArray(data)
        ? data
        : []

  return {
    purchase: purchases,
    total: typeof data.total === 'number' ? data.total : purchases.length,
    page: typeof data.page === 'number' ? data.page : 1,
    limit: typeof data.limit === 'number' ? data.limit : purchases.length,
  }
}

export const purchaseApi = {
  list: (params?: { search?: string; partyId?: number; paymentStatus?: string; startDate?: string; endDate?: string; status?: boolean; page?: number; limit?: number }) => {
    const query = new URLSearchParams()
    if (params?.search) query.append('search', params.search)
    if (params?.partyId) query.append('partyId', String(params.partyId))
    if (params?.paymentStatus) query.append('paymentStatus', params.paymentStatus)
    if (params?.startDate) query.append('startDate', params.startDate)
    if (params?.endDate) query.append('endDate', params.endDate)
    if (params?.status !== undefined) query.append('status', String(params.status))
    if (params?.page) query.append('page', String(params.page))
    if (params?.limit) query.append('limit', String(params.limit))
    const qs = query.toString()
    return request<Record<string, unknown>>(`/purchases${qs ? `?${qs}` : ''}`).then(normalizePurchaseList)
  },
  get: (id: number) => request<{ purchase: Purchase }>(`/purchases/${id}`).then((res) => res.purchase),
  create: (payload: PurchasePayload) => request<Purchase>('/purchases', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }),
  update: (id: number, payload: Partial<PurchasePayload>) => request<Purchase>(`/purchases/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }),
  remove: (id: number) => request<{ message: string }>(`/purchases/${id}`, { method: 'DELETE' }),
}
