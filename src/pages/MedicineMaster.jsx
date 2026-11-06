import { useState, useEffect, useMemo } from 'react'
import { MEDICINE_DATABASE, DEFAULT_GROUPS, DEFAULT_SCHEDULES } from '../data/medicineDatabase'

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
      const res = await fetch('http://localhost:8081/api/medicines')
      if (res.ok) {
        const data = await res.json()
        setMedicines(data || [])
      }
    } catch (err) {
      console.error('Failed to fetch medicines:', err)
    }
  }

  // Combine active catalog and static database for medicine name auto-suggestions
  const uniqueSuggestions = useMemo(() => {
    const names = new Set()
    const suggestions = []

    medicines.forEach(m => {
      if (m.name && !names.has(m.name)) {
        names.add(m.name)
        suggestions.push(m.name)
      }
    })

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

  // Merge default group categories with any custom groups saved in the active database
  const uniqueGroupSuggestions = useMemo(() => {
    const groupSet = new Set(DEFAULT_GROUPS || [])

    medicines.forEach(m => {
      if (m.group && m.group.trim()) {
        groupSet.add(m.group.trim().toUpperCase())
      }
    })

    return Array.from(groupSet).sort()
  }, [medicines])

  // Merge default schedules with any custom schedules saved in the active database
  const uniqueScheduleSuggestions = useMemo(() => {
    const scheduleSet = new Set(DEFAULT_SCHEDULES || [])

    medicines.forEach(m => {
      if (m.schedule && m.schedule.trim()) {
        scheduleSet.add(m.schedule.trim().toUpperCase())
      }
    })

    return Array.from(scheduleSet).sort()
  }, [medicines])

  // Auto-fill manufacturer and group when typing or selecting a medicine name
  const handleNameChange = (e) => {
    const selectedName = e.target.value
    let autoManufacturer = formData.manufacturer
    let autoGroup = formData.group

    const foundInDb = medicines.find(m => m.name && m.name.toLowerCase() === selectedName.toLowerCase())
    const foundInStatic = Array.isArray(MEDICINE_DATABASE)
      ? MEDICINE_DATABASE.find(m => (m.name || m).toLowerCase() === selectedName.toLowerCase())
      : null

    if (foundInDb) {
      if (foundInDb.manufacturer) autoManufacturer = foundInDb.manufacturer
      if (foundInDb.group) autoGroup = foundInDb.group
    } else if (foundInStatic) {
      if (foundInStatic.manufacturer) autoManufacturer = foundInStatic.manufacturer
      if (foundInStatic.group) autoGroup = foundInStatic.group
    }

    setFormData(prev => ({
      ...prev,
      name: selectedName,
      manufacturer: autoManufacturer,
      group: autoGroup
    }))
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  // Switch to edit mode with populated medicine fields
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

    const payload = {
      ...formData,
      qty_per_pack: parseInt(formData.qty_per_pack, 10) || 1,
      gst_pct: parseFloat(formData.gst_pct) || 0,
      cess_pct: parseFloat(formData.cess_pct) || 0,
      wholesale_rate: parseFloat(formData.wholesale_rate) || 0,
      min_qty: parseInt(formData.min_qty, 10) || 0,
      max_qty: parseInt(formData.max_qty, 10) || 0
    }

    const method = isEditing ? 'PUT' : 'POST'

    try {
      const res = await fetch('http://localhost:8081/api/medicines', {
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

  // Filter medicines for catalog view
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
      {/* Top Header & Navigation Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-hospital-navy">MEDICINE MASTER</h2>
          <div className="flex bg-gray-200 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => {
                if (isEditing) handleCancelEdit()
                setActiveTab('form')
              }}
              className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
                activeTab === 'form'
                  ? 'bg-hospital-teal text-white shadow'
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
                  ? 'bg-hospital-teal text-white shadow'
                  : 'text-gray-600 hover:text-hospital-navy'
              }`}
            >
              📋 Medicine Catalog ({medicines.length})
            </button>
          </div>
        </div>

        <div className="text-xs text-gray-500">
          State Code: 29 (Karnataka)
        </div>
      </div>

      {/* VIEW 1: CREATE / EDIT FORM */}
      {activeTab === 'form' && (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
          <div className="bg-hospital-teal text-white px-6 py-4 font-bold text-lg flex justify-between items-center">
            <span>
              {isEditing ? `Edit Item Master: ${formData.name} (ID: #${formData.id})` : 'Create Item Master'}
            </span>
            {isEditing && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="bg-white/20 hover:bg-white/30 text-white text-xs px-3 py-1.5 rounded transition"
              >
                Cancel Edit
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Section 1: Basic Information */}
            <div>
              <h4 className="font-bold text-hospital-navy border-b pb-2 mb-4">Basic Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">Item Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleNameChange}
                    list="medicine-suggestions"
                    className="w-full border p-2 rounded focus:ring-1 focus:ring-hospital-teal focus:border-hospital-teal"
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
                  <label className="block text-gray-600 font-semibold mb-1">Manufacturer</label>
                  <input
                    type="text"
                    name="manufacturer"
                    value={formData.manufacturer}
                    onChange={handleInputChange}
                    className="w-full border p-2 rounded focus:ring-1 focus:ring-hospital-teal focus:border-hospital-teal"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">Brand Name</label>
                  <input
                    type="text"
                    name="brand_name"
                    value={formData.brand_name}
                    onChange={handleInputChange}
                    className="w-full border p-2 rounded focus:ring-1 focus:ring-hospital-teal focus:border-hospital-teal"
                  />
                </div>
                <div className="md:col-span-3">
                  <label className="block text-gray-600 font-semibold mb-1">Major Content (Composition)</label>
                  <input
                    type="text"
                    name="major_content"
                    value={formData.major_content}
                    onChange={handleInputChange}
                    className="w-full border p-2 rounded focus:ring-1 focus:ring-hospital-teal focus:border-hospital-teal"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Categorization & Packaging */}
            <div>
              <h4 className="font-bold text-hospital-navy border-b pb-2 mb-4">Categorization & Packaging</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">Packing</label>
                  <input
                    type="text"
                    name="packing"
                    placeholder="e.g. 10x10"
                    value={formData.packing}
                    onChange={handleInputChange}
                    className="w-full border p-2 rounded focus:ring-1 focus:ring-hospital-teal focus:border-hospital-teal"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">Qty / Pack</label>
                  <input
                    type="number"
                    name="qty_per_pack"
                    value={formData.qty_per_pack}
                    onChange={handleInputChange}
                    className="w-full border p-2 rounded focus:ring-1 focus:ring-hospital-teal focus:border-hospital-teal"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">Group (Category)</label>
                  <input
                    type="text"
                    name="group"
                    value={formData.group}
                    onChange={handleInputChange}
                    list="group-suggestions"
                    placeholder="Select or type (e.g. TABLETS)"
                    className="w-full border p-2 rounded focus:ring-1 focus:ring-hospital-teal focus:border-hospital-teal uppercase"
                    autoComplete="off"
                  />
                  <datalist id="group-suggestions">
                    {uniqueGroupSuggestions.map((grp, idx) => (
                      <option key={idx} value={grp} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">Schedule</label>
                  <input
                    type="text"
                    name="schedule"
                    value={formData.schedule}
                    onChange={handleInputChange}
                    list="schedule-suggestions"
                    placeholder="Select or type (e.g. SCHEDULE H1)"
                    className="w-full border p-2 rounded focus:ring-1 focus:ring-hospital-teal focus:border-hospital-teal uppercase"
                    autoComplete="off"
                  />
                  <datalist id="schedule-suggestions">
                    {uniqueScheduleSuggestions.map((sch, idx) => (
                      <option key={idx} value={sch} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">Item Category</label>
                  <input
                    type="text"
                    name="item_category"
                    value={formData.item_category}
                    onChange={handleInputChange}
                    className="w-full border p-2 rounded focus:ring-1 focus:ring-hospital-teal focus:border-hospital-teal"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">Profile Category</label>
                  <input
                    type="text"
                    name="profile_category"
                    value={formData.profile_category}
                    onChange={handleInputChange}
                    className="w-full border p-2 rounded focus:ring-1 focus:ring-hospital-teal focus:border-hospital-teal"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Inventory & Location */}
            <div>
              <h4 className="font-bold text-hospital-navy border-b pb-2 mb-4">Inventory & Location</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">Rack / Shelf</label>
                  <input
                    type="text"
                    name="rack"
                    value={formData.rack}
                    onChange={handleInputChange}
                    className="w-full border p-2 rounded focus:ring-1 focus:ring-hospital-teal focus:border-hospital-teal"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">Barcode</label>
                  <input
                    type="text"
                    name="barcode"
                    value={formData.barcode}
                    onChange={handleInputChange}
                    className="w-full border p-2 rounded focus:ring-1 focus:ring-hospital-teal focus:border-hospital-teal"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">Min Qty Alert</label>
                  <input
                    type="number"
                    name="min_qty"
                    value={formData.min_qty}
                    onChange={handleInputChange}
                    className="w-full border p-2 rounded focus:ring-1 focus:ring-hospital-teal focus:border-hospital-teal"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">Max Qty Limit</label>
                  <input
                    type="number"
                    name="max_qty"
                    value={formData.max_qty}
                    onChange={handleInputChange}
                    className="w-full border p-2 rounded focus:ring-1 focus:ring-hospital-teal focus:border-hospital-teal"
                  />
                </div>
              </div>
            </div>

            {/* Section 4: Tax & Compliance */}
            <div>
              <h4 className="font-bold text-hospital-navy border-b pb-2 mb-4">Tax & Compliance</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">HSN/SAC Code</label>
                  <input
                    type="text"
                    name="hsn_code"
                    value={formData.hsn_code}
                    onChange={handleInputChange}
                    className="w-full border p-2 rounded focus:ring-1 focus:ring-hospital-teal focus:border-hospital-teal"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">GST %</label>
                  <input
                    type="number"
                    step="0.01"
                    name="gst_pct"
                    value={formData.gst_pct}
                    onChange={handleInputChange}
                    className="w-full border p-2 rounded focus:ring-1 focus:ring-hospital-teal focus:border-hospital-teal"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">CESS %</label>
                  <input
                    type="number"
                    step="0.01"
                    name="cess_pct"
                    value={formData.cess_pct}
                    onChange={handleInputChange}
                    className="w-full border p-2 rounded focus:ring-1 focus:ring-hospital-teal focus:border-hospital-teal"
                  />
                </div>
                <div className="flex flex-col justify-center space-y-2 mt-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="requires_license"
                      checked={formData.requires_license}
                      onChange={handleInputChange}
                      className="rounded text-hospital-teal focus:ring-hospital-teal"
                    />
                    <span className="text-gray-600 font-semibold">Requires Additional License</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={formData.is_active}
                      onChange={handleInputChange}
                      className="rounded text-hospital-teal focus:ring-hospital-teal"
                    />
                    <span className="text-gray-600 font-semibold">Active Item</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Section 5: Notes & Actions */}
            <div>
              <label className="block text-gray-600 font-semibold mb-1">Internal Note</label>
              <input
                type="text"
                name="note"
                value={formData.note}
                onChange={handleInputChange}
                className="w-full border p-2 rounded focus:ring-1 focus:ring-hospital-teal focus:border-hospital-teal"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              {isEditing && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="bg-gray-200 text-gray-700 px-6 py-3 rounded font-bold hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                className="bg-hospital-teal text-white px-8 py-3 rounded font-bold text-lg hover:bg-teal-700 transition-colors shadow"
              >
                {isEditing ? 'Update Medicine Master' : 'Save Medicine Master'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* VIEW 2: DEDICATED CATALOG VIEW */}
      {activeTab === 'catalog' && (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
          {/* Search & Actions Bar */}
          <div className="p-4 bg-gray-50 border-b flex flex-wrap items-center justify-between gap-4">
            <div className="relative flex-1 min-w-[280px] max-w-md">
              <input
                type="text"
                placeholder="Search by name, manufacturer, group, composition, or rack..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full border p-2 pl-9 rounded text-sm bg-white shadow-sm focus:ring-1 focus:ring-hospital-teal focus:border-hospital-teal"
              />
              <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
            </div>

            <button
              type="button"
              onClick={() => {
                setFormData({ ...emptyForm })
                setIsEditing(false)
                setActiveTab('form')
              }}
              className="bg-hospital-teal text-white px-4 py-2 rounded text-xs font-bold hover:bg-teal-700 transition flex items-center gap-1 shadow"
            >
              <span>+</span> Add New Medicine
            </button>
          </div>

          {/* Full Catalog Table */}
          <div className="overflow-x-auto max-h-[650px] overflow-y-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-hospital-navy text-white sticky top-0 z-10 whitespace-nowrap">
                <tr>
                  <th className="p-3 text-center">Action</th>
                  <th className="p-3">ID</th>
                  <th className="p-3">Item Name</th>
                  <th className="p-3">Manufacturer</th>
                  <th className="p-3">Brand Name</th>
                  <th className="p-3">Major Content</th>
                  <th className="p-3">Group</th>
                  <th className="p-3">Packing</th>
                  <th className="p-3 text-center">Qty/Pack</th>
                  <th className="p-3">Rack</th>
                  <th className="p-3">HSN</th>
                  <th className="p-3 text-right">GST %</th>
                  <th className="p-3 text-right">Cess %</th>
                  <th className="p-3 text-right">Wholesale Rate</th>
                  <th className="p-3 text-center">Min / Max Qty</th>
                  <th className="p-3 text-center">Schedule</th>
                  <th className="p-3 text-center">License Req?</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3">Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 whitespace-nowrap">
                {filteredMedicines.map((m) => (
                  <tr key={m.id} className="hover:bg-blue-50 transition-colors">
                    <td className="p-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleEdit(m)}
                        className="bg-teal-50 text-teal-700 hover:bg-teal-600 hover:text-white border border-teal-300 px-3 py-1 rounded font-bold text-xs transition"
                      >
                        ✏️ Edit
                      </button>
                    </td>
                    <td className="p-3 font-mono text-gray-500">{m.id}</td>
                    <td className="p-3 font-bold text-hospital-navy">{m.name}</td>
                    <td className="p-3 text-gray-700">{m.manufacturer || '-'}</td>
                    <td className="p-3 text-gray-600">{m.brand_name || '-'}</td>
                    <td className="p-3 max-w-[200px] truncate" title={m.major_content}>{m.major_content || '-'}</td>
                    <td className="p-3 font-medium text-slate-800">{m.group || '-'}</td>
                    <td className="p-3 font-semibold">{m.packing || '-'}</td>
                    <td className="p-3 text-center">{m.qty_per_pack || 1}</td>
                    <td className="p-3 font-mono text-indigo-700 bg-indigo-50 px-2 rounded">{m.rack || '-'}</td>
                    <td className="p-3 font-mono">{m.hsn_code || '-'}</td>
                    <td className="p-3 text-right font-medium text-emerald-600">{m.gst_pct ? `${m.gst_pct}%` : '0%'}</td>
                    <td className="p-3 text-right text-gray-600">{m.cess_pct ? `${m.cess_pct}%` : '0%'}</td>
                    <td className="p-3 text-right font-bold text-gray-800">₹{parseFloat(m.wholesale_rate || 0).toFixed(2)}</td>
                    <td className="p-3 text-center text-gray-600">
                      {m.min_qty} / {m.max_qty || '∞'}
                    </td>
                    <td className="p-3 text-center">
                      {m.schedule ? (
                        <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-[11px] font-bold">
                          {m.schedule}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      {m.requires_license ? (
                        <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-[11px] font-semibold">Yes</span>
                      ) : (
                        <span className="text-gray-400">No</span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      {m.is_active ? (
                        <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500" title="Active"></span>
                      ) : (
                        <span className="inline-block w-2.5 h-2.5 rounded-full bg-rose-500" title="Inactive"></span>
                      )}
                    </td>
                    <td className="p-3 text-gray-500 max-w-[150px] truncate" title={m.note}>{m.note || '-'}</td>
                  </tr>
                ))}
                {filteredMedicines.length === 0 && (
                  <tr>
                    <td colSpan="19" className="p-8 text-center text-gray-500">
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