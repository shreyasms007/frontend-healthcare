import { Outlet, useNavigate, useLocation } from 'react-router-dom'

export default function DashboardLayout() {
  const navigate = useNavigate()
  const location = useLocation()

  const navItems = [
    { name: 'Medicine Master', path: '/' },
    { name: 'Suppliers', path: '/suppliers' },
    { name: 'Purchase Invoices', path: '/purchases' },
    { name: 'Sales Billing', path: '/sales' },
    { name: 'Inventory', path: '/inventory' },
  ]

  return (
    <div className="flex h-screen bg-hospital-bg font-sans">
      {/* Sidebar */}
      <div className="w-64 bg-hospital-navy text-white flex flex-col shadow-lg">
        <div className="p-6 border-b border-blue-800 flex items-center gap-3">
          <div className="w-8 h-8 bg-hospital-teal rounded flex items-center justify-center font-bold">JH</div>
          <h1 className="text-lg font-bold tracking-wide">JENUKAL<br/><span className="text-sm font-normal text-blue-200">PHARMACY</span></h1>
        </div>
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path
              return (
                <li
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`p-3 rounded cursor-pointer transition-colors ${
                    isActive
                      ? 'bg-blue-800/50 border-l-4 border-hospital-teal font-medium text-white'
                      : 'text-gray-300 hover:bg-blue-800/50 hover:text-white'
                  }`}
                >
                  {item.name}
                </li>
              )
            })}
          </ul>
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm px-8 py-4 flex justify-between items-center z-10">
          <h2 className="text-xl font-bold text-gray-800">
            {navItems.find((i) => i.path === location.pathname)?.name || 'Dashboard'}
          </h2>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-bold">A</span>
            Admin User
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-hospital-bg p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}