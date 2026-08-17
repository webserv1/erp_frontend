export type MasterStatus = "ACTIVE" | "INACTIVE";

export interface Brand {
  id: number;
  companyId: number;
  type: "BRAND";
  name: string;
  categoryId: number;
  unit: "PIECES" | "DOZEN";
  quantity: number | null;
  purchaseAmount: number | null;
  saleAmount: number | null;
  status: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Color {
  id: number;
  companyId: number;
  type: "COLOR";
  name: string;
  categoryId: number;
  unit: "PIECES" | "DOZEN";
  quantity: number | null;
  purchaseAmount: number | null;
  saleAmount: number | null;
  status: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Size {
  id: number;
  companyId: number;
  type: "SIZE";
  name: string;
  categoryId: number;
  unit: "PIECES" | "DOZEN";
  quantity: number | null;
  purchaseAmount: number | null;
  saleAmount: number | null;
  status: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: number;
  companyId: number;
  type: "CATEGORY";
  name: string;
  categoryId: null;
  unit: "PIECES" | "DOZEN";
  quantity: number;
  purchaseAmount: number;
  saleAmount: number;
  status: boolean;
  createdAt: string;
  updatedAt: string;
  brands: Brand[];
  colors: Color[];
  sizes: Size[];
}

export interface Product {
  id: number;
  companyId: number;
  productCode: string;
  productName: string;
  categoryId: number;
  brandId: number;
  colorId: number;
  sizeId: number;
  brandIds: number[];
  colorIds: number[];
  sizeIds: number[];
  productImage?: string;
  gst: string;
  itemCode: string;
  purchasePrice: string | number;
  quantity: number;
  unit: "PIECES" | "DOZEN";
  status: boolean;
  category?: { id: number; name: string };
  brand?: { id: number; name: string };
  color?: { id: number; name: string };
  size?: { id: number; name: string };
  brands: { id: number; name: string }[];
  colors: { id: number; name: string }[];
  sizes: { id: number; name: string }[];
}

export interface ProductListResponse {
  products: Product[];
  total?: number;
  page?: number;
  limit?: number;
}

export interface ProductCreateResponse {
  message: string;
  product: Product;
}

export interface ProductUpdateResponse {
  message: string;
  product: Product;
}

export interface Party {
  id: number;
  companyId: number;
  partyName: string;
  shopName: string;
  mobile: string;
  email?: string;
  address: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  sales_profit: number;
  status: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PartyListResponse {
  party: Party[];
  total: number;
  page: number;
  limit: number;
}

export interface Supplier {
  id: number;
  companyId: number;
  name: string;
  mobile: string;
  email?: string;
  address: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  status: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierListResponse {
  supplier: Supplier[];
  total: number;
  page: number;
  limit: number;
}

export interface Purchase {
  id: number;
  companyId: number;
  purchaseNumber: string;
  supplierId: number;
  supplierName: string;
  productCode: string;
  createdById?: number;
  invoiceDate: string;
  purchasePrice: number;
  paidAmount: number;
  remainingBalance: number;
  paymentStatus: "UNPAID" | "PARTIAL" | "PAID" | "OVERDUE";
  remarks?: string;
  status: boolean;
  createdAt: string;
  updatedAt: string;
  supplier?: { id: number; name: string; mobile: string };
  createdBy?: { id: number; name: string };
}

export interface PurchaseListResponse {
  purchase: Purchase[];
  total: number;
  page: number;
  limit: number;
}

export interface Sale {
  id: number;
  companyId: number;
  productId?: number;
  productName: string;
  productCode: string;
  partyId: number;
  partyName: string;
  supplierId?: number;
  supplierName?: string;
  brandId?: number;
  sizeId?: number;
  colorId?: number;
  brandIds: number[];
  colorIds: number[];
  sizeIds: number[];
  quantity: number;
  unit: "PIECES" | "DOZEN";
  salePrice: number;
  purchasePrice: number;
  paidAmount: number;
  remainingAmount: number;
  paymentStatus: "UNPAID" | "PARTIAL" | "PAID" | "OVERDUE";
  perSaleProfit: number;
  status: boolean;
  createdAt: string;
  updatedAt: string;
  size?: { id: number; name: string };
  color?: { id: number; name: string };
  brand?: { id: number; name: string };
  brands: { id: number; name: string }[];
  colors: { id: number; name: string }[];
  sizes: { id: number; name: string }[];
  supplier?: { id: number; name: string };
  party?: { id: number; partyName: string };
}

export interface SaleListResponse {
  sale: Sale[];
  total: number;
  page: number;
  limit: number;
}

export interface Stock {
  id: number;
  companyId: number;
  productCode: string;
  productName: string;
  sizeId: number;
  qtyIn: number;
  qtyOut: number;
  balanceStock: number;
  salePrice: number;
  purchasePrice: number;
  saleValue: number;
  remarks?: string;
  status: boolean;
  createdAt: string;
  updatedAt: string;
  size?: { id: number; name: string };
  brandIds: number[];
  colorIds: number[];
  sizeIds: number[];
  brands: { id: number; name: string }[];
  colors: { id: number; name: string }[];
  sizes: { id: number; name: string }[];
}

export interface StockListResponse {
  stock: Stock[];
  total: number;
  page: number;
  limit: number;
}

export interface Expense {
  id: number;
  companyId: number;
  category: string;
  details: string;
  amount: number;
  paymentMode: "UPI" | "CASH";
  billUrl?: string;
  createdById?: number;
  status: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseListResponse {
  expense: Expense[];
  total: number;
  page: number;
  limit: number;
}

export interface SalesTrend {
  date: string;
  sales: number;
  profit: number;
}

export interface TopProduct {
  productCode: string;
  productName: string;
  quantity: number;
  total: number;
}

export interface TopParty {
  partyId: number;
  partyName: string;
  total: number;
}

export interface LowStockAlertReport {
  id: number;
  productCode: string;
  productName: string;
  balanceStock: number;
}

export interface ReportData {
  sales: { count: number; total: number; profit: number };
  purchases: { count: number; total: number };
  expenses: { count: number; total: number };
  netProfit: number;
  balances: {
    partyOutstanding: number;
    supplierPayable: number;
    parties: { id: number | null; name: string; balance: number }[];
    suppliers: { id: number | null; name: string; balance: number }[];
  };
  salesTrend: SalesTrend[];
  topProducts: TopProduct[];
  topParties: TopParty[];
  lowStockAlerts: LowStockAlertReport[];
}

export interface Report {
  id: number;
  companyId: number;
  type: "WEEKLY" | "MONTHLY";
  periodStart: string;
  periodEnd: string;
  data: ReportData;
  generatedById?: number;
  createdAt: string;
  generatedBy?: { id: number; name: string };
}

export interface ReportListResponse {
  reports: Report[];
}

export interface GenerateReportPayload {
  type: "WEEKLY" | "MONTHLY";
}

export interface Company {
  id: number;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  mobile?: string;
  email?: string;
  gst?: string;
  logo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Branding {
  id: number;
  companyId: number;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  logo?: string;
  background?: string;
  favicon?: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: number;
  companyId: number;
  name: string;
  email: string;
  role: "ADMIN" | "MANAGER" | "WORKER";
  status: boolean;
  createdAt: string;
  updatedAt: string;
}
