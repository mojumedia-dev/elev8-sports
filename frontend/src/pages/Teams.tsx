import { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../hooks/useApi';
import { api } from '../utils/api';
import Card from '../components/Card';

const SPORTS = [
  { value: 'BASEBALL', label: '⚾ Baseball', emoji: '⚾' },
  { value: 'SOFTBALL', label: '🥎 Softball', emoji: '🥎' },
  { value: 'BASKETBALL', label: '🏀 Basketball', emoji: '🏀' },
  { value: 'SOCCER', label: '⚽ Soccer', emoji: '⚽' },
  { value: 'FLAG_FOOTBALL', label: '🏈 Flag Football', emoji: '🏈' },
  { value: 'OTHER', label: '🏅 Other', emoji: '🏅' },
];

const sportEmoji = (s: string) => SPORTS.find(sp => sp.value === s)?.emoji || '🏅';

interface TeamForm { name: string; sport: string; season: string; ageGroup: string }

function TeamFormFields({ form, setForm, onSubmit, onCancel, submitLabel }: {
  form: TeamForm; setForm: (f: TeamForm) => void; onSubmit: (e: FormEvent) => void; onCancel: () => void; submitLabel: string;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input placeholder="Team Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required
          className="px-4 py-2.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none text-base sm:text-sm" />
        <select value={form.sport} onChange={(e) => setForm({ ...form, sport: e.target.value })} required
          className="px-4 py-2.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none bg-white text-base sm:text-sm">
          <option value="">Select Sport...</option>
          {SPORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <input placeholder="Season (e.g., Spring 2026)" value={form.season} onChange={(e) => setForm({ ...form, season: e.target.value })}
          className="px-4 py-2.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none text-base sm:text-sm" />
        <input placeholder="Age Group (e.g., U12)" value={form.ageGroup} onChange={(e) => setForm({ ...form, ageGroup: e.target.value })}
          className="px-4 py-2.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none text-base sm:text-sm" />
      </div>
      <div className="flex flex-col sm:flex-row gap-2">
        <button type="submit" className="px-4 py-2.5 sm:py-2 bg-primary text-white rounded-lg text-sm font-medium w-full sm:w-auto">{submitLabel}</button>
        <button type="button" onClick={onCancel} className="px-4 py-2.5 sm:py-2 bg-gray-200 rounded-lg text-sm w-full sm:w-auto">Cancel</button>
      </div>
    </form>
  );
}

export default function Teams() {
  const { token, user } = useAuth();
  const { data: teams, refetch } = useApi<any[]>('/teams');
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<TeamForm>({ name: '', sport: '', season: '', ageGroup: '' });
  const [editForm, setEditForm] = useState<TeamForm>({ name: '', sport: '', season: '', ageGroup: '' });

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    await api('/teams', { method: 'POST', body: form, token: token! });
    setForm({ name: '', sport: '', season: '', ageGroup: '' });
    setShowCreate(false);
    refetch();
  };

  const startEdit = (team: any) => {
    setEditingId(team.id);
    setEditForm({ name: team.name, sport: team.sport || '', season: team.season || '', ageGroup: team.ageGroup || '' });
    setShowCreate(false);
  };

  const handleEdit = async (e: FormEvent) => {
    e.preventDefault();
    await api(`/teams/${editingId}`, { method: 'PUT', body: editForm, token: token! });
    setEditingId(null);
    refetch();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this team? This cannot be undone.')) return;
    await api(`/teams/${id}`, { method: 'DELETE', token: token! });
    refetch();
  };

  return (
    <div className="px-1 sm:px-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-secondary">Teams</h1>
          <p className="text-gray-500 mt-1 text-sm sm:text-base">Manage your teams and rosters.</p>
        </div>
        {(user?.role === 'COACH' || user?.role === 'ORG_ADMIN') && (
          <button onClick={() => { setShowCreate(!showCreate); setEditingId(null); }}
            className="px-5 py-2.5 bg-primary hover:bg-blue-700 text-white font-medium rounded-lg transition w-full sm:w-auto">
            {showCreate ? 'Cancel' : '+ Create Team'}
          </button>
        )}
      </div>

      {showCreate && (
        <Card className="mb-6">
          <h2 className="text-lg font-semibold mb-4">Create New Team</h2>
          <TeamFormFields form={form} setForm={setForm} onSubmit={handleCreate} onCancel={() => setShowCreate(false)} submitLabel="Create Team" />
        </Card>
      )}

      {teams?.length === 0 ? (
        <Card><p className="text-gray-400 text-center py-8">No teams yet. Create your first team to get started!</p></Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {teams?.map((team: any) => (
            <Card key={team.id}>
              {editingId === team.id ? (
                <div>
                  <h3 className="text-lg font-semibold text-secondary mb-3">Edit Team</h3>
                  <TeamFormFields form={editForm} setForm={setEditForm} onSubmit={handleEdit} onCancel={() => setEditingId(null)} submitLabel="Save Changes" />
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between">
                    <Link to={`/teams/${team.id}`} className="flex-1">
                      <h3 className="text-lg font-semibold text-secondary hover:text-primary transition">{team.name}</h3>
                      <p className="text-sm text-primary font-medium">{sportEmoji(team.sport)} {team.sport?.replace(/_/g, ' ')}</p>
                    </Link>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => startEdit(team)} className="p-1.5 text-gray-400 hover:text-primary transition">✏️</button>
                      <button onClick={() => handleDelete(team.id)} className="p-1.5 text-gray-300 hover:text-red-500 transition">✕</button>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
                    <span>👥 {team._count?.members || 0} members</span>
                    <span>📅 {team._count?.events || 0} events</span>
                  </div>
                  {team.season && <p className="mt-2 text-xs text-gray-400">{team.season} {team.ageGroup && `· ${team.ageGroup}`}</p>}
                  {team.organization && <p className="mt-1 text-xs text-accent font-medium">{team.organization.name}</p>}
                  <div className="mt-3 pt-3 border-t flex gap-3">
                    <Link to={`/teams/${team.id}`} className="text-sm text-primary hover:underline font-medium">View Team →</Link>
                    <button onClick={() => startEdit(team)} className="text-sm text-gray-500 hover:text-primary font-medium">Edit</button>
                  </div>
                </>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
