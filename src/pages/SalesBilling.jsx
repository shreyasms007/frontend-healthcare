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
  // Snapshot of original items to fix math when editing parked bills
  const [originalItems, setOriginalItems] = useState([])
  const [sales, setSales] = useState([])
  const [inventory, setInventory] = useState([]) 
  
  const [searchPhone, setSearchPhone] = useState('')
  const [searchName, setSearchName] = useState('')

  const [currentItem, setCurrentItem] = useState({ medicine_id: '', batch_id: '', qty: 1, rate: 0 })

  const safeItems = Array.isArray(formData.items) ? formData.items : []

  useEffect(() => {
    const draft = localStorage.getItem('salesBillDraft');
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        if (parsed && parsed.id === null) {
          setFormData(parsed);
        }
      } catch (e) {
        console.error("Failed to parse draft", e);
      }
    }
    fetchSales()
    fetchInventory()
  }, [])

  useEffect(() => {
    if (formData.id === null && (formData.phone_number !== '' || safeItems.length > 0)) {
      localStorage.setItem('salesBillDraft', JSON.stringify(formData));
    }
  }, [formData, safeItems])

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

  const uniqueMedicines = useMemo(() => {
    const names = inventory.map(inv => inv.medicine_name || inv.item_name || inv.name).filter(Boolean);
    return Array.from(new Set(names));
  }, [inventory])

  // NEW FIX: Filter out negative/0 stock items unless they are currently in the cart
  const availableBatches = useMemo(() => {
    return inventory.filter(inv => {
      const isMatch = (inv.medicine_name === currentItem.medicine_id) || 
                      (inv.item_name === currentItem.medicine_id) || 
                      (inv.name === currentItem.medicine_id);
      
      if (!isMatch) return false;

      const batchId = String(inv.batch_number || inv.batch_id || inv.id);
      
      // Check if this batch is already sitting in the bill table
      const isInCart = safeItems.some(item => String(item.batch_id) === batchId);
      
      // Only show the batch in the dropdown if it has stock > 0 OR if it's already in the cart
      return Number(inv.stock_qty || inv.available_stock || 0) > 0 || isInCart;
    });
  }, [inventory, currentItem.medicine_id, safeItems])

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
      setOriginalItems([]) 
      setActiveView('create')
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleMedicineChange = (e) => {
    const val = e.target.value
    const batches = inventory.filter(inv => 
      (inv.medicine_name === val) || 
      (inv.item_name === val) || 
      (inv.name === val)
    )

    let defaultBatch = ''
    let defaultRate = 0

    if (batches.length === 1) {
       defaultBatch = batches[0].batch_number || batches[0].batch_id || batches[0].id || ''
       defaultRate = batches[0].sale_rate || batches[0].rate || batches[0].mrp || batches[0].price || 0
    }

    setCurrentItem(prev => ({
      ...prev,
      medicine_id: val,
      batch_id: defaultBatch, 
      rate: defaultRate,      
      qty: 1
    }))
  }

  const handleBatchChange = (e) => {
    const bId = e.target.value;
    const selectedBatch = availableBatches.find(inv => 
      String(inv.batch_number) === String(bId) || String(inv.batch_id) === String(bId) || String(inv.id) === String(bId)
    );

    setCurrentItem(prev => ({
      ...prev,
      batch_id: bId,
      rate: selectedBatch ? (selectedBatch.sale_rate || selectedBatch.rate || selectedBatch.mrp || selectedBatch.price || 0) : prev.rate
    }));
  }

  const handleAddItem = () => {
    const isValidMedicine = uniqueMedicines.includes(currentItem.medicine_id);
    if (!isValidMedicine) {
      alert("⚠️ Invalid Item: You must select a valid medicine from the dropdown list.");
      return; 
    }
    if (!currentItem.batch_id || currentItem.batch_id === "") {
      alert("⚠️ Please select a valid Batch from the dropdown for this medicine.");
      return; 
    }

    const selectedInv = availableBatches.find(inv => 
      String(inv.batch_number) === String(currentItem.batch_id) || 
      String(inv.batch_id) === String(currentItem.batch_id) || 
      String(inv.id) === String(currentItem.batch_id)
    );

    const existingItemIndex = safeItems.findIndex(item => 
      String(item.batch_id) === String(currentItem.batch_id) && 
      String(item.medicine_id) === String(currentItem.medicine_id)
    );

    const originalQty = originalItems
      .filter(item => String(item.batch_id) === String(currentItem.batch_id))
      .reduce((sum, item) => sum + Number(item.qty), 0);

    const rawStock = selectedInv ? Number(selectedInv.stock_qty || selectedInv.available_stock || 0) : 0;
    const trueAvailableStock = rawStock + originalQty;

    const currentCartQty = existingItemIndex >= 0 ? Number(safeItems[existingItemIndex].qty) : 0;
    const totalRequestedQty = currentCartQty + Number(currentItem.qty);

    if (selectedInv && totalRequestedQty > trueAvailableStock) {
      alert(`⚠️ Insufficient Stock! You are requesting ${totalRequestedQty} total, but only ${trueAvailableStock} is available.`);
      return;
    }

    if (existingItemIndex >= 0) {
       const updatedItems = [...safeItems];
       updatedItems[existingItemIndex].qty = totalRequestedQty;
       updatedItems[existingItemIndex].amount = totalRequestedQty * Number(currentItem.rate);
       setFormData(prev => ({ ...prev, items: updatedItems }));
    } else {
       if (!currentItem.medicine_id || currentItem.qty <= 0) return;
       setFormData(prev => ({
         ...prev,
         items: [...safeItems, { ...currentItem, amount: Number(currentItem.qty) * Number(currentItem.rate) }]
       }));
    }
    
    setCurrentItem({ medicine_id: '', batch_id: '', qty: 1, rate: 0 });
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

  // NEW FIX: Save function safely merges pending inputs to prevent backend duplicates
  const handleSave = async (isIssuedFlag = false) => {
    if (!formData.phone_number) {
      alert("Phone number is required!")
      return false
    }

    let itemsToSave = JSON.parse(JSON.stringify(safeItems));
    
    if (currentItem.medicine_id && currentItem.qty > 0) {
      const isValid = inventory.some(inv => 
         (inv.medicine_name === currentItem.medicine_id || inv.name === currentItem.medicine_id || inv.item_name === currentItem.medicine_id) && 
         (String(inv.batch_number) === String(currentItem.batch_id) || String(inv.batch_id) === String(currentItem.batch_id) || String(inv.id) === String(currentItem.batch_id))
      );
      
      if (isValid) {
        const existingIdx = itemsToSave.findIndex(item => 
          String(item.batch_id) === String(currentItem.batch_id) && 
          String(item.medicine_id) === String(currentItem.medicine_id)
        );
        
        if (existingIdx >= 0) {
          itemsToSave[existingIdx].qty = Number(itemsToSave[existingIdx].qty) + Number(currentItem.qty);
          itemsToSave[existingIdx].amount = itemsToSave[existingIdx].qty * Number(itemsToSave[existingIdx].rate);
        } else {
          itemsToSave.push({
            ...currentItem,
            amount: Number(currentItem.qty) * Number(currentItem.rate)
          });
        }
      }
    }

    if (itemsToSave.length === 0) {
      alert("Please add at least one valid medicine item to the bill!")
      return false
    }

    const payload = {
      ...formData,
      total_amount: calculateTotal(itemsToSave),
      is_issued: isIssuedFlag,
      items: itemsToSave
    }

    const method = activeView === 'edit' ? 'PUT' : 'POST'
    const url = activeView === 'edit' ? `${API_BASE}/api/sales/${formData.id}` : `${API_BASE}/api/sales`

    try {
      const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        localStorage.removeItem('salesBillDraft'); 
        fetchSales()
        if (!isIssuedFlag) {
            alert('Bill saved as Open (Unissued).')
            setActiveView('list') 
        }
        setOriginalItems([]) 
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
      let itemsToPrint = JSON.parse(JSON.stringify(safeItems));
      
      if (currentItem.medicine_id && currentItem.qty > 0) {
        const isValid = inventory.some(inv => 
           (inv.medicine_name === currentItem.medicine_id || inv.name === currentItem.medicine_id || inv.item_name === currentItem.medicine_id) && 
           (String(inv.batch_number) === String(currentItem.batch_id) || String(inv.batch_id) === String(currentItem.batch_id) || String(inv.id) === String(currentItem.batch_id))
        );
        if (isValid) {
          const existingIdx = itemsToPrint.findIndex(item => 
            String(item.batch_id) === String(currentItem.batch_id) && 
            String(item.medicine_id) === String(currentItem.medicine_id)
          );
          if (existingIdx >= 0) {
            itemsToPrint[existingIdx].qty = Number(itemsToPrint[existingIdx].qty) + Number(currentItem.qty);
            itemsToPrint[existingIdx].amount = itemsToPrint[existingIdx].qty * Number(itemsToPrint[existingIdx].rate);
          } else {
            itemsToPrint.push({
              ...currentItem,
              amount: Number(currentItem.qty) * Number(currentItem.rate)
            });
          }
        }
      }

      if (itemsToPrint.length === 0) {
        alert("No valid items to print in this invoice!");
        return;
      }

      const saveSuccess = await handleSave(true);
      if (!saveSuccess) return;

      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a5' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const rightMarginX = pageWidth - 10; 
      const col2X = pageWidth - 55;        
      
      const hospitalName = "JENUKAL PHARMACY (A Unit of Jenukal Hospital)";
      const addressLine = "OPP GOVT HOSPITAL, DARGA COMPLEX, ARASIKERE, Karnataka - 573103";
      const contactInfo = "Ph: 08174-234400, 7996779835";
      const legalInfo = "GST No: 29AJTPR8514J1ZA  |  DL.No: KA-HS1-145811, KA-HS1-145812";

      const totalAmt = calculateTotal(itemsToPrint);
      const roundedTotal = Math.round(totalAmt);
      const totalQty = itemsToPrint.reduce((sum, item) => sum + Number(item.qty || 0), 0);

      const printHeader = (data) => {
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0, 0, 0); 
        doc.text(hospitalName, 14, 20);
        
        doc.setFontSize(7);
        doc.setFont("helvetica", "normal");
        doc.text(addressLine, 14, 25);
        doc.text(contactInfo, 14, 29);
        doc.text(legalInfo, 14, 33);
        
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.5);
        doc.line(14, 36, rightMarginX, 36);
        
        doc.setFontSize(9);
        doc.text(`Patient: ${formData.customer_name || 'Cash Customer'}`, 14, 42);
        doc.text(`Phone: ${formData.phone_number || '-'}`, 14, 47);
        doc.text(`Doctor: ${formData.doctor_name || '-'}`, 14, 52);
        
        doc.setFont("helvetica", "bold");
        doc.text("COMPOSIT INV / CASH BILL", col2X, 42);
        doc.setFont("helvetica", "normal");
        doc.text(`Bill No: ${formData.invoice_number || formData.id || 'NEW'}`, col2X, 47);
        doc.text(`Date: ${new Date().toLocaleDateString()}`, col2X, 52);
        
        doc.line(14, 55, rightMarginX, 55);
      };

      const tableColumn = ["Qty", "Item Name", "Batch", "Rate", "Amount"];
      const tableRows = itemsToPrint.map(item => [
        Number(item.qty).toFixed(2),
        item.medicine_id || '-',
        item.batch_id || '-',
        Number(item.rate || 0).toFixed(2),
        Number(item.amount || 0).toFixed(2)
      ]);

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 57, 
        theme: 'grid',
        headStyles: { fillColor: [220, 220, 220], textColor: [0, 0, 0], fontStyle: 'bold', lineColor: [0,0,0], lineWidth: 0.1 },
        styles: { fontSize: 8, textColor: [0, 0, 0], lineColor: [0,0,0], lineWidth: 0.1, cellPadding: 1.5 },
        alternateRowStyles: { fillColor: [250, 250, 250] },
        margin: { top: 57, bottom: 40, left: 14, right: 10 }, 
        
        didDrawPage: (data) => {
          printHeader(data);
          
          doc.setFontSize(9);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(0, 0, 0);
          doc.text(`Total Items: ${itemsToPrint.length}    Qty: ${totalQty}`, 14, pageHeight - 28);
          doc.text(`Sub Total: Rs ${totalAmt.toFixed(2)}`, col2X, pageHeight - 28);
          
          doc.setFontSize(12);
          doc.text(`Rounded Total: Rs ${roundedTotal}.00`, col2X - 5, pageHeight - 20);
          
          doc.setFontSize(7);
          doc.setFont("helvetica", "normal");
          doc.text("E. & O.E. Goods Once Sold Cannot Be Taken Back Or Exchng.", 14, pageHeight - 13);
          doc.setFont("helvetica", "bold");
          doc.text("CAUTION: Once the bill is printed, the medicines cannot be returned.", 14, pageHeight - 9);
          
          doc.setFont("helvetica", "normal");
          doc.text(`Page ${data.pageNumber}`, rightMarginX, pageHeight - 9, { align: 'right' });
        }
      });

      const pdfBlob = doc.output('blob');
      const blobUrl = URL.createObjectURL(pdfBlob);
      const downloadLink = document.createElement('a');
      downloadLink.href = blobUrl;
      downloadLink.download = `Invoice_${formData.phone_number || 'Sale'}.pdf`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(blobUrl);
      
      localStorage.removeItem('salesBillDraft'); 
      setFormData({ ...emptyForm })
      setOriginalItems([])
      setCurrentItem({ medicine_id: '', batch_id: '', qty: 1, rate: 0 })
      setActiveView('list')
      
    } catch (error) {
      console.error(error);
      alert("Failed to generate PDF.");
    }
  }

  const openEditView = (sale) => {
    const loadedItems = Array.isArray(sale.items) ? sale.items : [];
    setFormData({
      id: sale.id,
      phone_number: sale.phone_number || '',
      customer_name: sale.customer_name || '',
      doctor_name: sale.doctor_name || '',
      invoice_date: sale.invoice_date || '',
      is_issued: sale.is_issued || false,
      items: loadedItems 
    })
    setOriginalItems(JSON.parse(JSON.stringify(loadedItems)))
    setCurrentItem({ medicine_id: '', batch_id: '', qty: 1, rate: 0 })
    setActiveView('edit')
  }

  return (
    <div className="space-y-6 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
        <div className="flex items-center gap-3">
          <div className="flex bg-gray-200 p-1 rounded-lg ml-4">
            <button
              onClick={() => { 
                localStorage.removeItem('salesBillDraft'); 
                setFormData({ ...emptyForm }); 
                setOriginalItems([]);
                setCurrentItem({ medicine_id: '', batch_id: '', qty: 1, rate: 0 }); 
                setActiveView('create'); 
              }}
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
                    {uniqueMedicines.map((med, idx) => (
                      <option key={idx} value={med} />
                    ))}
                  </datalist>
                </div>
                
                <div className="w-48">
                  <label className="block text-xs text-gray-500 mb-1">Batch ID</label>
                  <select 
                    className="w-full border p-2 rounded bg-white text-sm" 
                    value={currentItem.batch_id} 
                    onChange={handleBatchChange}
                  >
                    <option value="">Select Batch</option>
                    {availableBatches.map((b, idx) => {
                      const batchId = b.batch_number || b.batch_id || b.id;
                      
                      const originalQty = originalItems
                        .filter(item => String(item.batch_id) === String(batchId))
                        .reduce((sum, item) => sum + Number(item.qty), 0);
                      
                      const inCart = safeItems
                        .filter(item => String(item.batch_id) === String(batchId))
                        .reduce((sum, item) => sum + Number(item.qty), 0);
                        
                      const rawStock = Number(b.stock_qty || b.available_stock || 0);
                      const displayStock = (rawStock + originalQty) - inCart; 

                      return (
                        <option key={idx} value={batchId}>
                          {batchId} (Qty: {displayStock})
                        </option>
                      )
                    })}
                  </select>
                </div>

                <div className="w-24">
                  <label className="block text-xs text-gray-500 mb-1">Quantity</label>
                  <input type="number" min="1" className="w-full border p-2 rounded" value={currentItem.qty} onChange={e => setCurrentItem({...currentItem, qty: Number(e.target.value)})} />
                </div>
                <div className="w-32">
                  <label className="block text-xs text-gray-500 mb-1">Rate</label>
                  <input type="number" className="w-full border p-2 rounded bg-gray-50" readOnly value={currentItem.rate} />
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