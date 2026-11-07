import React, { useState, useEffect } from 'react';
import { API_BASE } from '../config.js';

export default function Inventory() {
  const [inventoryList, setInventoryList] = useState([]);

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        // Adjust this endpoint if your backend uses a different path for live inventory
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

  return (
    <div className="p-6 bg-gray-50 min-h-screen font-sans">
      <div className="bg-white rounded-lg shadow border border-gray-200">
        
        <div className="bg-hospital-navy text-white px-6 py-3 rounded-t-lg font-bold">
          <h1 className="text-xl uppercase tracking-wide m-0">Live Inventory Stock Levels</h1>
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
              {inventoryList.map((item, index) => (
                <tr key={index} className="border-b hover:bg-teal-50 transition-colors">
                  {/* Matching the exact JSON keys from your network tab */}
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
              
              {inventoryList.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-500 font-semibold">
                    Inventory is empty. Record a purchase invoice to stock items.
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