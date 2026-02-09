import { useAuth } from '../context/AuthContext';
import { useApi } from '../hooks/useApi';
import Card from '../components/Card';
import { Link } from 'react-router-dom';
import { useState, FormEvent } from 'react';
import { api } from '../utils/api';

export default function AdminDashboard() {
  const { user, token } = useAuth();
  const { data: orgs, refetch: refetchOrgs } = useApi<any[]>('/organizations');
  const { data: teams } = useApi<any[]>('/teams');
  const [showCreate, setShowCreate] = useState(false);
  const [orgForm, setOrgForm] = useState({ name: '', description: '', website: '' });

  const handleCreateOrg = async (e: FormEvent) => {
    e.preventDefault();
    await api('/organizations', { method: 'POST', body: orgForm, token: token! });
    setOrgForm({ name: '', description: '', website: '' });
    setShowCreate(false);
    refetchOrgs();
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-secondary">Organization Admin 🏢</h1>
        <p className="text-gray-500 mt-1">Welcome back, {user?.firstName}!</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Organizations</p>
              <p className="text-3xl font-bold text-secondary">{orgs?.length || 0}</p>
            </div>
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-2xl">🏢</div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Teams</p>
              <p className="text-3xl font-bold text-secondary">{teams?.length || 0}</p>
            </div>
            <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center text-2xl">⚽</div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Players</p>
              <p className="text-3xl font-bold text-secondary">{teams?.reduce((s: number, t: any) => s + (t._count?.members || 0), 0) || 0}</p>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center text-2xl">👥</div>
          </div>
        </Card>
      </div>

      <Card className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-secondary">My Organizations</h2>
          <button onClick={() => setShowCreate(!showCreate)}
            className="px-4 py-2 bg-primary hover:bg-primary-dark text-white text-sm font-medium rounded-lg transition">
            + New Organization
          </button>
        </div>

        {showCreate && (
          <form onSubmit={handleCreateOrg} className="mb-6 p-4 bg-slate rounded-lg space-y-3">
            <input placeholder="Organization Name" value={orgForm.name} onChange={(e) => setOrgForm({ ...orgForm, name: e.target.value })} required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none" />
            <input placeholder="Description" value={orgForm.description} onChange={(e) => setOrgForm({ ...orgForm, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none" />
            <input placeholder="Website" value={orgForm.website} onChange={(e) => setOrgForm({ ...orgForm, website: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none" />
            <div className="flex gap-2">
              <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium">Create</button>
              <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 bg-gray-200 rounded-lg text-sm">Cancel</button>
            </div>
          </form>
        )}

        {orgs?.length === 0 ? (
          <p className="text-gray-400 text-sm">No organizations yet. Create your first one!</p>
        ) : (
          <div className="space-y-3">
            {orgs?.map((org: any) => (
              <Link key={org.id} to={`/organizations/${org.id}`} className="flex items-center justify-between p-4 bg-slate rounded-lg hover:bg-gray-100 transition">
                <div>
                  <p className="font-semibold text-secondary">{org.name}</p>
                  <p className="text-sm text-gray-500">{org._count?.teams || 0} teams · {org.description || 'No description'}</p>
                </div>
                <span className="text-gray-400">→</span>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
