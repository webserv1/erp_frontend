import type { ApiError } from "../types/auth.types";
import type { PartyReturn } from "../types/product.types";

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

export type PartyReturnPayload = {
  invoiceNumber?: string;
  partyId?: number | null;
  partyName: string;
  shopName: string;
  items: Array<{
    productCode: string;
    productName: string;
    quantity: number;
    unit: "PIECES" | "DOZEN";
    salePrice: number;
    totalSalePrice: number;
  }>;
  netTotalSalePrice: number;
  invoicePaidAmount: number;
  discount: number;
  transport: number;
  invoiceRemainingAmount: number;
  paymentStatus: "UNPAID" | "PARTIAL" | "PAID" | "OVERDUE";
  reason: string;
  amountPaid: number;
  returnDate: string;
};

export type InvoiceOption = {
  invoiceNumber: string;
  partyName: string;
  shopName: string;
  saleDate: string;
};

export type InvoiceDetails = {
  invoiceNumber: string;
  partyId?: number | null;
  partyName: string;
  shopName: string;
  saleDate: string;
  items: Array<{
    id: number;
    productCode: string;
    productName: string;
    quantity: number;
    unit: "PIECES" | "DOZEN";
    salePrice: number;
    totalSalePrice: number;
  }>;
  netTotalSalePrice: number;
  invoicePaidAmount: number;
  discount: number;
  transport: number;
  invoiceRemainingAmount: number;
  paymentStatus: "UNPAID" | "PARTIAL" | "PAID" | "OVERDUE";
};

export const partyReturnApi = {
  list: () => request<{ partyReturns: PartyReturn[] }>("/party-returns").then((res) => res.partyReturns || []),
  get: (id: number) => request<{ partyReturn: PartyReturn }>(`/party-returns/${id}`).then((res) => res.partyReturn),
  create: (payload: PartyReturnPayload) =>
    request<{ message: string; partyReturn: PartyReturn }>("/party-returns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  update: (id: number, payload: Partial<PartyReturnPayload>) =>
    request<{ message: string; partyReturn: PartyReturn }>(`/party-returns/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  remove: (id: number) => request<{ message: string }>(`/party-returns/${id}`, { method: "DELETE" }),
  invoiceOptions: () =>
    request<{ invoices: InvoiceOption[] }>("/party-returns/invoices").then((res) => res.invoices || []),
  invoiceDetails: (invoiceNumber: string) =>
    request<{ invoice: InvoiceDetails }>(`/party-returns/invoices/${encodeURIComponent(invoiceNumber)}`).then(
      (res) => res.invoice,
    ),
};
