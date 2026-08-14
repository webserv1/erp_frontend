import type { ApiError } from "../types/auth.types";
import type { Sale, SaleListResponse } from "../types/product.types";

export type SalePayload = {
  productName: string;
  productCode: string;
  partyId?: number;
  partyName?: string;
  supplierId?: number;
  supplierName?: string;
  brandIds?: number[];
  colorIds: number[];
  sizeIds: number[];
  quantity: number;
  unit: "PIECES" | "DOZEN";
  salePrice: number;
  purchasePrice: number;
  paidAmount?: number;
  paymentStatus?: "UNPAID" | "PARTIAL" | "PAID" | "OVERDUE";
  status: boolean;
};
export type ProductDetails = {
  product: {
    id: number;
    productCode: string;
    productName: string;
    quantity: number | null;
    unit: "PIECES" | "DOZEN";
    purchasePrice: number | null;
    brandIds: number[];
    colorIds: number[];
    sizeIds: number[];
    brands: { id: number; name: string }[];
    colors: { id: number; name: string }[];
    sizes: { id: number; name: string }[];
  };
  supplier: { id: number; name: string } | null;
};
const base = import.meta.env.VITE_API_BASE_URL;
if (!base)
  throw new Error("VITE_API_BASE_URL is missing. Add it to your .env file.");
const request = async <T>(
  path: string,
  options: RequestInit = {},
): Promise<T> => {
  const token = localStorage.getItem("erp_access_token");
  const response = await fetch(`${base}${path}`, {
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
export const saleApi = {
  list: (params?: { search?: string }) => {
    const qs = params?.search
      ? `?search=${encodeURIComponent(params.search)}`
      : "";
    return request<{ sales: Sale[] }>(`/sales${qs}`).then(
      (data) =>
        ({
          sale: data.sales,
          total: data.sales.length,
          page: 1,
          limit: data.sales.length,
        }) satisfies SaleListResponse,
    );
  },
  productDetails: (productCode: string) =>
    request<ProductDetails>(
      `/sales/product-details?productCode=${encodeURIComponent(productCode)}`,
    ),
  create: (payload: SalePayload) =>
    request<{ message: string; sale: Sale }>("/sales", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  update: (id: number, payload: SalePayload) =>
    request<{ message: string; sale: Sale }>(`/sales/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  remove: (id: number) =>
    request<{ message: string }>(`/sales/${id}`, { method: "DELETE" }),
};
