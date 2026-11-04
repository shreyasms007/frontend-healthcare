import { BrowserRouter, Routes, Route } from 'react-router-dom'
import DashboardLayout from './layouts/DashboardLayout'
import MedicineMaster from './pages/MedicineMaster'
import Suppliers from './pages/Suppliers'
import PurchaseInvoices from './pages/PurchaseInvoices'
import SalesBilling from './pages/SalesBilling'
import Inventory from './pages/Inventory'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<MedicineMaster />} />
          <Route path="suppliers" element={<Suppliers />} />
          <Route path="purchases" element={<PurchaseInvoices />} />
          <Route path="sales" element={<SalesBilling />} />
          <Route path="inventory" element={<Inventory />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}