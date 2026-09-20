import type { ApiError } from "../types/auth.types";
import type { Sale, SaleListResponse } from "../types/product.types";

export type SalePayload = {
  saleNumber?: string;
  partyId?: number;
  partyName?: string;
  items: {
    productId?: number;
    productName: string;
    productCode: string;
    supplierId?: number;
    supplierName?: string;
    brandIds: number[];
    colorIds: number[];
    sizeIds: number[];
    quantity: number;
    unit: "PIECES" | "DOZEN";
    salePrice: number;
    purchasePrice: number;
    totalSalePrice: number;
    totalPurchaseAmount?: number;
  }[];
  netTotalPurchaseAmount?: number;
  netTotalSalePrice: number;
  paidAmount?: number;
  paymentStatus?: "UNPAID" | "PARTIAL" | "PAID" | "OVERDUE";
  remarks?: string;
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
    lastPurchasePrice: number | null;
    previousPurchasePrice: number | null;
    balanceQuantity: number | null;
    balanceQuantityDisplay: string | null;
    totalPurchaseAmount: number | null;
    brandIds: number[];
    colorIds: number[];
    sizeIds: number[];
    brands: { id: number; name: string }[];
    colors: { id: number; name: string }[];
    sizes: { id: number; name: string }[];
  };
  supplier: { id: number; name: string } | null;
};

export type SaleInvoice = {
  invoiceNumber: string;
  issueDate: string;
  company: { id: number; name: string; logoUrl: string | null };
  customer: { id: number; name: string } | null;
  sale: Sale;
};
const base = import.meta.env.VITE_API_BASE_URL;
if (!base)
  throw new Error("VITE_API_BASE_URL is missing. Add it to your .env file.");

const unitMultiplier = (unit: "PIECES" | "DOZEN") => (unit === "DOZEN" ? 12 : 1);

const numberOrZero = (value: unknown) =>
  typeof value === "number" ? value : Number(value) || 0;

const normalizeSale = (entry: Sale): Sale => {
  const normalizedItems =
    Array.isArray(entry.items) && entry.items.length
      ? entry.items.map((item, index) => ({
          id: item.id ?? index + 1,
          productId: item.productId,
          productCode: item.productCode || entry.productCode,
          productName: item.productName || entry.productName,
          supplierId: item.supplierId ?? entry.supplierId,
          supplierName: item.supplierName ?? entry.supplierName,
          brandIds: Array.isArray(item.brandIds)
            ? item.brandIds
            : Array.isArray(entry.brandIds)
              ? entry.brandIds
              : [],
          colorIds: Array.isArray(item.colorIds)
            ? item.colorIds
            : Array.isArray(entry.colorIds)
              ? entry.colorIds
              : [],
          sizeIds: Array.isArray(item.sizeIds)
            ? item.sizeIds
            : Array.isArray(entry.sizeIds)
              ? entry.sizeIds
              : [],
          brands: Array.isArray(item.brands)
            ? item.brands
            : Array.isArray(entry.brands)
              ? entry.brands
              : [],
          colors: Array.isArray(item.colors)
            ? item.colors
            : Array.isArray(entry.colors)
              ? entry.colors
              : [],
          sizes: Array.isArray(item.sizes)
            ? item.sizes
            : Array.isArray(entry.sizes)
              ? entry.sizes
              : [],
          quantity: numberOrZero(item.quantity || entry.quantity),
          unit: item.unit || entry.unit,
          salePrice: numberOrZero(item.salePrice || entry.salePrice),
          purchasePrice: numberOrZero(item.purchasePrice || entry.purchasePrice),
          totalSalePrice:
            numberOrZero(item.totalSalePrice || item.Totalsaleprice) ||
            numberOrZero(item.quantity || entry.quantity) *
              unitMultiplier(item.unit || entry.unit) *
              numberOrZero(item.salePrice || entry.salePrice),
          totalPurchaseAmount:
            numberOrZero(item.totalPurchaseAmount) ||
            numberOrZero(item.quantity || entry.quantity) *
              unitMultiplier(item.unit || entry.unit) *
              numberOrZero(item.purchasePrice || entry.purchasePrice),
        }))
      : [
          {
            id: entry.id,
            productId: entry.productId,
            productCode: entry.productCode,
            productName: entry.productName,
            supplierId: entry.supplierId,
            supplierName: entry.supplierName,
            brandIds: Array.isArray(entry.brandIds) ? entry.brandIds : [],
            colorIds: Array.isArray(entry.colorIds) ? entry.colorIds : [],
            sizeIds: Array.isArray(entry.sizeIds) ? entry.sizeIds : [],
            brands: Array.isArray(entry.brands) ? entry.brands : [],
            colors: Array.isArray(entry.colors) ? entry.colors : [],
            sizes: Array.isArray(entry.sizes) ? entry.sizes : [],
            quantity: numberOrZero(entry.quantity),
            unit: entry.unit,
            salePrice: numberOrZero(entry.salePrice),
            purchasePrice: numberOrZero(entry.purchasePrice),
            totalSalePrice:
              numberOrZero(entry.totalSalePrice) ||
              numberOrZero(entry.quantity) *
                unitMultiplier(entry.unit) *
                numberOrZero(entry.salePrice),
            totalPurchaseAmount:
              numberOrZero(entry.quantity) *
              unitMultiplier(entry.unit) *
              numberOrZero(entry.purchasePrice),
          },
        ];

  const netTotalSalePrice =
    numberOrZero(entry.netTotalSalePrice || entry.NetTotalsaleprice) ||
    normalizedItems.reduce((sum, item) => sum + numberOrZero(item.totalSalePrice), 0);
  const netTotalPurchaseAmount =
    numberOrZero(entry.netTotalPurchaseAmount || entry.netTotalpurchaseamount) ||
    normalizedItems.reduce(
      (sum, item) =>
        sum + numberOrZero(item.totalPurchaseAmount),
      0,
    );

  return {
    ...entry,
    productCode: normalizedItems[0]?.productCode || entry.productCode,
    productName: normalizedItems[0]?.productName || entry.productName,
    quantity: numberOrZero(entry.quantity || normalizedItems[0]?.quantity),
    unit: entry.unit || normalizedItems[0]?.unit || "PIECES",
    salePrice: numberOrZero(entry.salePrice || normalizedItems[0]?.salePrice),
    purchasePrice: numberOrZero(
      entry.purchasePrice || normalizedItems[0]?.purchasePrice,
    ),
    totalSalePrice:
      numberOrZero(entry.totalSalePrice) || numberOrZero(normalizedItems[0]?.totalSalePrice),
    netTotalSalePrice,
    netTotalPurchaseAmount,
    perSaleProfit:
      numberOrZero(entry.perSaleProfit || entry.persaleprofit) ||
      netTotalSalePrice - netTotalPurchaseAmount,
    brandIds: Array.isArray(entry.brandIds) ? entry.brandIds : [],
    colorIds: Array.isArray(entry.colorIds) ? entry.colorIds : [],
    sizeIds: Array.isArray(entry.sizeIds) ? entry.sizeIds : [],
    brands: Array.isArray(entry.brands) ? entry.brands : [],
    colors: Array.isArray(entry.colors) ? entry.colors : [],
    sizes: Array.isArray(entry.sizes) ? entry.sizes : [],
    items: normalizedItems,
  };
};

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
  list: (params?: { search?: string; page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.search) query.append("search", params.search);
    if (params?.page) query.append("page", String(params.page));
    if (params?.limit) query.append("limit", String(params.limit));
    const qs = query.toString();
    return request<Record<string, unknown>>(`/sales${qs ? `?${qs}` : ""}`).then(
      (data) => {
        const sales = Array.isArray(data.sale)
          ? data.sale
          : Array.isArray(data.sales)
            ? data.sales
            : Array.isArray(data)
              ? data
              : [];

        const normalizedSales = sales.map((entry) => normalizeSale(entry as Sale));

        return {
          sale: normalizedSales,
          total:
            typeof data.total === "number" ? data.total : normalizedSales.length,
          page: typeof data.page === "number" ? data.page : params?.page || 1,
          limit:
            typeof data.limit === "number"
              ? data.limit
              : params?.limit || normalizedSales.length,
        } satisfies SaleListResponse;
      },
    );
  },
  productDetails: (productCode: string) =>
    request<ProductDetails>(
      `/sales/product-details?productCode=${encodeURIComponent(productCode)}`,
    ),
  invoice: (id: number) =>
    request<{ invoice: SaleInvoice }>(`/sales/${id}/invoice`).then(
      (data) => ({
        ...data.invoice,
        sale: normalizeSale(data.invoice.sale),
      }),
    ),
  create: (payload: SalePayload) =>
    request<{ message: string; sale: Sale }>("/sales", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then((result) => ({ ...result, sale: normalizeSale(result.sale) })),
  update: (id: number, payload: SalePayload) =>
    request<{ message: string; sale: Sale }>(`/sales/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then((result) => ({ ...result, sale: normalizeSale(result.sale) })),
  remove: (id: number) =>
    request<{ message: string }>(`/sales/${id}`, { method: "DELETE" }),
};
