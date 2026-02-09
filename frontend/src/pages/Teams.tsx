import { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../hooks/useApi';
import { api } from '../utils/api';
import Card from '../components/Card';

export default function Teams() {
  const { token, user } = useAuth();
  const { data: teams, refetch } = useApi<any[]>('/teams');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', sport: '', season: '', ageGroup: '' });

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    await api('/teams', { method: 'POST', body: form, token: token! });
    setForm({ name: '', sport: '', season: '', ageGroup: '' });
    setShowCreate(false);
    refetch();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-secondary">Teams</h1>
          <p className="text-gray-500 mt-1">Manage your teams and rosters.</p>
        </div>
        {(user?.role === 'COACH' || user?.role === 'ORG_ADMIN') && (
          <button onClick={() => setShowCreate(!showCreate)}
            className="px-5 py-2.5 bg-primary hover:bg-primary-dark text-white font-medium rounded-lg transition">
            + Create Team
          </button>
        )}
      </div>

      {showCreate && (
        <Card className="mb-6">
          <h2 className="text-lg font-semibold mb-4">Create New Team</h2>
          <form onSubmit={handleCreate} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input placeholder="Team Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none" />
              <input placeholder="Sport (e.g., Basketball)" value={form.sport} onChange={(e) => setForm({ ...form, sport: e.target.value })} required
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none" />
              <input placeholder="Season (e.g., Spring 2025)" value={form.season} onChange={(e) => setForm({ ...form, season: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none" />
              <input placeholder="Age Group (e.g., U12)" value={form.ageGroup} onChange={(e) => setForm({ ...form, ageGroup: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none" />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium">Create Team</button>
              <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 bg-gray-200 rounded-lg text-sm">Cancel</button>
            </div>
          </form>
        </Card>
      )}

      {teams?.length === 0 ? (
        <Card><p className="text-gray-400 text-center py-8">No teams yet. Create your first team to get started!</p></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams?.map((team: any) => (
            <Link key={team.id} to={`/teams/${team.id}`}>
              <Card className="hover:shadow-md transition cursor-pointer">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-secondary">{team.name}</h3>
                    <p className="text-sm text-primary font-medium">{team.sport}</p>
                  </div>
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-lg">⚽</div>
                </div>
                <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
                  <span>👥 {team._count?.members || 0} members</span>
                  <span>📅 {team._count?.events || 0} events</span>
                </div>
                {team.season && <p className="mt-2 text-xs text-gray-400">{team.season} {team.ageGroup && `· ${team.ageGroup}`}</p>}
                {team.organization && <p className="mt-1 text-xs text-accent font-medium">{team.organization.name}</p>}
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
