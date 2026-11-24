import React, { useState, useEffect, useMemo } from 'react';
import { API_BASE } from '../config.js';

export default function Reports() {
  // Default to the first and last day of the current month
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(firstDay);
  const [endDate, setEndDate] = useState(lastDay);
  const [reportType, setReportType] = useState('sales'); // 'sales' or 'purchases'
  
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch data whenever report type changes or "Generate" is clicked
  const fetchReportData = async () => {
    setIsLoading(true);
    try {
      // Assuming your backend has an /api/purchases endpoint similar to /api/sales
      const endpoint = reportType === 'sales' ? `${API_BASE}/api/sales` : `${API_BASE}/api/purchases`;
      const res = await fetch(endpoint);
      
      if (res.ok) {
        const json = await res.json();
        const records = Array.isArray(json) ? json : (json.data || []);
        setData(records);
      } else {
        alert("Failed to fetch report data.");
      }
    } catch (err) {
      console.error("Error fetching reports:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [reportType]);

  // Filter the fetched data by the selected Date Range
  const filteredData = useMemo(() => {
    return data.filter(item => {
      // Handle different date field names depending on your DB schema
      const itemDateStr = item.invoice_date || item.created_at || item.date;
      if (!itemDateStr) return true; // If no date, include it

      const itemDate = new Date(itemDateStr).setHours(0,0,0,0);
      const start = new Date(startDate).setHours(0,0,0,0);
      const end = new Date(endDate).setHours(23,59,59,999);

      return itemDate >= start && itemDate <= end;
    });
  }, [data, startDate, endDate]);

  // Calculate Totals for the Summary Cards
  const totalAmount = filteredData.reduce((sum, item) => sum + Number(item.total_amount || item.amount || 0), 0);
  const totalRecords = filteredData.length;

  return (
    <div className="space-y-6 text-sm font-sans">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
        <h2 className="text-xl font-extrabold text-[#0B162C] tracking-wide uppercase">AUDIT & REPORTS</h2>
        <div className="text-xs text-slate-500 font-medium">Financial Year: 2026-2027</div>
      </div>

      <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
        
        {/* HEADER & FILTERS */}
        <div className="bg-[#0B162C] text-white px-6 py-5 border-b border-[#1A2C4E]">
          <div className="flex flex-col md:flex-row md:items-end gap-5">
            
            <div className="flex-1">
              <label className="block text-xs text-teal-400 mb-1.5 font-bold uppercase tracking-wider">Report Type</label>
              <select 
                value={reportType} 
                onChange={(e) => setReportType(e.target.value)}
                className="w-full bg-[#152a52] border border-[#1e3a70] text-white p-2.5 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none font-bold tracking-wide"
              >
                <option value="sales">Sales & Revenue</option>
                <option value="purchases">Purchases & Expenses</option>
              </select>
            </div>

            <div className="flex-1">
              <label className="block text-xs text-teal-400 mb-1.5 font-bold uppercase tracking-wider">Start Date</label>
              <input 
                type="date" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-[#152a52] border border-[#1e3a70] text-white p-2.5 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none color-scheme-dark" 
              />
            </div>

            <div className="flex-1">
              <label className="block text-xs text-teal-400 mb-1.5 font-bold uppercase tracking-wider">End Date</label>
              <input 
                type="date" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-[#152a52] border border-[#1e3a70] text-white p-2.5 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none color-scheme-dark" 
              />
            </div>

            <div>
              <button 
                onClick={fetchReportData}
                className="bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white px-8 py-2.5 rounded-lg font-bold transition-all shadow-lg shadow-teal-500/20 w-full md:w-auto flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Filter Data
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 bg-slate-50 space-y-6">
          
          {/* SUMMARY CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Records</p>
                <p className="text-2xl font-extrabold text-[#0B162C]">{totalRecords}</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Selected Period</p>
                <p className="text-sm font-bold text-[#0B162C]">
                  {new Date(startDate).toLocaleDateString()} - {new Date(endDate).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-[#0B162C] to-[#152a52] p-6 rounded-xl shadow-md flex items-center gap-4 text-white relative overflow-hidden">
               <div className="absolute top-0 right-0 -mr-4 -mt-4 opacity-10">
                 <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
               </div>
              <div className="h-12 w-12 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm z-10">
                <span className="text-2xl font-bold text-teal-400">₹</span>
              </div>
              <div className="z-10">
                <p className="text-xs font-bold text-teal-400 uppercase tracking-wider">
                  Total {reportType === 'sales' ? 'Revenue' : 'Expenditure'}
                </p>
                <p className="text-2xl font-extrabold tracking-tight">₹{totalAmount.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* DATA TABLE */}
          <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm">
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto custom-scrollbar">
              <table className="w-full text-left border-collapse text-sm">
                <thead className="bg-slate-100 text-slate-600 sticky top-0 z-10">
                  <tr>
                    <th className="p-4 font-bold tracking-wider uppercase text-xs">Date</th>
                    <th className="p-4 font-bold tracking-wider uppercase text-xs">Invoice / ID</th>
                    <th className="p-4 font-bold tracking-wider uppercase text-xs">{reportType === 'sales' ? 'Customer Phone' : 'Supplier'}</th>
                    <th className="p-4 font-bold tracking-wider uppercase text-xs text-center">Status</th>
                    <th className="p-4 font-bold tracking-wider uppercase text-xs text-right">Total Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {isLoading ? (
                    <tr>
                      <td colSpan="5" className="p-10 text-center text-slate-400 font-bold">Loading report data...</td>
                    </tr>
                  ) : filteredData.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="p-10 text-center text-slate-400 font-medium">No records found for the selected date range.</td>
                    </tr>
                  ) : (
                    filteredData.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4 font-mono text-slate-500">
                          {new Date(item.invoice_date || item.created_at || item.date).toLocaleDateString()}
                        </td>
                        <td className="p-4 font-bold text-[#0B162C]">
                          {item.invoice_number || `#${item.id}`}
                        </td>
                        <td className="p-4 text-slate-700 font-medium">
                          {reportType === 'sales' ? (item.phone_number || item.customer_name || 'Walk-in') : (item.supplier_name || 'Vendor')}
                        </td>
                        <td className="p-4 text-center">
                          {item.is_issued || item.status === 'completed' ? (
                            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-md text-[11px] font-bold tracking-wide">COMPLETED</span>
                          ) : (
                            <span className="bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1 rounded-md text-[11px] font-bold tracking-wide">PENDING</span>
                          )}
                        </td>
                        <td className="p-4 text-right font-extrabold text-teal-700 font-mono">
                          ₹{Number(item.total_amount || item.amount || 0).toFixed(2)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}