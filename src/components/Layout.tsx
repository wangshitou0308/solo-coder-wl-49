import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  MapPin,
  Package,
  Thermometer,
  AlertTriangle,
  ShoppingBag,
  User,
  LogOut,
  Menu,
  X,
  Leaf,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth';

const navItems = [
  { to: '/dashboard', label: '数据看板', icon: LayoutDashboard },
  { to: '/compost-sites', label: '堆肥点管理', icon: MapPin },
  { to: '/deposit', label: '扫码投放', icon: Package },
  { to: '/deposit/records', label: '投放记录', icon: Package },
  { to: '/monitor', label: '日常监控', icon: Thermometer },
  { to: '/monitor/alerts', label: '告警中心', icon: AlertTriangle },
  { to: '/store', label: '积分商城', icon: ShoppingBag },
  { to: '/profile', label: '个人中心', icon: User },
];

const roleLabels: Record<string, string> = {
  admin: '管理员',
  manager: '堆肥管理员',
  resident: '居民',
};

export default function Layout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const sidebarContent = (
    <>
      <div className="flex items-center gap-2 px-4 py-5 border-b border-white/10">
        <Leaf className="w-7 h-7 text-compost-pale flex-shrink-0" />
        {!collapsed && (
          <span className="text-white font-serif text-lg font-bold whitespace-nowrap">
            社区堆肥管理
          </span>
        )}
      </div>
      <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 mx-2 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-white/20 text-white font-medium'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span className="whitespace-nowrap">{label}</span>}
          </NavLink>
        ))}
      </nav>
    </>
  );

  return (
    <div className="flex h-screen overflow-hidden">
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 flex flex-col bg-[#2D6A4F] text-white transition-all duration-300 ${
          collapsed ? 'w-16' : 'w-56'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {sidebarContent}
        <div className="px-3 py-3 border-t border-white/10">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex items-center justify-center w-full py-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-white border-b border-gray-100 flex items-center justify-between px-4 flex-shrink-0">
          <button
            className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            {user && (
              <>
                <span className="text-sm text-gray-700">{user.name}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-compost-pale text-compost-green font-medium">
                  {roleLabels[user.role] || user.role}
                </span>
              </>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-500 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">退出</span>
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto bg-[#FAF6F0] p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
