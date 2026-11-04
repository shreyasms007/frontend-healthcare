import { useState, useEffect } from 'react'

export default function MedicineMaster() {
  const [medicines, setMedicines] = useState([])
  const [formData, setFormData] = useState({
    code: '', name: '', hsn_sac_code: '', gst_code: '', group_name: '', packing: '', manufacturer: ''
  })

  useEffect(() => {
    fetchMedicines()
  }, [])

  const fetchMedicines = async () => {
    try {
      const response = await fetch('http://localhost:8081/api/medicines')
      const data = await response.json()
      setMedicines(data || [])
    } catch (error) {
      console.error('Error fetching medicines:', error)
    }
  }

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const response = await fetch('http://localhost:8081/api/medicines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      if (response.ok) {
        setFormData({ code: '', name: '', hsn_sac_code: '', gst_code: '', group_name: '', packing: '', manufacturer: '' })
        fetchMedicines()
      } else {
        alert('Failed to save medicine')
      }
    } catch (error) {
      console.error('Error saving medicine:', error)
    }
  }

  return (
    <div>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8 overflow-hidden">
        <div className="bg-hospital-teal px-6 py-3">
          <h3 className="text-white font-medium">Create Medicine</h3>
        </div>
        <form onSubmit={handleSubmit} className="p-6 grid grid-cols-4 gap-6">
          <div className="col-span-1"><label className="block text-xs font-medium text-gray-500 mb-1">Code</label><input name="code" value={formData.code} onChange={handleInputChange} className="w-full border border-gray-300 p-2 rounded focus:ring-1 focus:ring-hospital-teal focus:border-hospital-teal outline-none" required /></div>
          <div className="col-span-1"><label className="block text-xs font-medium text-gray-500 mb-1">Name</label><input name="name" value={formData.name} onChange={handleInputChange} className="w-full border border-gray-300 p-2 rounded focus:ring-1 focus:ring-hospital-teal focus:border-hospital-teal outline-none" required /></div>
          <div className="col-span-1"><label className="block text-xs font-medium text-gray-500 mb-1">HSN/SAC Code</label><input name="hsn_sac_code" value={formData.hsn_sac_code} onChange={handleInputChange} className="w-full border border-gray-300 p-2 rounded focus:ring-1 focus:ring-hospital-teal focus:border-hospital-teal outline-none" /></div>
          <div className="col-span-1"><label className="block text-xs font-medium text-gray-500 mb-1">GST Code</label><input name="gst_code" value={formData.gst_code} onChange={handleInputChange} className="w-full border border-gray-300 p-2 rounded focus:ring-1 focus:ring-hospital-teal focus:border-hospital-teal outline-none" /></div>
          <div className="col-span-1"><label className="block text-xs font-medium text-gray-500 mb-1">Group</label><input name="group_name" value={formData.group_name} onChange={handleInputChange} className="w-full border border-gray-300 p-2 rounded focus:ring-1 focus:ring-hospital-teal focus:border-hospital-teal outline-none" /></div>
          <div className="col-span-1"><label className="block text-xs font-medium text-gray-500 mb-1">Packing</label><input name="packing" value={formData.packing} onChange={handleInputChange} className="w-full border border-gray-300 p-2 rounded focus:ring-1 focus:ring-hospital-teal focus:border-hospital-teal outline-none" /></div>
          <div className="col-span-2"><label className="block text-xs font-medium text-gray-500 mb-1">Manufacturer</label><input name="manufacturer" value={formData.manufacturer} onChange={handleInputChange} className="w-full border border-gray-300 p-2 rounded focus:ring-1 focus:ring-hospital-teal focus:border-hospital-teal outline-none" /></div>
          <div className="col-span-4 flex justify-end mt-2">
            <button type="submit" className="bg-hospital-teal text-white px-6 py-2 rounded font-medium hover:bg-teal-700 transition-colors shadow-sm">Save Medicine</button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="font-bold text-gray-800">Medicines Catalog</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-hospital-navy text-white">
              <tr>
                <th className="py-3 px-6 font-medium">Code</th>
                <th className="py-3 px-6 font-medium">Name</th>
                <th className="py-3 px-6 font-medium">HSN/SAC</th>
                <th className="py-3 px-6 font-medium">GST</th>
                <th className="py-3 px-6 font-medium">Group</th>
                <th className="py-3 px-6 font-medium">Packing</th>
                <th className="py-3 px-6 font-medium">Manufacturer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-gray-700">
              {medicines.map((med) => (
                <tr key={med.id} className="hover:bg-blue-50 transition-colors">
                  <td className="py-3 px-6">{med.code}</td>
                  <td className="py-3 px-6 font-medium text-hospital-navy">{med.name}</td>
                  <td className="py-3 px-6">{med.hsn_sac_code}</td>
                  <td className="py-3 px-6">
                    <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs border border-gray-200">{med.gst_code}</span>
                  </td>
                  <td className="py-3 px-6">{med.group_name}</td>
                  <td className="py-3 px-6">{med.packing}</td>
                  <td className="py-3 px-6">{med.manufacturer}</td>
                </tr>
              ))}
              {medicines.length === 0 && (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-gray-500">No medicines found. Add one above.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}