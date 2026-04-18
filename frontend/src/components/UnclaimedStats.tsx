import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../hooks/useApi';
import { api } from '../utils/api';
import Card from './Card';

interface Group {
  playerName: string;
  statCount: number;
  sport: string;
  season: string | null;
  statIds: string[];
}

export default function UnclaimedStats({ teamId }: { teamId: string }) {
  const { token } = useAuth();
  const { data: groups, refetch } = useApi<Group[]>(`/imports/gamechanger/unclaimed?teamId=${teamId}`, [teamId]);
  const { data: children } = useApi<any[]>('/children');
  const [claiming, setClaiming] = useState<string | null>(null);
  const [error, setError] = useState('');

  if (!groups || groups.length === 0) return null;

  const myKidsOnTeam = (children || []).filter((c: any) =>
    c.teamMembers?.some((tm: any) => tm.teamId === teamId)
  );

  const claim = async (group: Group, childId: string) => {
    setError('');
    setClaiming(group.playerName);
    try {
      await api('/imports/gamechanger/claim', {
        method: 'POST', token: token!,
        body: { childId, statIds: group.statIds },
      });
      refetch();
    } catch (e: any) {
      setError(e.message || 'Claim failed');
    } finally {
      setClaiming(null);
    }
  };

  return (
    <Card className="border-l-4 border-l-amber-500">
      <h2 className="text-lg font-semibold text-secondary mb-1">📥 Unclaimed Stats ({groups.length})</h2>
      <p className="text-xs text-gray-500 mb-4">
        Coach uploaded a CSV but these player names didn't match the Elev8 roster. If one is your kid, claim it below.
      </p>

      {myKidsOnTeam.length === 0 && (
        <p className="text-xs text-amber-600 mb-3">
          You don't have a child on this team's Elev8 roster yet — ask your coach to add them, then come back to claim.
        </p>
      )}

      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

      <div className="space-y-2">
        {groups.map(g => (
          <div key={g.playerName} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-slate rounded-lg gap-2">
            <div>
              <p className="font-medium text-secondary text-sm">{g.playerName}</p>
              <p className="text-xs text-gray-500">
                {g.sport === 'SOFTBALL' ? '🥎' : '⚾'} {g.statCount} stats {g.season && `· ${g.season}`}
              </p>
            </div>
            {myKidsOnTeam.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {myKidsOnTeam.map((c: any) => (
                  <button
                    key={c.id}
                    onClick={() => claim(g, c.id)}
                    disabled={claiming === g.playerName}
                    className="text-xs px-3 py-1.5 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition disabled:opacity-50">
                    {claiming === g.playerName ? '...' : `Claim for ${c.firstName}`}
                  </button>
                ))}
              </div>
            ) : (
              <span className="text-xs text-gray-400">No eligible kids</span>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
