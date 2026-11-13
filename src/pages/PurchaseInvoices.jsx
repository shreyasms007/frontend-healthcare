import { useState, useEffect } from 'react'
import { API_BASE } from '../config.js';

export default function PurchaseInvoices() {
  const [purchases, setPurchases] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [medicines, setMedicines] = useState([])

  // Modal states for New Medicine (Exactly matching MedicineMaster schema)
  const [showMedModal, setShowMedModal] = useState(false);
  const [activeRowIndex, setActiveRowIndex] = useState(null);
  const emptyMedForm = {
    name: '',
    manufacturer: '',
    brand_name: '',
    major_content: '',
    packing: '',
    qty_per_pack: 1,
    group: '',
    item_category: '',
    profile_category: '',
    schedule: '',
    barcode: '',
    rack: '',
    hsn_code: '',
    gst_pct: 0,
    cess_pct: 0,
    wholesale_rate: 0,
    min_qty: 0,
    max_qty: 0,
    requires_license: false,
    is_active: true,
    note: ''
  };
  const [newMedForm, setNewMedForm] = useState({ ...emptyMedForm });

  const todayStr = new Date().toISOString().split('T')[0]

  const emptyItem = {
    medicine_id: '', batch_number: '', expiry_date: todayStr,
    qty: 1, free_qty: 0, dis_pct: 0, gst_code: '12%', tax_pct: 12,
    tax_amt: 0, mrp: '', old_mrp: 0, purchase_rate: '', ptr: 0,
    sale_rate: '', qpk: 1, amount: 0
  }

  const [formData, setFormData] = useState({
    supplier_id: '',
    invoice_number: '',
    invoice_date: todayStr,
    bill_type: 'TAX',
    state_code: '29',
    due_days: 30,
    eway_bill_no: '',
    lr_no: '',
    freight: 0,
    subtotal: 0,
    net_tax: 0,
    net_amount: 0,
    items: [{ ...emptyItem }]
  })

  useEffect(() => {
    fetchPurchases()
    fetchSuppliers()
    fetchMedicines()
  }, [])

  const fetchPurchases = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/purchases`)
      const data = await res.json()
      setPurchases(data || [])
    } catch (err) { console.error(err) }
  }

  const fetchSuppliers = async () => {
    try {
     const res = await fetch(`${API_BASE}/api/suppliers`)
      const data = await res.json()
      setSuppliers(data || [])
    } catch (err) { console.error(err) }
  }

  const fetchMedicines = async () => {
    try {
     const res = await fetch(`${API_BASE}/api/medicines`)
      const data = await res.json()
      setMedicines(data || [])
    } catch (err) { console.error(err) }
  }

  const recalculateTotals = (itemsList, freightVal = formData.freight) => {
    let sub = 0
    let taxTotal = 0

    const updatedItems = itemsList.map(item => {
      const q = parseFloat(item.qty) || 0
      const pr = parseFloat(item.purchase_rate) || 0
      const disc = parseFloat(item.dis_pct) || 0
      const taxP = parseFloat(item.tax_pct) || 0

      const base = q * pr
      const afterDisc = base - (base * (disc / 100))
      const tAmt = afterDisc * (taxP / 100)
      const rowTotal = afterDisc + tAmt

      sub += afterDisc
      taxTotal += tAmt

      return {
        ...item,
        tax_amt: parseFloat(tAmt.toFixed(2)),
        amount: parseFloat(rowTotal.toFixed(2))
      }
    })

    const grandTotal = Math.round(sub + taxTotal + (parseFloat(freightVal) || 0))
    setFormData(prev => ({
      ...prev,
      items: updatedItems,
      subtotal: parseFloat(sub.toFixed(2)),
      net_tax: parseFloat(taxTotal.toFixed(2)),
      net_amount: grandTotal
    }))
  }

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items]
    newItems[index][field] = value
    recalculateTotals(newItems)
  }

  const addItemRow = () => {
    setFormData(prev => ({ ...prev, items: [...prev.items, { ...emptyItem }] }))
  }

  const formatForBackend = (dateStr) => {
    if (!dateStr || dateStr.trim() === '') return null
    const parts = dateStr.split('-')
    if (parts[0].length === 4) return dateStr
    const [day, month, year] = parts
    return `${year}-${month}-${day}`
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const payload = {
      supplier_id: parseInt(formData.supplier_id),
      invoice_number: formData.invoice_number,
      invoice_date: formatForBackend(formData.invoice_date),
      net_amount: parseFloat(formData.net_amount) || 0,
      items: formData.items.map(item => ({
        medicine_id: parseInt(item.medicine_id),
        batch_number: item.batch_number,
        expiry_date: formatForBackend(item.expiry_date),
        qty: parseInt(item.qty) || 0,
        free_qty: parseInt(item.free_qty) || 0,
        mrp: parseFloat(item.mrp) || 0,
        purchase_rate: parseFloat(item.purchase_rate) || 0,
        sale_rate: parseFloat(item.sale_rate) || parseFloat(item.mrp) || 0,
        amount: parseFloat(item.amount) || 0
      }))
    }

    try {
     const res = await fetch(`${API_BASE}/api/purchases`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (res.ok) {
        setFormData({
          ...formData,
          invoice_number: '',
          subtotal: 0, net_tax: 0, net_amount: 0,
          items: [{ ...emptyItem }]
        })
        fetchPurchases()
        alert('GST Purchase Invoice Saved!')
      } else {
        alert('Failed to save Purchase Invoice')
      }
    } catch (err) { console.error(err) }
  }

  // Handle Modal Save (Perfectly matches MedicineMaster.jsx payload parsing)
  const handleSaveNewMedicine = async () => {
    if (!newMedForm.name.trim()) {
      alert("Medicine name is required.");
      return;
    }

    const payload = {
      ...newMedForm,
      qty_per_pack: parseInt(newMedForm.qty_per_pack, 10) || 1,
      gst_pct: parseFloat(newMedForm.gst_pct) || 0,
      cess_pct: parseFloat(newMedForm.cess_pct) || 0,
      wholesale_rate: parseFloat(newMedForm.wholesale_rate) || 0,
      min_qty: parseInt(newMedForm.min_qty, 10) || 0,
      max_qty: parseInt(newMedForm.max_qty, 10) || 0
    }

    try {
      const res = await fetch(`${API_BASE}/api/medicines`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        // Fetch updated medicines to get the new ID
        const fetchRes = await fetch(`${API_BASE}/api/medicines`);
        const updatedMedicines = await fetchRes.json();
        setMedicines(updatedMedicines || []);

        const newlyAdded = updatedMedicines.find(m => m.name.toUpperCase() === newMedForm.name.toUpperCase());

        // Auto-select the newly added medicine in the row
        if (newlyAdded && activeRowIndex !== null) {
          handleItemChange(activeRowIndex, 'medicine_id', newlyAdded.id);
        }

        setShowMedModal(false);
        setNewMedForm({ ...emptyMedForm });
        setActiveRowIndex(null);
      } else {
        alert("Failed to add medicine: " + await res.text());
      }
    } catch (error) {
      console.error(error);
      alert("An error occurred while saving the medicine.");
    }
  };

  return (
    <div className="space-y-6 relative">
      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden text-xs">
        
        <form onSubmit={handleSubmit}>
          <div className="bg-slate-100 p-4 border-b border-gray-300 grid grid-cols-12 gap-4 items-center">
            
            {/* Left Info: Supplier & Bill No */}
            <div className="col-span-5 space-y-2 border-r border-gray-300 pr-4">
              <div className="flex items-center justify-between">
                <span className="text-base font-extrabold text-hospital-navy">PURCHASE (GST)</span>
                <span className="bg-hospital-teal text-white px-2 py-0.5 rounded text-[10px] font-bold">State Code: {formData.state_code}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="block text-gray-500 font-semibold">Supplier A/c *</label>
                  <select value={formData.supplier_id} onChange={(e) => setFormData({...formData, supplier_id: e.target.value})} className="w-full border border-gray-300 p-1.5 rounded bg-white font-bold text-hospital-navy" required>
                    <option value="">-- Select Supplier --</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-500 font-semibold">Bill Type</label>
                  <select value={formData.bill_type} onChange={(e) => setFormData({...formData, bill_type: e.target.value})} className="w-full border border-gray-300 p-1.5 rounded bg-white font-semibold">
                    <option value="TAX">TAX</option>
                    <option value="RETAIL">RETAIL</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-500 font-semibold">Bill No. (Invoice #) *</label>
                  <input type="text" value={formData.invoice_number} onChange={(e) => setFormData({...formData, invoice_number: e.target.value})} className="w-full border border-gray-300 p-1.5 rounded bg-white font-bold" required />
                </div>
                <div>
                  <label className="block text-gray-500 font-semibold">Bill Date *</label>
                  <input type="date" value={formData.invoice_date} onChange={(e) => setFormData({...formData, invoice_date: e.target.value})} className="w-full border border-gray-300 p-1.5 rounded bg-white" required />
                </div>
              </div>
            </div>

            {/* Middle Info: E-Way Bill, Due Days, Tax */}
            <div className="col-span-4 space-y-2 border-r border-gray-300 pr-4">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-500">Due Days</label>
                  <input type="number" value={formData.due_days} onChange={(e) => setFormData({...formData, due_days: e.target.value})} className="w-full border border-gray-300 p-1 rounded bg-white" />
                </div>
                <div>
                  <label className="block text-gray-500">Net Tax (₹)</label>
                  <input type="text" value={formData.net_tax.toFixed(2)} readOnly className="w-full border border-gray-300 p-1 rounded bg-gray-100 font-bold text-right" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-500">E-Way Bill No.</label>
                  <input type="text" value={formData.eway_bill_no} onChange={(e) => setFormData({...formData, eway_bill_no: e.target.value})} className="w-full border border-gray-300 p-1 rounded bg-white" />
                </div>
                <div>
                  <label className="block text-gray-500">LR No. / Transport</label>
                  <input type="text" value={formData.lr_no} onChange={(e) => setFormData({...formData, lr_no: e.target.value})} className="w-full border border-gray-300 p-1 rounded bg-white" />
                </div>
              </div>
            </div>

            {/* Right Box: Pharmsoft Black Digital Net Amount Display */}
            <div className="col-span-3 flex flex-col justify-between bg-gray-900 text-white p-3 rounded shadow-inner">
              <div className="flex justify-between text-[11px] text-gray-400">
                <span>Calc Total:</span>
                <span className="text-amber-400 font-mono">{(formData.subtotal + formData.net_tax).toFixed(2)}</span>
              </div>
              <div className="my-1 flex items-baseline justify-between border-y border-gray-700 py-1.5">
                <span className="text-xl font-bold text-teal-400">₹</span>
                <span className="text-3xl font-extrabold font-mono tracking-tight text-white">
                  {formData.net_amount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-[10px] text-gray-400">
                <span>Total Items: {formData.items.length}</span>
                <span>Rounded Off</span>
              </div>
            </div>
          </div>

          {/* LINE ITEMS GRID */}
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead className="bg-hospital-navy text-white text-[11px]">
                <tr>
                  <th className="py-2 px-2 text-left w-48">Item Name</th>
                  <th className="py-2 px-1.5 text-left w-24">Batch</th>
                  <th className="py-2 px-1.5 text-left w-28">Expiry</th>
                  <th className="py-2 px-1.5 text-right w-14">Qty</th>
                  <th className="py-2 px-1.5 text-right w-14">Sch</th>
                  <th className="py-2 px-1.5 text-right w-14">Dis%</th>
                  <th className="py-2 px-1.5 text-right w-14">Tax%</th>
                  <th className="py-2 px-1.5 text-right w-20 bg-amber-600">MRP</th>
                  <th className="py-2 px-1.5 text-right w-20">Pur Rt</th>
                  <th className="py-2 px-1.5 text-right w-20">PTR</th>
                  <th className="py-2 px-1.5 text-right w-20">Sale Rt</th>
                  <th className="py-2 px-1.5 text-right w-14">Qpk</th>
                  <th className="py-2 px-2 text-right w-24">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-teal-50/20">
                {formData.items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-blue-50/50">
                    <td className="p-1.5">
                      <select 
                        value={item.medicine_id} 
                        onChange={(e) => {
                          if (e.target.value === 'ADD_NEW') {
                            setActiveRowIndex(idx);
                            setShowMedModal(true);
                          } else {
                            handleItemChange(idx, 'medicine_id', e.target.value);
                          }
                        }} 
                        className="w-full border border-gray-300 p-1 rounded bg-white font-semibold" 
                        required
                      >
                        <option value="">Select Medicine</option>
                        {medicines.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                        <option value="ADD_NEW" className="font-bold text-hospital-teal bg-teal-50">
                          + Add New Medicine...
                        </option>
                      </select>
                    </td>
                    <td className="p-1"><input value={item.batch_number} onChange={(e) => handleItemChange(idx, 'batch_number', e.target.value)} className="w-full border border-gray-300 p-1 rounded uppercase" required /></td>
                    <td className="p-1"><input type="date" value={item.expiry_date} onChange={(e) => handleItemChange(idx, 'expiry_date', e.target.value)} className="w-full border border-gray-300 p-1 rounded" required /></td>
                    <td className="p-1"><input type="number" value={item.qty} onChange={(e) => handleItemChange(idx, 'qty', e.target.value)} className="w-full border border-gray-300 p-1 rounded text-right font-bold" required /></td>
                    <td className="p-1"><input type="number" value={item.free_qty} onChange={(e) => handleItemChange(idx, 'free_qty', e.target.value)} className="w-full border border-gray-300 p-1 rounded text-right" /></td>
                    <td className="p-1"><input type="number" step="0.1" value={item.dis_pct} onChange={(e) => handleItemChange(idx, 'dis_pct', e.target.value)} className="w-full border border-gray-300 p-1 rounded text-right" /></td>
                    <td className="p-1"><input type="number" value={item.tax_pct} onChange={(e) => handleItemChange(idx, 'tax_pct', e.target.value)} className="w-full border border-gray-300 p-1 rounded text-right" /></td>
                    <td className="p-1"><input type="number" step="0.01" value={item.mrp} onChange={(e) => handleItemChange(idx, 'mrp', e.target.value)} className="w-full border border-amber-400 p-1 rounded text-right font-bold bg-amber-50/40" required /></td>
                    <td className="p-1"><input type="number" step="0.01" value={item.purchase_rate} onChange={(e) => handleItemChange(idx, 'purchase_rate', e.target.value)} className="w-full border border-gray-300 p-1 rounded text-right font-bold" required /></td>
                    <td className="p-1"><input type="number" step="0.01" value={item.ptr} onChange={(e) => handleItemChange(idx, 'ptr', e.target.value)} className="w-full border border-gray-300 p-1 rounded text-right" /></td>
                    <td className="p-1"><input type="number" step="0.01" value={item.sale_rate} onChange={(e) => handleItemChange(idx, 'sale_rate', e.target.value)} className="w-full border border-gray-300 p-1 rounded text-right" required /></td>
                    <td className="p-1"><input type="number" value={item.qpk} onChange={(e) => handleItemChange(idx, 'qpk', e.target.value)} className="w-full border border-gray-300 p-1 rounded text-right" /></td>
                    <td className="p-1.5 text-right font-bold text-hospital-navy font-mono">₹{item.amount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* BOTTOM SUMMARY BAR */}
          <div className="bg-slate-100 p-4 border-t border-gray-300 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button type="button" onClick={addItemRow} className="bg-hospital-navy text-white px-4 py-2 rounded font-bold hover:bg-blue-900">
                + Add Row
              </button>
              <div className="flex gap-4 text-gray-600 bg-white px-4 py-1.5 rounded border border-gray-200">
                <span>Subtotal: <strong>₹{formData.subtotal.toFixed(2)}</strong></span>
                <span>GST Tax: <strong>₹{formData.net_tax.toFixed(2)}</strong></span>
              </div>
            </div>
            <button type="submit" className="bg-hospital-teal text-white px-8 py-2.5 rounded font-bold hover:bg-teal-700 shadow">
              F10 — Save Purchase Bill
            </button>
          </div>
        </form>
      </div>

      {/* Purchase History Table */}
      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden text-xs">
        <div className="px-6 py-3 bg-gray-100 border-b border-gray-200 font-bold text-gray-800">
          Recent Purchase Invoices
        </div>
        <table className="min-w-full text-left">
          <thead className="bg-hospital-navy text-white">
            <tr>
              <th className="py-2.5 px-4">Invoice #</th>
              <th className="py-2.5 px-4">Supplier</th>
              <th className="py-2.5 px-4">Bill Date</th>
              <th className="py-2.5 px-4">Net Amount</th>
              <th className="py-2.5 px-4">Balance Due</th>
              <th className="py-2.5 px-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {purchases.map(p => (
              <tr key={p.id} className="hover:bg-blue-50">
                <td className="py-2.5 px-4 font-bold text-hospital-navy">{p.invoice_number}</td>
                <td className="py-2.5 px-4 font-medium">{p.supplier_name}</td>
                <td className="py-2.5 px-4">{p.invoice_date}</td>
                <td className="py-2.5 px-4 font-bold">₹{p.net_amount?.toFixed(2)}</td>
                <td className="py-2.5 px-4 font-bold text-red-600">₹{p.balance_amount?.toFixed(2)}</td>
                <td className="py-2.5 px-4">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${p.is_settled ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-800'}`}>
                    {p.is_settled ? 'SETTLED' : 'UNSETTLED'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* EXPANDED ADD NEW MEDICINE MODAL */}
      {showMedModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden text-sm">
            <div className="bg-hospital-teal text-white px-6 py-4 font-bold flex justify-between items-center shrink-0">
              <span className="text-lg">+ Create Item Master (Quick Add)</span>
              <button onClick={() => setShowMedModal(false)} className="text-white hover:text-gray-200 font-bold text-2xl">&times;</button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="font-bold text-gray-700 border-b pb-1">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Item Name *</label>
                    <input type="text" value={newMedForm.name} onChange={e => setNewMedForm({...newMedForm, name: e.target.value.toUpperCase()})} className="w-full border p-2 rounded focus:ring-hospital-teal" autoFocus required />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Manufacturer</label>
                    <input type="text" value={newMedForm.manufacturer} onChange={e => setNewMedForm({...newMedForm, manufacturer: e.target.value})} className="w-full border p-2 rounded" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Brand Name</label>
                    <input type="text" value={newMedForm.brand_name} onChange={e => setNewMedForm({...newMedForm, brand_name: e.target.value})} className="w-full border p-2 rounded" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Major Content (Composition)</label>
                  <input type="text" value={newMedForm.major_content} onChange={e => setNewMedForm({...newMedForm, major_content: e.target.value})} className="w-full border p-2 rounded" />
                </div>
              </div>

              {/* Categorization & Packaging */}
              <div className="space-y-4">
                <h3 className="font-bold text-gray-700 border-b pb-1">Categorization & Packaging</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Packing (e.g., 10x10)</label>
                    <input type="text" value={newMedForm.packing} onChange={e => setNewMedForm({...newMedForm, packing: e.target.value})} className="w-full border p-2 rounded" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Qty / Pack</label>
                    <input type="number" value={newMedForm.qty_per_pack} onChange={e => setNewMedForm({...newMedForm, qty_per_pack: e.target.value})} className="w-full border p-2 rounded text-right" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Group (Category)</label>
                    <input type="text" placeholder="e.g. TABLETS" value={newMedForm.group} onChange={e => setNewMedForm({...newMedForm, group: e.target.value.toUpperCase()})} className="w-full border p-2 rounded" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Schedule</label>
                    <input type="text" placeholder="e.g. SCHEDULE H1" value={newMedForm.schedule} onChange={e => setNewMedForm({...newMedForm, schedule: e.target.value.toUpperCase()})} className="w-full border p-2 rounded" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Item Category</label>
                    <input type="text" value={newMedForm.item_category} onChange={e => setNewMedForm({...newMedForm, item_category: e.target.value})} className="w-full border p-2 rounded" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Profile Category</label>
                    <input type="text" value={newMedForm.profile_category} onChange={e => setNewMedForm({...newMedForm, profile_category: e.target.value})} className="w-full border p-2 rounded" />
                  </div>
                </div>
              </div>

              {/* Inventory & Location */}
              <div className="space-y-4">
                <h3 className="font-bold text-gray-700 border-b pb-1">Inventory & Location</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Rack / Shelf</label>
                    <input type="text" value={newMedForm.rack} onChange={e => setNewMedForm({...newMedForm, rack: e.target.value.toUpperCase()})} className="w-full border p-2 rounded" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Barcode</label>
                    <input type="text" value={newMedForm.barcode} onChange={e => setNewMedForm({...newMedForm, barcode: e.target.value})} className="w-full border p-2 rounded" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Min Qty Alert</label>
                    <input type="number" value={newMedForm.min_qty} onChange={e => setNewMedForm({...newMedForm, min_qty: e.target.value})} className="w-full border p-2 rounded text-right" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Max Qty Limit</label>
                    <input type="number" value={newMedForm.max_qty} onChange={e => setNewMedForm({...newMedForm, max_qty: e.target.value})} className="w-full border p-2 rounded text-right" />
                  </div>
                </div>
              </div>

              {/* Tax & Compliance */}
              <div className="space-y-4">
                <h3 className="font-bold text-gray-700 border-b pb-1">Tax & Compliance</h3>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">HSN/SAC Code</label>
                    <input type="text" value={newMedForm.hsn_code} onChange={e => setNewMedForm({...newMedForm, hsn_code: e.target.value})} className="w-full border p-2 rounded" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">GST %</label>
                    <input type="number" step="0.01" value={newMedForm.gst_pct} onChange={e => setNewMedForm({...newMedForm, gst_pct: e.target.value})} className="w-full border p-2 rounded text-right" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">CESS %</label>
                    <input type="number" step="0.01" value={newMedForm.cess_pct} onChange={e => setNewMedForm({...newMedForm, cess_pct: e.target.value})} className="w-full border p-2 rounded text-right" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Wholesale Rate</label>
                    <input type="number" step="0.01" value={newMedForm.wholesale_rate} onChange={e => setNewMedForm({...newMedForm, wholesale_rate: e.target.value})} className="w-full border p-2 rounded text-right" />
                  </div>
                  <div className="flex flex-col gap-2 mt-4 ml-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={newMedForm.requires_license} onChange={e => setNewMedForm({...newMedForm, requires_license: e.target.checked})} className="accent-hospital-teal" />
                      <span className="text-xs text-gray-600">Requires Licence</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={newMedForm.is_active} onChange={e => setNewMedForm({...newMedForm, is_active: e.target.checked})} className="accent-hospital-teal" />
                      <span className="text-xs text-gray-600">Active Item</span>
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Internal Note</label>
                  <textarea value={newMedForm.note} onChange={e => setNewMedForm({...newMedForm, note: e.target.value})} className="w-full border p-2 rounded h-12 resize-none" />
                </div>
              </div>

            </div>

            <div className="bg-gray-50 px-6 py-4 border-t flex justify-end gap-3 shrink-0">
              <button onClick={() => setShowMedModal(false)} className="px-6 py-2.5 border border-gray-300 rounded text-gray-700 font-bold hover:bg-gray-200 transition">
                Cancel
              </button>
              <button onClick={handleSaveNewMedicine} className="px-6 py-2.5 bg-hospital-teal text-white rounded font-bold hover:bg-teal-700 shadow transition">
                Save Medicine Master
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}