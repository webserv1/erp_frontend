import type { ApiError } from "../types/auth.types";

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

export interface TodayData {
  purchaseCount: number;
  purchaseTotal: number;
  saleCount: number;
  saleTotal: number;
  salesProfit: number;
}

export interface LowStockAlert {
  id: number;
  productCode: string;
  productName: string;
  balanceStock: number;
  salePrice: number;
}

export interface LastPartyPurchase {
  id: number;
  purchaseNumber: string;
  purchasePrice: number;
  createdAt: string;
  partyId: number;
  partyName: string;
}

export interface DashboardData {
  totalProducts: number;
  totalSuppliers: number;
  totalParties: number;
  totalSales: number;
  totalSalesProfit: number;
  today: TodayData;
  lowStockAlerts: LowStockAlert[];
  lastPartyPurchases: LastPartyPurchase[];
}

export const dashboardApi = {
  get: (params?: { lowStockThreshold?: number }) => {
    const query = new URLSearchParams();
    if (params?.lowStockThreshold)
      query.append("lowStockThreshold", String(params.lowStockThreshold));
    const qs = query.toString();
    return request<{ dashboard: Partial<DashboardData> }>(
      `/dashboard${qs ? `?${qs}` : ""}`,
    ).then((res) => {
      const dashboard = res.dashboard ?? {};
      return {
        totalProducts: dashboard.totalProducts ?? 0,
        totalSuppliers: dashboard.totalSuppliers ?? 0,
        totalParties: dashboard.totalParties ?? 0,
        totalSales: dashboard.totalSales ?? 0,
        totalSalesProfit: dashboard.totalSalesProfit ?? 0,
        today: {
          purchaseCount: dashboard.today?.purchaseCount ?? 0,
          purchaseTotal: dashboard.today?.purchaseTotal ?? 0,
          saleCount: dashboard.today?.saleCount ?? 0,
          saleTotal: dashboard.today?.saleTotal ?? 0,
          salesProfit: dashboard.today?.salesProfit ?? 0,
        },
        lowStockAlerts: Array.isArray(dashboard.lowStockAlerts)
          ? dashboard.lowStockAlerts
          : [],
        lastPartyPurchases: Array.isArray(dashboard.lastPartyPurchases)
          ? dashboard.lastPartyPurchases
          : [],
      };
    });
  },
};
