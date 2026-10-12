import type { ApiError } from "../types/auth.types";
import type { SupplierReturn } from "../types/product.types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!API_BASE_URL) {
  throw new Error("VITE_API_BASE_URL is missing. Add it to your .env file.");
}

const request = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
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

export type SupplierReturnPayload = {
  purchaseNumber?: string;
  supplierId?: number | null;
  supplierName: string;
  supplierAddress: string;
  invoiceDate: string;
  paymentStatus: "UNPAID" | "PARTIAL" | "PAID" | "OVERDUE";
  returnAmountReceived: number;
  items: Array<{
    productCode: string;
    productName: string;
    sizeName?: string;
    colorName?: string;
    brandName?: string;
    quantity: number;
    unit: "PIECES" | "DOZEN";
    purchaseAmount: number;
    totalPurchaseAmount: number;
  }>;
};

export type PurchaseOption = {
  purchaseNumber: string;
  supplierName: string;
  invoiceDate: string;
};

export type PurchaseDetails = {
  purchaseNumber: string;
  supplierId?: number | null;
  supplierName: string;
  supplierAddress: string;
  invoiceDate: string;
  paymentStatus: "UNPAID" | "PARTIAL" | "PAID" | "OVERDUE";
  netTotalPurchaseAmount: number;
  items: Array<{
    id: number;
    productCode: string;
    productName: string;
    sizeName?: string;
    colorName?: string;
    brandName?: string;
    quantity: number;
    unit: "PIECES" | "DOZEN";
    purchaseAmount: number;
    totalPurchaseAmount: number;
  }>;
};

export type ProductCodeOption = { productCode: string; productName: string };
export type ProductCodeDetails = {
  productCode: string;
  productName: string;
  sizeName?: string;
  colorName?: string;
  brandName?: string;
  unit: "PIECES" | "DOZEN";
  purchaseAmount: number;
};

export const supplierReturnApi = {
  list: () =>
    request<{ supplierReturns: SupplierReturn[] }>("/supplier-returns").then(
      (res) => res.supplierReturns || [],
    ),
  get: (id: number) =>
    request<{ supplierReturn: SupplierReturn }>(`/supplier-returns/${id}`).then(
      (res) => res.supplierReturn,
    ),
  create: (payload: SupplierReturnPayload) =>
    request<{ message: string; supplierReturn: SupplierReturn }>("/supplier-returns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  update: (id: number, payload: Partial<SupplierReturnPayload>) =>
    request<{ message: string; supplierReturn: SupplierReturn }>(
      `/supplier-returns/${id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    ),
  remove: (id: number) =>
    request<{ message: string }>(`/supplier-returns/${id}`, { method: "DELETE" }),
  purchaseOptions: () =>
    request<{ purchases: PurchaseOption[] }>("/supplier-returns/purchases").then(
      (res) => res.purchases || [],
    ),
  purchaseDetails: (purchaseNumber: string) =>
    request<{ purchase: PurchaseDetails }>(
      `/supplier-returns/purchases/${encodeURIComponent(purchaseNumber)}`,
    ).then((res) => res.purchase),
  productCodeOptions: () =>
    request<{ products: ProductCodeOption[] }>("/supplier-returns/product-codes").then(
      (res) => res.products || [],
    ),
  productCodeDetails: (productCode: string) =>
    request<{ product: ProductCodeDetails }>(
      `/supplier-returns/product-codes/${encodeURIComponent(productCode)}`,
    ).then((res) => res.product),
};
