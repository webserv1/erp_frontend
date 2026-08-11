import type { ApiError } from '../types/auth.types'
import type { Company, Branding } from '../types/product.types'

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

export const companyApi = {
  get: () => request<{ company: Company }>('/company').then((res) => res.company),
  update: (payload: Partial<Company>) => request<{ company: Company }>('/company', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }),
  getProfile: () => request<{ company: { id: number; name: string; createdAt: string; updatedAt: string }; roles: { id: number; name: string }[] }>('/company/profile'),
}

export const brandingApi = {
  get: () => request<{ branding: Branding }>('/company/branding').then((res) => res.branding),
  update: (formData: FormData) => request<{ branding: Branding }>('/company/branding', { method: 'PUT', body: formData }),
  deleteLogo: () => request<{ message: string }>('/company/branding/logo', { method: 'DELETE' }),
  deleteBackground: () => request<{ message: string }>('/company/branding/background', { method: 'DELETE' }),
  deleteFavicon: () => request<{ message: string }>('/company/branding/favicon', { method: 'DELETE' }),
}
