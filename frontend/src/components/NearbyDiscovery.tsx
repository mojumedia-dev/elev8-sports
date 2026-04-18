import { useApi } from '../hooks/useApi';
import Card from './Card';
import { Link } from 'react-router-dom';

const sportEmoji: Record<string, string> = { BASEBALL:'⚾', SOFTBALL:'🥎', BASKETBALL:'🏀', SOCCER:'⚽', FLAG_FOOTBALL:'🏈', OTHER:'🏅' };

export default function NearbyDiscovery() {
  const { data: players } = useApi<any[]>('/users/nearby-players');
  const { data: teams } = useApi<any[]>('/teams/nearby');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
      <Card>
        <h2 className="text-lg font-semibold text-secondary mb-4">🧒 Players in Your Area</h2>
        {!players || players.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-4">No players found in your org's city yet.</p>
        ) : (
          <div className="space-y-2">
            {players.slice(0, 10).map((p: any) => (
              <div key={p.id} className="p-3 bg-slate rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="font-medium text-secondary truncate">{p.firstName} {p.lastName}</p>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 mt-0.5">
                      {p.sport && <span>{sportEmoji[p.sport] || '🏅'} {p.sport.replace(/_/g, ' ')}</span>}
                      {p.positions?.length > 0 && <span>{p.positions.join(', ')}</span>}
                      {p.parent?.city && <span>📍 {p.parent.city}</span>}
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 shrink-0 ml-2">{p.teamMembers?.length || 0} team{p.teamMembers?.length === 1 ? '' : 's'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-secondary mb-4">🏆 Teams in Your Area</h2>
        {!teams || teams.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-4">No teams found in your org's city yet.</p>
        ) : (
          <div className="space-y-2">
            {teams.slice(0, 10).map((t: any) => (
              <Link key={t.id} to={`/teams/${t.id}`} className="block p-3 bg-slate rounded-lg hover:bg-gray-100 transition">
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="font-medium text-secondary truncate">{t.name}</p>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 mt-0.5">
                      <span>{sportEmoji[t.sport] || '🏅'} {t.sport?.replace(/_/g, ' ')}</span>
                      {t.ageGroup && <span>{t.ageGroup}</span>}
                      {t.organization && <span className="text-accent">{t.organization.name}</span>}
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 shrink-0 ml-2">👥 {t._count?.members || 0}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
