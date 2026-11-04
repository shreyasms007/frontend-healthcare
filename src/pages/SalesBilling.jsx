import { useState, useEffect } from 'react'

export default function SalesBilling() {
  const [sales, setSales] = useState([])
  const [medicines, setMedicines] = useState([])
  const [formData, setFormData] = useState({
    customer_name: '',
    doctor_name: '',
    items: [{ medicine_id: '', batch_number: '', quantity: 1, unit_price: 0 }]
  })

  useEffect(() => {
    fetchSales()
    fetchMedicines()
  }, [])

  const fetchSales = async () => {
    try {
      const res = await fetch('http://localhost:8081/api/sales')
      const data = await res.json()
      setSales(data || [])
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
      items: [...formData.items, { medicine_id: '', batch_number: '', quantity: 1, unit_price: 0 }]
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const payload = {
      customer_name: formData.customer_name,
      doctor_name: formData.doctor_name,
      items: formData.items.map(item => ({
        medicine_id: parseInt(item.medicine_id),
        batch_number: item.batch_number,
        quantity: parseInt(item.quantity),
        unit_price: parseFloat(item.unit_price)
      }))
    }

    try {
      const res = await fetch('http://localhost:8081/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (res.ok) {
        setFormData({ customer_name: '', doctor_name: '', items: [{ medicine_id: '', batch_number: '', quantity: 1, unit_price: 0 }] })
        fetchSales()
      } else {
        alert('Billing transaction failed (Check inventory stock)')
      }
    } catch (err) { console.error(err) }
  }

  return (
    <div>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8 overflow-hidden">
        <div className="bg-hospital-teal px-6 py-3">
          <h3 className="text-white font-medium">New Sales Counter Bill</h3>
        </div>
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Customer / Patient Name</label>
              <input type="text" value={formData.customer_name} onChange={(e) => setFormData({...formData, customer_name: e.target.value})} className="w-full border border-gray-300 p-2 rounded outline-none" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Prescribing Doctor</label>
              <input type="text" value={formData.doctor_name} onChange={(e) => setFormData({...formData, doctor_name: e.target.value})} className="w-full border border-gray-300 p-2 rounded outline-none" />
            </div>
          </div>

          <h4 className="font-bold text-gray-700 mb-3 text-sm">Billing Line Items</h4>
          {formData.items.map((item, index) => (
            <div key={index} className="grid grid-cols-4 gap-4 mb-3 bg-gray-50 p-3 rounded border border-gray-200">
              <div>
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
                <label className="block text-[10px] text-gray-500 mb-1">Quantity</label>
                <input type="number" value={item.quantity} onChange={(e) => handleItemChange(index, 'quantity', e.target.value)} className="w-full border border-gray-300 p-1.5 rounded text-xs" required />
              </div>
              <div>
                <label className="block text-[10px] text-gray-500 mb-1">Unit Price</label>
                <input type="number" step="0.01" value={item.unit_price} onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)} className="w-full border border-gray-300 p-1.5 rounded text-xs" required />
              </div>
            </div>
          ))}

          <div className="flex justify-between items-center mt-4">
            <button type="button" onClick={addItemRow} className="bg-gray-200 text-gray-700 px-4 py-2 rounded text-xs font-medium hover:bg-gray-300">Add Item</button>
            <button type="submit" className="bg-hospital-teal text-white px-6 py-2 rounded font-medium hover:bg-teal-700 transition-colors shadow-sm">Complete Sale & Print</button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="font-bold text-gray-800">Sales History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-hospital-navy text-white">
              <tr>
                <th className="py-3 px-6 font-medium">Customer Name</th>
                <th className="py-3 px-6 font-medium">Doctor</th>
                <th className="py-3 px-6 font-medium">Total Amount</th>
                <th className="py-3 px-6 font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-gray-700">
              {sales.map((s) => (
                <tr key={s.id} className="hover:bg-blue-50 transition-colors">
                  <td className="py-3 px-6 font-medium text-hospital-navy">{s.customer_name}</td>
                  <td className="py-3 px-6">{s.doctor_name || 'N/A'}</td>
                  <td className="py-3 px-6 font-bold text-hospital-teal">₹{s.total_amount?.toFixed(2)}</td>
                  <td className="py-3 px-6">{s.created_at?.split('T')[0]}</td>
                </tr>
              ))}
              {sales.length === 0 && (
                <tr><td colSpan="4" className="py-8 text-center text-gray-500">No sales transactions recorded.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}