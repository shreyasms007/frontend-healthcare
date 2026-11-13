import React, { useState, useEffect } from 'react';
import { API_BASE } from '../config.js';

export default function Inventory() {
  const [inventoryList, setInventoryList] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/inventory`); 
        const data = await res.json();
        
        // Ensure we always set an array to avoid mapping errors
        setInventoryList(data || []);
      } catch (error) {
        console.error('Error fetching inventory:', error);
      }
    };
    fetchInventory();
  }, []);

  // FILTER: Hide 0/negative stock AND apply search query
  const activeInventory = inventoryList.filter(item => {
    // 1. Check stock level
    const hasStock = Number(item.stock_qty || 0) > 0;
    if (!hasStock) return false;

    // 2. Check search term
    if (!searchTerm.trim()) return true;
    
    const query = searchTerm.toLowerCase();
    const medName = (item.medicine_name || '').toLowerCase();
    const batchNo = (String(item.batch_number) || '').toLowerCase();

    return medName.includes(query) || batchNo.includes(query);
  });

  return (
    <div className="p-6 bg-gray-50 min-h-screen font-sans">
      <div className="bg-white rounded-lg shadow border border-gray-200">
        
        <div className="bg-hospital-navy text-white px-6 py-3 rounded-t-lg font-bold flex justify-between items-center">
          <h1 className="text-xl uppercase tracking-wide m-0">Live Inventory Stock Levels</h1>
        </div>

        {/* SEARCH BAR SECTION */}
        <div className="p-4 bg-gray-50 border-b border-gray-200 flex">
          <div className="relative w-full max-w-md">
            <input
              type="text"
              placeholder="Search by Medicine Name or Batch Number..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full border p-2 pl-9 rounded text-sm bg-white shadow-sm focus:ring-1 focus:ring-hospital-teal focus:border-hospital-teal"
            />
            <span className="absolute left-3 top-2 text-gray-400 text-base">🔍</span>
          </div>
        </div>

        <div className="p-6 overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-gray-100 text-hospital-navy border-b-2 border-gray-300">
              <tr>
                <th className="p-3 font-bold">Medicine Name</th>
                <th className="p-3 font-bold">Batch Number</th>
                <th className="p-3 font-bold">Available Quantity</th>
                <th className="p-3 font-bold">Sale Price</th>
                <th className="p-3 font-bold">Expiry Date</th>
              </tr>
            </thead>
            <tbody>
              {activeInventory.map((item, index) => (
                <tr key={index} className="border-b hover:bg-teal-50 transition-colors">
                  <td className="p-3 font-bold text-hospital-navy">{item.medicine_name}</td>
                  <td className="p-3">{item.batch_number}</td>
                  <td className="p-3">
                    <span className="bg-teal-100 text-teal-800 px-2 py-1 rounded font-bold">
                      {item.stock_qty}
                    </span>
                  </td>
                  <td className="p-3">₹{item.sale_rate}</td>
                  <td className="p-3">{item.expiry_date}</td>
                </tr>
              ))}
              
              {activeInventory.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-500 font-semibold">
                    {searchTerm 
                      ? "No matching inventory found for your search." 
                      : "Inventory is empty or all items are currently out of stock. Record a purchase invoice to add items."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}