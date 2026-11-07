import { BrowserRouter, Routes, Route } from 'react-router-dom'
import DashboardLayout from './layouts/DashboardLayout'
import MedicineMaster from './pages/MedicineMaster'
import Suppliers from './pages/Suppliers'
import SuppliersList from './pages/SuppliersList' // <-- Add this import
import PriceMaster from './pages/PriceMaster'
import PurchaseInvoices from './pages/PurchaseInvoices'
import SupplierPayments from './pages/SupplierPayments'
import SalesBilling from './pages/SalesBilling'
import Inventory from './pages/Inventory'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardLayout />}>
          <Route path="medicines" element={<MedicineMaster />} />
          <Route path="suppliers" element={<Suppliers />} />
          <Route path="suppliers-list" element={<SuppliersList />} /> {/* <-- Add this route */}
          <Route path="price-master" element={<PriceMaster />} />
          <Route path="purchases" element={<PurchaseInvoices />} />
          <Route path="supplier-payments" element={<SupplierPayments />} />
          <Route path="sales" element={<SalesBilling />} />
          <Route path="inventory" element={<Inventory />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}