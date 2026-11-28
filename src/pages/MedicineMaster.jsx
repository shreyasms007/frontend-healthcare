import { useState, useEffect, useMemo } from 'react'
import { MEDICINE_DATABASE, DEFAULT_GROUPS, DEFAULT_SCHEDULES } from '../data/medicineDatabase'
import { ACCOUNT_DATABASE } from '../data/accountDatabase'
import { API_BASE } from '../config.js';

export default function MedicineMaster() {
  const emptyForm = {
    id: null,
    name: '',
    manufacturer: '',
    brand_name: '',
    major_content: '',
    packing: '',
    qty_per_pack: 1,
    group: '',
    item_category: '',
    profile_category: '',
    schedule: '',
    barcode: '',
    rack: '',
    hsn_code: '',
    gst_pct: 0,
    cess_pct: 0,
    wholesale_rate: 0,
    min_qty: 0,
    max_qty: 0,
    requires_license: false,
    is_active: true,
    note: ''
  }

  const [activeTab, setActiveTab] = useState('form') // 'form' | 'catalog'
  const [formData, setFormData] = useState({ ...emptyForm })
  const [medicines, setMedicines] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    fetchMedicines()
  }, [])

  const fetchMedicines = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/medicines`)
      if (res.ok) {
        const data = await res.json()
        setMedicines(data || [])
      }
    } catch (err) {
      console.error('Failed to fetch medicines:', err)
    }
  }

  const uniqueSuggestions = useMemo(() => {
    const names = new Set()
    const suggestions = []

    medicines.forEach(m => {
      if (m.name && !names.has(m.name)) {
        names.add(m.name)
        suggestions.push(m.name)
      }
    })

    if (Array.isArray(ACCOUNT_DATABASE)) {
      ACCOUNT_DATABASE.forEach(m => {
        const name = typeof m === 'string' ? m : m.name
        if (name && !names.has(name)) {
          names.add(name)
          suggestions.push(name)
        }
      })
    }

    if (Array.isArray(MEDICINE_DATABASE)) {
      MEDICINE_DATABASE.forEach(m => {
        const name = typeof m === 'string' ? m : m.name
        if (name && !names.has(name)) {
          names.add(name)
          suggestions.push(name)
        }
      })
    }

    return suggestions
  }, [medicines])

  const uniqueGroupSuggestions = useMemo(() => {
    const groupSet = new Set(DEFAULT_GROUPS || [])
    medicines.forEach(m => {
      if (m.group && m.group.trim()) {
        groupSet.add(m.group.trim().toUpperCase())
      }
    })
    return Array.from(groupSet).sort()
  }, [medicines])

  const uniqueScheduleSuggestions = useMemo(() => {
    const scheduleSet = new Set(DEFAULT_SCHEDULES || [])
    medicines.forEach(m => {
      if (m.schedule && m.schedule.trim()) {
        scheduleSet.add(m.schedule.trim().toUpperCase())
      }
    })
    return Array.from(scheduleSet).sort()
  }, [medicines])

  const handleNameChange = (e) => {
    const selectedName = e.target.value;
    
    setFormData(prev => ({
      ...prev,
      name: selectedName
    }));

    if (isEditing) {
      return; 
    }

    const normalizedName = selectedName.trim().toLowerCase();
    if (!normalizedName) return;
    
    const foundInDb = medicines.find(m => (m.name || '').trim().toLowerCase() === normalizedName);
    
    if (foundInDb) {
      setFormData({
        id: foundInDb.id,
        name: selectedName, 
        manufacturer: foundInDb.manufacturer || '',
        brand_name: foundInDb.brand_name || '',
        major_content: foundInDb.major_content || '',
        packing: foundInDb.packing || '',
        qty_per_pack: foundInDb.qty_per_pack || 1,
        group: foundInDb.group || '',
        item_category: foundInDb.item_category || '',
        profile_category: foundInDb.profile_category || '',
        schedule: foundInDb.schedule || '',
        barcode: foundInDb.barcode || '',
        rack: foundInDb.rack || '',
        hsn_code: foundInDb.hsn_code || '',
        gst_pct: foundInDb.gst_pct || 0,
        cess_pct: foundInDb.cess_pct || 0,
        wholesale_rate: foundInDb.wholesale_rate || 0,
        min_qty: foundInDb.min_qty || 0,
        max_qty: foundInDb.max_qty || 0,
        requires_license: !!foundInDb.requires_license,
        is_active: foundInDb.is_active !== undefined ? foundInDb.is_active : true,
        note: foundInDb.note || ''
      });
      setIsEditing(true);
      return;
    }

    const checkStaticMatch = (m) => {
      const mName = typeof m === 'string' ? m : (m.name || '');
      return mName.trim().toLowerCase() === normalizedName;
    };

    let foundInStatic = null;
    if (Array.isArray(MEDICINE_DATABASE)) foundInStatic = MEDICINE_DATABASE.find(checkStaticMatch);
    if (!foundInStatic && Array.isArray(ACCOUNT_DATABASE)) foundInStatic = ACCOUNT_DATABASE.find(checkStaticMatch);

    if (foundInStatic && typeof foundInStatic === 'object') {
      setFormData(prev => ({
        ...prev,
        id: null,
        manufacturer: foundInStatic.manufacturer || prev.manufacturer,
        brand_name: foundInStatic.brandName || foundInStatic.brand_name || prev.brand_name,
        major_content: foundInStatic.composition || foundInStatic.major_content || prev.major_content,
        packing: foundInStatic.packing || prev.packing,
        group: foundInStatic.group || prev.group,
        item_category: foundInStatic.itemCategory || foundInStatic.item_category || prev.item_category,
        barcode: foundInStatic.code || foundInStatic.barcode || prev.barcode
      }));
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleEdit = (med) => {
    setFormData({
      id: med.id,
      name: med.name || '',
      manufacturer: med.manufacturer || '',
      brand_name: med.brand_name || '',
      major_content: med.major_content || '',
      packing: med.packing || '',
      qty_per_pack: med.qty_per_pack || 1,
      group: med.group || '',
      item_category: med.item_category || '',
      profile_category: med.profile_category || '',
      schedule: med.schedule || '',
      barcode: med.barcode || '',
      rack: med.rack || '',
      hsn_code: med.hsn_code || '',
      gst_pct: med.gst_pct || 0,
      cess_pct: med.cess_pct || 0,
      wholesale_rate: med.wholesale_rate || 0,
      min_qty: med.min_qty || 0,
      max_qty: med.max_qty || 0,
      requires_license: !!med.requires_license,
      is_active: med.is_active !== undefined ? med.is_active : true,
      note: med.note || ''
    })
    setIsEditing(true)
    setActiveTab('form')
  }

  const handleCancelEdit = () => {
    setFormData({ ...emptyForm })
    setIsEditing(false)
    setActiveTab('catalog')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const parsedMin = parseInt(formData.min_qty, 10) || 0;
    const parsedMax = parseInt(formData.max_qty, 10) || 0;
    const parsedQtyPerPack = parseInt(formData.qty_per_pack, 10) || 1;

    if (parsedMax > 0 && parsedMin > parsedMax) {
      alert("Validation Error: Min Qty Alert cannot be greater than Max Qty Limit.");
      return; 
    }

    const payload = {
      ...formData,
      qty_per_pack: parsedQtyPerPack,
      gst_pct: parseFloat(formData.gst_pct) || 0,
      cess_pct: parseFloat(formData.cess_pct) || 0,
      wholesale_rate: parseFloat(formData.wholesale_rate) || 0,
      min_qty: parsedMin,
      max_qty: parsedMax
    }

    const method = isEditing ? 'PUT' : 'POST'

    try {
     const res = await fetch(`${API_BASE}/api/medicines`, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        alert(isEditing ? 'Medicine updated successfully!' : 'Medicine saved successfully!')
        setFormData({ ...emptyForm })
        setIsEditing(false)
        fetchMedicines()
        setActiveTab('catalog')
      } else {
        const errText = await res.text()
        alert('Operation failed: ' + errText)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const filteredMedicines = useMemo(() => {
    if (!searchTerm.trim()) return medicines
    const query = searchTerm.toLowerCase()
    return medicines.filter(m =>
      (m.name && m.name.toLowerCase().includes(query)) ||
      (m.manufacturer && m.manufacturer.toLowerCase().includes(query)) ||
      (m.group && m.group.toLowerCase().includes(query)) ||
      (m.schedule && m.schedule.toLowerCase().includes(query)) ||
      (m.major_content && m.major_content.toLowerCase().includes(query)) ||
      (m.rack && m.rack.toLowerCase().includes(query))
    )
  }, [medicines, searchTerm])

  return (
    <div className="space-y-6 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-hospital-navy tracking-wide uppercase">MEDICINE MASTER</h2>
          <div className="flex bg-gray-200 p-1 rounded-lg ml-4">
            <button
              type="button"
              onClick={() => {
                if (isEditing) handleCancelEdit()
                setActiveTab('form')
              }}
              className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
                activeTab === 'form'
                  ? 'bg-hospital-navy text-white shadow'
                  : 'text-gray-600 hover:text-hospital-navy'
              }`}
            >
              {isEditing ? 'Edit Medicine' : '+ Create Medicine'}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('catalog')}
              className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
                activeTab === 'catalog'
                  ? 'bg-hospital-navy text-white shadow'
                  : 'text-gray-600 hover:text-hospital-navy'
              }`}
            >
              📋 Medicine Catalog ({medicines.length})
            </button>
          </div>
        </div>

        <div className="text-xs text-gray-500 font-medium">
          State Code: 29 (Karnataka)
        </div>
      </div>

      {activeTab === 'form' && (
        <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
          <div className="bg-hospital-navy text-white px-6 py-4 flex justify-between items-center border-b border-[#1A2C4E]">
            <span className="text-lg font-extrabold uppercase tracking-widest">
              {isEditing ? `Edit Item Master: ${formData.name} (ID: #${formData.id})` : 'Create Item Master'}
            </span>
            {isEditing && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="bg-white/20 hover:bg-white/30 text-white text-xs px-4 py-2 rounded-lg transition"
              >
                Cancel Edit
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-8 bg-slate-50">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm transition-shadow hover:shadow-md">
              <h4 className="font-extrabold text-teal-800 border-b border-slate-100 pb-3 mb-5 uppercase tracking-wide">Basic Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs text-slate-500 mb-1.5 font-bold uppercase tracking-wider">Item Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleNameChange}
                    list="medicine-suggestions"
                    placeholder="Type to add new or select to edit"
                    className="border border-slate-300 p-2.5 rounded-lg w-full focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all font-bold text-slate-800"
                    autoComplete="off"
                    required
                  />
                  <datalist id="medicine-suggestions">
                    {uniqueSuggestions.map((medName, idx) => (
                      <option key={idx} value={medName} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1.5 font-bold uppercase tracking-wider">Manufacturer</label>
                  <input
                    type="text"
                    name="manufacturer"
                    value={formData.manufacturer}
                    onChange={handleInputChange}
                    className="border border-slate-300 p-2.5 rounded-lg w-full focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1.5 font-bold uppercase tracking-wider">Brand Name</label>
                  <input
                    type="text"
                    name="brand_name"
                    value={formData.brand_name}
                    onChange={handleInputChange}
                    className="border border-slate-300 p-2.5 rounded-lg w-full focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all"
                  />
                </div>
                <div className="md:col-span-3">
                  <label className="block text-xs text-slate-500 mb-1.5 font-bold uppercase tracking-wider">Major Content (Composition)</label>
                  <input
                    type="text"
                    name="major_content"
                    value={formData.major_content}
                    onChange={handleInputChange}
                    className="border border-slate-300 p-2.5 rounded-lg w-full focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all bg-slate-50 focus:bg-white"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm transition-shadow hover:shadow-md">
              <h4 className="font-extrabold text-teal-800 border-b border-slate-100 pb-3 mb-5 uppercase tracking-wide">Categorization & Packaging</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                  <label className="block text-xs text-slate-500 mb-1.5 font-bold uppercase tracking-wider">Packing</label>
                  <input
                    type="text"
                    name="packing"
                    placeholder="e.g. 10x10"
                    value={formData.packing}
                    onChange={handleInputChange}
                    className="border border-slate-300 p-2.5 rounded-lg w-full focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1.5 font-bold uppercase tracking-wider">Qty / Pack</label>
                  <input
                    type="number"
                    name="qty_per_pack"
                    value={formData.qty_per_pack}
                    onChange={handleInputChange}
                    className="border border-slate-300 p-2.5 rounded-lg w-full focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1.5 font-bold uppercase tracking-wider">Group (Category)</label>
                  <input
                    type="text"
                    name="group"
                    value={formData.group}
                    onChange={handleInputChange}
                    list="group-suggestions"
                    placeholder="e.g. TABLETS"
                    className="border border-slate-300 p-2.5 rounded-lg w-full focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all uppercase"
                    autoComplete="off"
                  />
                  <datalist id="group-suggestions">
                    {uniqueGroupSuggestions.map((grp, idx) => (
                      <option key={idx} value={grp} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1.5 font-bold uppercase tracking-wider">Schedule</label>
                  <input
                    type="text"
                    name="schedule"
                    value={formData.schedule}
                    onChange={handleInputChange}
                    list="schedule-suggestions"
                    placeholder="e.g. SCHEDULE H1"
                    className="border border-slate-300 p-2.5 rounded-lg w-full focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all uppercase"
                    autoComplete="off"
                  />
                  <datalist id="schedule-suggestions">
                    {uniqueScheduleSuggestions.map((sch, idx) => (
                      <option key={idx} value={sch} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1.5 font-bold uppercase tracking-wider">Item Category</label>
                  <input
                    type="text"
                    name="item_category"
                    value={formData.item_category}
                    onChange={handleInputChange}
                    className="border border-slate-300 p-2.5 rounded-lg w-full focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1.5 font-bold uppercase tracking-wider">Profile Category</label>
                  <input
                    type="text"
                    name="profile_category"
                    value={formData.profile_category}
                    onChange={handleInputChange}
                    className="border border-slate-300 p-2.5 rounded-lg w-full focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm transition-shadow hover:shadow-md">
              <h4 className="font-extrabold text-teal-800 border-b border-slate-100 pb-3 mb-5 uppercase tracking-wide">Inventory & Location</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                  <label className="block text-xs text-slate-500 mb-1.5 font-bold uppercase tracking-wider">Rack / Shelf</label>
                  <input
                    type="text"
                    name="rack"
                    value={formData.rack}
                    onChange={handleInputChange}
                    className="border border-slate-300 p-2.5 rounded-lg w-full focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all font-mono uppercase bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1.5 font-bold uppercase tracking-wider">Barcode</label>
                  <input
                    type="text"
                    name="barcode"
                    value={formData.barcode}
                    onChange={handleInputChange}
                    className="border border-slate-300 p-2.5 rounded-lg w-full focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1.5 font-bold uppercase tracking-wider">Min Qty Alert</label>
                  <input
                    type="number"
                    name="min_qty"
                    value={formData.min_qty}
                    onChange={handleInputChange}
                    className="border border-slate-300 p-2.5 rounded-lg w-full focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1.5 font-bold uppercase tracking-wider">Max Qty Limit</label>
                  <input
                    type="number"
                    name="max_qty"
                    value={formData.max_qty}
                    onChange={handleInputChange}
                    className="border border-slate-300 p-2.5 rounded-lg w-full focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-teal-50 to-white p-6 rounded-xl border border-teal-100 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-teal-400"></div>
              <h4 className="font-extrabold text-teal-800 border-b border-teal-100 pb-3 mb-5 uppercase tracking-wide">Tax & Compliance</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                  <label className="block text-xs text-teal-700 mb-1.5 font-bold uppercase tracking-wider">HSN/SAC Code</label>
                  <input
                    type="text"
                    name="hsn_code"
                    value={formData.hsn_code}
                    onChange={handleInputChange}
                    className="border border-teal-200 p-2.5 rounded-lg w-full focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 outline-none transition-all font-mono shadow-inner"
                  />
                </div>
                <div>
                  <label className="block text-xs text-teal-700 mb-1.5 font-bold uppercase tracking-wider">GST %</label>
                  <input
                    type="number"
                    step="0.01"
                    name="gst_pct"
                    value={formData.gst_pct}
                    onChange={handleInputChange}
                    className="border border-teal-200 p-2.5 rounded-lg w-full focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 outline-none transition-all shadow-inner"
                  />
                </div>
                <div>
                  <label className="block text-xs text-teal-700 mb-1.5 font-bold uppercase tracking-wider">CESS %</label>
                  <input
                    type="number"
                    step="0.01"
                    name="cess_pct"
                    value={formData.cess_pct}
                    onChange={handleInputChange}
                    className="border border-teal-200 p-2.5 rounded-lg w-full focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 outline-none transition-all shadow-inner"
                  />
                </div>
                <div className="flex flex-col justify-center space-y-3 mt-4">
                  <label className="flex items-center space-x-2 cursor-pointer hover:text-teal-900">
                    <input
                      type="checkbox"
                      name="requires_license"
                      checked={formData.requires_license}
                      onChange={handleInputChange}
                      className="accent-teal-600 w-4 h-4"
                    />
                    <span className="text-xs text-slate-700 font-bold uppercase tracking-wide">Requires License</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer hover:text-teal-900">
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={formData.is_active}
                      onChange={handleInputChange}
                      className="accent-teal-600 w-4 h-4"
                    />
                    <span className="text-xs text-slate-700 font-bold uppercase tracking-wide">Active Item</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm transition-shadow hover:shadow-md">
              <label className="block text-xs text-slate-500 mb-1.5 font-bold uppercase tracking-wider">Internal Note</label>
              <input
                type="text"
                name="note"
                value={formData.note}
                onChange={handleInputChange}
                className="border border-slate-300 p-2.5 rounded-lg w-full focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all bg-slate-50 focus:bg-white"
              />
            </div>

            <div className="flex justify-end gap-4 pt-4 border-t border-slate-200">
              {isEditing && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="bg-white border border-slate-300 text-slate-700 px-6 py-2.5 rounded-lg font-bold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                className="bg-hospital-navy text-white px-8 py-3 rounded-lg font-bold hover:bg-[#152a52] transition-colors shadow-lg flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                {isEditing ? 'Update Medicine Master' : 'Save Medicine Master'}
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === 'catalog' && (
        <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
          <div className="p-5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
            <div className="relative flex-1 min-w-[280px] max-w-md">
              <input
                type="text"
                placeholder="Search by name, manufacturer, group, composition, or rack..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full border border-slate-300 p-2.5 pl-10 rounded-lg text-sm bg-white shadow-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all"
              />
              <span className="absolute left-3.5 top-3 text-slate-400">🔍</span>
            </div>

            <button
              type="button"
              onClick={() => {
                setFormData({ ...emptyForm })
                setIsEditing(false)
                setActiveTab('form')
              }}
              className="bg-hospital-navy text-white px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-[#152a52] transition-colors shadow-md flex items-center gap-2"
            >
              <span>+</span> Add New Medicine
            </button>
          </div>

          <div className="overflow-x-auto max-h-[650px] overflow-y-auto custom-scrollbar">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-[#0B162C] text-white sticky top-0 z-10 whitespace-nowrap">
                <tr>
                  <th className="p-4 font-bold tracking-wider">Action</th>
                  <th className="p-4 font-bold tracking-wider">ID</th>
                  <th className="p-4 font-bold tracking-wider">Item Name</th>
                  <th className="p-4 font-bold tracking-wider">Manufacturer</th>
                  <th className="p-4 font-bold tracking-wider">Brand Name</th>
                  <th className="p-4 font-bold tracking-wider">Major Content</th>
                  <th className="p-4 font-bold tracking-wider">Group</th>
                  <th className="p-4 font-bold tracking-wider">Packing</th>
                  <th className="p-4 font-bold tracking-wider text-center">Qty/Pack</th>
                  <th className="p-4 font-bold tracking-wider">Rack</th>
                  <th className="p-4 font-bold tracking-wider">HSN</th>
                  <th className="p-4 font-bold tracking-wider text-right">GST %</th>
                  <th className="p-4 font-bold tracking-wider text-right">Cess %</th>
                  <th className="p-4 font-bold tracking-wider text-right">Wholesale Rate</th>
                  <th className="p-4 font-bold tracking-wider text-center">Min / Max Qty</th>
                  <th className="p-4 font-bold tracking-wider text-center">Schedule</th>
                  <th className="p-4 font-bold tracking-wider text-center">License Req?</th>
                  <th className="p-4 font-bold tracking-wider text-center">Status</th>
                  <th className="p-4 font-bold tracking-wider">Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 whitespace-nowrap bg-white">
                {filteredMedicines.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleEdit(m)}
                        className="bg-white text-teal-700 hover:bg-teal-50 hover:text-teal-800 border border-teal-200 px-3 py-1.5 rounded-md font-bold text-xs transition-colors shadow-sm"
                      >
                        ✏️ Edit
                      </button>
                    </td>
                    <td className="p-4 font-mono text-slate-500">{m.id}</td>
                    <td className="p-4 font-extrabold text-slate-800">{m.name}</td>
                    <td className="p-4 text-slate-600 font-medium">{m.manufacturer || '-'}</td>
                    <td className="p-4 text-slate-500">{m.brand_name || '-'}</td>
                    <td className="p-4 max-w-[200px] truncate" title={m.major_content}>{m.major_content || '-'}</td>
                    <td className="p-4 font-medium text-slate-700">{m.group || '-'}</td>
                    <td className="p-4 font-semibold text-slate-600">{m.packing || '-'}</td>
                    <td className="p-4 text-center font-mono">{m.qty_per_pack || 1}</td>
                    <td className="p-4 font-mono text-indigo-700 bg-indigo-50/50 px-2 rounded">{m.rack || '-'}</td>
                    <td className="p-4 font-mono text-slate-500">{m.hsn_code || '-'}</td>
                    <td className="p-4 text-right font-bold text-emerald-600">{m.gst_pct ? `${m.gst_pct}%` : '0%'}</td>
                    <td className="p-4 text-right text-slate-500">{m.cess_pct ? `${m.cess_pct}%` : '0%'}</td>
                    <td className="p-4 text-right font-extrabold text-slate-800">₹{parseFloat(m.wholesale_rate || 0).toFixed(2)}</td>
                    <td className="p-4 text-center text-slate-500 font-mono">
                      {m.min_qty} / {m.max_qty || '∞'}
                    </td>
                    <td className="p-4 text-center">
                      {m.schedule ? (
                        <span className="bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-1 rounded text-[10px] font-bold tracking-wide uppercase">
                          {m.schedule}
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      {m.requires_license ? (
                        <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded text-[10px] font-bold tracking-wide uppercase">Yes</span>
                      ) : (
                        <span className="text-slate-300">No</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      {m.is_active ? (
                        <span className="inline-block w-3 h-3 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/40" title="Active"></span>
                      ) : (
                        <span className="inline-block w-3 h-3 rounded-full bg-rose-500 shadow-sm shadow-rose-500/40" title="Inactive"></span>
                      )}
                    </td>
                    <td className="p-4 text-slate-500 max-w-[150px] truncate" title={m.note}>{m.note || '-'}</td>
                  </tr>
                ))}
                {filteredMedicines.length === 0 && (
                  <tr>
                    <td colSpan="19" className="p-10 text-center text-slate-500 font-medium">
                      {searchTerm ? 'No medicines match your search.' : 'No medicines found in catalog.'}
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