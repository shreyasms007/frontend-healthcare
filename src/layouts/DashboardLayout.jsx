import { Outlet, useNavigate, useLocation } from 'react-router-dom'

export default function DashboardLayout() {
  const navigate = useNavigate()
  const location = useLocation()

  const navItems = [
    { name: 'Medicine Master', path: '/' },
    { name: 'Account Master (Suppliers)', path: '/suppliers' },
    { name: 'Price Master', path: '/price-master' },
    { name: 'Purchase Entry (GST)', path: '/purchases' },
    { name: 'Supplier Payment', path: '/supplier-payments' },
    { name: 'Sales Billing', path: '/sales' },
    { name: 'Live Inventory', path: '/inventory' },
  ]

  return (
    <div className="flex h-screen bg-hospital-bg font-sans">
      {/* Sidebar */}
      <div className="w-64 bg-hospital-navy text-white flex flex-col shadow-lg">
        <div className="p-6 border-b border-blue-800 flex items-center gap-3">
          <div className="w-8 h-8 bg-hospital-teal rounded flex items-center justify-center font-bold">SM</div>
          <h1 className="text-lg font-bold tracking-wide">
             SARAJ<br />
            <span className="text-xs font-normal text-blue-200">MEDICALS</span>
          </h1>
        </div>
        <nav className="flex-1 p-3 overflow-y-auto">
          <ul className="space-y-1.5 text-sm">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path
              return (
                <li
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`p-3 rounded cursor-pointer transition-colors ${
                    isActive
                      ? 'bg-blue-800/60 border-l-4 border-hospital-teal font-semibold text-white'
                      : 'text-gray-300 hover:bg-blue-800/40 hover:text-white'
                  }`}
                >
                  {item.name}
                </li>
              )
            })}
          </ul>
        </nav>
        <div className="p-3 border-t border-blue-800 text-[11px] text-blue-300 flex justify-between">
          <span>FY 2026-2027</span>
          <span>F10 - Save</span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm px-8 py-3.5 flex justify-between items-center z-10 border-b border-gray-200">
          <h2 className="text-lg font-bold text-hospital-navy uppercase tracking-wide">
            {navItems.find((i) => i.path === location.pathname)?.name || 'Dashboard'}
          </h2>
          <div className="flex items-center gap-3 text-xs text-gray-600 font-medium">
            <span className="bg-teal-50 text-hospital-teal border border-teal-200 px-2.5 py-1 rounded">
              State Code: 29 (Karnataka)
            </span>
            <span className="w-7 h-7 bg-hospital-navy text-white rounded-full flex items-center justify-center font-bold">
              S
            </span>
            SUPERVISOR
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-hospital-bg p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}