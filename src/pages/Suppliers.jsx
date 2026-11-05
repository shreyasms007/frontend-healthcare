import { useState, useEffect } from 'react'

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([])
  const initialForm = {
    ac_code: 'NEW', name: '', is_locked: false, is_inactive: false,
    allow_sales: false, allow_purchase: true, account_type: 'Other A/c',
    bank_name: '', account_no: '0', ifsc_code: '0', micr_code: '0',
    bill_type: 'TAX', pan_no: '', dl_no_1: '', dl_no_2: '', addnl_lic_no: '0',
    dl_valid_till: '', gst_number: '', gst_type: 'Registered',
    credit_days: 0, credit_limit: 0, debit_days: 0, debit_limit: 0,
    discount_pct: 0, payment_mode: 'Credit',
    address: '', city: '', pin: '', phone: '', email: '', contact_person: '',
    area: 'UNSURE-DEFAULT', category: 'RETAILER-DEFAULT', food_licence: ''
  }
  const [formData, setFormData] = useState(initialForm)

  useEffect(() => { fetchSuppliers() }, [])

  const fetchSuppliers = async () => {
    try {
      const res = await fetch('http://localhost:8081/api/suppliers')
      const data = await res.json()
      setSuppliers(data || [])
    } catch (err) { console.error(err) }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const payload = {
      ...formData,
      credit_days: parseInt(formData.credit_days) || 0,
      credit_limit: parseFloat(formData.credit_limit) || 0,
      debit_days: parseInt(formData.debit_days) || 0,
      debit_limit: parseFloat(formData.debit_limit) || 0,
      discount_pct: parseFloat(formData.discount_pct) || 0,
    }
    try {
      const res = await fetch('http://localhost:8081/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (res.ok) {
        setFormData(initialForm)
        fetchSuppliers()
        alert('Account Master saved successfully!')
      } else {
        alert('Failed to save Account Master')
      }
    } catch (err) { console.error(err) }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <div className="bg-hospital-navy px-6 py-3 flex justify-between items-center text-white">
          <h3 className="font-bold tracking-wide">Account Master — New / Modify</h3>
          <span className="bg-hospital-teal text-xs px-3 py-1 rounded font-medium">GST Update Utility Enabled</span>
        </div>

        <form onSubmit={handleSubmit} className="p-6 text-xs space-y-5">
          <div className="grid grid-cols-12 gap-6">
            
            {/* LEFT COLUMN: Identity, Banking, DL/TL Licenses & Credit Limits */}
            <div className="col-span-6 space-y-4 border-r border-gray-200 pr-6">
              
              {/* A/c Code & Name */}
              <div className="bg-gray-50 p-3 rounded border border-gray-200 space-y-3">
                <div className="flex items-center gap-4">
                  <div className="w-1/3">
                    <label className="block font-semibold text-gray-600 mb-1">A/c Code</label>
                    <input name="ac_code" value={formData.ac_code} onChange={handleChange} className="w-full border border-gray-300 p-1.5 rounded font-bold text-hospital-navy" />
                  </div>
                  <label className="flex items-center gap-1.5 mt-4 cursor-pointer text-gray-700 font-medium">
                    <input type="checkbox" name="is_locked" checked={formData.is_locked} onChange={handleChange} /> Lock
                  </label>
                  <label className="flex items-center gap-1.5 mt-4 cursor-pointer text-red-600 font-medium">
                    <input type="checkbox" name="is_inactive" checked={formData.is_inactive} onChange={handleChange} /> Inactive
                  </label>
                </div>
                <div>
                  <label className="block font-semibold text-gray-600 mb-1">A/c Name (Company / Distributor) *</label>
                  <input name="name" value={formData.name} onChange={handleChange} className="w-full border border-gray-300 p-1.5 rounded focus:border-hospital-teal outline-none font-medium" required />
                </div>
              </div>

              {/* Account Permissions & Banking */}
              <div className="bg-gray-50 p-3 rounded border border-gray-200 space-y-2.5">
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <label className="flex items-center gap-1.5 font-semibold text-hospital-navy">
                    <input type="checkbox" name="allow_sales" checked={formData.allow_sales} onChange={handleChange} /> Allow Sales
                  </label>
                  <label className="flex items-center gap-1.5 font-semibold text-hospital-teal">
                    <input type="checkbox" name="allow_purchase" checked={formData.allow_purchase} onChange={handleChange} /> Allow Purchase
                  </label>
                  <select name="account_type" value={formData.account_type} onChange={handleChange} className="border border-gray-300 rounded px-2 py-0.5 bg-white">
                    <option>Cash A/c</option>
                    <option>Bank A/c</option>
                    <option>Other A/c</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-gray-500 mb-0.5">A/c Bank</label>
                    <input name="bank_name" value={formData.bank_name} onChange={handleChange} className="w-full border border-gray-300 p-1.5 rounded" />
                  </div>
                  <div>
                    <label className="block text-gray-500 mb-0.5">A/c No.</label>
                    <input name="account_no" value={formData.account_no} onChange={handleChange} className="w-full border border-gray-300 p-1.5 rounded" />
                  </div>
                  <div>
                    <label className="block text-gray-500 mb-0.5">IFSC Code</label>
                    <input name="ifsc_code" value={formData.ifsc_code} onChange={handleChange} className="w-full border border-gray-300 p-1.5 rounded" />
                  </div>
                  <div>
                    <label className="block text-gray-500 mb-0.5">MICR</label>
                    <input name="micr_code" value={formData.micr_code} onChange={handleChange} className="w-full border border-gray-300 p-1.5 rounded" />
                  </div>
                </div>
              </div>

              {/* Drug License (DL/TL No. 1 & 2) & PAN */}
              <div className="bg-blue-50/50 p-3 rounded border border-blue-200 space-y-2.5">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-gray-600 mb-0.5">Bill Type</label>
                    <select name="bill_type" value={formData.bill_type} onChange={handleChange} className="w-full border border-gray-300 p-1.5 rounded bg-white">
                      <option value="TAX">TAX</option>
                      <option value="RETAIL">RETAIL</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-600 mb-0.5">PAN No</label>
                    <input name="pan_no" value={formData.pan_no} onChange={handleChange} className="w-full border border-gray-300 p-1.5 rounded uppercase" />
                  </div>
                </div>
                <div>
                  <label className="block font-bold text-hospital-navy mb-0.5">DL/TL No. 1</label>
                  <input name="dl_no_1" value={formData.dl_no_1} onChange={handleChange} placeholder="e.g. KA-HS1-201386" className="w-full border border-gray-300 p-1.5 rounded bg-white" />
                </div>
                <div>
                  <label className="block font-bold text-hospital-navy mb-0.5">DL/TL No. 2</label>
                  <input name="dl_no_2" value={formData.dl_no_2} onChange={handleChange} placeholder="e.g. KA-HS1-201387" className="w-full border border-gray-300 p-1.5 rounded bg-white" />
                </div>
                <div>
                  <label className="block text-gray-600 mb-0.5">Addnl Lic No.</label>
                  <input name="addnl_lic_no" value={formData.addnl_lic_no} onChange={handleChange} className="w-full border border-gray-300 p-1.5 rounded bg-white" />
                </div>
              </div>

              {/* Credit & Debit Days / Limits */}
              <div className="grid grid-cols-4 gap-3 bg-gray-50 p-3 rounded border border-gray-200">
                <div>
                  <label className="block text-gray-500 mb-0.5">Credit Days</label>
                  <input type="number" name="credit_days" value={formData.credit_days} onChange={handleChange} className="w-full border border-gray-300 p-1.5 rounded" />
                </div>
                <div>
                  <label className="block text-gray-500 mb-0.5">Credit Limit</label>
                  <input type="number" step="0.01" name="credit_limit" value={formData.credit_limit} onChange={handleChange} className="w-full border border-gray-300 p-1.5 rounded" />
                </div>
                <div>
                  <label className="block text-gray-500 mb-0.5">Debit Days</label>
                  <input type="number" name="debit_days" value={formData.debit_days} onChange={handleChange} className="w-full border border-gray-300 p-1.5 rounded" />
                </div>
                <div>
                  <label className="block text-gray-500 mb-0.5">Debit Limit</label>
                  <input type="number" step="0.01" name="debit_limit" value={formData.debit_limit} onChange={handleChange} className="w-full border border-gray-300 p-1.5 rounded" />
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Address, Contact, Area/Category, GSTN & Payment Mode */}
            <div className="col-span-6 space-y-4">
              <div className="bg-gray-50 p-3 rounded border border-gray-200 space-y-2.5">
                <div>
                  <label className="block font-semibold text-gray-600 mb-0.5">Full Address</label>
                  <input name="address" value={formData.address} onChange={handleChange} className="w-full border border-gray-300 p-1.5 rounded" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="block text-gray-500 mb-0.5">City</label>
                    <input name="city" value={formData.city} onChange={handleChange} className="w-full border border-gray-300 p-1.5 rounded" />
                  </div>
                  <div>
                    <label className="block text-gray-500 mb-0.5">Pin Code</label>
                    <input name="pin" value={formData.pin} onChange={handleChange} className="w-full border border-gray-300 p-1.5 rounded" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-gray-500 mb-0.5">Phone / Mobile *</label>
                    <input name="phone" value={formData.phone} onChange={handleChange} className="w-full border border-gray-300 p-1.5 rounded" required />
                  </div>
                  <div>
                    <label className="block text-gray-500 mb-0.5">Contact Person</label>
                    <input name="contact_person" value={formData.contact_person} onChange={handleChange} className="w-full border border-gray-300 p-1.5 rounded" />
                  </div>
                  <div>
                    <label className="block text-gray-500 mb-0.5">E-Mail</label>
                    <input name="email" value={formData.email} onChange={handleChange} className="w-full border border-gray-300 p-1.5 rounded" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-gray-500 mb-0.5">Area</label>
                    <input name="area" value={formData.area} onChange={handleChange} className="w-full border border-gray-300 p-1.5 rounded" />
                  </div>
                  <div>
                    <label className="block text-gray-500 mb-0.5">Category</label>
                    <input name="category" value={formData.category} onChange={handleChange} className="w-full border border-gray-300 p-1.5 rounded" />
                  </div>
                </div>
              </div>

              {/* Tax, GSTIN, Food License */}
              <div className="bg-teal-50/50 p-3 rounded border border-teal-200 space-y-2.5">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-hospital-teal mb-0.5">GSTN (15-Digit)</label>
                    <input name="gst_number" value={formData.gst_number} onChange={handleChange} placeholder="29AAAAA0000A1Z5" className="w-full border border-gray-300 p-1.5 rounded bg-white uppercase font-semibold" />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-600 mb-0.5">GST Type</label>
                    <select name="gst_type" value={formData.gst_type} onChange={handleChange} className="w-full border border-gray-300 p-1.5 rounded bg-white">
                      <option value="Registered">Registered</option>
                      <option value="Un-Registered">Un-Registered</option>
                      <option value="Composite">Composite</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-600 mb-0.5">DL/TL Valid Till</label>
                    <input type="date" name="dl_valid_till" value={formData.dl_valid_till} onChange={handleChange} className="w-full border border-gray-300 p-1.5 rounded bg-white" />
                  </div>
                  <div>
                    <label className="block text-gray-600 mb-0.5">Food Licence (FSSAI)</label>
                    <input name="food_licence" value={formData.food_licence} onChange={handleChange} className="w-full border border-gray-300 p-1.5 rounded bg-white" />
                  </div>
                </div>
              </div>

              {/* Default Discount & Payment Mode */}
              <div className="bg-gray-50 p-3 rounded border border-gray-200 flex items-center justify-between">
                <div className="w-1/3">
                  <label className="block text-gray-600 mb-0.5">Default Disc %</label>
                  <input type="number" step="0.01" name="discount_pct" value={formData.discount_pct} onChange={handleChange} className="w-full border border-gray-300 p-1.5 rounded" />
                </div>
                <div className="flex items-center gap-4 mt-3">
                  {['Cash', 'Card', 'Credit'].map(mode => (
                    <label key={mode} className="flex items-center gap-1 font-semibold text-gray-700 cursor-pointer">
                      <input type="radio" name="payment_mode" value={mode} checked={formData.payment_mode === mode} onChange={handleChange} />
                      {mode}
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button type="submit" className="bg-hospital-teal text-white px-8 py-2.5 rounded font-bold hover:bg-teal-700 transition-colors shadow">
                  F10 — Save Account Master
                </button>
              </div>
            </div>

          </div>
        </form>
      </div>

      {/* Directory Table */}
      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <div className="px-6 py-3 bg-gray-100 border-b border-gray-200 font-bold text-gray-700 text-sm">
          Registered Accounts Directory
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs text-left">
            <thead className="bg-hospital-navy text-white">
              <tr>
                <th className="py-2.5 px-4">Code</th>
                <th className="py-2.5 px-4">Company Name</th>
                <th className="py-2.5 px-4">DL/TL No. 1</th>
                <th className="py-2.5 px-4">GSTN</th>
                <th className="py-2.5 px-4">Phone</th>
                <th className="py-2.5 px-4">City</th>
                <th className="py-2.5 px-4">Mode</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {suppliers.map(sup => (
                <tr key={sup.id} className="hover:bg-blue-50">
                  <td className="py-2.5 px-4 font-semibold text-gray-500">{sup.ac_code}</td>
                  <td className="py-2.5 px-4 font-bold text-hospital-navy">{sup.name}</td>
                  <td className="py-2.5 px-4">{sup.dl_no_1 || '-'}</td>
                  <td className="py-2.5 px-4 font-mono">{sup.gst_number || 'Un-Registered'}</td>
                  <td className="py-2.5 px-4">{sup.phone}</td>
                  <td className="py-2.5 px-4">{sup.city}</td>
                  <td className="py-2.5 px-4">
                    <span className="bg-teal-50 text-hospital-teal border border-teal-200 px-2 py-0.5 rounded">{sup.payment_mode}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}