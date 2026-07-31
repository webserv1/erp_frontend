import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from '../components/ProtectedRoute'
import { PublicRoute } from '../components/PublicRoute'
import { MainLayout } from '../components/layout'
import { Login } from '../pages/auth/Login'
import { Register } from '../pages/auth/Register'
import { Dashboard } from '../pages/dashboard/Dashboard'
import { Products } from '../pages/products/Products'
import { ProductMasters } from '../pages/products/ProductMasters'
import { CategoryMaster } from '../pages/products/masters/CategoryMaster'
import { BrandMaster } from '../pages/products/masters/BrandMaster'
import { ColorMaster } from '../pages/products/masters/ColorMaster'
import { SizeMaster } from '../pages/products/masters/SizeMaster'
import { PartyMaster } from '../pages/parties/PartyMaster'
import { SupplierMaster } from '../pages/suppliers/SupplierMaster'
import { PurchaseMaster } from '../pages/purchases/PurchaseMaster'
import { Sales } from '../pages/sales/Sales'

export const AppRoutes = () => (
  <Routes>
    <Route element={<PublicRoute />}>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
    </Route>
    <Route element={<ProtectedRoute />}>
      <Route element={<MainLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/products" element={<Products />} />
        <Route path="/product-masters" element={<ProductMasters />} />
        <Route path="/product-masters/category" element={<CategoryMaster />} />
        <Route path="/product-masters/brand" element={<BrandMaster />} />
        <Route path="/product-masters/color" element={<ColorMaster />} />
        <Route path="/product-masters/size" element={<SizeMaster />} />
        <Route path="/parties" element={<PartyMaster />} />
        <Route path="/suppliers" element={<SupplierMaster />} />
        <Route path="/purchases" element={<PurchaseMaster />} />
        <Route path="/sales" element={<Sales />} />
      </Route>
    </Route>
    <Route path="/" element={<Navigate to="/dashboard" replace />} />
    <Route path="*" element={<Navigate to="/dashboard" replace />} />
  </Routes>
)
