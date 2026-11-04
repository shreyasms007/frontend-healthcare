import { useState, useEffect } from 'react'

export default function PurchaseInvoices() {
  const [purchases, setPurchases] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [medicines, setMedicines] = useState([])
  
  const [formData, setFormData] = useState({
    supplier_id: '',
    invoice_number: '',
    purchase_date: new Date().toISOString().split('T')[0],
    items: [{ medicine_id: '', batch_number: '', quantity: '', purchase_price: '', sale_price: '', expiry_date: '' }]
  })

  useEffect(() => {
    fetchPurchases()
    fetchSuppliers()
    fetchMedicines()
  }, [])

  const fetchPurchases = async () => {
    try {
      const res = await fetch('http://localhost:8081/api/purchases')
      const data = await res.json()
      setPurchases(data || [])
    } catch (err) { console.error(err) }
  }

  const fetchSuppliers = async () => {
    try {
      const res = await fetch('http://localhost:8081/api/suppliers')
      const data = await res.json()
      setSuppliers(data || [])
    } catch (err) { console.error(err) }
  }

  const fetchMedicines = async () => {
    try {
      const res = await fetch('http://localhost:8081/api/medicines')
      const data = await res.json()
      setMedicines(data || [])
    } catch (err) { console.error(err) }
  }

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items]
    newItems[index][field] = value
    setFormData({ ...formData, items: newItems })
  }

  const addItemRow = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { medicine_id: '', batch_number: '', quantity: '', purchase_price: '', sale_price: '', expiry_date: '' }]
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    // Formatting IDs and numbers correctly for backend payload
    const payload = {
      supplier_id: parseInt(formData.supplier_id),
      invoice_number: formData.invoice_number,
      purchase_date: formData.purchase_date,
      items: formData.items.map(item => ({
        medicine_id: parseInt(item.medicine_id),
        batch_number: item.batch_number,
        quantity: parseInt(item.quantity),
        purchase_price: parseFloat(item.purchase_price),
        sale_price: parseFloat(item.sale_price),
        expiry_date: item.expiry_date
      }))
    }

    try {
      const res = await fetch('http://localhost:8081/api/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (res.ok) {
        setFormData({
          supplier_id: '',
          invoice_number: '',
          purchase_date: new Date().toISOString().split('T')[0],
          items: [{ medicine_id: '', batch_number: '', quantity: '', purchase_price: '', sale_price: '', expiry_date: '' }]
        })
        fetchPurchases()
      } else {
        alert('Failed to save purchase invoice')
      }
    } catch (err) { console.error(err) }
  }

  return (
    <div>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8 overflow-hidden">
        <div className="bg-hospital-teal px-6 py-3">
          <h3 className="text-white font-medium">New Purchase Invoice</h3>
        </div>
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-3 gap-6 mb-6">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Supplier</label>
              <select name="supplier_id" value={formData.supplier_id} onChange={(e) => setFormData({...formData, supplier_id: e.target.value})} className="w-full border border-gray-300 p-2 rounded outline-none bg-white" required>
                <option value="">Select Supplier</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Invoice Number</label>
              <input type="text" value={formData.invoice_number} onChange={(e) => setFormData({...formData, invoice_number: e.target.value})} className="w-full border border-gray-300 p-2 rounded outline-none" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Purchase Date</label>
              <input type="date" value={formData.purchase_date} onChange={(e) => setFormData({...formData, purchase_date: e.target.value})} className="w-full border border-gray-300 p-2 rounded outline-none" required />
            </div>
          </div>

          <h4 className="font-bold text-gray-700 mb-3 text-sm">Invoice Line Items</h4>
          {formData.items.map((item, index) => (
            <div key={index} className="grid grid-cols-6 gap-3 mb-3 bg-gray-50 p-3 rounded border border-gray-200">
              <div className="col-span-2">
                <label className="block text-[10px] text-gray-500 mb-1">Medicine</label>
                <select value={item.medicine_id} onChange={(e) => handleItemChange(index, 'medicine_id', e.target.value)} className="w-full border border-gray-300 p-1.5 rounded text-xs bg-white" required>
                  <option value="">Select Medicine</option>
                  {medicines.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-gray-500 mb-1">Batch #</label>
                <input type="text" value={item.batch_number} onChange={(e) => handleItemChange(index, 'batch_number', e.target.value)} className="w-full border border-gray-300 p-1.5 rounded text-xs" required />
              </div>
              <div>
                <label className="block text-[10px] text-gray-500 mb-1">Qty</label>
                <input type="number" value={item.quantity} onChange={(e) => handleItemChange(index, 'quantity', e.target.value)} className="w-full border border-gray-300 p-1.5 rounded text-xs" required />
              </div>
              <div>
                <label className="block text-[10px] text-gray-500 mb-1">Purchase Price</label>
                <input type="number" step="0.01" value={item.purchase_price} onChange={(e) => handleItemChange(index, 'purchase_price', e.target.value)} className="w-full border border-gray-300 p-1.5 rounded text-xs" required />
              </div>
              <div>
                <label className="block text-[10px] text-gray-500 mb-1">Sale Price</label>
                <input type="number" step="0.01" value={item.sale_price} onChange={(e) => handleItemChange(index, 'sale_price', e.target.value)} className="w-full border border-gray-300 p-1.5 rounded text-xs" required />
              </div>
              <div className="col-span-6">
                <label className="block text-[10px] text-gray-500 mb-1">Expiry Date</label>
                <input type="date" value={item.expiry_date} onChange={(e) => handleItemChange(index, 'expiry_date', e.target.value)} className="w-full border border-gray-300 p-1.5 rounded text-xs" required />
              </div>
            </div>
          ))}

          <div className="flex justify-between items-center mt-4">
            <button type="button" onClick={addItemRow} className="bg-gray-200 text-gray-700 px-4 py-2 rounded text-xs font-medium hover:bg-gray-300">Add Another Item</button>
            <button type="submit" className="bg-hospital-teal text-white px-6 py-2 rounded font-medium hover:bg-teal-700 transition-colors shadow-sm">Save Purchase Invoice</button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="font-bold text-gray-800">Purchase History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-hospital-navy text-white">
              <tr>
                <th className="py-3 px-6 font-medium">Invoice #</th>
                <th className="py-3 px-6 font-medium">Supplier ID</th>
                <th className="py-3 px-6 font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-gray-700">
              {purchases.map((p) => (
                <tr key={p.id} className="hover:bg-blue-50 transition-colors">
                  <td className="py-3 px-6 font-medium text-hospital-navy">{p.invoice_number}</td>
                  <td className="py-3 px-6">{p.supplier_id}</td>
                  <td className="py-3 px-6">{p.purchase_date?.split('T')[0]}</td>
                </tr>
              ))}
              {purchases.length === 0 && (
                <tr><td colSpan="3" className="py-8 text-center text-gray-500">No purchase invoices recorded.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}