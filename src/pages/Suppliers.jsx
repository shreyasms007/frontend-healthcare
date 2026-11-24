import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ACCOUNT_DATABASE } from '../data/accountDatabase.js';
import { API_BASE } from '../config.js';

export default function AccountMaster() {
  const navigate = useNavigate();

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
      (acc) => acc.name.toLowerCase() === selectedName.trim().toLowerCase()
    );

    if (matchedAccount) {
      setFormData((prev) => ({
        ...prev,
        name: matchedAccount.name,
        code: matchedAccount.code ?? prev.code,
        acBank: matchedAccount.acBank ?? prev.acBank,
        acNumber: matchedAccount.acNumber ?? prev.acNumber,
        ifscCode: matchedAccount.ifscCode ?? prev.ifscCode,
        fullAddress: matchedAccount.fullAddress ?? prev.fullAddress,
        city: matchedAccount.city ?? prev.city,
        gstnNo: matchedAccount.gstnNo ?? prev.gstnNo,
      }));
    } else {
      setFormData((prev) => ({ ...prev, name: selectedName }));
    }
  };

  const handleSubmit = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/suppliers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        alert('Account Master saved successfully!');
        setFormData(initialState);
      } else {
        alert('Failed to save account. Please check the backend connection.');
      }
    } catch (error) {
      console.error('Error saving:', error);
      alert('Network error occurred.');
    }
  };

  return (
    <div className="space-y-6 text-sm">
      <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">

        {/* PREMIUM HEADER */}
        <div className="bg-[#0B162C] text-white px-6 py-4 flex justify-between items-center border-b border-[#1A2C4E]">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-extrabold uppercase tracking-widest m-0">Account Master</h1>
            <button
              onClick={() => navigate('/suppliers-list')}
              className="bg-teal-500/20 hover:bg-teal-500/40 text-teal-300 border border-teal-500/30 text-xs font-bold py-1.5 px-4 rounded-lg transition-all duration-200"
            >
              View Suppliers List
            </button>
          </div>
          <button className="bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-lg shadow-teal-500/20">
            GST Update Utility Enabled
          </button>
        </div>

        <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-10 bg-slate-50">

          {/* LEFT COLUMN */}
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm transition-shadow hover:shadow-md">
              <div className="mb-5">
                <label className="block text-xs text-slate-500 mb-1.5 font-bold uppercase tracking-wider">A/c Code</label>
                <div className="flex gap-5 items-center">
                  <input
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleInputChange}
                    className="border border-slate-300 p-2.5 rounded-lg w-1/3 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all font-mono font-bold text-slate-700"
                  />
                  <label className="flex items-center gap-2 text-sm text-slate-600 font-semibold cursor-pointer hover:text-slate-800">
                    <input type="checkbox" className="accent-teal-600 w-4 h-4" /> Lock
                  </label>
                  <label className="flex items-center gap-2 text-sm text-rose-500 font-semibold cursor-pointer hover:text-rose-600">
                    <input type="checkbox" className="accent-rose-500 w-4 h-4" /> Inactive
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-500 mb-1.5 font-bold uppercase tracking-wider">
                  A/c Name (Company / Distributor) *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleNameChange}
                  list="account-suggestions"
                  autoComplete="off"
                  className="border-2 border-teal-500/40 p-2.5 rounded-lg w-full focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none transition-all font-bold text-slate-800"
                />
                <datalist id="account-suggestions">
                  {ACCOUNT_DATABASE.map((acc, index) => (
                    <option key={index} value={acc.name} />
                  ))}
                </datalist>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex gap-5 mb-5 text-sm font-bold text-teal-700 border-b border-slate-100 pb-4">
                <label className="flex items-center gap-2 cursor-pointer hover:text-teal-800">
                  <input type="checkbox" className="accent-teal-600 w-4 h-4" /> Allow Sales
                </label>
                <label className="flex items-center gap-2 cursor-pointer hover:text-teal-800">
                  <input type="checkbox" defaultChecked className="accent-teal-600 w-4 h-4" /> Allow Purchase
                </label>
                <select className="border border-slate-300 p-1.5 text-xs ml-auto rounded-md text-slate-700 font-semibold bg-slate-50 focus:outline-none">
                  <option>Other A/c</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-5 mb-5">
                <div>
                  <label className="block text-xs text-slate-500 mb-1.5 font-bold uppercase tracking-wider">A/c Bank</label>
                  <input
                    type="text"
                    name="acBank"
                    value={formData.acBank}
                    onChange={handleInputChange}
                    className="border border-slate-300 p-2.5 rounded-lg w-full focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1.5 font-bold uppercase tracking-wider">A/c No.</label>
                  <input
                    type="text"
                    name="acNumber"
                    value={formData.acNumber}
                    onChange={handleInputChange}
                    className="border border-slate-300 p-2.5 rounded-lg w-full focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs text-slate-500 mb-1.5 font-bold uppercase tracking-wider">IFSC Code</label>
                  <input
                    type="text"
                    name="ifscCode"
                    value={formData.ifscCode}
                    onChange={handleInputChange}
                    className="border border-slate-300 p-2.5 rounded-lg w-full focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1.5 font-bold uppercase tracking-wider">MICR</label>
                  <input
                    type="text"
                    name="micr"
                    value={formData.micr}
                    onChange={handleInputChange}
                    className="border border-slate-300 p-2.5 rounded-lg w-full focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm transition-shadow hover:shadow-md space-y-5">
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs text-slate-500 mb-1.5 font-bold uppercase tracking-wider">Bill Type</label>
                  <select
                    name="billType"
                    className="border border-slate-300 p-2.5 rounded-lg w-full focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none bg-white font-semibold"
                  >
                    <option>TAX</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1.5 font-bold uppercase tracking-wider">PAN No</label>
                  <input
                    type="text"
                    name="panNo"
                    value={formData.panNo}
                    onChange={handleInputChange}
                    className="border border-slate-300 p-2.5 rounded-lg w-full focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all font-mono uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-700 mb-1.5 font-extrabold uppercase tracking-wider">DL/TL No. 1</label>
                <input
                  type="text"
                  name="dlNo1"
                  value={formData.dlNo1}
                  onChange={handleInputChange}
                  placeholder="e.g. KA-HS1-201386"
                  className="border border-slate-300 p-2.5 rounded-lg w-full focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all font-mono bg-slate-50 focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-700 mb-1.5 font-extrabold uppercase tracking-wider">DL/TL No. 2</label>
                <input
                  type="text"
                  name="dlNo2"
                  value={formData.dlNo2}
                  onChange={handleInputChange}
                  placeholder="e.g. KA-HS1-201387"
                  className="border border-slate-300 p-2.5 rounded-lg w-full focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all font-mono bg-slate-50 focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1.5 font-bold uppercase tracking-wider">Addnl Lic No.</label>
                <input
                  type="text"
                  name="addnlLicNo"
                  value={formData.addnlLicNo}
                  onChange={handleInputChange}
                  className="border border-slate-300 p-2.5 rounded-lg w-full focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all"
                />
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm transition-shadow hover:shadow-md grid grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block text-slate-500 mb-1.5 font-bold uppercase tracking-wider">Credit Days</label>
                <input
                  type="text"
                  name="creditDays"
                  value={formData.creditDays}
                  onChange={handleInputChange}
                  className="border border-slate-300 p-2 rounded-lg w-full text-center"
                />
              </div>
              <div>
                <label className="block text-slate-500 mb-1.5 font-bold uppercase tracking-wider">Credit Limit</label>
                <input
                  type="text"
                  name="creditLimit"
                  value={formData.creditLimit}
                  onChange={handleInputChange}
                  className="border border-slate-300 p-2 rounded-lg w-full text-center"
                />
              </div>
              <div>
                <label className="block text-slate-500 mb-1.5 font-bold uppercase tracking-wider">Debit Days</label>
                <input
                  type="text"
                  name="debitDays"
                  value={formData.debitDays}
                  onChange={handleInputChange}
                  className="border border-slate-300 p-2 rounded-lg w-full text-center"
                />
              </div>
              <div>
                <label className="block text-slate-500 mb-1.5 font-bold uppercase tracking-wider">Debit Limit</label>
                <input
                  type="text"
                  name="debitLimit"
                  value={formData.debitLimit}
                  onChange={handleInputChange}
                  className="border border-slate-300 p-2 rounded-lg w-full text-center"
                />
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-5">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-5">
              <div>
                <label className="block text-xs text-slate-500 mb-1.5 font-bold uppercase tracking-wider">Full Address</label>
                <input
                  type="text"
                  name="fullAddress"
                  value={formData.fullAddress}
                  onChange={handleInputChange}
                  className="border border-slate-300 p-2.5 rounded-lg w-full focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs text-slate-500 mb-1.5 font-bold uppercase tracking-wider">City</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="border border-slate-300 p-2.5 rounded-lg w-full focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1.5 font-bold uppercase tracking-wider">Pin Code</label>
                  <input
                    type="text"
                    name="pinCode"
                    value={formData.pinCode}
                    onChange={handleInputChange}
                    className="border border-slate-300 p-2.5 rounded-lg w-full focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-5">
                <div>
                  <label className="block text-xs text-slate-500 mb-1.5 font-bold uppercase tracking-wider">Phone / Mobile *</label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="border border-slate-300 p-2.5 rounded-lg w-full focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1.5 font-bold uppercase tracking-wider">Contact Person</label>
                  <input
                    type="text"
                    name="contactPerson"
                    value={formData.contactPerson}
                    onChange={handleInputChange}
                    className="border border-slate-300 p-2.5 rounded-lg w-full focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1.5 font-bold uppercase tracking-wider">E-Mail</label>
                  <input
                    type="text"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="border border-slate-300 p-2.5 rounded-lg w-full focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5 pt-2">
                <div>
                  <label className="block text-xs text-slate-500 mb-1.5 font-bold uppercase tracking-wider">Area</label>
                  <input
                    type="text"
                    name="area"
                    value={formData.area}
                    onChange={handleInputChange}
                    className="border border-slate-300 p-2.5 rounded-lg w-full focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1.5 font-bold uppercase tracking-wider">Category</label>
                  <input
                    type="text"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="border border-slate-300 p-2.5 rounded-lg w-full focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            {/* GSTN & LICENCE CARD MATCHING SIDE PANEL (#0B162C / #070F1E + TEAL) */}
            <div className="bg-gradient-to-br from-[#0B162C] via-[#0B162C] to-[#070F1E] p-6 rounded-xl border border-teal-500/30 shadow-md space-y-5 relative overflow-hidden text-white">
              <div className="absolute top-0 left-0 w-1 h-full bg-teal-400"></div>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-extrabold text-teal-400 mb-1.5 uppercase tracking-wider">
                    GSTN (15-Digit)
                  </label>
                  <input
                    type="text"
                    name="gstnNo"
                    value={formData.gstnNo}
                    onChange={handleInputChange}
                    className="border border-[#1e3a70] p-2.5 rounded-lg w-full uppercase focus:ring-2 focus:ring-teal-400/40 focus:border-teal-400 outline-none transition-all font-mono bg-[#152a52] text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-teal-400 mb-1.5 font-bold uppercase tracking-wider">GST Type</label>
                  <select
                    name="gstType"
                    value={formData.gstType}
                    onChange={handleInputChange}
                    className="border border-[#1e3a70] p-2.5 rounded-lg w-full focus:ring-2 focus:ring-teal-400/40 focus:border-teal-400 outline-none bg-[#152a52] text-white font-semibold"
                  >
                    <option value="Registered">Registered</option>
                    <option value="Composition">Composition</option>
                    <option value="Unregistered">Unregistered</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs text-slate-300 mb-1.5 font-bold uppercase tracking-wider">DL/TL Valid Till</label>
                  <input
                    type="date"
                    className="border border-[#1e3a70] p-2.5 rounded-lg w-full focus:ring-2 focus:ring-teal-400/40 focus:border-teal-400 outline-none transition-all bg-[#152a52] text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1.5 font-bold uppercase tracking-wider">Food Licence (FSSAI)</label>
                  <input
                    type="text"
                    name="foodLicence"
                    value={formData.foodLicence}
                    onChange={handleInputChange}
                    className="border border-[#1e3a70] p-2.5 rounded-lg w-full focus:ring-2 focus:ring-teal-400/40 focus:border-teal-400 outline-none transition-all bg-[#152a52] text-white"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm mt-4 flex justify-between items-center">
              <div>
                <label className="block text-xs text-slate-500 mb-1.5 font-bold uppercase tracking-wider">Default Disc %</label>
                <input
                  type="text"
                  name="defaultDisc"
                  value={formData.defaultDisc}
                  onChange={handleInputChange}
                  className="border border-slate-300 p-2 rounded-lg w-24 text-center font-bold text-teal-700 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all"
                />
              </div>
              <div className="flex gap-5 text-sm items-center justify-end text-slate-600 font-semibold bg-slate-50 px-4 py-2 rounded-lg border border-slate-100">
                <label className="flex items-center gap-2 cursor-pointer hover:text-slate-900">
                  <input type="radio" name="paymentType" className="accent-teal-600 w-4 h-4" /> Cash
                </label>
                <label className="flex items-center gap-2 cursor-pointer hover:text-slate-900">
                  <input type="radio" name="paymentType" className="accent-teal-600 w-4 h-4" /> Card
                </label>
                <label className="flex items-center gap-2 cursor-pointer hover:text-slate-900">
                  <input type="radio" name="paymentType" defaultChecked className="accent-teal-600 w-4 h-4" /> Credit
                </label>
              </div>
            </div>

            <div className="flex justify-end pt-6 border-t border-slate-200 mt-6">
              <button
                onClick={handleSubmit}
                className="bg-[#0B162C] text-white px-8 py-3 rounded-lg font-bold hover:bg-[#152a52] transition-colors shadow-lg flex items-center gap-2 text-sm tracking-wide"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                F10 — Save Account Master
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}