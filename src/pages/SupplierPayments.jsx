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
    setSelectedIds({})
    if (!supplierId) {
      setUnsettledBills([])
      setSettledBills([])
      return
    }
    try {
      const res = await fetch(`${API_BASE}/api/purchases?supplier_id=${supplierId}`)
      const allBills = (await res.json()) || []
      setUnsettledBills(allBills.filter(b => !b.is_settled && b.balance_amount > 0))
      setSettledBills(allBills.filter(b => b.is_settled || b.paid_amount > 0))
    } catch (err) { console.error(err) }
  }

  const toggleBillSelection = (bill) => {
    setSelectedIds(prev => {
      const next = { ...prev }
      if (next[bill.id]) {
        delete next[bill.id]
      } else {
        next[bill.id] = bill.balance_amount
      }
      return next
    })
  }

  const totalSelectedBillAmt = Object.values(selectedIds).reduce((sum, val) => sum + (parseFloat(val) || 0), 0)
  const totalUnsettledSum = unsettledBills.reduce((sum, b) => sum + (b.balance_amount || 0), 0)
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

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden text-xs">
      
      {/* Top Banner */}
      <div className="bg-hospital-navy px-6 py-3 flex justify-between items-center text-white">
        <h3 className="text-base font-bold tracking-wide">Supplier Payment — Bill Settlement</h3>
        <span className="bg-hospital-teal px-3 py-0.5 rounded text-[11px] font-semibold">Ledger Allocation</span>
      </div>

      <form onSubmit={handleSubmit} className="p-5 space-y-5">
        
        {/* Upper Control Grid */}
        <div className="grid grid-cols-12 gap-6 bg-blue-50/40 p-4 rounded border border-blue-200">
          
          {/* Left 8 Cols: Supplier, Cash/Bank, Cheque Details */}
          <div className="col-span-8 space-y-3 border-r border-blue-200 pr-6">
            <div className="grid grid-cols-4 gap-3 items-center">
              <label className="font-bold text-gray-700">Payment Date</label>
              <input type="date" value={formData.payment_date} onChange={(e) => setFormData({...formData, payment_date: e.target.value})} className="border border-gray-300 p-1.5 rounded bg-white" required />
              <label className="font-bold text-gray-700 text-right pr-2">Pur No.</label>
              <input type="text" value={formData.pur_no} onChange={(e) => setFormData({...formData, pur_no: e.target.value})} className="border border-gray-300 p-1.5 rounded bg-white" />
            </div>

            <div className="grid grid-cols-12 gap-3 items-center">
              <label className="col-span-2 font-bold text-hospital-navy">Supplier</label>
              <select value={formData.supplier_id} onChange={(e) => handleSupplierChange(e.target.value)} className="col-span-6 border border-gray-300 p-1.5 rounded bg-white font-bold text-hospital-navy" required>
                <option value="">-- Select Supplier --</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <div className="col-span-4 bg-gray-900 text-amber-400 font-mono font-bold px-3 py-1.5 rounded text-right">
                {totalUnsettledSum.toFixed(2)} Cr
              </div>
            </div>

            <div className="grid grid-cols-12 gap-3 items-center">
              <label className="col-span-2 font-bold text-gray-700">Cash / Bank</label>
              <select value={formData.cash_bank_ac} onChange={(e) => setFormData({...formData, cash_bank_ac: e.target.value})} className="col-span-6 border border-gray-300 p-1.5 rounded bg-white font-semibold">
                <option value="CASH">CASH</option>
                <option value="STATE BANK OF INDIA">STATE BANK OF INDIA</option>
                <option value="HDFC BANK A/C">HDFC BANK A/C</option>
                <option value="NEFT / RTGS / UPI">NEFT / RTGS / UPI</option>
              </select>
              <div className="col-span-4 bg-gray-900 text-white font-mono font-bold px-3 py-1.5 rounded text-right">
                {totalSettledSum.toFixed(2)} Dr
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-1">
              <div>
                <label className="block text-gray-600 mb-0.5">Cheque / UTR No.</label>
                <input type="text" value={formData.cheque_no} onChange={(e) => setFormData({...formData, cheque_no: e.target.value})} className="w-full border border-gray-300 p-1.5 rounded bg-white" />
              </div>
              <div>
                <label className="block text-gray-600 mb-0.5">Chq Date</label>
                <input type="date" value={formData.cheque_date} onChange={(e) => setFormData({...formData, cheque_date: e.target.value})} className="w-full border border-gray-300 p-1.5 rounded bg-white" />
              </div>
              <div>
                <label className="block text-gray-600 mb-0.5">Reconciliation Dt</label>
                <input type="date" value={formData.reconciliation_date} onChange={(e) => setFormData({...formData, reconciliation_date: e.target.value})} className="w-full border border-gray-300 p-1.5 rounded bg-white" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 items-center">
              <label className="flex items-center gap-1.5 font-bold text-amber-700 cursor-pointer mt-3">
                <input type="checkbox" checked={formData.is_advance} onChange={(e) => setFormData({...formData, is_advance: e.target.checked})} />
                Adv / On A/c
              </label>
              <div>
                <label className="block text-gray-600 mb-0.5">TDS %</label>
                <input type="number" step="0.001" value={formData.tds_pct} onChange={(e) => setFormData({...formData, tds_pct: e.target.value})} className="w-full border border-gray-300 p-1.5 rounded bg-white text-right" />
              </div>
              <div>
                <label className="block text-gray-600 mb-0.5">TDS Amount</label>
                <input type="number" step="0.01" value={formData.tds_amount} onChange={(e) => setFormData({...formData, tds_amount: e.target.value})} className="w-full border border-gray-300 p-1.5 rounded bg-white text-right" />
              </div>
            </div>

            <div>
              <label className="block text-gray-600 mb-0.5">Remark</label>
              <input type="text" value={formData.remark} onChange={(e) => setFormData({...formData, remark: e.target.value})} className="w-full border border-gray-300 p-1.5 rounded bg-white" />
            </div>
          </div>

          {/* Right 4 Cols: Total Cheque/Cash vs Total Bill Amount */}
          <div className="col-span-4 flex flex-col justify-between space-y-3">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="font-bold text-gray-700">Total Cheque/Cash</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.total_cheque_cash}
                  onChange={(e) => setFormData({...formData, total_cheque_cash: e.target.value})}
                  placeholder={totalSelectedBillAmt.toFixed(2)}
                  className="w-36 border border-gray-300 p-1.5 rounded bg-white text-right font-bold"
                />
              </div>
              <div className="flex justify-between items-center">
                <label className="font-bold text-hospital-navy">Total Bill Amount</label>
                <input
                  type="text"
                  value={totalSelectedBillAmt.toFixed(2)}
                  readOnly
                  className="w-36 border border-hospital-teal p-1.5 rounded bg-teal-50 text-right font-extrabold text-hospital-navy"
                />
              </div>
            </div>

            <div className="bg-gray-900 text-white p-3 rounded text-right font-mono">
              <div className="text-[10px] text-gray-400">UNALLOCATED / DIFF AMOUNT</div>
              <div className="text-lg font-bold text-amber-400">{diffAmount.toFixed(2)}</div>
            </div>

            <button type="submit" className="w-full bg-hospital-teal text-white py-2.5 rounded font-bold hover:bg-teal-700 shadow">
              F10 — Settle Selected Bills
            </button>
          </div>

        </div>

        {/* SPLIT VIEW: SETTLED BILL (Left) vs UNSETTLED BILL LIST (Right) */}
        <div className="grid grid-cols-12 gap-4">
          
          {/* Left: Settled Bills */}
          <div className="col-span-5 border border-gray-300 rounded overflow-hidden flex flex-col">
            <div className="bg-hospital-navy text-white px-4 py-2 font-bold text-center">
              Settled Bill
            </div>
            <div className="flex-1 overflow-y-auto max-h-72">
              <table className="min-w-full text-left border-collapse">
                <thead className="bg-gray-200 text-gray-700 text-[11px]">
                  <tr>
                    <th className="py-1.5 px-2">Doc No</th>
                    <th className="py-1.5 px-2">Bill No</th>
                    <th className="py-1.5 px-2">Bill Date</th>
                    <th className="py-1.5 px-2 text-right">Paid Amt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {settledBills.map(b => (
                    <tr key={b.id} className="hover:bg-gray-50">
                      <td className="py-1.5 px-2 font-mono">26 K{b.id}</td>
                      <td className="py-1.5 px-2 font-semibold">{b.invoice_number}</td>
                      <td className="py-1.5 px-2">{b.invoice_date}</td>
                      <td className="py-1.5 px-2 text-right font-bold text-green-700">{b.paid_amount?.toFixed(2)} &rarr;</td>
                    </tr>
                  ))}
                  {settledBills.length === 0 && (
                    <tr><td colSpan="4" className="py-8 text-center text-gray-400">No settled bills for this supplier.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="bg-gray-100 px-3 py-2 border-t border-gray-300 flex justify-between font-bold">
              <span>Settled Total:</span>
              <span className="font-mono text-green-700">₹{totalSettledSum.toFixed(2)}</span>
            </div>
          </div>

          {/* Right: Unsettled Bill List */}
          <div className="col-span-7 border border-gray-300 rounded overflow-hidden flex flex-col">
            <div className="bg-hospital-teal text-white px-4 py-2 font-bold text-center">
              Unsettled Bill List (Check to Settle)
            </div>
            <div className="flex-1 overflow-y-auto max-h-72">
              <table className="min-w-full text-left border-collapse">
                <thead className="bg-gray-200 text-gray-700 text-[11px]">
                  <tr>
                    <th className="py-1.5 px-2">SrNo</th>
                    <th className="py-1.5 px-2">Bill No</th>
                    <th className="py-1.5 px-2">Bill Dt</th>
                    <th className="py-1.5 px-2 text-right">Total</th>
                    <th className="py-1.5 px-2 text-right">Bal Amt</th>
                    <th className="py-1.5 px-2 text-center">Select</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {unsettledBills.map(b => {
                    const isChecked = !!selectedIds[b.id]
                    return (
                      <tr key={b.id} className={isChecked ? 'bg-teal-50 font-semibold' : 'hover:bg-blue-50/40'}>
                        <td className="py-1.5 px-2 font-mono">26 K{b.id}</td>
                        <td className="py-1.5 px-2 font-bold text-hospital-navy">{b.invoice_number}</td>
                        <td className="py-1.5 px-2">{b.invoice_date}</td>
                        <td className="py-1.5 px-2 text-right font-mono">{b.net_amount?.toFixed(2)}</td>
                        <td className="py-1.5 px-2 text-right font-mono font-bold text-red-600">{b.balance_amount?.toFixed(2)}</td>
                        <td className="py-1.5 px-2 text-center">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleBillSelection(b)}
                            className="w-4 h-4 accent-hospital-teal cursor-pointer"
                          />
                        </td>
                      </tr>
                    )
                  })}
                  {unsettledBills.length === 0 && (
                    <tr><td colSpan="6" className="py-8 text-center text-gray-400">No unsettled bills pending.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="bg-gray-100 px-3 py-2 border-t border-gray-300 flex justify-between font-bold">
              <span>Total Unsettled Payable:</span>
              <span className="font-mono text-red-600">₹{totalUnsettledSum.toFixed(2)}</span>
            </div>
          </div>

        </div>

      </form>
    </div>
  )
}