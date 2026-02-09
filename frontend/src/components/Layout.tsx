import { useState } from 'react';
import { Link, useNavigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  const dashboardPath = user?.role === 'COACH' ? '/coach' : user?.role === 'ORG_ADMIN' ? '/admin' : '/parent';

  const navLinks = [
    { to: dashboardPath, label: 'Dashboard', icon: '🏠' },
    { to: '/teams', label: 'Teams', icon: '👥' },
    { to: '/schedule', label: 'Schedule', icon: '📅' },
    { to: '/messages', label: 'Messages', icon: '💬' },
    { to: '/directory', label: 'Directory', icon: '🔍' },
    { to: '/import-stats', label: 'Stats', icon: '📊' },
    { to: '/children', label: 'Children', icon: '👧' },
  ];

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <div className="min-h-screen bg-slate">
      {/* Top nav */}
      <nav className="bg-secondary text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-14 sm:h-16 items-center">
            <Link to={dashboardPath} className="flex items-center space-x-2">
              <span className="text-xl sm:text-2xl font-extrabold text-primary">Elev8</span>
              <span className="text-base sm:text-lg font-semibold text-accent">Sports</span>
            </Link>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center space-x-5">
              {navLinks.map(link => (
                <Link key={link.to} to={link.to}
                  className={`text-sm hover:text-primary transition-colors ${isActive(link.to) ? 'text-primary font-semibold' : ''}`}>
                  {link.label}
                </Link>
              ))}
              <div className="flex items-center space-x-3 ml-3 pl-3 border-l border-gray-600">
                <span className="text-sm text-gray-300">{user?.firstName}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">{user?.role?.replace('_', ' ')}</span>
                <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-white transition-colors">Logout</button>
              </div>
            </div>

            {/* Mobile hamburger */}
            <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 -mr-2 text-2xl">
              {menuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-gray-700 bg-secondary">
            <div className="px-4 py-3 space-y-1">
              {navLinks.map(link => (
                <Link key={link.to} to={link.to} onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-base transition ${
                    isActive(link.to) ? 'bg-primary/20 text-primary font-semibold' : 'text-gray-300 hover:bg-gray-700'
                  }`}>
                  <span>{link.icon}</span>
                  <span>{link.label}</span>
                </Link>
              ))}
            </div>
            <div className="border-t border-gray-700 px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm text-white">{user?.firstName} {user?.lastName}</p>
                <p className="text-xs text-gray-400">{user?.role?.replace('_', ' ')}</p>
              </div>
              <button onClick={() => { handleLogout(); setMenuOpen(false); }}
                className="text-sm bg-gray-700 text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-600 transition">
                Logout
              </button>
            </div>
          </div>
        )}
      </nav>

      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        <Outlet />
      </main>
    </div>
  );
}
