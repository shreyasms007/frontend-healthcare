import { useState, useEffect } from 'react'

export default function Inventory() {
  const [inventory, setInventory] = useState([])

  useEffect(() => {
    fetchInventory()
  }, [])

  const fetchInventory = async () => {
    try {
      const res = await fetch('http://localhost:8081/api/inventory')
      const data = await res.json()
      setInventory(data || [])
    } catch (err) { console.error(err) }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-hospital-navy text-white">
        <h3 className="font-bold">Live Inventory Stock Levels</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm text-left">
          <thead className="bg-gray-100 text-gray-700 border-b border-gray-200">
            <tr>
              <th className="py-3 px-6 font-medium">Medicine ID</th>
              <th className="py-3 px-6 font-medium">Batch Number</th>
              <th className="py-3 px-6 font-medium">Available Quantity</th>
              <th className="py-3 px-6 font-medium">Sale Price</th>
              <th className="py-3 px-6 font-medium">Expiry Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 text-gray-700">
            {inventory.map((inv) => (
              <tr key={inv.id} className="hover:bg-blue-50 transition-colors">
                <td className="py-3 px-6 font-medium text-hospital-navy">{inv.medicine_id}</td>
                <td className="py-3 px-6">{inv.batch_number}</td>
                <td className="py-3 px-6">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${inv.quantity > 10 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {inv.quantity} units
                  </span>
                </td>
                <td className="py-3 px-6 font-medium">₹{inv.sale_price?.toFixed(2)}</td>
                <td className="py-3 px-6">{inv.expiry_date?.split('T')[0]}</td>
              </tr>
            ))}
            {inventory.length === 0 && (
              <tr><td colSpan="5" className="py-8 text-center text-gray-500">Inventory is empty. Record a purchase invoice to stock items.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}