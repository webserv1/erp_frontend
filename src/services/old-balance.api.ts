import type { ApiError } from "../types/auth.types";
import type { OldBalance, OldBalanceListResponse } from "../types/product.types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!API_BASE_URL) {
  throw new Error("VITE_API_BASE_URL is missing. Add it to your .env file.");
}

const request = async <T>(
  path: string,
  options: RequestInit = {},
): Promise<T> => {
  const token = localStorage.getItem("erp_access_token");
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    ...options,
    headers: {
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw data as ApiError;
  return data as T;
};

const normalizeOldBalanceList = (data: Record<string, unknown>): OldBalanceListResponse => {
  const oldBalances = Array.isArray(data.oldBalance)
    ? data.oldBalance
    : Array.isArray(data.oldBalances)
      ? data.oldBalances
      : Array.isArray(data)
        ? data
        : [];

  return {
    oldBalance: oldBalances as OldBalance[],
    total: typeof data.total === "number" ? data.total : oldBalances.length,
    page: typeof data.page === "number" ? data.page : 1,
    limit: typeof data.limit === "number" ? data.limit : oldBalances.length,
  };
};

export const oldBalanceApi = {
  list: (params?: { search?: string; partyId?: number; status?: boolean; startDate?: string; endDate?: string; page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.search) query.append("search", params.search);
    if (params?.partyId) query.append("partyId", String(params.partyId));
    if (params?.status !== undefined) query.append("status", String(params.status));
    if (params?.startDate) query.append("startDate", params.startDate);
    if (params?.endDate) query.append("endDate", params.endDate);
    if (params?.page) query.append("page", String(params.page));
    if (params?.limit) query.append("limit", String(params.limit));
    const qs = query.toString();
    return request<Record<string, unknown>>(`/old-balances${qs ? `?${qs}` : ""}`).then(normalizeOldBalanceList);
  },
  get: (id: number) =>
    request<{ oldBalance: OldBalance }>(`/old-balances/${id}`).then((res) => res.oldBalance),
  create: (formData: FormData) =>
    request<{ message: string; oldBalance: OldBalance }>("/old-balances", {
      method: "POST",
      body: formData,
    }),
  update: (id: number, formData: FormData) =>
    request<{ message: string; oldBalance: OldBalance }>(`/old-balances/${id}`, {
      method: "PUT",
      body: formData,
    }),
  remove: (id: number) =>
    request<{ message: string }>(`/old-balances/${id}`, { method: "DELETE" }),
};
