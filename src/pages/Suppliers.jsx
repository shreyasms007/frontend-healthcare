import React, { useState } from 'react';
import { ACCOUNT_DATABASE } from '../data/accountDatabase.js'; 
// ADDED: Import your API base URL
import { API_BASE } from '../config.js'; 

export default function AccountMaster() {
  const initialState = {
    code: 'NEW',
    name: '',
    acBank: '',
    acNumber: '0',
    ifscCode: '0',
    micr: '0',
    fullAddress: '',
    city: '',
    pinCode: '',
    phone: '',
    contactPerson: '',
    email: '',
    area: 'UNSURE-DEFAULT',
    category: 'RETAILER-DEFAULT',
    gstnNo: '29AAAAA0000A1Z5',
    gstType: 'Registered',
    dlNo1: '',
    dlNo2: '',
    addnlLicNo: '0',
    panNo: '',
    foodLicence: '',
    defaultDisc: '0',
    creditDays: '0',
    creditLimit: '0',
    debitDays: '0',
    debitLimit: '0',
  };

  const [formData, setFormData] = useState(initialState);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNameChange = (e) => {
    const selectedName = e.target.value;
    const matchedAccount = ACCOUNT_DATABASE.find(
      (acc) => acc.name.toLowerCase() === selectedName.toLowerCase()
    );

    if (matchedAccount) {
      setFormData((prev) => ({
        ...prev,
        name: matchedAccount.name,
        code: matchedAccount.code || 'NEW',
        acBank: matchedAccount.acBank || '',
        acNumber: matchedAccount.acNumber || '0',
        ifscCode: matchedAccount.ifscCode || '0',
        fullAddress: matchedAccount.fullAddress || '',
        city: matchedAccount.city || '',
        gstnNo: matchedAccount.gstnNo || '29AAAAA0000A1Z5'
      }));
    } else {
      setFormData((prev) => ({ ...prev, name: selectedName }));
    }
  };

  // ADDED: The function to handle saving data to the backend
  const handleSubmit = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/suppliers`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        alert('Account Master saved successfully!');
        setFormData(initialState); // Clear form after save
      } else {
        alert('Failed to save account. Please check the backend connection.');
      }
    } catch (error) {
      console.error('Error saving:', error);
      alert('Network error occurred.');
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen font-sans">
      <div className="bg-white rounded-lg shadow border border-gray-200">
        
        {/* Header */}
        <div className="bg-hospital-navy text-white px-6 py-3 rounded-t-lg font-bold flex justify-between items-center">
          <span>Account Master — New / Modify</span>
          <button className="bg-teal-500 hover:bg-teal-600 px-3 py-1 rounded text-sm transition shadow-sm">
            GST Update Utility Enabled
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* LEFT COLUMN */}
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded border border-gray-200 shadow-sm">
              <div className="mb-4">
                <label className="block text-sm text-gray-600 mb-1 font-semibold">A/c Code</label>
                <div className="flex gap-4 items-center">
                  <input 
                    type="text" 
                    name="code"
                    value={formData.code} 
                    onChange={handleInputChange}
                    className="border p-2 rounded w-1/3 focus:ring-1 focus:ring-teal-500 outline-none" 
                  />
                  <label className="flex items-center gap-1 text-sm"><input type="checkbox" /> Lock</label>
                  <label className="flex items-center gap-1 text-sm text-red-600"><input type="checkbox" /> Inactive</label>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1 font-semibold">A/c Name (Company / Distributor) *</label>
                <input 
                  type="text" 
                  name="name"
                  value={formData.name}
                  onChange={handleNameChange}
                  list="account-suggestions"
                  autoComplete="off"
                  className="border p-2 rounded w-full border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none shadow-sm" 
                />
                <datalist id="account-suggestions">
                  {ACCOUNT_DATABASE.map((acc, index) => (
                    <option key={index} value={acc.name} />
                  ))}
                </datalist>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded border border-gray-200 shadow-sm">
              <div className="flex gap-4 mb-4 text-sm font-bold text-teal-700">
                <label className="flex items-center gap-1"><input type="checkbox" /> Allow Sales</label>
                <label className="flex items-center gap-1"><input type="checkbox" defaultChecked /> Allow Purchase</label>
                <select className="border p-1 text-sm ml-auto rounded text-gray-700"><option>Other A/c</option></select>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1 font-semibold">A/c Bank</label>
                  <input 
                    type="text" 
                    name="acBank"
                    value={formData.acBank} 
                    onChange={handleInputChange}
                    className="border p-2 rounded w-full focus:ring-1 focus:ring-teal-500 outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1 font-semibold">A/c No.</label>
                  <input 
                    type="text" 
                    name="acNumber"
                    value={formData.acNumber} 
                    onChange={handleInputChange}
                    className="border p-2 rounded w-full focus:ring-1 focus:ring-teal-500 outline-none" 
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1 font-semibold">IFSC Code</label>
                  <input 
                    type="text" 
                    name="ifscCode"
                    value={formData.ifscCode} 
                    onChange={handleInputChange}
                    className="border p-2 rounded w-full focus:ring-1 focus:ring-teal-500 outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1 font-semibold">MICR</label>
                  <input 
                    type="text" 
                    name="micr"
                    value={formData.micr} 
                    onChange={handleInputChange}
                    className="border p-2 rounded w-full focus:ring-1 focus:ring-teal-500 outline-none" 
                  />
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded border border-gray-200 shadow-sm space-y-4">
               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1 font-semibold">Bill Type</label>
                    <select name="billType" className="border p-2 rounded w-full focus:ring-1 focus:ring-teal-500 outline-none">
                      <option>TAX</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1 font-semibold">PAN No</label>
                    <input 
                      type="text" 
                      name="panNo"
                      value={formData.panNo} 
                      onChange={handleInputChange}
                      className="border p-2 rounded w-full focus:ring-1 focus:ring-teal-500 outline-none" 
                    />
                  </div>
               </div>
               
               <div>
                  <label className="block text-sm text-gray-800 mb-1 font-bold">DL/TL No. 1</label>
                  <input type="text" name="dlNo1" value={formData.dlNo1} onChange={handleInputChange} placeholder="e.g. KA-HS1-201386" className="border p-2 rounded w-full focus:ring-1 focus:ring-teal-500 outline-none" />
               </div>
               <div>
                  <label className="block text-sm text-gray-800 mb-1 font-bold">DL/TL No. 2</label>
                  <input type="text" name="dlNo2" value={formData.dlNo2} onChange={handleInputChange} placeholder="e.g. KA-HS1-201387" className="border p-2 rounded w-full focus:ring-1 focus:ring-teal-500 outline-none" />
               </div>
               <div>
                  <label className="block text-sm text-gray-600 mb-1 font-semibold">Addnl Lic No.</label>
                  <input type="text" name="addnlLicNo" value={formData.addnlLicNo} onChange={handleInputChange} className="border p-2 rounded w-full focus:ring-1 focus:ring-teal-500 outline-none" />
               </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded border border-gray-200 shadow-sm grid grid-cols-4 gap-2 text-xs">
                <div>
                    <label className="block text-gray-600 mb-1">Credit Days</label>
                    <input type="text" name="creditDays" value={formData.creditDays} onChange={handleInputChange} className="border p-2 rounded w-full" />
                </div>
                <div>
                    <label className="block text-gray-600 mb-1">Credit Limit</label>
                    <input type="text" name="creditLimit" value={formData.creditLimit} onChange={handleInputChange} className="border p-2 rounded w-full" />
                </div>
                <div>
                    <label className="block text-gray-600 mb-1">Debit Days</label>
                    <input type="text" name="debitDays" value={formData.debitDays} onChange={handleInputChange} className="border p-2 rounded w-full" />
                </div>
                <div>
                    <label className="block text-gray-600 mb-1">Debit Limit</label>
                    <input type="text" name="debitLimit" value={formData.debitLimit} onChange={handleInputChange} className="border p-2 rounded w-full" />
                </div>
            </div>

          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1 font-semibold">Full Address</label>
              <input 
                type="text" 
                name="fullAddress"
                value={formData.fullAddress} 
                onChange={handleInputChange}
                className="border p-2 rounded w-full focus:ring-1 focus:ring-teal-500 outline-none" 
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1 font-semibold">City</label>
                <input 
                  type="text" 
                  name="city"
                  value={formData.city} 
                  onChange={handleInputChange}
                  className="border p-2 rounded w-full focus:ring-1 focus:ring-teal-500 outline-none" 
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1 font-semibold">Pin Code</label>
                <input 
                  type="text" 
                  name="pinCode"
                  value={formData.pinCode} 
                  onChange={handleInputChange}
                  className="border p-2 rounded w-full focus:ring-1 focus:ring-teal-500 outline-none" 
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1 font-semibold">Phone / Mobile *</label>
                <input type="text" name="phone" value={formData.phone} onChange={handleInputChange} className="border p-2 rounded w-full focus:ring-1 focus:ring-teal-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1 font-semibold">Contact Person</label>
                <input type="text" name="contactPerson" value={formData.contactPerson} onChange={handleInputChange} className="border p-2 rounded w-full focus:ring-1 focus:ring-teal-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1 font-semibold">E-Mail</label>
                <input type="text" name="email" value={formData.email} onChange={handleInputChange} className="border p-2 rounded w-full focus:ring-1 focus:ring-teal-500 outline-none" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pb-2">
              <div>
                <label className="block text-sm text-gray-600 mb-1 font-semibold">Area</label>
                <input type="text" name="area" value={formData.area} onChange={handleInputChange} className="border p-2 rounded w-full focus:ring-1 focus:ring-teal-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1 font-semibold">Category</label>
                <input type="text" name="category" value={formData.category} onChange={handleInputChange} className="border p-2 rounded w-full focus:ring-1 focus:ring-teal-500 outline-none" />
              </div>
            </div>

            <div className="bg-teal-50 p-4 rounded border border-teal-200 mt-2 shadow-sm space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-teal-700 mb-1">GSTN (15-Digit)</label>
                  <input 
                    type="text" 
                    name="gstnNo"
                    value={formData.gstnNo} 
                    onChange={handleInputChange}
                    className="border p-2 rounded w-full uppercase focus:ring-1 focus:ring-teal-500 outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1 font-semibold">GST Type</label>
                  <select name="gstType" className="border p-2 rounded w-full focus:ring-1 focus:ring-teal-500 outline-none">
                     <option>Registered</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                  <label className="block text-sm text-gray-600 mb-1 font-semibold">DL/TL Valid Till</label>
                  <input type="date" className="border p-2 rounded w-full focus:ring-1 focus:ring-teal-500 outline-none" />
                 </div>
                 <div>
                  <label className="block text-sm text-gray-600 mb-1 font-semibold">Food Licence (FSSAI)</label>
                  <input type="text" name="foodLicence" value={formData.foodLicence} onChange={handleInputChange} className="border p-2 rounded w-full focus:ring-1 focus:ring-teal-500 outline-none" />
                 </div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded border border-gray-200 shadow-sm mt-4 grid grid-cols-2 items-center">
               <div>
                  <label className="block text-sm text-gray-600 mb-1">Default Disc %</label>
                  <input type="text" name="defaultDisc" value={formData.defaultDisc} onChange={handleInputChange} className="border p-2 rounded w-24" />
               </div>
               <div className="flex gap-4 text-sm items-center justify-end text-gray-700">
                  <label className="flex items-center gap-1"><input type="radio" name="paymentType" /> Cash</label>
                  <label className="flex items-center gap-1"><input type="radio" name="paymentType" /> Card</label>
                  <label className="flex items-center gap-1"><input type="radio" name="paymentType" defaultChecked /> Credit</label>
               </div>
            </div>
            
            <div className="flex justify-end pt-4">
               {/* ADDED: onClick={handleSubmit} to trigger the function */}
               <button onClick={handleSubmit} className="bg-teal-600 text-white px-6 py-2 rounded font-bold hover:bg-teal-700 transition shadow">
                  F10 — Save Account Master
               </button>
            </div>
            
          </div>
        </div>
        
        {/* Table Mockup based on screenshot */}
        <div className="p-6 border-t mt-4">
           <div className="bg-gray-50 p-4 rounded border">
              <h3 className="font-bold text-gray-700 mb-4">Registered Accounts Directory</h3>
              <table className="w-full text-left text-sm border-collapse">
                 <thead className="bg-hospital-navy text-white">
                    <tr>
                       <th className="p-2">Code</th>
                       <th className="p-2">Company Name</th>
                       <th className="p-2">DL/TL No. 1</th>
                       <th className="p-2">GSTN</th>
                       <th className="p-2">Phone</th>
                       <th className="p-2">City</th>
                       <th className="p-2 text-center">Mode</th>
                    </tr>
                 </thead>
                 <tbody>
                    <tr className="border-b">
                       <td className="p-2">RAJASTAN</td>
                       <td className="p-2 font-bold text-hospital-navy">RAJASTHAN PHARMACY</td>
                       <td className="p-2">FSDKHBFSD5161616</td>
                       <td className="p-2">BFJEBFJEWBF516565156</td>
                       <td className="p-2">616656515621</td>
                       <td className="p-2">HASSAN</td>
                       <td className="p-2 text-center"><span className="text-teal-600 border border-teal-200 px-2 py-0.5 rounded text-xs bg-teal-50">Cash</span></td>
                    </tr>
                    <tr className="border-b">
                       <td className="p-2">657YF</td>
                       <td className="p-2 font-bold text-hospital-navy">SJS medicals</td>
                       <td className="p-2">F32R3</td>
                       <td className="p-2">QWE1</td>
                       <td className="p-2">QE12RG</td>
                       <td className="p-2">ARASIKERE</td>
                       <td className="p-2 text-center"><span className="text-teal-600 border border-teal-200 px-2 py-0.5 rounded text-xs bg-teal-50">Cash</span></td>
                    </tr>
                 </tbody>
              </table>
           </div>
        </div>

      </div>
    </div>
  );
}