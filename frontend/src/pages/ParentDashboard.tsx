import { useAuth } from '../context/AuthContext';
import { useApi } from '../hooks/useApi';
import Card from '../components/Card';
import { Link } from 'react-router-dom';

export default function ParentDashboard() {
  const { user } = useAuth();
  const { data: children } = useApi<any[]>('/children');
  const { data: events } = useApi<any[]>('/events');
  const { data: notifications } = useApi<any[]>('/notifications');
  const { data: imports } = useApi<any[]>('/imports/gamechanger/imports');

  const upcoming = events?.filter((e: any) => new Date(e.startTime) > new Date()).slice(0, 5) || [];
  const unread = notifications?.filter((n: any) => !n.read).length || 0;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-secondary">Welcome back, {user?.firstName}! 👋</h1>
        <p className="text-gray-500 mt-1">Here's what's happening with your family's sports.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">My Children</p>
              <p className="text-3xl font-bold text-secondary">{children?.length || 0}</p>
            </div>
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-2xl">👧</div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Upcoming Events</p>
              <p className="text-3xl font-bold text-secondary">{upcoming.length}</p>
            </div>
            <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center text-2xl">📅</div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Notifications</p>
              <p className="text-3xl font-bold text-secondary">{unread}</p>
            </div>
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center text-2xl">🔔</div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-secondary">My Children</h2>
            <Link to="/children" className="text-sm text-primary hover:underline">Manage</Link>
          </div>
          {children?.length === 0 ? (
            <p className="text-gray-400 text-sm">No children added yet. Add a child to get started!</p>
          ) : (
            <div className="space-y-3">
              {children?.map((child: any) => (
                <Link key={child.id} to={`/players/${child.id}`} className="flex items-center justify-between p-3 bg-slate rounded-lg hover:bg-gray-100 transition">
                  <div>
                    <p className="font-medium text-secondary">{child.firstName} {child.lastName}</p>
                    <p className="text-sm text-gray-500">{child.teamMembers?.length || 0} teams</p>
                  </div>
                  <span className="text-gray-400 text-sm">View Stats →</span>
                </Link>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-secondary">Upcoming Events</h2>
            <Link to="/schedule" className="text-sm text-primary hover:underline">View All</Link>
          </div>
          {upcoming.length === 0 ? (
            <p className="text-gray-400 text-sm">No upcoming events.</p>
          ) : (
            <div className="space-y-3">
              {upcoming.map((event: any) => (
                <div key={event.id} className="flex items-center justify-between p-3 bg-slate rounded-lg">
                  <div>
                    <p className="font-medium text-secondary">{event.title}</p>
                    <p className="text-sm text-gray-500">{event.team?.name} · {new Date(event.startTime).toLocaleDateString()}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    event.type === 'GAME' ? 'bg-primary/10 text-primary' :
                    event.type === 'PRACTICE' ? 'bg-green-50 text-green-700' : 'bg-accent/10 text-accent-dark'
                  }`}>{event.type}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* GameChanger Import Card */}
      <Card className="mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-secondary">📊 Recent Stat Imports</h2>
          <Link to="/import-stats" className="text-sm text-primary hover:underline">Import Stats</Link>
        </div>
        {!imports || imports.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-gray-400 text-sm mb-2">No stats imported yet.</p>
            <Link to="/import-stats" className="text-sm text-primary hover:underline font-medium">
              Import from GameChanger →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {imports.slice(0, 3).map((imp: any) => (
              <div key={imp.id} className="flex items-center justify-between p-3 bg-slate rounded-lg">
                <div>
                  <p className="font-medium text-secondary">
                    {imp.child?.firstName} {imp.child?.lastName}
                    {imp.teamName && <span className="text-gray-500"> — {imp.teamName}</span>}
                  </p>
                  <p className="text-sm text-gray-500">
                    {imp.sport === 'SOFTBALL' ? '🥎' : '⚾'} {imp.sport} · {imp._count?.stats || 0} stats
                  </p>
                </div>
                <p className="text-xs text-gray-400">{new Date(imp.importedAt).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
