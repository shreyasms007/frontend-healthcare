import { useState, useEffect } from 'react'
import { API_BASE } from '../config.js';

export default function SupplierPayments() {
  const [suppliers, setSuppliers] = useState([])
  const [unsettledBills, setUnsettledBills] = useState([])
  const [settledBills, setSettledBills] = useState([])
  const [selectedIds, setSelectedIds] = useState({})

  const todayStr = new Date().toISOString().split('T')[0]

  const [formData, setFormData] = useState({
    payment_date: todayStr,
    pur_no: '',
    supplier_id: '',
    cash_bank_ac: 'CASH',
    cheque_no: '',
    cheque_date: '',
    reconciliation_date: '',
    is_advance: false,
    tds_pct: 0,
    tds_amount: 0,
    total_cheque_cash: 0,
    remark: ''
  })

  useEffect(() => { fetchSuppliers() }, [])

  const fetchSuppliers = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/suppliers`)
      const data = await res.json()
      setSuppliers(data || [])
    } catch (err) { console.error(err) }
  }

  const handleSupplierChange = async (supplierId) => {
    setFormData({ ...formData, supplier_id: supplierId })
    setSelectedIds({}) // Reset selected bills when supplier changes
    
    if (!supplierId) {
      setUnsettledBills([])
      setSettledBills([])
      return
    }
    
    try {
      const res = await fetch(`${API_BASE}/api/purchases?supplier_id=${supplierId}`)
      
      if (res.ok) {
        let allBills = await res.json()
        
        // Handle variations in backend response wrapping
        if (allBills && !Array.isArray(allBills)) {
          allBills = allBills.data || allBills.records || []
        }

        if (Array.isArray(allBills)) {
          // Find the supplier name to do a fallback text match
          const selectedSup = suppliers.find(s => String(s.id) === String(supplierId));
          const sName = selectedSup ? selectedSup.name : '';

          // Match by ID OR Name
          const supplierBills = allBills.filter(b => 
            String(b.supplier_id) === String(supplierId) || 
            (b.supplier_name && b.supplier_name === sName)
          );

          // We ignore balance_amount > 0 constraint here in case backend saves it as 0 initially
          setUnsettledBills(supplierBills.filter(b => !b.is_settled))
          setSettledBills(supplierBills.filter(b => b.is_settled))
        }
      }
    } catch (err) { 
      console.error("Failed to fetch purchases for supplier:", err) 
    }
  }

  // Toggle selection and show input for editing amounts
  const toggleBillSelection = (bill, isChecked) => {
    setSelectedIds(prev => {
      const next = { ...prev }
      if (!isChecked) {
        delete next[bill.id]
      } else {
        // Fallback to net_amount if balance_amount is 0
        const bal = (bill.balance_amount > 0 ? bill.balance_amount : bill.net_amount) || 0;
        next[bill.id] = parseFloat(bal)
      }
      return next
    })
  }

  // Update the exact amount being paid for a specific bill
  const handleAmountChange = (billId, val) => {
    setSelectedIds(prev => ({
      ...prev,
      [billId]: val === '' ? '' : (parseFloat(val) || 0)
    }))
  }

  const totalSelectedBillAmt = Object.values(selectedIds).reduce((sum, val) => sum + (parseFloat(val) || 0), 0)
  
  const totalUnsettledSum = unsettledBills.reduce((sum, b) => {
    const bal = (b.balance_amount > 0 ? b.balance_amount : b.net_amount) || 0;
    return sum + bal;
  }, 0)
  
  const totalSettledSum = settledBills.reduce((sum, b) => sum + (b.paid_amount || 0), 0)
  const diffAmount = (parseFloat(formData.total_cheque_cash) || 0) - totalSelectedBillAmt

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.supplier_id) return alert('Select a Supplier first')

    const allocations = Object.entries(selectedIds).map(([invId, amt]) => ({
      purchase_invoice_id: parseInt(invId),
      allocated_amount: parseFloat(amt),
      note: formData.remark
    }))

    const payload = {
      ...formData,
      supplier_id: parseInt(formData.supplier_id),
      tds_pct: parseFloat(formData.tds_pct) || 0,
      tds_amount: parseFloat(formData.tds_amount) || 0,
      total_cheque_cash: parseFloat(formData.total_cheque_cash) || totalSelectedBillAmt,
      total_bill_amount: totalSelectedBillAmt,
      settled_bills: allocations
    }

    try {
     const res = await fetch(`${API_BASE}/api/supplier-payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (res.ok) {
        alert('Supplier Payment & Bill Settlement Recorded!')
        handleSupplierChange(formData.supplier_id)
      } else {
        alert('Failed to record payment')
      }
    } catch (err) { console.error(err) }
  }

  // Bind F10 key to submit
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'F10') {
        e.preventDefault()
        const formEl = document.getElementById('supplier-payment-form')
        if (formEl) formEl.requestSubmit()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden text-xs">
      
      {/* Top Banner */}
      <div className="bg-[#0B162C] px-6 py-4 flex justify-between items-center text-white border-b border-[#1A2C4E]">
        <h3 className="text-lg font-extrabold uppercase tracking-widest m-0">Supplier Payment — Bill Settlement</h3>
        <span className="bg-teal-500/15 text-teal-300 border border-teal-400/30 px-3 py-1 rounded-md text-xs font-bold shadow-inner">Ledger Allocation</span>
      </div>

      <form id="supplier-payment-form" onSubmit={handleSubmit} className="p-6 space-y-6 bg-slate-50">
        
        {/* Upper Control Grid */}
        <div className="grid grid-cols-12 gap-6 bg-white p-6 rounded-xl border border-slate-200 shadow-sm transition-shadow hover:shadow-md">
          
          {/* Left 8 Cols */}
          <div className="col-span-8 space-y-5 border-r border-slate-200 pr-8">
            <div className="grid grid-cols-4 gap-4 items-center">
              <label className="font-bold text-slate-500 uppercase tracking-wider text-xs">Payment Date</label>
              <input type="date" value={formData.payment_date} onChange={(e) => setFormData({...formData, payment_date: e.target.value})} className="border border-slate-300 p-2.5 rounded-lg w-full focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all font-mono" required />
              <label className="font-bold text-slate-500 uppercase tracking-wider text-xs text-right pr-2">Pur No.</label>
              <input type="text" value={formData.pur_no} onChange={(e) => setFormData({...formData, pur_no: e.target.value})} className="border border-slate-300 p-2.5 rounded-lg w-full focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all font-mono" />
            </div>

            <div className="grid grid-cols-12 gap-4 items-center">
              <label className="col-span-2 font-bold text-[#0B162C] uppercase tracking-wider text-xs">Supplier</label>
              <select value={formData.supplier_id} onChange={(e) => handleSupplierChange(e.target.value)} className="col-span-6 border border-slate-300 p-2.5 rounded-lg w-full focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all font-bold text-[#0B162C]" required>
                <option value="">-- Select Supplier --</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <div className="col-span-4 bg-[#0B162C] text-amber-400 font-mono font-bold px-4 py-2.5 rounded-lg text-right shadow-inner border border-[#1A2C4E]">
                {totalUnsettledSum.toFixed(2)} Cr
              </div>
            </div>

            <div className="grid grid-cols-12 gap-4 items-center">
              <label className="col-span-2 font-bold text-slate-500 uppercase tracking-wider text-xs">Cash / Bank</label>
              <select value={formData.cash_bank_ac} onChange={(e) => setFormData({...formData, cash_bank_ac: e.target.value})} className="col-span-6 border border-slate-300 p-2.5 rounded-lg w-full focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all font-semibold text-slate-700">
                <option value="CASH">CASH</option>
                <option value="STATE BANK OF INDIA">STATE BANK OF INDIA</option>
                <option value="HDFC BANK A/C">HDFC BANK A/C</option>
                <option value="NEFT / RTGS / UPI">NEFT / RTGS / UPI</option>
              </select>
              <div className="col-span-4 bg-[#0B162C] text-teal-300 font-mono font-bold px-4 py-2.5 rounded-lg text-right shadow-inner border border-[#1A2C4E]">
                {totalSettledSum.toFixed(2)} Dr
              </div>
            </div>

            <div className="grid grid-cols-3 gap-5 pt-2">
              <div>
                <label className="block text-slate-500 font-bold uppercase tracking-wider text-xs mb-1.5">Cheque / UTR No.</label>
                <input type="text" value={formData.cheque_no} onChange={(e) => setFormData({...formData, cheque_no: e.target.value})} className="border border-slate-300 p-2.5 rounded-lg w-full focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all font-mono" />
              </div>
              <div>
                <label className="block text-slate-500 font-bold uppercase tracking-wider text-xs mb-1.5">Chq Date</label>
                <input type="date" value={formData.cheque_date} onChange={(e) => setFormData({...formData, cheque_date: e.target.value})} className="border border-slate-300 p-2.5 rounded-lg w-full focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all font-mono" />
              </div>
              <div>
                <label className="block text-slate-500 font-bold uppercase tracking-wider text-xs mb-1.5">Reconciliation Dt</label>
                <input type="date" value={formData.reconciliation_date} onChange={(e) => setFormData({...formData, reconciliation_date: e.target.value})} className="border border-slate-300 p-2.5 rounded-lg w-full focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all font-mono" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-5 items-center">
              <label className="flex items-center gap-2 font-bold text-amber-700 cursor-pointer mt-5 hover:text-amber-800 transition-colors">
                <input type="checkbox" checked={formData.is_advance} onChange={(e) => setFormData({...formData, is_advance: e.target.checked})} className="accent-amber-600 w-4 h-4" />
                ADV / ON A/C
              </label>
              <div>
                <label className="block text-slate-500 font-bold uppercase tracking-wider text-xs mb-1.5">TDS %</label>
                <input type="number" step="0.001" value={formData.tds_pct} onChange={(e) => setFormData({...formData, tds_pct: e.target.value})} className="border border-slate-300 p-2.5 rounded-lg w-full focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all text-right font-mono" />
              </div>
              <div>
                <label className="block text-slate-500 font-bold uppercase tracking-wider text-xs mb-1.5">TDS Amount</label>
                <input type="number" step="0.01" value={formData.tds_amount} onChange={(e) => setFormData({...formData, tds_amount: e.target.value})} className="border border-slate-300 p-2.5 rounded-lg w-full focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all text-right font-mono" />
              </div>
            </div>

            <div>
              <label className="block text-slate-500 font-bold uppercase tracking-wider text-xs mb-1.5">Remark</label>
              <input type="text" value={formData.remark} onChange={(e) => setFormData({...formData, remark: e.target.value})} className="border border-slate-300 p-2.5 rounded-lg w-full focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all bg-slate-50 focus:bg-white" />
            </div>
          </div>

          {/* Right 4 Cols: Total Cheque/Cash vs Total Bill Amount */}
          <div className="col-span-4 flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-100">
                <label className="font-bold text-slate-600 uppercase tracking-wider text-xs">Total Cheque/Cash</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.total_cheque_cash}
                  onChange={(e) => setFormData({...formData, total_cheque_cash: e.target.value})}
                  placeholder={totalSelectedBillAmt.toFixed(2)}
                  className="w-40 border border-slate-300 p-2 rounded-lg bg-white text-right font-bold text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all"
                />
              </div>
              <div className="flex justify-between items-center bg-teal-50/50 p-3 rounded-lg border border-teal-100">
                <label className="font-bold text-teal-800 uppercase tracking-wider text-xs">Total Bill Amount</label>
                <input
                  type="text"
                  value={totalSelectedBillAmt.toFixed(2)}
                  readOnly
                  className="w-40 border border-teal-200 p-2 rounded-lg bg-white text-right font-extrabold text-teal-800 text-sm shadow-sm"
                />
              </div>
            </div>

            <div className="bg-[#0B162C] text-white p-5 rounded-xl text-right font-mono shadow-inner border border-[#1A2C4E] relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-amber-400"></div>
              <div className="text-[10px] text-slate-400 font-sans font-bold tracking-widest uppercase mb-1">Unallocated / Diff Amount</div>
              <div className="text-2xl font-extrabold text-amber-400 tracking-tight">{diffAmount.toFixed(2)}</div>
            </div>

            <button type="submit" className="bg-[#0B162C] hover:bg-[#152a52] text-white border border-teal-500/40 px-6 py-3.5 rounded-lg font-bold transition-all shadow-md hover:shadow-teal-500/20 flex items-center justify-center w-full gap-2 cursor-pointer">
              <span className="text-teal-400 font-mono">F10</span>
              <span>— Settle Selected Bills</span>
            </button>
          </div>

        </div>

        {/* SPLIT VIEW: SETTLED BILL (Left) vs UNSETTLED BILL LIST (Right) */}
        <div className="grid grid-cols-12 gap-6">
          
          {/* Left: Settled Bills */}
          <div className="col-span-5 bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden flex flex-col">
            <div className="bg-slate-100 text-slate-600 border-b border-slate-200 px-5 py-3 font-bold text-center tracking-wider uppercase text-xs">
              Settled Bills History
            </div>
            <div className="flex-1 overflow-y-auto max-h-72 custom-scrollbar">
              <table className="min-w-full text-left border-collapse">
                <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-wider sticky top-0">
                  <tr>
                    <th className="py-2.5 px-4 font-bold border-b border-slate-200">Doc No</th>
                    <th className="py-2.5 px-4 font-bold border-b border-slate-200">Bill No</th>
                    <th className="py-2.5 px-4 font-bold border-b border-slate-200">Bill Date</th>
                    <th className="py-2.5 px-4 font-bold border-b border-slate-200 text-right">Paid Amt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {settledBills.map(b => (
                    <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-4 font-mono text-slate-400">26 K{b.id}</td>
                      <td className="py-2.5 px-4 font-bold text-slate-700">{b.invoice_number}</td>
                      <td className="py-2.5 px-4 text-slate-500 font-mono">{b.invoice_date}</td>
                      <td className="py-2.5 px-4 text-right font-bold text-emerald-600 font-mono">{b.paid_amount?.toFixed(2)} &rarr;</td>
                    </tr>
                  ))}
                  {settledBills.length === 0 && (
                    <tr><td colSpan="4" className="py-10 text-center text-slate-400 font-medium">No settled bills for this supplier.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex justify-between font-bold items-center">
              <span className="text-slate-600 uppercase tracking-wider text-xs">Settled Total:</span>
              <span className="font-mono text-emerald-600 text-sm bg-emerald-50 px-3 py-1 rounded border border-emerald-100">₹{totalSettledSum.toFixed(2)}</span>
            </div>
          </div>

          {/* Right: Unsettled Bill List */}
          <div className="col-span-7 bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden flex flex-col">
            
            {/* UPDATED DARK THEME HEADER */}
            <div className="bg-[#0B162C] text-teal-300 border-b border-teal-500/30 px-5 py-3 font-bold text-center tracking-wider uppercase text-xs shadow-sm">
              Unsettled Bill List (Check to Settle)
            </div>
            
            <div className="flex-1 overflow-y-auto max-h-72 custom-scrollbar">
              <table className="min-w-full text-left border-collapse">
                <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-wider sticky top-0">
                  <tr>
                    <th className="py-2.5 px-4 font-bold border-b border-slate-200">SrNo</th>
                    <th className="py-2.5 px-4 font-bold border-b border-slate-200">Bill No</th>
                    <th className="py-2.5 px-4 font-bold border-b border-slate-200">Bill Dt</th>
                    <th className="py-2.5 px-4 font-bold border-b border-slate-200 text-right">Total</th>
                    <th className="py-2.5 px-4 font-bold border-b border-slate-200 text-right">Bal Amt</th>
                    <th className="py-2.5 px-4 font-bold border-b border-slate-200 text-right">Pay Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {unsettledBills.map(b => {
                    const isChecked = selectedIds[b.id] !== undefined;
                    // Safely grab the balance to display
                    const bal = (b.balance_amount > 0 ? b.balance_amount : b.net_amount) || 0;
                    
                    return (
                      <tr key={b.id} className={isChecked ? 'bg-teal-50/50' : 'hover:bg-slate-50 transition-colors'}>
                        <td className="py-2.5 px-4 font-mono text-slate-400">26 K{b.id}</td>
                        <td className="py-2.5 px-4 font-extrabold text-[#0B162C]">{b.invoice_number}</td>
                        <td className="py-2.5 px-4 text-slate-500 font-mono">{b.invoice_date}</td>
                        <td className="py-2.5 px-4 text-right font-mono text-slate-600 font-medium">{b.net_amount?.toFixed(2)}</td>
                        <td className="py-2.5 px-4 text-right font-mono font-bold text-rose-600">{bal.toFixed(2)}</td>
                        
                        {/* UPDATED EDITABLE AMOUNT COLUMN */}
                        <td className="py-2.5 px-4">
                          <div className="flex items-center justify-end gap-3">
                            {isChecked && (
                              <input
                                type="number"
                                step="0.01"
                                value={selectedIds[b.id]}
                                onChange={(e) => handleAmountChange(b.id, e.target.value)}
                                className="w-24 border border-teal-500 p-1 rounded-md text-right font-bold text-[#0B162C] shadow-sm focus:ring-2 focus:ring-teal-500/30 outline-none"
                              />
                            )}
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => toggleBillSelection(b, e.target.checked)}
                              className="w-5 h-5 accent-teal-600 cursor-pointer shadow-sm"
                            />
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                  {unsettledBills.length === 0 && (
                    <tr><td colSpan="6" className="py-10 text-center text-slate-400 font-medium">No unsettled bills pending.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex justify-between font-bold items-center">
              <span className="text-slate-600 uppercase tracking-wider text-xs">Total Unsettled Payable:</span>
              <span className="font-mono text-rose-600 text-sm bg-rose-50 px-3 py-1 rounded border border-rose-100">₹{totalUnsettledSum.toFixed(2)}</span>
            </div>
          </div>

        </div>

      </form>
    </div>
  )
}