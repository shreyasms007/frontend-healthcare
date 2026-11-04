import { useState, useEffect } from 'react'

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([])
  const [formData, setFormData] = useState({
    name: '', contact_person: '', phone: '', email: '', address: '', gst_number: ''
  })

  useEffect(() => {
    fetchSuppliers()
  }, [])

  const fetchSuppliers = async () => {
    try {
      const response = await fetch('http://localhost:8081/api/suppliers')
      const data = await response.json()
      setSuppliers(data || [])
    } catch (error) {
      console.error('Error fetching suppliers:', error)
    }
  }

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const response = await fetch('http://localhost:8081/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      if (response.ok) {
        setFormData({ name: '', contact_person: '', phone: '', email: '', address: '', gst_number: '' })
        fetchSuppliers()
      } else {
        alert('Failed to save supplier')
      }
    } catch (error) {
      console.error('Error saving supplier:', error)
    }
  }

  return (
    <div>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8 overflow-hidden">
        <div className="bg-hospital-teal px-6 py-3">
          <h3 className="text-white font-medium">Add Distributor / Supplier</h3>
        </div>
        <form onSubmit={handleSubmit} className="p-6 grid grid-cols-3 gap-6">
          <div><label className="block text-xs font-medium text-gray-500 mb-1">Company Name</label><input name="name" value={formData.name} onChange={handleInputChange} className="w-full border border-gray-300 p-2 rounded focus:ring-1 focus:ring-hospital-teal outline-none" required /></div>
          <div><label className="block text-xs font-medium text-gray-500 mb-1">Contact Person</label><input name="contact_person" value={formData.contact_person} onChange={handleInputChange} className="w-full border border-gray-300 p-2 rounded focus:ring-1 focus:ring-hospital-teal outline-none" /></div>
          <div><label className="block text-xs font-medium text-gray-500 mb-1">Phone Number</label><input name="phone" value={formData.phone} onChange={handleInputChange} className="w-full border border-gray-300 p-2 rounded focus:ring-1 focus:ring-hospital-teal outline-none" required /></div>
          <div><label className="block text-xs font-medium text-gray-500 mb-1">Email</label><input name="email" value={formData.email} onChange={handleInputChange} className="w-full border border-gray-300 p-2 rounded focus:ring-1 focus:ring-hospital-teal outline-none" /></div>
          <div><label className="block text-xs font-medium text-gray-500 mb-1">GST Number</label><input name="gst_number" value={formData.gst_number} onChange={handleInputChange} className="w-full border border-gray-300 p-2 rounded focus:ring-1 focus:ring-hospital-teal outline-none" /></div>
          <div><label className="block text-xs font-medium text-gray-500 mb-1">Address</label><input name="address" value={formData.address} onChange={handleInputChange} className="w-full border border-gray-300 p-2 rounded focus:ring-1 focus:ring-hospital-teal outline-none" /></div>
          
          <div className="col-span-3 flex justify-end mt-2">
            <button type="submit" className="bg-hospital-teal text-white px-6 py-2 rounded font-medium hover:bg-teal-700 transition-colors shadow-sm">Save Supplier</button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="font-bold text-gray-800">Supplier Directory</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-hospital-navy text-white">
              <tr>
                <th className="py-3 px-6 font-medium">Company Name</th>
                <th className="py-3 px-6 font-medium">Contact Person</th>
                <th className="py-3 px-6 font-medium">Phone</th>
                <th className="py-3 px-6 font-medium">Email</th>
                <th className="py-3 px-6 font-medium">GST Number</th>
                <th className="py-3 px-6 font-medium">Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-gray-700">
              {suppliers.map((sup) => (
                <tr key={sup.id} className="hover:bg-blue-50 transition-colors">
                  <td className="py-3 px-6 font-medium text-hospital-navy">{sup.name}</td>
                  <td className="py-3 px-6">{sup.contact_person}</td>
                  <td className="py-3 px-6">{sup.phone}</td>
                  <td className="py-3 px-6">{sup.email}</td>
                  <td className="py-3 px-6">
                    <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs border border-gray-200">{sup.gst_number}</span>
                  </td>
                  <td className="py-3 px-6">{sup.address}</td>
                </tr>
              ))}
              {suppliers.length === 0 && (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-gray-500">No suppliers registered yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}