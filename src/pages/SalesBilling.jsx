import { useState, useEffect, useMemo } from 'react'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { API_BASE } from '../config.js';

export default function SalesBilling() {
  const emptyForm = {
    id: null,
    phone_number: '',
    customer_name: '',
    doctor_name: '',
    invoice_date: '',
    is_issued: false,
    items: []
  }

  const [activeView, setActiveView] = useState('create')
  const [formData, setFormData] = useState({ ...emptyForm })
  const [sales, setSales] = useState([])
  const [inventory, setInventory] = useState([]) 
  
  const [searchPhone, setSearchPhone] = useState('')
  const [searchName, setSearchName] = useState('')

  const [currentItem, setCurrentItem] = useState({ medicine_id: '', batch_id: '', qty: 1, rate: 0 })

  const safeItems = Array.isArray(formData.items) ? formData.items : []

  useEffect(() => {
    fetchSales()
    fetchInventory()
  }, [])

  const fetchSales = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/sales`)
      if (res.ok) {
        const data = await res.json()
        setSales(Array.isArray(data) ? data : (data.data || []))
      }
    } catch (err) { console.error("Failed to fetch sales:", err) }
  }

  const fetchInventory = async () => {
    try {
     const res = await fetch(`${API_BASE}/api/inventory`)
      if (res.ok) {
        const data = await res.json()
        let arr = []
        if (Array.isArray(data)) arr = data
        else if (data && Array.isArray(data.data)) arr = data.data
        else if (data && Array.isArray(data.items)) arr = data.items
        setInventory(arr)
      }
    } catch (err) { console.error("Failed to fetch inventory:", err) }
  }

  const filteredSales = useMemo(() => {
    return sales.filter(s => {
      const matchPhone = !searchPhone.trim() || (s.phone_number && s.phone_number.includes(searchPhone.trim()))
      const matchName = !searchName.trim() || (s.customer_name && s.customer_name.toLowerCase().includes(searchName.trim().toLowerCase()))
      return matchPhone && matchName
    })
  }, [sales, searchPhone, searchName])

  const uniquePhones = useMemo(() => {
    return Array.from(new Set(sales.filter(s => s.phone_number).map(s => s.phone_number)))
  }, [sales])

  const handlePhoneChange = (e) => {
    const phone = e.target.value
    const openBill = sales.find(s => s.phone_number === phone && !s.is_issued)
    
    if (openBill) {
      openEditView(openBill)
    } else {
      const pastSale = sales.find(s => s.phone_number === phone)
      setFormData(prev => ({
        ...emptyForm,
        phone_number: phone,
        customer_name: pastSale ? pastSale.customer_name : ''
      }))
      setActiveView('create')
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleMedicineChange = (e) => {
    const val = e.target.value
    const foundItem = inventory.find(inv => 
      (inv.medicine_name === val) || 
      (inv.item_name === val) || 
      (inv.name === val) ||
      (inv.medicine_id === val)
    )

    setCurrentItem(prev => ({
      ...prev,
      medicine_id: val,
      batch_id: foundItem ? (foundItem.batch_id || foundItem.id || '') : prev.batch_id,
      rate: foundItem ? (foundItem.rate || foundItem.mrp || foundItem.price || 0) : prev.rate
    }))
  }

  const handleAddItem = () => {
    if (!currentItem.medicine_id || currentItem.qty <= 0) return
    setFormData(prev => ({
      ...prev,
      items: [...safeItems, { ...currentItem, amount: currentItem.qty * currentItem.rate }]
    }))
    setCurrentItem({ medicine_id: '', batch_id: '', qty: 1, rate: 0 })
  }

  const handleRemoveItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: safeItems.filter((_, i) => i !== index)
    }))
  }

  const calculateTotal = (itemsList) => {
    const list = itemsList || safeItems
    return list.reduce((sum, item) => sum + ((item.qty || 0) * (item.rate || 0)), 0)
  }

  const handleSave = async (isIssuedFlag = false) => {
    if (!formData.phone_number) {
      alert("Phone number is required!")
      return false
    }

    // Automatically grab pending item inputs if user forgot to click "Add"
    let itemsToSave = [...safeItems]
    if (currentItem.medicine_id && currentItem.qty > 0) {
      itemsToSave.push({
        ...currentItem,
        amount: currentItem.qty * currentItem.rate
      })
    }

    if (itemsToSave.length === 0) {
      alert("Please add at least one medicine item to the bill!")
      return false
    }

    const payload = {
      ...formData,
      total_amount: calculateTotal(itemsToSave),
      is_issued: isIssuedFlag,
      items: itemsToSave
    }

    const method = activeView === 'edit' ? 'PUT' : 'POST'
    const url = activeView === 'edit' ? `http://localhost:8081/api/sales/${formData.id}` : 'http://localhost:8081/api/sales'

    try {
      const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        fetchSales()
        if (!isIssuedFlag) {
            alert('Bill saved as Open (Unissued).')
            setActiveView('list') 
        }
        return true
      } else {
        alert('Failed to save sale: ' + await res.text())
        return false
      }
    } catch (err) { 
      console.error(err)
      return false
    }
  }

  const handlePrint = async () => {
    try {
      let itemsToPrint = [...safeItems]
      if (currentItem.medicine_id && currentItem.qty > 0) {
        itemsToPrint.push({
          ...currentItem,
          amount: currentItem.qty * currentItem.rate
        })
      }

      if (itemsToPrint.length === 0) {
        alert("No items to print in this invoice!");
        return;
      }

      const saveSuccess = await handleSave(true);
      if (!saveSuccess) return;

      const doc = new jsPDF();
      doc.setFontSize(22);
      doc.setTextColor(24, 54, 102); 
      doc.text("SARAJ MEDICALS", 14, 20);
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text("Tax Invoice / Cash Memo", 14, 27);
      doc.text("State Code: 29 (Karnataka)", 140, 27);

      doc.setFontSize(11);
      doc.setTextColor(0);
      doc.text(`Invoice No: ${formData.invoice_number || 'NEW'}`, 14, 45);
      doc.text(`Date: ${new Date().toLocaleDateString()}`, 140, 45);
      doc.text(`Patient Name: ${formData.customer_name || 'Cash Customer'}`, 14, 52);
      doc.text(`Phone: ${formData.phone_number || '-'}`, 140, 52);
      doc.text(`Doctor: ${formData.doctor_name || '-'}`, 14, 59);

      const tableColumn = ["Medicine / Item", "Batch ID", "Qty", "Rate (Rs)", "Amount (Rs)"];
      const tableRows = itemsToPrint.map(item => [
        item.medicine_id || '-',
        item.batch_id || '-',
        item.qty || 0,
        Number(item.rate || 0).toFixed(2),
        Number(item.amount || 0).toFixed(2)
      ]);

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 68,
        theme: 'striped',
        headStyles: { fillColor: [24, 54, 102] }, 
        styles: { fontSize: 10 },
        alternateRowStyles: { fillColor: [245, 247, 250] }
      });

      const finalY = doc.lastAutoTable.finalY || 68;
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text(`Total Amount: Rs ${calculateTotal(itemsToPrint).toFixed(2)}`, 130, finalY + 15);

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(150);
      doc.text("Thank you for your visit. Get well soon!", 14, 280);

      doc.save(`Invoice_${formData.phone_number || 'Sale'}.pdf`);
      
      setFormData({ ...emptyForm })
      setCurrentItem({ medicine_id: '', batch_id: '', qty: 1, rate: 0 })
      setActiveView('list')
      
    } catch (error) {
      console.error(error);
      alert("Failed to generate PDF.");
    }
  }

  const openEditView = (sale) => {
    setFormData({
      id: sale.id,
      phone_number: sale.phone_number || '',
      customer_name: sale.customer_name || '',
      doctor_name: sale.doctor_name || '',
      invoice_date: sale.invoice_date || '',
      is_issued: sale.is_issued || false,
      items: Array.isArray(sale.items) ? sale.items : [] 
    })
    setCurrentItem({ medicine_id: '', batch_id: '', qty: 1, rate: 0 })
    setActiveView('edit')
  }

  return (
    <div className="space-y-6 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
        <div className="flex items-center gap-3">
          <div className="flex bg-gray-200 p-1 rounded-lg ml-4">
            <button
              onClick={() => { setFormData({ ...emptyForm }); setCurrentItem({ medicine_id: '', batch_id: '', qty: 1, rate: 0 }); setActiveView('create'); }}
              className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
                activeView === 'create' ? 'bg-hospital-teal text-white shadow' : 'text-gray-600 hover:text-hospital-navy'
              }`}
            >
              + New Bill
            </button>
            <button
              onClick={() => setActiveView('list')}
              className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
                activeView === 'list' ? 'bg-hospital-teal text-white shadow' : 'text-gray-600 hover:text-hospital-navy'
              }`}
            >
              📋 Customers / Sales Ledger
            </button>
            {activeView === 'edit' && (
              <button className="px-4 py-1.5 rounded-md text-xs font-bold bg-amber-500 text-white shadow cursor-default">
                ✏️ Editing {formData.is_issued ? 'Issued Invoice' : 'Open Bill'} #{formData.id}
              </button>
            )}
          </div>
        </div>
        <div className="text-xs text-gray-500">State Code: 29 (Karnataka)</div>
      </div>

      {(activeView === 'create' || activeView === 'edit') && (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
          <div className="bg-hospital-teal text-white px-6 py-4 font-bold text-lg flex justify-between">
            <span>{activeView === 'create' ? 'New Sales Counter Bill' : `Edit Bill - Phone: ${formData.phone_number}`}</span>
            {formData.is_issued && <span className="bg-white text-hospital-teal px-2 py-1 text-xs rounded">ISSUED</span>}
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-gray-600 font-semibold mb-1">Phone Number *</label>
                <input 
                  type="text" 
                  name="phone_number" 
                  value={formData.phone_number} 
                  onChange={handlePhoneChange} 
                  list="phone-suggestions"
                  autoComplete="off"
                  className="w-full border p-2 rounded focus:ring-hospital-teal" 
                  required 
                />
                <datalist id="phone-suggestions">
                  {uniquePhones.map((phone, idx) => (
                    <option key={idx} value={phone} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className="block text-gray-600 font-semibold mb-1">Customer Name</label>
                <input 
                  type="text" 
                  name="customer_name" 
                  value={formData.customer_name} 
                  onChange={handleInputChange} 
                  className="w-full border p-2 rounded focus:ring-hospital-teal" 
                />
              </div>
              <div>
                <label className="block text-gray-600 font-semibold mb-1">Prescribing Doctor</label>
                <input 
                  type="text" 
                  name="doctor_name" 
                  value={formData.doctor_name} 
                  onChange={handleInputChange} 
                  className="w-full border p-2 rounded focus:ring-hospital-teal" 
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-bold text-hospital-navy mb-3">Billing Line Items</h4>
              <div className="flex gap-2 items-end mb-4">
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-1">Medicine / Item</label>
                  <input 
                    type="text" 
                    className="w-full border p-2 rounded" 
                    value={currentItem.medicine_id} 
                    onChange={handleMedicineChange} 
                    list="inventory-suggestions"
                    autoComplete="off"
                  />
                  <datalist id="inventory-suggestions">
                    {inventory.map((inv, idx) => (
                      <option key={idx} value={inv.medicine_name || inv.name || inv.item_name || inv.medicine_id} />
                    ))}
                  </datalist>
                </div>
                <div className="w-32">
                  <label className="block text-xs text-gray-500 mb-1">Batch ID</label>
                  <input type="number" className="w-full border p-2 rounded" value={currentItem.batch_id} onChange={e => setCurrentItem({...currentItem, batch_id: Number(e.target.value)})} />
                </div>
                <div className="w-24">
                  <label className="block text-xs text-gray-500 mb-1">Quantity</label>
                  <input type="number" className="w-full border p-2 rounded" value={currentItem.qty} onChange={e => setCurrentItem({...currentItem, qty: Number(e.target.value)})} />
                </div>
                <div className="w-32">
                  <label className="block text-xs text-gray-500 mb-1">Rate</label>
                  <input type="number" className="w-full border p-2 rounded" value={currentItem.rate} onChange={e => setCurrentItem({...currentItem, rate: Number(e.target.value)})} />
                </div>
                <button type="button" onClick={handleAddItem} className="bg-gray-200 px-4 py-2 rounded font-bold text-gray-700 hover:bg-gray-300">Add</button>
              </div>

              <table className="w-full text-left border-collapse mt-4">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="p-2">Medicine</th>
                    <th className="p-2 text-center">Batch ID</th>
                    <th className="p-2 text-center">Qty</th>
                    <th className="p-2 text-right">Rate</th>
                    <th className="p-2 text-right">Amount</th>
                    <th className="p-2 text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {safeItems.map((item, idx) => (
                    <tr key={idx} className="border-b">
                      <td className="p-2 font-bold">{item.medicine_id}</td>
                      <td className="p-2 text-center">{item.batch_id}</td>
                      <td className="p-2 text-center">{item.qty}</td>
                      <td className="p-2 text-right">₹{Number(item.rate || 0).toFixed(2)}</td>
                      <td className="p-2 text-right font-bold text-hospital-navy">₹{Number((item.qty * item.rate) || 0).toFixed(2)}</td>
                      <td className="p-2 text-center">
                        <button onClick={() => handleRemoveItem(idx)} className="text-red-500 font-bold hover:text-red-700">X</button>
                      </td>
                    </tr>
                  ))}
                  {safeItems.length === 0 && <tr><td colSpan="6" className="p-4 text-center text-gray-400">No items added yet.</td></tr>}
                </tbody>
              </table>
              <div className="flex justify-end mt-4 text-xl font-bold text-hospital-navy">
                Total: ₹{calculateTotal().toFixed(2)}
              </div>
            </div>

            <div className="flex justify-end gap-4 border-t pt-4">
              <button type="button" onClick={() => handleSave(false)} className="bg-hospital-navy text-white px-6 py-3 rounded font-bold hover:bg-blue-900 transition shadow">
                Park / Save Open Bill
              </button>
              
              <button type="button" onClick={handlePrint} className="bg-hospital-teal text-white px-8 py-3 rounded font-bold hover:bg-teal-700 transition shadow">
                🖨️ Print & Finalize Bill
              </button>
            </div>
          </div>
        </div>
      )}

      {activeView === 'list' && (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
          <div className="p-4 bg-gray-50 border-b flex gap-4">
            <div className="relative w-1/3 min-w-[200px]">
              <input type="text" placeholder="Phone Number..." value={searchPhone} onChange={e => setSearchPhone(e.target.value)} className="w-full border p-2 pl-9 rounded shadow-sm focus:ring-hospital-teal" />
              <span className="absolute left-3 top-2.5 text-gray-400">📞</span>
            </div>
            <div className="relative w-1/3 min-w-[200px]">
              <input type="text" placeholder="Customer Name..." value={searchName} onChange={e => setSearchName(e.target.value)} className="w-full border p-2 pl-9 rounded shadow-sm focus:ring-hospital-teal" />
              <span className="absolute left-3 top-2.5 text-gray-400">👤</span>
            </div>
          </div>

          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead className="bg-hospital-navy text-white sticky top-0">
                <tr>
                  <th className="p-3">Inv ID</th>
                  <th className="p-3">Phone Number</th>
                  <th className="p-3">Customer Name</th>
                  <th className="p-3 text-right">Total Amount</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-blue-50 cursor-pointer transition">
                    <td className="p-3 font-mono text-gray-500">{sale.invoice_number || `#${sale.id}`}</td>
                    <td className="p-3 font-bold text-hospital-navy">{sale.phone_number}</td>
                    <td className="p-3">{sale.customer_name || '-'}</td>
                    <td className="p-3 text-right font-bold text-emerald-600">₹{parseFloat(sale.total_amount || 0).toFixed(2)}</td>
                    <td className="p-3 text-center">
                      {sale.is_issued ? (
                        <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-xs font-bold">ISSUED</span>
                      ) : (
                        <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded text-xs font-bold">OPEN</span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <button onClick={() => openEditView(sale)} className="bg-teal-50 text-teal-700 hover:bg-teal-600 hover:text-white border border-teal-300 px-4 py-1.5 rounded font-bold text-xs transition">
                        View / Edit Bill
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}