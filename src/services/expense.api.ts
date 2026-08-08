import type { ApiError } from '../types/auth.types'
import type { Expense, ExpenseListResponse } from '../types/product.types'

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

const normalizeExpenseList = (data: Record<string, unknown>): ExpenseListResponse => {
  const expenses = Array.isArray(data.expense)
    ? data.expense
    : Array.isArray(data.expenses)
      ? data.expenses
      : Array.isArray(data)
        ? data
        : []

  return {
    expense: expenses,
    total: typeof data.total === 'number' ? data.total : expenses.length,
    page: typeof data.page === 'number' ? data.page : 1,
    limit: typeof data.limit === 'number' ? data.limit : expenses.length,
  }
}

export interface ExpenseSummary {
  thisMonthTotal: number
  totalRecords: number
  activeExpenses: number
}

export const expenseApi = {
  list: (params?: { search?: string; category?: string; paymentMode?: string; status?: boolean; startDate?: string; endDate?: string; page?: number; limit?: number }) => {
    const query = new URLSearchParams()
    if (params?.search) query.append('search', params.search)
    if (params?.category) query.append('category', params.category)
    if (params?.paymentMode) query.append('paymentMode', params.paymentMode)
    if (params?.status !== undefined) query.append('status', String(params.status))
    if (params?.startDate) query.append('startDate', params.startDate)
    if (params?.endDate) query.append('endDate', params.endDate)
    if (params?.page) query.append('page', String(params.page))
    if (params?.limit) query.append('limit', String(params.limit))
    const qs = query.toString()
    return request<Record<string, unknown>>(`/expenses${qs ? `?${qs}` : ''}`).then(normalizeExpenseList)
  },
  get: (id: number) => request<{ expense: Expense }>(`/expenses/${id}`).then((res) => res.expense),
  create: (formData: FormData) => request<Expense>('/expenses', { method: 'POST', body: formData }),
  update: (id: number, formData: FormData) => request<Expense>(`/expenses/${id}`, { method: 'PUT', body: formData }),
  remove: (id: number) => request<{ message: string }>(`/expenses/${id}`, { method: 'DELETE' }),
  getSummary: () => request<{ summary: ExpenseSummary }>('/expenses/summary').then((res) => res.summary),
}
