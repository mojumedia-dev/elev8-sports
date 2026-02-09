import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ParentDashboard from './pages/ParentDashboard';
import CoachDashboard from './pages/CoachDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Teams from './pages/Teams';
import TeamView from './pages/TeamView';
import Schedule from './pages/Schedule';
import Messages from './pages/Messages';
import Directory from './pages/Directory';
import ImportStats from './pages/ImportStats';
import PlayerProfile from './pages/PlayerProfile';
import Children from './pages/Children';
import OrgView from './pages/OrgView';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  return <>{children}</>;
}

function DashboardRedirect() {
  const { activeRole } = useAuth();
  if (activeRole === 'COACH') return <Navigate to="/coach" />;
  if (activeRole === 'ORG_ADMIN') return <Navigate to="/admin" />;
  return <Navigate to="/parent" />;
}

export default function App() {
  const { user, loading } = useAuth();

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading...</div>;

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
      <Route path="/signup" element={user ? <Navigate to="/dashboard" /> : <Signup />} />
      <Route path="/" element={<Navigate to={user ? '/dashboard' : '/login'} />} />
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<DashboardRedirect />} />
        <Route path="/parent" element={<ParentDashboard />} />
        <Route path="/coach" element={<CoachDashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/teams" element={<Teams />} />
        <Route path="/teams/:id" element={<TeamView />} />
        <Route path="/schedule" element={<Schedule />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/directory" element={<Directory />} />
        <Route path="/import-stats" element={<ImportStats />} />
        <Route path="/children" element={<Children />} />
        <Route path="/organizations/:id" element={<OrgView />} />
        <Route path="/players/:childId" element={<PlayerProfile />} />
      </Route>
    </Routes>
  );
}
