import { useState, useEffect } from 'react'

export default function PriceMaster() {
  const [batches, setBatches] = useState([])
  const [selectedBatch, setSelectedBatch] = useState(null)

  useEffect(() => { fetchBatches() }, [])

  const fetchBatches = async () => {
    try {
      const res = await fetch('http://localhost:8081/api/price-master')
      const data = await res.json()
      setBatches(data || [])
      if (data && data.length > 0 && !selectedBatch) {
        setSelectedBatch(data[0])
      }
    } catch (err) { console.error(err) }
  }

  const handleSelectBatch = (batchId) => {
    const found = batches.find(b => b.batch_id === parseInt(batchId))
    if (found) setSelectedBatch({ ...found })
  }

  const handleChange = (field, value) => {
    const updated = { ...selectedBatch, [field]: value }

    // Auto-calculate Loose rates when Pack rate or Qty/Pack changes
    const qpk = parseInt(updated.qty_per_pack) || 1
    if (field === 'mrp_pack' || field === 'qty_per_pack') {
      updated.mrp_loose = parseFloat(((parseFloat(updated.mrp_pack) || 0) / qpk).toFixed(3))
    }
    if (field === 'pur_rate_pack' || field === 'qty_per_pack') {
      updated.pur_rate_loose = parseFloat(((parseFloat(updated.pur_rate_pack) || 0) / qpk).toFixed(3))
      updated.eff_pur_rate = updated.pur_rate_loose
    }
    if (field === 'godown_balance' || field === 'store_balance') {
      updated.balance_qty = (parseInt(updated.godown_balance) || 0) + (parseInt(updated.store_balance) || 0)
    }

    setSelectedBatch(updated)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!selectedBatch) return

    const payload = {
      ...selectedBatch,
      qty_per_pack: parseInt(selectedBatch.qty_per_pack) || 1,
      tax_pct: parseFloat(selectedBatch.tax_pct) || 0,
      cess_pct: parseFloat(selectedBatch.cess_pct) || 0,
      add_value: parseFloat(selectedBatch.add_value) || 0,
      opening_stock: parseInt(selectedBatch.opening_stock) || 0,
      balance_qty: parseInt(selectedBatch.balance_qty) || 0,
      opening_scheme_stock: parseInt(selectedBatch.opening_scheme_stock) || 0,
      godown_opening: parseInt(selectedBatch.godown_opening) || 0,
      godown_balance: parseInt(selectedBatch.godown_balance) || 0,
      store_opening: parseInt(selectedBatch.store_opening) || 0,
      store_balance: parseInt(selectedBatch.store_balance) || 0,
      mrp_pack: parseFloat(selectedBatch.mrp_pack) || 0,
      mrp_loose: parseFloat(selectedBatch.mrp_loose) || 0,
      old_mrp_l: parseFloat(selectedBatch.old_mrp_l) || 0,
      pur_rate_pack: parseFloat(selectedBatch.pur_rate_pack) || 0,
      pur_rate_loose: parseFloat(selectedBatch.pur_rate_loose) || 0,
      eff_pur_rate: parseFloat(selectedBatch.eff_pur_rate) || 0,
      ptr: parseFloat(selectedBatch.ptr) || 0,
      sale_rate_loose: parseFloat(selectedBatch.sale_rate_loose) || 0,
      old_mrp_p: parseFloat(selectedBatch.old_mrp_p) || 0,
    }

    try {
      const res = await fetch('http://localhost:8081/api/price-master', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (res.ok) {
        fetchBatches()
        alert('Price Master updated successfully!')
      } else {
        alert('Failed to update Price Master')
      }
    } catch (err) { console.error(err) }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
        
        {/* Top Header matching Price Master Modify */}
        <div className="bg-hospital-navy px-6 py-3.5 flex justify-between items-center text-white">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-bold tracking-wide">Price Master — Modify</h3>
            <span className="bg-hospital-teal text-xs px-2.5 py-0.5 rounded">Batch Pricing & Stock Control</span>
          </div>
          <div className="text-xs font-mono text-blue-200">
            Ref. No.: {selectedBatch ? `26 K ${selectedBatch.batch_id}` : 'N/A'}
          </div>
        </div>

        {!selectedBatch ? (
          <div className="p-8 text-center text-gray-500">
            No batches available in inventory. Record a Purchase Invoice first to populate Price Master.
          </div>
        ) : (
          <form onSubmit={handleSave} className="p-6 text-xs space-y-6">
            
            {/* SECTION 1: Item & Batch Selection */}
            <div className="grid grid-cols-12 gap-6 bg-gray-50 p-4 rounded border border-gray-200">
              <div className="col-span-8 space-y-3">
                <div className="grid grid-cols-4 items-center">
                  <label className="font-bold text-hospital-navy">Select Item / Batch</label>
                  <select
                    value={selectedBatch.batch_id}
                    onChange={(e) => handleSelectBatch(e.target.value)}
                    className="col-span-3 border border-gray-300 p-2 rounded bg-white font-bold text-gray-800 outline-none focus:border-hospital-teal"
                  >
                    {batches.map(b => (
                      <option key={b.batch_id} value={b.batch_id}>
                        {b.medicine_name} — Batch: {b.batch_number} (Stock: {b.balance_qty})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-4 items-center">
                  <label className="font-bold text-red-700">Batch No.</label>
                  <input
                    value={selectedBatch.batch_number}
                    onChange={(e) => handleChange('batch_number', e.target.value)}
                    className="border border-gray-300 p-1.5 rounded bg-white font-semibold"
                  />
                  <label className="font-bold text-red-700 text-right pr-3">Print Batch</label>
                  <input
                    value={selectedBatch.batch_number}
                    readOnly
                    className="border border-gray-200 p-1.5 rounded bg-gray-100 text-gray-600"
                  />
                </div>

                <div className="grid grid-cols-4 items-center">
                  <label className="font-bold text-red-700">Expiry Date</label>
                  <input
                    type="date"
                    value={selectedBatch.expiry_date}
                    onChange={(e) => handleChange('expiry_date', e.target.value)}
                    className="border border-gray-300 p-1.5 rounded bg-white"
                  />
                </div>
              </div>

              <div className="col-span-4 space-y-2 border-l border-gray-200 pl-6">
                <div className="flex justify-between items-center">
                  <label className="font-semibold text-gray-600">Tax %</label>
                  <input type="number" step="0.01" value={selectedBatch.tax_pct} onChange={(e) => handleChange('tax_pct', e.target.value)} className="w-28 border border-gray-300 p-1.5 rounded text-right bg-white" />
                </div>
                <div className="flex justify-between items-center">
                  <label className="font-semibold text-gray-600">Add Value</label>
                  <input type="number" step="0.01" value={selectedBatch.add_value} onChange={(e) => handleChange('add_value', e.target.value)} className="w-28 border border-gray-300 p-1.5 rounded text-right bg-white" />
                </div>
                <div className="flex justify-between items-center">
                  <label className="font-bold text-hospital-navy">Qty / Pack</label>
                  <input type="number" value={selectedBatch.qty_per_pack} onChange={(e) => handleChange('qty_per_pack', e.target.value)} className="w-28 border border-hospital-teal p-1.5 rounded text-right font-bold bg-white" />
                </div>
              </div>
            </div>

            {/* SECTION 2: Stock Details (Store + Godown Matrix) */}
            <div>
              <h4 className="font-bold text-hospital-navy mb-2 uppercase tracking-wider text-[11px]">Stock Details</h4>
              <div className="grid grid-cols-12 gap-6 bg-gray-50 p-4 rounded border border-gray-200 items-center">
                
                <div className="col-span-5 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-medium">Opening Stock (Store+Godown)</span>
                    <input type="number" value={selectedBatch.opening_stock} onChange={(e) => handleChange('opening_stock', e.target.value)} className="w-28 border border-gray-300 p-1.5 rounded text-right bg-white" />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-hospital-navy">Balance Quantity</span>
                    <input type="number" value={selectedBatch.balance_qty} readOnly className="w-28 border border-gray-300 p-1.5 rounded text-right bg-teal-50 font-bold text-hospital-teal" />
                  </div>
                </div>

                <div className="col-span-7 border-l border-gray-200 pl-6 space-y-3">
                  <div className="grid grid-cols-3 gap-3 text-center font-bold text-gray-700">
                    <div></div>
                    <div className="bg-gray-200 py-1 rounded">Godown Stock</div>
                    <div className="bg-gray-200 py-1 rounded">Store Stock</div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 items-center">
                    <span className="font-semibold text-gray-600">Opening &rarr;</span>
                    <input type="number" value={selectedBatch.godown_opening} onChange={(e) => handleChange('godown_opening', e.target.value)} className="border border-gray-300 p-1.5 rounded text-right bg-white" />
                    <input type="number" value={selectedBatch.store_opening} onChange={(e) => handleChange('store_opening', e.target.value)} className="border border-gray-300 p-1.5 rounded text-right bg-white" />
                  </div>
                  <div className="grid grid-cols-3 gap-3 items-center">
                    <span className="font-bold text-hospital-navy">Balance &rarr;</span>
                    <input type="number" value={selectedBatch.godown_balance} onChange={(e) => handleChange('godown_balance', e.target.value)} className="border border-gray-300 p-1.5 rounded text-right bg-white font-semibold" />
                    <input type="number" value={selectedBatch.store_balance} onChange={(e) => handleChange('store_balance', e.target.value)} className="border border-gray-300 p-1.5 rounded text-right bg-white font-semibold" />
                  </div>
                </div>

              </div>
            </div>

            {/* SECTION 3: Price Details (Pack vs Loose 3-Column Matrix) */}
            <div>
              <h4 className="font-bold text-hospital-navy mb-2 uppercase tracking-wider text-[11px]">Price Details</h4>
              <div className="grid grid-cols-3 gap-6 bg-blue-50/40 p-4 rounded border border-blue-200">
                
                {/* Column 1: MRP */}
                <div className="space-y-2.5">
                  <div className="flex justify-between items-center">
                    <label className="font-bold text-gray-700">MRP (Pack)</label>
                    <input type="number" step="0.001" value={selectedBatch.mrp_pack} onChange={(e) => handleChange('mrp_pack', e.target.value)} className="w-32 border border-gray-300 p-1.5 rounded text-right bg-white font-bold" />
                  </div>
                  <div className="flex justify-between items-center">
                    <label className="font-semibold text-gray-600">MRP (L)</label>
                    <input type="number" step="0.001" value={selectedBatch.mrp_loose} onChange={(e) => handleChange('mrp_loose', e.target.value)} className="w-32 border border-gray-300 p-1.5 rounded text-right bg-white" />
                  </div>
                  <div className="flex justify-between items-center">
                    <label className="text-gray-500">Old MRP (L)</label>
                    <input type="number" step="0.001" value={selectedBatch.old_mrp_l} onChange={(e) => handleChange('old_mrp_l', e.target.value)} className="w-32 border border-gray-300 p-1.5 rounded text-right bg-white" />
                  </div>
                </div>

                {/* Column 2: Purchase Rate */}
                <div className="space-y-2.5 border-x border-blue-200 px-4">
                  <div className="flex justify-between items-center">
                    <label className="font-bold text-gray-700">Pur.Rate (Pack)</label>
                    <input type="number" step="0.001" value={selectedBatch.pur_rate_pack} onChange={(e) => handleChange('pur_rate_pack', e.target.value)} className="w-32 border border-gray-300 p-1.5 rounded text-right bg-white font-bold" />
                  </div>
                  <div className="flex justify-between items-center">
                    <label className="font-semibold text-gray-600">Pur.Rate (L)</label>
                    <input type="number" step="0.001" value={selectedBatch.pur_rate_loose} onChange={(e) => handleChange('pur_rate_loose', e.target.value)} className="w-32 border border-gray-300 p-1.5 rounded text-right bg-white" />
                  </div>
                  <div className="flex justify-between items-center">
                    <label className="text-gray-500">Eff. Pur.Rate</label>
                    <input type="number" step="0.001" value={selectedBatch.eff_pur_rate} onChange={(e) => handleChange('eff_pur_rate', e.target.value)} className="w-32 border border-gray-300 p-1.5 rounded text-right bg-white" />
                  </div>
                </div>

                {/* Column 3: PTR & Sale Rate */}
                <div className="space-y-2.5">
                  <div className="flex justify-between items-center">
                    <label className="font-semibold text-gray-600">PTR (L)/(WH)</label>
                    <input type="number" step="0.001" value={selectedBatch.ptr} onChange={(e) => handleChange('ptr', e.target.value)} className="w-32 border border-gray-300 p-1.5 rounded text-right bg-white" />
                  </div>
                  <div className="flex justify-between items-center">
                    <label className="font-bold text-hospital-teal">Sale Rate (L)</label>
                    <input type="number" step="0.001" value={selectedBatch.sale_rate_loose} onChange={(e) => handleChange('sale_rate_loose', e.target.value)} className="w-32 border border-hospital-teal p-1.5 rounded text-right bg-white font-bold text-hospital-navy" />
                  </div>
                  <div className="flex justify-between items-center">
                    <label className="text-gray-500">Old MRP (P)</label>
                    <input type="number" step="0.001" value={selectedBatch.old_mrp_p} onChange={(e) => handleChange('old_mrp_p', e.target.value)} className="w-32 border border-gray-300 p-1.5 rounded text-right bg-white" />
                  </div>
                </div>

              </div>
            </div>

            {/* Footer Controls */}
            <div className="flex justify-between items-center pt-2 border-t border-gray-200">
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 font-semibold text-gray-700 cursor-pointer">
                  <input type="checkbox" checked={selectedBatch.exclusive_of_tax} onChange={(e) => handleChange('exclusive_of_tax', e.target.checked)} />
                  Exclusive of Tax
                </label>
                <label className="flex items-center gap-2 font-semibold text-red-600 cursor-pointer">
                  <input type="checkbox" checked={selectedBatch.is_locked} onChange={(e) => handleChange('is_locked', e.target.checked)} />
                  Lock Batch
                </label>
              </div>
              <button type="submit" className="bg-hospital-teal text-white px-8 py-2.5 rounded font-bold hover:bg-teal-700 transition-colors shadow">
                F10 — Save Price Master
              </button>
            </div>

          </form>
        )}
      </div>
    </div>
  )
}