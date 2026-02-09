import { Link, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  const dashboardPath = user?.role === 'COACH' ? '/coach' : user?.role === 'ORG_ADMIN' ? '/admin' : '/dashboard';

  return (
    <div className="min-h-screen bg-slate">
      <nav className="bg-secondary text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link to={dashboardPath} className="flex items-center space-x-2">
              <span className="text-2xl font-extrabold text-primary">Elev8</span>
              <span className="text-lg font-semibold text-accent">Sports</span>
            </Link>
            <div className="flex items-center space-x-6">
              <Link to="/teams" className="hover:text-primary transition-colors">Teams</Link>
              <Link to="/schedule" className="hover:text-primary transition-colors">Schedule</Link>
              <Link to="/messages" className="hover:text-primary transition-colors">Messages</Link>
              <Link to="/directory" className="hover:text-primary transition-colors">Directory</Link>
              <Link to="/import-stats" className="hover:text-primary transition-colors">Stats</Link>
              <div className="flex items-center space-x-3 ml-4 pl-4 border-l border-gray-600">
                <span className="text-sm text-gray-300">{user?.firstName} {user?.lastName}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">{user?.role}</span>
                <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-white transition-colors">Logout</button>
              </div>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}
