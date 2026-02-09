import { useParams } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import Card from '../components/Card';

export default function TeamView() {
  const { id } = useParams();
  const { data: team, loading } = useApi<any>(`/teams/${id}`, [id]);

  if (loading) return <div className="text-center py-12 text-gray-400">Loading...</div>;
  if (!team) return <div className="text-center py-12 text-gray-400">Team not found.</div>;

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center text-2xl">⚽</div>
          <div>
            <h1 className="text-3xl font-bold text-secondary">{team.name}</h1>
            <p className="text-primary font-medium">{team.sport} {team.season && `· ${team.season}`} {team.ageGroup && `· ${team.ageGroup}`}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-lg font-semibold text-secondary mb-4">Roster ({team.members?.length || 0})</h2>
          {team.members?.length === 0 ? (
            <p className="text-gray-400 text-sm">No members yet.</p>
          ) : (
            <div className="space-y-2">
              {team.members?.map((m: any) => (
                <div key={m.id} className="flex items-center justify-between p-3 bg-slate rounded-lg">
                  <div>
                    <p className="font-medium text-secondary">
                      {m.child ? `${m.child.firstName} ${m.child.lastName}` : m.user ? `${m.user.firstName} ${m.user.lastName}` : 'Unknown'}
                    </p>
                    {m.user?.email && <p className="text-sm text-gray-500">{m.user.email}</p>}
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    m.role === 'COACH' ? 'bg-accent/10 text-accent-dark' : m.role === 'MANAGER' ? 'bg-primary/10 text-primary' : 'bg-green-50 text-green-700'
                  }`}>{m.role}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-secondary mb-4">Schedule ({team.events?.length || 0})</h2>
          {team.events?.length === 0 ? (
            <p className="text-gray-400 text-sm">No events scheduled.</p>
          ) : (
            <div className="space-y-2">
              {team.events?.map((e: any) => (
                <div key={e.id} className="p-3 bg-slate rounded-lg">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-secondary">{e.title}</p>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      e.type === 'GAME' ? 'bg-primary/10 text-primary' :
                      e.type === 'PRACTICE' ? 'bg-green-50 text-green-700' : 'bg-accent/10 text-accent-dark'
                    }`}>{e.type}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{new Date(e.startTime).toLocaleString()}</p>
                  {e.location && <p className="text-sm text-gray-400">📍 {e.location}</p>}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
