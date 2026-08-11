import type { ApiError } from '../types/auth.types'
import type { Report, ReportListResponse, GenerateReportPayload } from '../types/product.types'

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

export const reportApi = {
  list: (params?: { type?: 'WEEKLY' | 'MONTHLY' }) => {
    const query = new URLSearchParams()
    if (params?.type) query.append('type', params.type)
    const qs = query.toString()
    return request<ReportListResponse>(`/reports${qs ? `?${qs}` : ''}`)
  },
  get: (id: number) => request<{ report: Report }>(`/reports/${id}`).then((res) => res.report),
  generate: (payload: GenerateReportPayload) => request<{ message: string; report: Report }>('/reports/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }),
}
