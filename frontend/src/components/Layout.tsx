import { useState } from 'react';
import { Link, useNavigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ROLES = [
  { value: 'PARENT', label: 'Parent', icon: '👨‍👧', color: 'bg-blue-500' },
  { value: 'COACH', label: 'Coach', icon: '🏋️', color: 'bg-green-500' },
  { value: 'ORG_ADMIN', label: 'Org Admin', icon: '🏢', color: 'bg-purple-500' },
] as const;

export default function Layout() {
  const { user, logout, isAdminMode, activeRole, setActiveRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [roleSwitcherOpen, setRoleSwitcherOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  const dashboardPath = activeRole === 'COACH' ? '/coach' : activeRole === 'ORG_ADMIN' ? '/admin' : '/parent';

  const navLinks = [
    { to: dashboardPath, label: 'Dashboard', icon: '🏠' },
    { to: '/teams', label: 'Teams', icon: '👥' },
    { to: '/schedule', label: 'Schedule', icon: '📅' },
    { to: '/messages', label: 'Messages', icon: '💬' },
    { to: '/directory', label: 'Directory', icon: '🔍' },
    { to: '/children', label: 'Children', icon: '👧' },
  ];

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');
  const currentRoleInfo = ROLES.find(r => r.value === activeRole) || ROLES[0];

  const handleRoleSwitch = (role: 'PARENT' | 'COACH' | 'ORG_ADMIN') => {
    setActiveRole(role);
    setRoleSwitcherOpen(false);
    setMenuOpen(false);
    const path = role === 'COACH' ? '/coach' : role === 'ORG_ADMIN' ? '/admin' : '/parent';
    navigate(path);
  };

  return (
    <div className="min-h-screen bg-slate">
      {/* Admin role switcher bar */}
      {isAdminMode && (
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-center py-1.5 px-4 text-xs sm:text-sm font-medium relative z-50">
          <span className="mr-2">⚡ Admin Mode</span>
          <span className="hidden sm:inline mr-2">— Viewing as:</span>
          <div className="inline-flex gap-1 sm:gap-2">
            {ROLES.map(role => (
              <button key={role.value} onClick={() => handleRoleSwitch(role.value)}
                className={`px-2 sm:px-3 py-0.5 rounded-full text-xs font-semibold transition ${
                  activeRole === role.value
                    ? 'bg-white text-orange-600'
                    : 'bg-white/20 hover:bg-white/30'
                }`}>
                <span className="hidden sm:inline">{role.icon} </span>{role.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Top nav */}
      <nav className="bg-secondary text-white shadow-lg sticky top-0 z-40">
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
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  activeRole === 'COACH' ? 'bg-green-500/20 text-green-400' :
                  activeRole === 'ORG_ADMIN' ? 'bg-purple-500/20 text-purple-400' :
                  'bg-primary/20 text-primary'
                }`}>
                  {currentRoleInfo.icon} {currentRoleInfo.label}
                </span>
                <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-white transition-colors">Logout</button>
              </div>
            </div>

            {/* Mobile hamburger */}
            <div className="flex items-center gap-2 md:hidden">
              {isAdminMode && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  activeRole === 'COACH' ? 'bg-green-500/20 text-green-400' :
                  activeRole === 'ORG_ADMIN' ? 'bg-purple-500/20 text-purple-400' :
                  'bg-primary/20 text-primary'
                }`}>
                  {currentRoleInfo.icon}
                </span>
              )}
              <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 -mr-2 text-2xl">
                {menuOpen ? '✕' : '☰'}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-gray-700 bg-secondary">
            {/* Mobile role switcher */}
            {isAdminMode && (
              <div className="px-4 py-3 border-b border-gray-700">
                <p className="text-xs text-gray-400 mb-2 font-medium">⚡ SWITCH VIEW</p>
                <div className="flex gap-2">
                  {ROLES.map(role => (
                    <button key={role.value} onClick={() => handleRoleSwitch(role.value)}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition text-center ${
                        activeRole === role.value
                          ? 'bg-primary text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}>
                      {role.icon}<br /><span className="text-xs">{role.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

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
                <p className="text-xs text-gray-400">{currentRoleInfo.label}</p>
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
