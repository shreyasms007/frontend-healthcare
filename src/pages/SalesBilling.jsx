import { useState, useEffect } from 'react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export default function SalesBilling() {
  const [batches, setBatches] = useState([])
  const [medicines, setMedicines] = useState([])
  const todayStr = new Date().toISOString().split('T')[0]

  const emptyItem = {
    medicine_id: '',
    batch_id: '',
    batch_number: '',
    qty: 1,
    rate: 0,
    amount: 0
  }

  const [formData, setFormData] = useState({
    customer_name: '',
    doctor_name: '',
    invoice_date: todayStr,
    items: [{ ...emptyItem }]
  })

  useEffect(() => {
    fetchPriceMasterBatches()
  }, [])

  const fetchPriceMasterBatches = async () => {
    try {
      const res = await fetch('http://localhost:8081/api/price-master')
      const data = await res.json()
      if (data) {
        setBatches(data)
        const uniqueMeds = []
        const medIds = new Set()
        data.forEach(b => {
          if (b.balance_qty > 0 && !medIds.has(b.medicine_id)) {
            medIds.add(b.medicine_id)
            uniqueMeds.push({ id: b.medicine_id, name: b.medicine_name })
          }
        })
        setMedicines(uniqueMeds)
      }
    } catch (err) { console.error("Failed to fetch batches:", err) }
  }

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items]
    const item = newItems[index]
    
    if (field === 'medicine_id') {
      item.medicine_id = value
      item.batch_id = ''
      item.batch_number = ''
      item.rate = 0
    } else if (field === 'batch_id') {
      const selectedBatch = batches.find(b => b.batch_id === parseInt(value))
      if (selectedBatch) {
        item.batch_id = selectedBatch.batch_id
        item.batch_number = selectedBatch.batch_number
        item.rate = selectedBatch.sale_rate_loose || selectedBatch.mrp_loose || selectedBatch.mrp_pack || 0 
      }
    } else {
      item[field] = value
    }

    const qty = parseFloat(item.qty) || 0
    const rate = parseFloat(item.rate) || 0
    item.amount = parseFloat((qty * rate).toFixed(2))

    setFormData({ ...formData, items: newItems })
  }

  const addItemRow = () => {
    setFormData(prev => ({ ...prev, items: [...prev.items, { ...emptyItem }] }))
  }

  const getTotalAmount = () => {
    return formData.items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0)
  }

  // --- NEW: PDF GENERATOR FUNCTION ---
  const generatePDF = (invoiceData, items) => {
    const doc = new jsPDF();
    
    // Header (Hospital Navy)
    doc.setFontSize(22);
    doc.setTextColor(30, 58, 138); 
    doc.text("NEW SARAJ MEDICAL", 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text("Arasikere, Karnataka", 14, 28);
    doc.text(`Date: ${invoiceData.invoice_date}`, 14, 34);
    
    // Patient & Doctor Info
    doc.setTextColor(0);
    doc.setFontSize(11);
    doc.text(`Patient Name: ${invoiceData.customer_name || 'Cash Customer'}`, 14, 46);
    doc.text(`Prescribing Doctor: ${invoiceData.doctor_name || 'Self'}`, 14, 52);

    // Prepare Table Data
    const tableColumn = ["Medicine", "Batch", "Qty", "Unit Price", "Amount"];
    const tableRows = [];
    
    items.forEach(item => {
      const medicineName = medicines.find(m => m.id === parseInt(item.medicine_id))?.name || 'Unknown';
      const itemData = [
        medicineName,
        item.batch_number,
        item.qty,
        `Rs ${parseFloat(item.rate).toFixed(2)}`,
        `Rs ${parseFloat(item.amount).toFixed(2)}`
      ];
      tableRows.push(itemData);
    });

    // Draw Table (Hospital Teal header)
    autoTable(doc, {
      startY: 60,
      head: [tableColumn],
      body: tableRows,
      theme: 'striped',
      headStyles: { fillColor: [13, 148, 136] }, 
    });

    // Footer / Total Amount
    const finalY = doc.lastAutoTable?.finalY || 60;
    doc.setFontSize(14);
    doc.setTextColor(30, 58, 138);
    doc.setFont("helvetica", "bold");
    doc.text(`Total Amount: Rs ${invoiceData.total_amount.toFixed(2)}`, 14, finalY + 12);
    
    // Thank you note
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.setFont("helvetica", "normal");
    doc.text("Thank you for your visit. Get well soon!", 14, finalY + 22);
    
    // Save and trigger download
    const fileName = `Invoice_${invoiceData.customer_name || 'Cash'}_${Date.now()}.pdf`;
    doc.save(fileName);
  };

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const payload = {
      customer_name: formData.customer_name,
      doctor_name: formData.doctor_name,
      invoice_date: formData.invoice_date,
      total_amount: getTotalAmount(),
      items: formData.items.map(i => ({
        medicine_id: parseInt(i.medicine_id),
        batch_id: parseInt(i.batch_id),
        qty: parseInt(i.qty),
        rate: parseFloat(i.rate),
        amount: parseFloat(i.amount)
      }))
    }

    try {
      const res = await fetch('http://localhost:8081/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      
      if (res.ok) {
        // --- TRIGGER PDF DOWNLOAD BEFORE RESETTING ---
        generatePDF(payload, formData.items);

        alert('Sale completed and Invoice downloaded!')
        setFormData({
          customer_name: '', doctor_name: '', invoice_date: todayStr, items: [{ ...emptyItem }]
        })
        fetchPriceMasterBatches() 
      } else {
        const errText = await res.text()
        alert('Failed to complete sale: ' + errText)
      }
    } catch (err) { console.error(err) }
  }

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden text-sm">
      <div className="bg-hospital-teal text-white px-6 py-4 font-bold text-lg">
        New Sales Counter Bill
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-gray-600 font-semibold mb-1">Customer / Patient Name</label>
            <input type="text" value={formData.customer_name} onChange={e => setFormData({...formData, customer_name: e.target.value})} className="w-full border p-2 rounded" required />
          </div>
          <div>
            <label className="block text-gray-600 font-semibold mb-1">Prescribing Doctor</label>
            <input type="text" value={formData.doctor_name} onChange={e => setFormData({...formData, doctor_name: e.target.value})} className="w-full border p-2 rounded" />
          </div>
        </div>

        <div>
          <h4 className="font-bold text-hospital-navy mb-3">Billing Line Items</h4>
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2">Medicine</th>
                <th className="p-2">Batch #</th>
                <th className="p-2 text-right">Quantity</th>
                <th className="p-2 text-right">Unit Price</th>
                <th className="p-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {formData.items.map((item, idx) => {
                const availableBatches = batches.filter(b => b.medicine_id === parseInt(item.medicine_id) && b.balance_qty > 0)
                
                return (
                  <tr key={idx} className="border-b">
                    <td className="p-2">
                      <select value={item.medicine_id} onChange={(e) => handleItemChange(idx, 'medicine_id', e.target.value)} className="w-full border p-1 rounded" required>
                        <option value="">Select Medicine</option>
                        {medicines.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                      </select>
                    </td>
                    <td className="p-2">
                      <select value={item.batch_id} onChange={(e) => handleItemChange(idx, 'batch_id', e.target.value)} className="w-full border p-1 rounded" required disabled={!item.medicine_id}>
                        <option value="">Select Batch</option>
                        {availableBatches.map(b => (
                          <option key={b.batch_id} value={b.batch_id}>
                            {b.batch_number} (Qty: {b.balance_qty})
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="p-2"><input type="number" value={item.qty} min="1" onChange={(e) => handleItemChange(idx, 'qty', e.target.value)} className="w-full border p-1 rounded text-right" required /></td>
                    <td className="p-2"><input type="number" step="0.01" value={item.rate} readOnly className="w-full border p-1 rounded text-right bg-gray-50" /></td>
                    <td className="p-2 font-bold text-right text-hospital-navy">₹{item.amount.toFixed(2)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <div className="mt-3 flex justify-between items-center">
             <button type="button" onClick={addItemRow} className="bg-gray-200 px-4 py-2 rounded text-sm font-semibold hover:bg-gray-300">Add Item</button>
             <div className="text-xl font-bold text-hospital-navy">Total: ₹{getTotalAmount().toFixed(2)}</div>
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" className="bg-hospital-teal text-white px-8 py-3 rounded font-bold text-lg hover:bg-teal-700">Complete Sale & Print</button>
        </div>
      </form>
    </div>
  )
}