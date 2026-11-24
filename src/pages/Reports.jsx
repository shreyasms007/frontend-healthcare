import React, { useState, useEffect, useCallback } from 'react';
import { API_BASE } from '../config.js';

export default function Reports() {
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const todayStr = today.toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(firstDay);
  const [endDate, setEndDate] = useState(todayStr);
  const [reportType, setReportType] = useState('purchases'); // 'sales' | 'purchases'

  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState({
    total_records: 0,
    total_items_qty: 0,
    total_amount: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchReportFromBackend = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg('');

    try {
      const base = (API_BASE || '').replace(/\/+$/, '');
      const url = new URL(`${base}/api/reports`);
      url.searchParams.set('type', reportType);
      if (startDate) url.searchParams.set('start_date', startDate);
      if (endDate) url.searchParams.set('end_date', endDate);

      console.log('Hitting backend report API:', url.toString());

      const res = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
      }

      const json = await res.json();
      const rows = Array.isArray(json.records) ? json.records : [];

      setRecords(rows);
      setSummary({
        total_records: Number(json.total_records ?? rows.length),
        total_items_qty: Number(json.total_items_qty ?? 0),
        total_amount: Number(json.total_amount ?? 0),
      });
    } catch (err) {
      console.error('Error calling /api/reports:', err);
      setErrorMsg(err.message || 'Failed to reach backend /api/reports');
      setRecords([]);
      setSummary({ total_records: 0, total_items_qty: 0, total_amount: 0 });
    } finally {
      setIsLoading(false);
    }
  }, [reportType, startDate, endDate]);

  useEffect(() => {
    fetchReportFromBackend();
  }, [reportType]);

  const handleFilterClick = (e) => {
    e.preventDefault();
    fetchReportFromBackend();
  };

  return (
    <div className="space-y-6 text-sm font-sans">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
        <h2 className="text-xl font-extrabold text-[#0B162C] tracking-wide uppercase">AUDIT & REPORTS</h2>
        <div className="text-xs text-slate-500 font-medium">Financial Year: 2026-2027</div>
      </div>

      <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
        <form onSubmit={handleFilterClick} className="bg-[#0B162C] text-white px-6 py-5 border-b border-white/10">
          <div className="flex flex-col md:flex-row md:items-end gap-5">
            <div className="flex-1">
              <label className="block text-xs text-teal-400 mb-1.5 font-bold uppercase tracking-wider">Report Type</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full bg-[#152a52] border border-[#1e3a70] text-white p-2.5 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none font-bold"
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
                className="w-full bg-[#152a52] border border-[#1e3a70] text-white p-2.5 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>

            <div className="flex-1">
              <label className="block text-xs text-teal-400 mb-1.5 font-bold uppercase tracking-wider">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-[#152a52] border border-[#1e3a70] text-white p-2.5 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 disabled:opacity-60 text-white px-8 py-2.5 rounded-lg font-bold transition-all shadow-lg shadow-teal-500/20 w-full md:w-auto"
              >
                {isLoading ? 'Filtering...' : 'Filter Data'}
              </button>
            </div>
          </div>
        </form>

        <div className="p-6 bg-slate-50 space-y-6">
          {errorMsg && (
            <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-medium">
              Backend request failed: {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Invoices</p>
              <p className="text-2xl font-extrabold text-[#0B162C] mt-1">{summary.total_records}</p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {reportType === 'sales' ? 'Total Items Sold' : 'Total Items Bought'}
              </p>
              <p className="text-2xl font-extrabold text-[#0B162C] mt-1">{summary.total_items_qty}</p>
            </div>

            <div className="bg-gradient-to-br from-[#0B162C] to-[#152a52] p-6 rounded-xl shadow-md text-white">
              <p className="text-xs font-bold text-teal-400 uppercase tracking-wider">
                {reportType === 'sales' ? 'Total Revenue' : 'Total Expenditure'}
              </p>
              <p className="text-2xl font-extrabold tracking-tight mt-1">
                ₹{Number(summary.total_amount).toFixed(2)}
              </p>
            </div>
          </div>

          <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm">
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead className="bg-[#0B162C] text-white sticky top-0 z-10">
                  <tr>
                    <th className="p-4 font-bold tracking-wider uppercase text-xs">Date</th>
                    <th className="p-4 font-bold tracking-wider uppercase text-xs">Invoice / ID</th>
                    <th className="p-4 font-bold tracking-wider uppercase text-xs">
                      {reportType === 'sales' ? 'Customer' : 'Supplier'}
                    </th>
                    <th className="p-4 font-bold tracking-wider uppercase text-xs text-center">Items Qty</th>
                    <th className="p-4 font-bold tracking-wider uppercase text-xs text-center">Status</th>
                    <th className="p-4 font-bold tracking-wider uppercase text-xs text-right">Total Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {isLoading ? (
                    <tr>
                      <td colSpan="6" className="p-10 text-center text-slate-400 font-bold">
                        Loading report from backend...
                      </td>
                    </tr>
                  ) : records.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="p-10 text-center text-slate-400 font-medium">
                        No records found for the selected date range.
                      </td>
                    </tr>
                  ) : (
                    records.map((item, idx) => (
                      <tr key={item.id ?? idx} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4 font-mono text-slate-500">
                          {item.date ? new Date(item.date).toLocaleDateString('en-GB') : '-'}
                        </td>
                        <td className="p-4 font-bold text-[#0B162C]">{item.invoice_number}</td>
                        <td className="p-4 text-slate-700 font-medium">{item.party_name}</td>
                        <td className="p-4 text-center font-mono font-bold text-slate-700">{item.items_qty}</td>
                        <td className="p-4 text-center">
                          <span
                            className={`px-3 py-1 rounded-md text-[11px] font-bold tracking-wide border ${
                              item.status === 'COMPLETED' || item.status === 'PAID'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td className="p-4 text-right font-extrabold text-teal-700 font-mono">
                          ₹{Number(item.total_amount).toFixed(2)}
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