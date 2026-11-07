import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from '../config.js';

export default function SuppliersList() {
  const [suppliersList, setSuppliersList] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/suppliers`);
        const data = await res.json();
        setSuppliersList(data || []);
      } catch (error) {
        console.error('Error fetching suppliers:', error);
      }
    };
    fetchSuppliers();
  }, []);

  return (
    <div className="p-6 bg-gray-50 min-h-screen font-sans">
      <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
        
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-gray-700 text-xl">Registered Accounts Directory</h3>
          <button 
            onClick={() => navigate('/suppliers')} 
            className="bg-gray-600 text-white px-4 py-2 rounded font-bold hover:bg-gray-700 transition"
          >
            ← Back to Add New
          </button>
        </div>

        <table className="w-full text-left text-sm border-collapse">
          <thead className="bg-hospital-navy text-white">
            <tr>
              <th className="p-3 rounded-tl">Code</th>
              <th className="p-3">Company Name</th>
              <th className="p-3">DL/TL No. 1</th>
              <th className="p-3">GSTN</th>
              <th className="p-3">Phone</th>
              <th className="p-3">City</th>
              <th className="p-3 text-center rounded-tr">Mode</th>
            </tr>
          </thead>
          <tbody>
            {suppliersList.map((supplier, index) => (
              <tr key={index} className="border-b hover:bg-gray-50">
                <td className="p-3">{supplier.code || 'N/A'}</td>
                <td className="p-3 font-bold text-hospital-navy">{supplier.name}</td>
                <td className="p-3">{supplier.dlNo1 || '-'}</td>
                <td className="p-3">{supplier.gstnNo || '-'}</td>
                <td className="p-3">{supplier.phone || '-'}</td>
                <td className="p-3">{supplier.city || '-'}</td>
                <td className="p-3 text-center">
                  <span className="text-teal-600 border border-teal-200 px-2 py-1 rounded text-xs bg-teal-50">
                    Active
                  </span>
                </td>
              </tr>
            ))}
            {suppliersList.length === 0 && (
              <tr>
                <td colSpan="7" className="p-6 text-center text-gray-500">
                  No registered accounts found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}