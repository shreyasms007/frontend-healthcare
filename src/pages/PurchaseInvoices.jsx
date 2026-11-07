import { useState, useEffect } from 'react'
import { API_BASE } from '../config.js';

export default function PurchaseInvoices() {
  const [purchases, setPurchases] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [medicines, setMedicines] = useState([])

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

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden text-xs">
        
        {/* TOP HEADER PANEL (Pharmsoft GST Layout) */}
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

          {/* LINE ITEMS GRID (Pharmsoft GST Columns) */}
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
                      <select value={item.medicine_id} onChange={(e) => handleItemChange(idx, 'medicine_id', e.target.value)} className="w-full border border-gray-300 p-1 rounded bg-white font-semibold" required>
                        <option value="">Select Medicine</option>
                        {medicines.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
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
    </div>
  )
}