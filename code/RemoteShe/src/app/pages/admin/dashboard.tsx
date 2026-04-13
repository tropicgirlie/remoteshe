import { Link, Outlet, useLocation, useNavigate } from "react-router";
import {
  Grid3X3, LayoutDashboard, Building2, Briefcase, Gift, BarChart2,
  Bell, Plus, Search, Settings, User, Users, RefreshCw, Inbox, LogOut, Activity,
} from "lucide-react";
import { useAuth } from "../../lib/auth-context";
import { ProtectedRoute } from "../../components/protected-route";
import { toast } from "sonner";

const NAV_ITEMS = [
  { path: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { path: '/admin/companies', label: 'Companies', icon: Building2 },
  { path: '/admin/jobs', label: 'Jobs Management', icon: Briefcase },
  { path: '/admin/ats-sync', label: 'ATS Sync', icon: RefreshCw },
  { path: '/admin/perks', label: 'Perks Registry', icon: Gift },
  { path: '/admin/subscribers', label: 'Subscribers', icon: Users },
  { path: '/admin/inbox', label: 'Inbox', icon: Inbox },
  { path: '/admin/diagnostic', label: 'Diagnostics', icon: Activity },
];

const REPORT_ITEMS = [
  { path: '/admin/analytics', label: 'Care Analytics', icon: BarChart2 },
];

export function AdminDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success("Logged out successfully");
      navigate("/login");
    } catch (error: any) {
      toast.error("Logout failed");
    }
  };

  const isActive = (path: string, exact?: boolean) => {
    if (exact) return location.pathname === path;
    return location.pathname === path || (path === '/admin/companies' && location.pathname === '/admin');
  };

  return (
    <div className="min-h-screen bg-[#F4F5FA] flex">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-gray-100 flex flex-col flex-shrink-0 fixed h-full z-40">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-gray-100">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 bg-[#5B39C8] rounded flex items-center justify-center">
              <Grid3X3 className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 leading-tight">RemoteShe</p>
              <p className="text-[10px] text-gray-400">Admin Portal</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <ul className="space-y-0.5">
            {NAV_ITEMS.map(item => {
              const Icon = item.icon;
              const active = isActive(item.path, item.exact);
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                      active
                        ? 'bg-[#5B39C8]/10 text-[#5B39C8] font-semibold'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${active ? 'text-[#5B39C8]' : 'text-gray-400'}`} />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="mt-6">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 px-3 mb-2">Reports</p>
            <ul className="space-y-0.5">
              {REPORT_ITEMS.map(item => {
                const Icon = item.icon;
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                    >
                      <Icon className="w-4 h-4 text-gray-400" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>

        {/* User info */}
        <div className="px-4 py-4 border-t border-gray-100">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-8 h-8 rounded-full bg-[#5B39C8]/10 flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 text-[#5B39C8]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-900 truncate">
                {user?.user_metadata?.name || user?.email || "Admin"}
              </p>
              <p className="text-[10px] text-gray-400">Super Admin</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 ml-56 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3 flex-1 max-w-sm">
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 flex-1">
              <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <input
                type="text"
                placeholder="Search companies, jobs, or perks..."
                className="text-sm bg-transparent outline-none text-gray-600 placeholder-gray-400 flex-1 min-w-0"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="relative w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-50 transition-colors">
              <Bell className="w-5 h-5 text-gray-500" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#5B39C8] rounded-full"></span>
            </button>
            <button
              onClick={() => navigate('/admin/companies')}
              className="flex items-center gap-2 px-4 py-2 bg-[#5B39C8] text-white text-sm font-semibold rounded-lg hover:bg-[#4a2fb0] transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Listing
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}