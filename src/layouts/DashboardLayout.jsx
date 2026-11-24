import { NavLink, Outlet } from 'react-router-dom';

export default function DashboardLayout() {
  const navItems = [
    { 
      name: 'Medicine Master', 
      path: '/', 
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /> 
    },
    { 
      name: 'Account Master (Suppliers)', 
      path: '/suppliers', 
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /> 
    },
    { 
      name: 'Price Master', 
      path: '/price-master', 
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /> 
    },
    { 
      name: 'Purchase Entry (GST)', 
      path: '/purchases', 
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /> 
    },
    { 
      name: 'Supplier Payment', 
      path: '/supplier-payments', 
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /> 
    },
    { 
      name: 'Sales Billing', 
      path: '/sales', 
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /> 
    },
    { 
      name: 'Live Inventory', 
      path: '/inventory', 
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /> 
    },
    { 
      name: 'Reports & Audit', 
      path: '/reports', 
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /> 
    },
  ];

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800 overflow-hidden">
      
      {/* PREMIUM SIDEBAR */}
      <aside className="w-[260px] bg-[#0B162C] text-slate-300 flex flex-col shadow-2xl relative z-20 shrink-0">
        
       {/* LOGO AREA */}
        <div className="h-20 bg-[#070F1E] flex items-center px-6 border-b border-white/5 shadow-md shrink-0">
          <div className="flex items-center gap-3">
            
            {/* NEW NATURAL SARAJ LOGO - NO BORDERS OR WHITE WRAPPERS */}
            <img 
              src="/saraj-logo.png" 
              alt="Saraj Medicals" 
              className="h-14 w-12 object-contain" 
            />
            
            <div className="flex flex-col">
              <span className="text-white font-extrabold tracking-widest text-xl leading-tight">SARAJ</span>
              <span className="text-teal-400 text-[11px] font-bold tracking-widest uppercase">Medicals</span>
            </div>
          </div>
        </div>

        {/* NAVIGATION LINKS */}
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1.5 custom-scrollbar">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                  isActive
                    ? 'bg-teal-900/40 text-teal-400 font-bold border-l-4 border-teal-400 shadow-inner'
                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-200 border-l-4 border-transparent'
                }`
              }
            >
              <svg 
                className="w-5 h-5 shrink-0 transition-transform group-hover:scale-110" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                {item.icon}
              </svg>
              <span className="text-[13px] tracking-wide leading-tight">{item.name}</span>
            </NavLink>
          ))}
        </nav>

        {/* FOOTER USER / SYSTEM STATUS */}
        <div className="p-4 bg-[#070F1E] border-t border-white/5 shrink-0">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/5 border border-white/10">
            <div className="h-8 w-8 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center border border-teal-500/30 shrink-0">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-bold text-white tracking-wide">SUPERVISOR</span>
              <span className="text-[10px] text-teal-400 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Online
              </span>
            </div>
          </div>
          <div className="flex justify-between items-center mt-3 px-2 text-[10px] text-slate-500 font-mono">
            <span>FY 2026-2027</span>
            <span>v2.1.0</span>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-50 relative">
        
        {/* CLEAN TOP HEADER */}
        <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm z-10 shrink-0">
          <div className="text-sm font-medium text-gray-500">
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
          <div className="flex gap-4 items-center">
            <button className="text-gray-400 hover:text-teal-600 transition outline-none">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>
          </div>
        </header>

        {/* PAGE OUTLET */}
        <div className="flex-1 overflow-auto p-6 scroll-smooth">
          <Outlet />
        </div>
      </main>

    </div>
  );
}