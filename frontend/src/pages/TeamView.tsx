import { useState, FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../hooks/useApi';
import { api } from '../utils/api';
import Card from '../components/Card';

const sportEmoji: Record<string, string> = { BASEBALL: '⚾', SOFTBALL: '🥎', BASKETBALL: '🏀', SOCCER: '⚽', FLAG_FOOTBALL: '🏈', OTHER: '🏅' };

const POSITIONS_BY_SPORT: Record<string, string[]> = {
  BASEBALL: ['Pitcher', 'Catcher', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH', 'Utility'],
  SOFTBALL: ['Pitcher', 'Catcher', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DP', 'Utility'],
  BASKETBALL: ['PG', 'SG', 'SF', 'PF', 'C'],
  SOCCER: ['GK', 'CB', 'FB', 'WB', 'DM', 'CM', 'AM', 'W', 'ST'],
  FLAG_FOOTBALL: ['QB', 'RB', 'WR', 'C', 'Rusher', 'LB', 'DB', 'S'],
  OTHER: [],
};

interface RosterForm { firstName: string; lastName: string; position: string; jerseyNumber: string }
const emptyRoster: RosterForm = { firstName: '', lastName: '', position: '', jerseyNumber: '' };

export default function TeamView() {
  const { id } = useParams();
  const { token, user } = useAuth();
  const { data: team, loading, refetch } = useApi<any>(`/teams/${id}`, [id]);
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [form, setForm] = useState<RosterForm>({ ...emptyRoster });
  const [editForm, setEditForm] = useState<RosterForm>({ ...emptyRoster });

  const isCoachOrAdmin = user?.role === 'COACH' || user?.role === 'ORG_ADMIN';
  const positions = team?.sport ? POSITIONS_BY_SPORT[team.sport] || [] : [];

  const handleAddPlayer = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.firstName || !form.lastName) return;
    await api(`/teams/${id}/members`, { method: 'POST', token: token!, body: { ...form, role: 'PLAYER' } });
    setForm({ ...emptyRoster });
    setShowAddPlayer(false);
    refetch();
  };

  const startEdit = (member: any) => {
    setEditingMemberId(member.id);
    setEditForm({
      firstName: member.firstName || member.child?.firstName || member.user?.firstName || '',
      lastName: member.lastName || member.child?.lastName || member.user?.lastName || '',
      position: member.position || '',
      jerseyNumber: member.jerseyNumber || '',
    });
  };

  const handleEditMember = async (e: FormEvent) => {
    e.preventDefault();
    await api(`/teams/${id}/members/${editingMemberId}`, { method: 'PUT', token: token!, body: editForm });
    setEditingMemberId(null);
    refetch();
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Remove this player from the roster?')) return;
    await api(`/teams/${id}/members/${memberId}`, { method: 'DELETE', token: token! });
    refetch();
  };

  const getMemberName = (m: any) => {
    if (m.firstName && m.lastName) return `${m.firstName} ${m.lastName}`;
    if (m.child) return `${m.child.firstName} ${m.child.lastName}`;
    if (m.user) return `${m.user.firstName} ${m.user.lastName}`;
    return 'Unknown';
  };

  if (loading) return <div className="text-center py-12 text-gray-400">Loading...</div>;
  if (!team) return <div className="text-center py-12 text-gray-400">Team not found.</div>;

  const players = team.members?.filter((m: any) => m.role === 'PLAYER') || [];
  const coaches = team.members?.filter((m: any) => m.role === 'COACH' || m.role === 'MANAGER') || [];

  return (
    <div className="px-1 sm:px-0">
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 sm:w-14 h-12 sm:h-14 bg-primary/10 rounded-full flex items-center justify-center text-2xl shrink-0">
            {sportEmoji[team.sport] || '🏅'}
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-secondary">{team.name}</h1>
            <p className="text-primary font-medium text-sm sm:text-base">
              {team.sport?.replace(/_/g, ' ')} {team.season && `· ${team.season}`} {team.ageGroup && `· ${team.ageGroup}`}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Roster */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-secondary">Roster ({players.length})</h2>
            {isCoachOrAdmin && (
              <button onClick={() => { setShowAddPlayer(!showAddPlayer); setEditingMemberId(null); }}
                className="text-sm bg-primary text-white px-3 py-1.5 rounded-lg font-medium hover:bg-blue-700 transition">
                {showAddPlayer ? 'Cancel' : '+ Add Player'}
              </button>
            )}
          </div>

          {/* Add player form */}
          {showAddPlayer && (
            <form onSubmit={handleAddPlayer} className="mb-4 p-3 bg-slate rounded-lg space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <input placeholder="First Name *" value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} required
                  className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none" />
                <input placeholder="Last Name *" value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} required
                  className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                {positions.length > 0 ? (
                  <select value={form.position} onChange={e => setForm({ ...form, position: e.target.value })}
                    className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none bg-white">
                    <option value="">Position...</option>
                    {positions.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                ) : (
                  <input placeholder="Position" value={form.position} onChange={e => setForm({ ...form, position: e.target.value })}
                    className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none" />
                )}
                <input placeholder="Jersey #" value={form.jerseyNumber} onChange={e => setForm({ ...form, jerseyNumber: e.target.value })}
                  className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none" />
              </div>
              <button type="submit" className="w-full sm:w-auto px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium">Add to Roster</button>
            </form>
          )}

          {/* Coaches */}
          {coaches.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Coaching Staff</p>
              {coaches.map((m: any) => (
                <div key={m.id} className="flex items-center justify-between p-2.5 bg-amber-50 rounded-lg mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">{m.role}</span>
                    <span className="text-sm font-medium text-secondary">{getMemberName(m)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Players */}
          {players.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-gray-400 text-sm mb-2">No players on the roster yet.</p>
              {isCoachOrAdmin && (
                <button onClick={() => setShowAddPlayer(true)} className="text-sm text-primary hover:underline font-medium">
                  + Add your first player
                </button>
              )}
            </div>
          ) : (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Players</p>

              {/* Table header - desktop */}
              <div className="hidden sm:grid grid-cols-12 gap-2 px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase">
                <div className="col-span-1">#</div>
                <div className="col-span-4">Name</div>
                <div className="col-span-3">Position</div>
                <div className="col-span-4 text-right">Actions</div>
              </div>

              <div className="space-y-1.5">
                {players.map((m: any) => (
                  <div key={m.id}>
                    {editingMemberId === m.id ? (
                      <form onSubmit={handleEditMember} className="p-3 bg-blue-50 rounded-lg space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <input placeholder="First Name" value={editForm.firstName} onChange={e => setEditForm({ ...editForm, firstName: e.target.value })}
                            className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary/30 outline-none" />
                          <input placeholder="Last Name" value={editForm.lastName} onChange={e => setEditForm({ ...editForm, lastName: e.target.value })}
                            className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary/30 outline-none" />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {positions.length > 0 ? (
                            <select value={editForm.position} onChange={e => setEditForm({ ...editForm, position: e.target.value })}
                              className="px-3 py-2 border rounded-lg text-sm outline-none bg-white">
                              <option value="">Position...</option>
                              {positions.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                          ) : (
                            <input placeholder="Position" value={editForm.position} onChange={e => setEditForm({ ...editForm, position: e.target.value })}
                              className="px-3 py-2 border rounded-lg text-sm outline-none" />
                          )}
                          <input placeholder="Jersey #" value={editForm.jerseyNumber} onChange={e => setEditForm({ ...editForm, jerseyNumber: e.target.value })}
                            className="px-3 py-2 border rounded-lg text-sm outline-none" />
                        </div>
                        <div className="flex gap-2">
                          <button type="submit" className="px-3 py-1.5 bg-primary text-white rounded-lg text-sm font-medium">Save</button>
                          <button type="button" onClick={() => setEditingMemberId(null)} className="px-3 py-1.5 bg-gray-200 rounded-lg text-sm">Cancel</button>
                        </div>
                      </form>
                    ) : (
                      <>
                        {/* Desktop row */}
                        <div className="hidden sm:grid grid-cols-12 gap-2 items-center px-3 py-2.5 bg-slate rounded-lg hover:bg-gray-100 transition">
                          <div className="col-span-1 font-bold text-primary text-lg">{m.jerseyNumber || '—'}</div>
                          <div className="col-span-4 font-medium text-secondary">{getMemberName(m)}</div>
                          <div className="col-span-3">
                            {m.position && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{m.position}</span>}
                          </div>
                          <div className="col-span-4 flex justify-end gap-1">
                            {isCoachOrAdmin && (
                              <>
                                <button onClick={() => startEdit(m)} className="p-1 text-gray-400 hover:text-primary transition text-sm">✏️</button>
                                <button onClick={() => handleRemoveMember(m.id)} className="p-1 text-gray-300 hover:text-red-500 transition text-sm">✕</button>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Mobile card */}
                        <div className="sm:hidden p-3 bg-slate rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center font-bold text-primary text-sm">
                                {m.jerseyNumber || '—'}
                              </div>
                              <div>
                                <p className="font-medium text-secondary">{getMemberName(m)}</p>
                                {m.position && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{m.position}</span>}
                              </div>
                            </div>
                            {isCoachOrAdmin && (
                              <div className="flex gap-1">
                                <button onClick={() => startEdit(m)} className="p-1.5 text-gray-400 hover:text-primary">✏️</button>
                                <button onClick={() => handleRemoveMember(m.id)} className="p-1.5 text-gray-300 hover:text-red-500">✕</button>
                              </div>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Schedule */}
        <Card>
          <h2 className="text-lg font-semibold text-secondary mb-4">Schedule ({team.events?.length || 0})</h2>
          {team.events?.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-6">No events scheduled.</p>
          ) : (
            <div className="space-y-2">
              {team.events?.map((e: any) => (
                <div key={e.id} className="p-3 bg-slate rounded-lg">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-secondary">{e.title}</p>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium shrink-0 ${
                      e.type === 'GAME' ? 'bg-primary/10 text-primary' :
                      e.type === 'PRACTICE' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
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
