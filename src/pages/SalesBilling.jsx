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

  const availableBatches = useMemo(() => {
    return inventory.filter(inv => {
      const isMatch = (inv.medicine_name === currentItem.medicine_id) || 
                      (inv.item_name === currentItem.medicine_id) || 
                      (inv.name === currentItem.medicine_id);
      
      if (!isMatch) return false;

      const batchId = String(inv.batch_number || inv.batch_id || inv.id);
      const isInCart = safeItems.some(item => String(item.batch_id) === batchId);
      
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
          <h2 className="text-xl font-bold text-hospital-navy tracking-wide uppercase">SALES BILLING</h2>
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
                activeView === 'create' ? 'bg-hospital-navy text-white shadow' : 'text-gray-600 hover:text-hospital-navy'
              }`}
            >
              + New Bill
            </button>
            <button
              onClick={() => setActiveView('list')}
              className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
                activeView === 'list' ? 'bg-hospital-navy text-white shadow' : 'text-gray-600 hover:text-hospital-navy'
              }`}
            >
              📋 Customers / Sales Ledger
            </button>
            {activeView === 'edit' && (
              <button className="px-4 py-1.5 rounded-md text-xs font-bold bg-amber-500 text-white shadow cursor-default ml-2">
                ✏️ Editing {formData.is_issued ? 'Issued Invoice' : 'Open Bill'} #{formData.id}
              </button>
            )}
          </div>
        </div>
        <div className="text-xs text-gray-500 font-medium">State Code: 29 (Karnataka)</div>
      </div>

      {(activeView === 'create' || activeView === 'edit') && (
        <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
          <div className="bg-[#0B162C] text-white px-6 py-4 flex justify-between items-center border-b border-[#1A2C4E]">
            <span className="text-lg font-extrabold uppercase tracking-widest">
              {activeView === 'create' ? 'New Sales Counter Bill' : `Edit Bill - Phone: ${formData.phone_number}`}
            </span>
            {formData.is_issued && <span className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 px-3 py-1 text-xs font-bold rounded-lg shadow-inner">ISSUED</span>}
          </div>

          <div className="p-8 space-y-8 bg-slate-50">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm transition-shadow hover:shadow-md">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs text-slate-500 mb-1.5 font-bold uppercase tracking-wider">Phone Number *</label>
                  <input 
                    type="text" 
                    name="phone_number" 
                    value={formData.phone_number} 
                    onChange={handlePhoneChange} 
                    list="phone-suggestions"
                    autoComplete="off"
                    className="border border-slate-300 p-2.5 rounded-lg w-full focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all font-bold text-slate-800" 
                    required 
                  />
                  <datalist id="phone-suggestions">
                    {uniquePhones.map((phone, idx) => (
                      <option key={idx} value={phone} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1.5 font-bold uppercase tracking-wider">Customer Name</label>
                  <input 
                    type="text" 
                    name="customer_name" 
                    value={formData.customer_name} 
                    onChange={handleInputChange} 
                    className="border border-slate-300 p-2.5 rounded-lg w-full focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all" 
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1.5 font-bold uppercase tracking-wider">Prescribing Doctor</label>
                  <input 
                    type="text" 
                    name="doctor_name" 
                    value={formData.doctor_name} 
                    onChange={handleInputChange} 
                    className="border border-slate-300 p-2.5 rounded-lg w-full focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all" 
                  />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm transition-shadow hover:shadow-md">
              <h4 className="font-extrabold text-teal-800 border-b border-slate-100 pb-3 mb-5 uppercase tracking-wide">Billing Line Items</h4>
              <div className="flex gap-4 items-end mb-6 bg-slate-50 p-4 rounded-lg border border-slate-100">
                <div className="flex-1">
                  <label className="block text-xs text-slate-500 mb-1.5 font-bold uppercase tracking-wider">Medicine / Item</label>
                  <input 
                    type="text" 
                    className="border border-slate-300 p-2.5 rounded-lg w-full focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all font-bold text-slate-700" 
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
                
                <div className="w-56">
                  <label className="block text-xs text-slate-500 mb-1.5 font-bold uppercase tracking-wider">Batch ID</label>
                  <select 
                    className="border border-slate-300 p-2.5 rounded-lg w-full focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all bg-white font-mono" 
                    value={currentItem.batch_id} 
                    onChange={handleBatchChange}
                  >
                    <option value="">Select Batch</option>
                    {availableBatches.map((b, idx) => {
                      const batchId = b.batch_number || b.batch_id || b.id;
                      const originalQty = originalItems.filter(item => String(item.batch_id) === String(batchId)).reduce((sum, item) => sum + Number(item.qty), 0);
                      const inCart = safeItems.filter(item => String(item.batch_id) === String(batchId)).reduce((sum, item) => sum + Number(item.qty), 0);
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
                  <label className="block text-xs text-slate-500 mb-1.5 font-bold uppercase tracking-wider">Quantity</label>
                  <input type="number" min="1" className="border border-slate-300 p-2.5 rounded-lg w-full focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all text-center font-bold text-slate-800" value={currentItem.qty} onChange={e => setCurrentItem({...currentItem, qty: Number(e.target.value)})} />
                </div>
                <div className="w-32">
                  <label className="block text-xs text-slate-500 mb-1.5 font-bold uppercase tracking-wider">Rate</label>
                  <input type="number" className="border border-slate-200 p-2.5 rounded-lg w-full bg-slate-100 text-slate-500 font-mono text-right" readOnly value={currentItem.rate} />
                </div>
                <button type="button" onClick={handleAddItem} className="bg-hospital-navy text-white px-6 py-2.5 rounded-lg font-bold hover:bg-[#152a52] transition-colors shadow-md">Add</button>
              </div>

              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-[#0B162C] text-white">
                    <tr>
                      <th className="p-3 font-bold tracking-wider text-xs uppercase">Medicine</th>
                      <th className="p-3 font-bold tracking-wider text-xs uppercase text-center">Batch ID</th>
                      <th className="p-3 font-bold tracking-wider text-xs uppercase text-center">Qty</th>
                      <th className="p-3 font-bold tracking-wider text-xs uppercase text-right">Rate</th>
                      <th className="p-3 font-bold tracking-wider text-xs uppercase text-right">Amount</th>
                      <th className="p-3 font-bold tracking-wider text-xs uppercase text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {safeItems.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 font-extrabold text-slate-800">{item.medicine_id}</td>
                        <td className="p-3 text-center font-mono text-slate-600">{item.batch_id}</td>
                        <td className="p-3 text-center font-bold text-slate-700">{item.qty}</td>
                        <td className="p-3 text-right text-slate-500 font-mono">₹{Number(item.rate || 0).toFixed(2)}</td>
                        <td className="p-3 text-right font-extrabold text-teal-700 font-mono">₹{Number((item.qty * item.rate) || 0).toFixed(2)}</td>
                        <td className="p-3 text-center">
                          <button onClick={() => handleRemoveItem(idx)} className="text-rose-500 font-bold hover:text-rose-700 bg-rose-50 px-2 py-1 rounded transition-colors">X</button>
                        </td>
                      </tr>
                    ))}
                    {safeItems.length === 0 && <tr><td colSpan="6" className="p-8 text-center text-slate-400 font-medium">No items added to the bill yet.</td></tr>}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-end mt-6 text-2xl font-extrabold text-[#0B162C] tracking-tight">
                Total: <span className="ml-2 text-teal-600">₹{calculateTotal().toFixed(2)}</span>
              </div>
            </div>

            <div className="flex justify-end gap-4 border-t border-slate-200 pt-6">
              <button type="button" onClick={() => handleSave(false)} className="bg-white border-2 border-[#0B162C] text-[#0B162C] px-8 py-3 rounded-lg font-bold hover:bg-slate-50 transition-colors shadow-sm">
                Park / Save Open Bill
              </button>
              
              <button type="button" onClick={handlePrint} className="bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white px-8 py-3 rounded-lg font-bold transition-all shadow-lg shadow-teal-500/20 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print & Finalize Bill
              </button>
            </div>
          </div>
        </div>
      )}

      {activeView === 'list' && (
        <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
          <div className="p-5 bg-slate-50 border-b border-slate-200 flex flex-wrap gap-4">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <input type="text" placeholder="Search Phone Number..." value={searchPhone} onChange={e => setSearchPhone(e.target.value)} className="w-full border border-slate-300 p-2.5 pl-10 rounded-lg text-sm bg-white shadow-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all font-mono" />
              <span className="absolute left-3.5 top-3 text-slate-400">📞</span>
            </div>
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <input type="text" placeholder="Search Customer Name..." value={searchName} onChange={e => setSearchName(e.target.value)} className="w-full border border-slate-300 p-2.5 pl-10 rounded-lg text-sm bg-white shadow-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all" />
              <span className="absolute left-3.5 top-3 text-slate-400">👤</span>
            </div>
          </div>

          <div className="overflow-x-auto max-h-[650px] overflow-y-auto custom-scrollbar">
            <table className="w-full text-left border-collapse text-sm">
              <thead className="bg-[#0B162C] text-white sticky top-0 z-10">
                <tr>
                  <th className="p-4 font-bold tracking-wider uppercase text-xs">Inv ID</th>
                  <th className="p-4 font-bold tracking-wider uppercase text-xs">Phone Number</th>
                  <th className="p-4 font-bold tracking-wider uppercase text-xs">Customer Name</th>
                  <th className="p-4 font-bold tracking-wider uppercase text-xs text-right">Total Amount</th>
                  <th className="p-4 font-bold tracking-wider uppercase text-xs text-center">Status</th>
                  <th className="p-4 font-bold tracking-wider uppercase text-xs text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-mono text-slate-500 font-bold">{sale.invoice_number || `#${sale.id}`}</td>
                    <td className="p-4 font-bold text-[#0B162C] font-mono">{sale.phone_number}</td>
                    <td className="p-4 text-slate-700 font-medium">{sale.customer_name || '-'}</td>
                    <td className="p-4 text-right font-extrabold text-emerald-600 font-mono">₹{parseFloat(sale.total_amount || 0).toFixed(2)}</td>
                    <td className="p-4 text-center">
                      {sale.is_issued ? (
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-md text-[11px] font-bold tracking-wide">ISSUED</span>
                      ) : (
                        <span className="bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1 rounded-md text-[11px] font-bold tracking-wide">OPEN</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <button onClick={() => openEditView(sale)} className="bg-white text-teal-700 hover:bg-teal-50 hover:text-teal-800 border border-teal-200 px-4 py-1.5 rounded-md font-bold text-xs transition-colors shadow-sm">
                        View / Edit Bill
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredSales.length === 0 && (
                  <tr>
                    <td colSpan="6" className="p-10 text-center text-slate-500 font-medium">
                      No sales records match your search criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}