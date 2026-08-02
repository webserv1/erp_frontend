import type { ApiError } from '../types/auth.types'
import type { Party, PartyListResponse } from '../types/product.types'

type PartyPayload = Omit<Party, 'id' | 'companyId' | 'sales_profit' | 'createdAt' | 'updatedAt'>
type PartyMutationResponse = { message: string; party: Party }

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

const normalizePartyList = (data: Record<string, unknown>): PartyListResponse => {
  const parties = Array.isArray(data.party)
    ? data.party
    : Array.isArray(data.parties)
      ? data.parties
      : Array.isArray(data)
        ? data
        : []

  return {
    party: parties,
    total: typeof data.total === 'number' ? data.total : parties.length,
    page: typeof data.page === 'number' ? data.page : 1,
    limit: typeof data.limit === 'number' ? data.limit : parties.length,
  }
}

export const partyApi = {
  list: (params?: { search?: string; status?: boolean; page?: number; limit?: number }) => {
    const query = new URLSearchParams()
    if (params?.search) query.append('search', params.search)
    if (params?.status !== undefined) query.append('status', String(params.status))
    if (params?.page) query.append('page', String(params.page))
    if (params?.limit) query.append('limit', String(params.limit))
    const qs = query.toString()
    return request<Record<string, unknown>>(`/parties${qs ? `?${qs}` : ''}`).then(normalizePartyList)
  },
  get: (id: number) => request<{ party: Party }>(`/parties/${id}`).then((res) => res.party),
  create: (payload: PartyPayload) => request<PartyMutationResponse>('/parties', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }),
  update: (id: number, payload: Partial<PartyPayload>) => request<PartyMutationResponse>(`/parties/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }),
  remove: (id: number) => request<{ message: string }>(`/parties/${id}`, { method: 'DELETE' }),
}
