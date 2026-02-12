import { useAuth } from '../context/AuthContext';
import { useApi } from '../hooks/useApi';
import Card from '../components/Card';
import { Link } from 'react-router-dom';

export default function ParentDashboard() {
  const { user } = useAuth();
  const { data: children } = useApi<any[]>('/children');
  const { data: events } = useApi<any[]>('/events');
  const { data: notifications } = useApi<any[]>('/notifications');
  const { data: announcements } = useApi<any[]>('/announcements/all');

  const upcoming = events?.filter((e: any) => new Date(e.startTime) > new Date()).slice(0, 5) || [];
  const unread = notifications?.filter((n: any) => !n.read).length || 0;

  return (
    <div className="px-1 sm:px-0">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-secondary">Welcome back, {user?.firstName}! 👋</h1>
        <p className="text-gray-500 mt-1 text-sm sm:text-base">Here's what's happening with your family's sports.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Announcements Feed */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-secondary">📢 Announcements</h2>
          </div>
          {!announcements || announcements.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">No announcements yet.</p>
          ) : (
            <div className="space-y-3">
              {announcements.slice(0, 10).map((ann: any) => (
                <div key={ann.id} className="p-3 bg-slate rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-secondary text-sm">{ann.title}</h4>
                    {ann.organization && (
                      <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">{ann.organization.name}</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{ann.content}</p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(ann.createdAt).toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* My Children */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-secondary">My Children</h2>
            <Link to="/children" className="text-sm text-primary hover:underline">Manage</Link>
          </div>
          {children?.length === 0 ? (
            <p className="text-gray-400 text-sm">No children added yet. <Link to="/children" className="text-primary hover:underline">Add a child</Link> to get started!</p>
          ) : (
            <div className="space-y-3">
              {children?.map((child: any) => (
                <Link key={child.id} to={`/players/${child.id}`} className="flex items-center justify-between p-3 bg-slate rounded-lg hover:bg-gray-100 transition">
                  <div>
                    <p className="font-medium text-secondary">{child.firstName} {child.lastName}</p>
                    <p className="text-sm text-gray-500">{child.teamMembers?.length || 0} teams</p>
                  </div>
                  <span className="text-gray-400 text-sm">View →</span>
                </Link>
              ))}
            </div>
          )}
        </Card>

        {/* Upcoming Events */}
        <Card className="lg:col-span-2">
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
                    event.type === 'PRACTICE' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
                  }`}>{event.type}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
