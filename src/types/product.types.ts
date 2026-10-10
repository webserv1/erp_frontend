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
  totalPurchaseAmount: number;
  saleAmount: number | null;
  status: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PartyReturn {
  id: number;
  companyId: number;
  saleNumber?: string | null;
  partyId?: number | null;
  partyName: string;
  shopName: string;
  netTotalSalePrice: number;
  invoicePaidAmount: number;
  discount: number;
  transport: number;
  invoiceRemainingAmount: number;
  paymentStatus: "UNPAID" | "PARTIAL" | "PAID" | "OVERDUE";
  reason: string;
  amountPaid: number;
  returnDate: string;
  createdById?: number | null;
  createdAt: string;
  updatedAt: string;
  items: {
    id: number;
    productCode: string;
    productName: string;
    quantity: number;
    unit: "PIECES" | "DOZEN";
    salePrice: number;
    totalSalePrice: number;
  }[];
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
  totalPurchaseAmount: number;
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
  totalPurchaseAmount: number;
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
  purchasePrice: string | number;
  saleAmount?: string | number;
  totalPurchaseAmount: number;
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
  nextProductCode?: string;
  total?: number;
  page?: number;
  limit?: number;
}

export interface ProductCreateResponse {
  message: string;
  product: Product;
  nextProductCode?: string;
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
  totalPurchase?: number;
  remainingBalance?: number;
  invoiceCount?: number;
  invoiceNumbers?: string[];
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
  paidAmount: number;
  paymentStatus: "UNPAID" | "PARTIAL" | "PAID" | "OVERDUE";
  netTotalPurchaseAmount: number;
  remainingAmount: number;
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
  quantity: number;
  unit: "PIECES" | "DOZEN";
  totalPurchaseAmount: number;
  netTotalPurchaseAmount: number;
  paidAmount: number;
  remainingAmount: number;
  paymentStatus: "UNPAID" | "PARTIAL" | "PAID" | "OVERDUE";
  remarks?: string;
  status: boolean;
  createdAt: string;
  updatedAt: string;
  supplier?: { id: number; name: string; mobile: string };
  createdBy?: { id: number; name: string };
  showSupplierFinance?: boolean;
  items: {
    id: number;
    productCode: string;
    productName?: string;
    quantity: number;
    unit: "PIECES" | "DOZEN";
    purchasePrice: number;
    totalPurchaseAmount: number;
    remarks?: string;
  }[];
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
  saleNumber?: string;
  invoiceNumber?: string;
  productId?: number;
  productName: string;
  productCode: string;
  partyId: number;
  partyName: string;
  shopName?: string | null;
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
  saleDate?: string;
  salePrice: number;
  totalSalePrice?: number;
  purchasePrice: number;
  netTotalPurchaseAmount?: number;
  netTotalpurchaseamount?: number;
  netTotalSalePrice?: number;
  NetTotalsaleprice?: number;
  discount?: number;
  transport?: number;
  paidAmount: number;
  remainingAmount: number;
  paymentStatus: "UNPAID" | "PARTIAL" | "PAID" | "OVERDUE";
  perSaleProfit: number;
  persaleprofit?: number;
  returnAmount?: number;
  remarks?: string;
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
  party?: { id: number; partyName: string; shopName?: string };
  items: {
    id: number;
    productId?: number;
    productCode: string;
    productName: string;
    supplierId?: number;
    supplierName?: string;
    brandIds: number[];
    colorIds: number[];
    sizeIds: number[];
    brands: { id: number; name: string }[];
    colors: { id: number; name: string }[];
    sizes: { id: number; name: string }[];
    quantity: number;
    unit: "PIECES" | "DOZEN";
    salePrice: number;
    purchasePrice: number;
    totalSalePrice: number;
    Totalsaleprice?: number;
    totalPurchaseAmount?: number;
  }[];
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
  qtyInDisplay?: string;
  qtyInUnitDisplay?: string;
  latestQtyIn?: number;
  latestQtyInDisplay?: string;
  latestQtyInUnitDisplay?: string;
  previousQtyIn?: number;
  previousQtyInDisplay?: string;
  previousQtyInUnitDisplay?: string | null;
  qtyOut: number;
  qtyOutDisplay?: string;
  qtyOutUnitDisplay?: string;
  balanceStock: number;
  balanceStockDisplay?: string;
  salePrice: number;
  purchasePrice: number;
  latestPurchasePrice?: number;
  previousPurchasePrice?: number | null;
  latestPurchaseAt?: string | null;
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
  expenseDate: string;
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

export interface ProfitWithdrawal {
  id: number;
  companyId: number;
  sqAmount: number;
  arsAmount: number;
  takenAmount: number;
  balanceAfterEntry: number;
  entryDate: string;
  notes?: string | null;
  createdById?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProfitWithdrawalSummary {
  totalProfit: number;
  totalTaken: number;
  remainingProfit: number;
}

export interface SalaryEntry {
  id: number;
  companyId: number;
  sqAmount: number;
  arsAmount: number;
  workerAmount: number;
  entryDate: string;
  notes?: string | null;
  createdById?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface SalaryEntrySummary {
  totalSqAmount: number;
  totalArsAmount: number;
  totalWorkerAmount: number;
  totalSalaryAmount: number;
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
