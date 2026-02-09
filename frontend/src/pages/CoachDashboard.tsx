import { useAuth } from '../context/AuthContext';
import { useApi } from '../hooks/useApi';
import Card from '../components/Card';
import { Link } from 'react-router-dom';

export default function CoachDashboard() {
  const { user } = useAuth();
  const { data: teams } = useApi<any[]>('/teams');
  const { data: events } = useApi<any[]>('/events');

  const upcoming = events?.filter((e: any) => new Date(e.startTime) > new Date()).slice(0, 5) || [];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-secondary">Coach Dashboard 🏆</h1>
        <p className="text-gray-500 mt-1">Welcome back, Coach {user?.lastName}!</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">My Teams</p>
              <p className="text-3xl font-bold text-secondary">{teams?.length || 0}</p>
            </div>
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-2xl">⚽</div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Players</p>
              <p className="text-3xl font-bold text-secondary">{teams?.reduce((sum: number, t: any) => sum + (t._count?.members || 0), 0) || 0}</p>
            </div>
            <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center text-2xl">👥</div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Upcoming Events</p>
              <p className="text-3xl font-bold text-secondary">{upcoming.length}</p>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center text-2xl">📅</div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-secondary">My Teams</h2>
            <Link to="/teams" className="text-sm text-primary hover:underline">View All</Link>
          </div>
          {teams?.length === 0 ? (
            <p className="text-gray-400 text-sm">No teams yet. Create your first team!</p>
          ) : (
            <div className="space-y-3">
              {teams?.map((team: any) => (
                <Link key={team.id} to={`/teams/${team.id}`} className="flex items-center justify-between p-3 bg-slate rounded-lg hover:bg-gray-100 transition">
                  <div>
                    <p className="font-medium text-secondary">{team.name}</p>
                    <p className="text-sm text-gray-500">{team.sport} · {team._count?.members || 0} members</p>
                  </div>
                  <span className="text-gray-400">→</span>
                </Link>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-secondary">Upcoming Schedule</h2>
            <Link to="/schedule" className="text-sm text-primary hover:underline">View All</Link>
          </div>
          {upcoming.length === 0 ? (
            <p className="text-gray-400 text-sm">No upcoming events.</p>
          ) : (
            <div className="space-y-3">
              {upcoming.map((event: any) => (
                <div key={event.id} className="p-3 bg-slate rounded-lg">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-secondary">{event.title}</p>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      event.type === 'GAME' ? 'bg-primary/10 text-primary' :
                      event.type === 'PRACTICE' ? 'bg-green-50 text-green-700' : 'bg-accent/10 text-accent-dark'
                    }`}>{event.type}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{event.team?.name} · {new Date(event.startTime).toLocaleString()}</p>
                  {event.location && <p className="text-sm text-gray-400">📍 {event.location}</p>}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
