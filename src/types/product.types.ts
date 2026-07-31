export type MasterStatus = 'ACTIVE' | 'INACTIVE'

export interface Category {
  id: number
  companyId: number
  name: string
  status: MasterStatus
}

export interface Brand {
  id: number
  companyId: number
  name: string
  status: MasterStatus
}

export interface Color {
  id: number
  companyId: number
  name: string
  status: MasterStatus
}

export interface Size {
  id: number
  companyId: number
  name: string
  status: MasterStatus
}

export interface Product {
  id: number
  companyId: number
  productCode: string
  productName: string
  categoryId: number
  brandId: number
  colorId: number
  sizeId: number
  productImage?: string
  gst: string
  itemCode: string
  status: boolean
  category?: { id: number; name: string }
  brand?: { id: number; name: string }
  color?: { id: number; name: string }
  size?: { id: number; name: string }
}

export interface ProductListResponse {
  products: Product[]
  total: number
  page: number
  limit: number
}

export interface Party {
  id: number
  companyId: number
  partyName: string
  shopName: string
  mobile: string
  email?: string
  address: string
  city: string
  state: string
  country: string
  pincode: string
  partyProfit: number
  status: boolean
  createdAt: string
  updatedAt: string
}

export interface PartyListResponse {
  party: Party[]
  total: number
  page: number
  limit: number
}

export interface Supplier {
  id: number
  companyId: number
  name: string
  mobile: string
  email?: string
  address: string
  city: string
  state: string
  country: string
  pincode: string
  status: boolean
  createdAt: string
  updatedAt: string
}

export interface SupplierListResponse {
  supplier: Supplier[]
  total: number
  page: number
  limit: number
}

export interface Purchase {
  id: number
  companyId: number
  purchaseNumber: string
  supplierId: number
  createdById?: number
  invoiceDate: string
  dueDate: string
  subTotal: number
  gstAmount: number
  discount: number
  grandTotal: number
  paidAmount: number
  paymentStatus: 'UNPAID' | 'PARTIAL' | 'PAID' | 'OVERDUE'
  remarks?: string
  createdAt: string
  updatedAt: string
  supplier?: { id: number; name: string; mobile: string }
  createdBy?: { id: number; name: string }
}

export interface PurchaseListResponse {
  purchase: Purchase[]
  total: number
  page: number
  limit: number
}
