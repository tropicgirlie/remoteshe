import { Link, Outlet, useLocation } from "react-router";
import { FeedbackButton } from "./feedback-button";
import { useAuth } from "../lib/auth-context";
import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

function LogoMark() {
  return (
    <div className="w-7 h-7 bg-[#5B39C8] rounded-md flex items-center justify-center flex-shrink-0">
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <rect x="1" y="1" width="5" height="5" rx="1" fill="white" />
        <rect x="8" y="1" width="5" height="5" rx="1" fill="white" opacity="0.6" />
        <rect x="1" y="8" width="5" height="5" rx="1" fill="white" opacity="0.6" />
        <rect x="8" y="8" width="5" height="5" rx="1" fill="white" />
      </svg>
    </div>
  );
}

// Header logo — includes subtle "Carefolio Project" sub-label
function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2 flex-shrink-0">
      <LogoMark />
      <div className="flex flex-col leading-none">
        <span className="text-[15px] font-bold text-gray-900 tracking-tight">RemoteShe</span>
        <span className="text-[9px] font-medium text-[#5B39C8]/60 tracking-wide uppercase">Carefolio Project</span>
      </div>
    </Link>
  );
}

// Footer logo — no sub-label, cleaner
function FooterLogo() {
  return (
    <Link to="/" className="flex items-center gap-2 flex-shrink-0">
      <LogoMark />
      <span className="text-[15px] font-bold text-gray-900 tracking-tight">RemoteShe</span>
    </Link>
  );
}

export function RootLayout() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");

  if (isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Outlet />
      </div>
    );
  }

  const navLinks = [
    { label: "Find Jobs", to: "/jobs" },
    { label: "Companies", to: "/companies" },
    { label: "Care Benefits", to: "/jobs" },
    { label: "Resources", to: "/about" },
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* ── TOP NAV ── */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-[60px]">
            <Logo />

            <nav className="hidden md:flex items-center gap-7">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  to={link.to}
                  className="text-[14px] text-gray-600 hover:text-[#5B39C8] transition-colors font-medium"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              <Link
                to="/admin"
                className="hidden md:inline-flex items-center text-[13px] font-semibold px-4 py-[7px] bg-[#3D2496] text-white rounded-full hover:bg-[#2e1a75] transition-colors"
              >
                Post a job
              </Link>
              <Link
                to="/admin"
                className="inline-flex items-center text-[13px] font-semibold px-4 py-[7px] border border-gray-300 text-gray-700 rounded-full hover:border-[#5B39C8] hover:text-[#5B39C8] transition-colors"
              >
                Log in
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* ── PAGE CONTENT ── */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* ── FOOTER ── */}
      <footer className="bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">

            {/* Left column — brand + description + ecosystem attribution */}
            <div className="md:col-span-1">
              <FooterLogo />
              <p className="text-sm text-gray-500 leading-relaxed mt-3 mb-5">
                RemoteShe is a remote job discovery platform highlighting companies with strong care infrastructure.
              </p>
              {/* Ecosystem attribution — hierarchical, muted */}
              <div className="space-y-1.5 border-t border-gray-100 pt-4">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-[10px] text-gray-300 font-medium uppercase tracking-wider w-16 flex-shrink-0">Data</span>
                  <a
                    href="https://carefolio.io"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-gray-400 hover:text-[#5B39C8] transition-colors"
                  >
                    Part of the Carefolio ecosystem
                  </a>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-[10px] text-gray-300 font-medium uppercase tracking-wider w-16 flex-shrink-0">Framework</span>
                  <a
                    href="https://momops.org"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-gray-400 hover:text-[#5B39C8] transition-colors"
                  >
                    Built within MomOps
                  </a>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-[10px] text-gray-300 font-medium uppercase tracking-wider w-16 flex-shrink-0">Creator</span>
                  <a
                    href="https://luana.systems"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-gray-400 hover:text-[#5B39C8] transition-colors"
                  >
                    Luana.systems
                  </a>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3">Platform</h4>
              <ul className="space-y-2">
                <li><Link to="/jobs" className="text-sm text-gray-500 hover:text-[#5B39C8] transition-colors">Find Jobs</Link></li>
                <li><Link to="/companies" className="text-sm text-gray-500 hover:text-[#5B39C8] transition-colors">Carefolio Index</Link></li>
                <li><Link to="/companies" className="text-sm text-gray-500 hover:text-[#5B39C8] transition-colors">Browse Companies</Link></li>
                <li><Link to="/about" className="text-sm text-gray-500 hover:text-[#5B39C8] transition-colors">About</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3">Support</h4>
              <ul className="space-y-2">
                <li><Link to="/about" className="text-sm text-gray-500 hover:text-[#5B39C8] transition-colors">Help Center</Link></li>
                <li><Link to="/about" className="text-sm text-gray-500 hover:text-[#5B39C8] transition-colors">Resources</Link></li>
                <li><Link to="/about" className="text-sm text-gray-500 hover:text-[#5B39C8] transition-colors">Privacy Policy</Link></li>
                <li><Link to="/about" className="text-sm text-gray-500 hover:text-[#5B39C8] transition-colors">Terms of Service</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3">Follow Us</h4>
              <div className="flex items-center gap-3">
                <a href="#" className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-[#5B39C8] group transition-colors">
                  <svg className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                  </svg>
                </a>
                <a href="#" className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-[#5B39C8] group transition-colors">
                  <svg className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z" />
                    <circle cx="4" cy="4" r="2" />
                  </svg>
                </a>
              </div>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-gray-100 flex items-center justify-between flex-wrap gap-3">
            <p className="text-xs text-gray-400">© 2025 RemoteShe · A <a href="https://luana.systems" target="_blank" rel="noopener noreferrer" className="hover:text-[#5B39C8] transition-colors">Luana.systems</a> product</p>
            <p className="text-xs text-gray-300">
              <a href="https://carefolio.io" target="_blank" rel="noopener noreferrer" className="hover:text-gray-400 transition-colors">Carefolio</a>
              <span className="mx-1.5">·</span>
              <a href="https://momops.org" target="_blank" rel="noopener noreferrer" className="hover:text-gray-400 transition-colors">MomOps</a>
            </p>
          </div>
        </div>
      </footer>

      {/* Floating feedback button — public pages only */}
      <FeedbackButton />
      <QuickAdminAccess />
    </div>
  );
}

function QuickAdminAccess() {
  const [show, setShow] = useState(false);
  const { signUp, signIn } = useAuth();
  const navigate = useNavigate();

  const quickLogin = async () => {
    const adminEmail = "admin@remoteshe.com";
    const adminPassword = "admin123";

    try {
      // Try to login first
      try {
        await signIn(adminEmail, adminPassword);
        toast.success("Welcome back, Admin!");
        navigate("/admin/diagnostic");
        return;
      } catch {
        // If login fails, create account
        await signUp(adminEmail, adminPassword, "Admin");
        toast.success("Admin account created!");
        navigate("/admin/diagnostic");
      }
    } catch (error: any) {
      toast.error("Quick login failed: " + error.message);
    }
  };

  return (
    <div className="fixed bottom-6 left-6 z-50">
      {!show ? (
        <button
          onClick={() => setShow(true)}
          className="w-3 h-3 bg-gray-200 hover:bg-[#6B46C1] rounded-full opacity-20 hover:opacity-100 transition-all"
          title="Quick Admin Access"
        />
      ) : (
        <div className="bg-white border-2 border-[#6B46C1] rounded-lg shadow-xl p-4 min-w-[200px]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-gray-900">Quick Admin</span>
            <button
              onClick={() => setShow(false)}
              className="text-gray-400 hover:text-gray-600 text-sm"
            >
              ✕
            </button>
          </div>
          <button
            onClick={quickLogin}
            className="w-full px-3 py-2 bg-[#6B46C1] hover:bg-[#5a3aa0] text-white text-xs font-semibold rounded-lg transition-colors"
          >
            Login as Admin
          </button>
          <p className="text-[10px] text-gray-400 mt-2 text-center">
            admin@remoteshe.com
          </p>
        </div>
      )}
    </div>
  );
}