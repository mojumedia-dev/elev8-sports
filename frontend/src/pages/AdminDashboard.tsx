import { useAuth } from '../context/AuthContext';
import { useApi } from '../hooks/useApi';
import Card from '../components/Card';
import { Link } from 'react-router-dom';
import { useState, FormEvent } from 'react';
import { api } from '../utils/api';

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'
];

const AGE_DIVISIONS = ['4U','5U','6U','7U','8U','9U','10U','11U','12U','13U','14U','15U','16U','17U','18U','High School','Adult'];
const SEASONS_OPTIONS = ['Spring','Summer','Fall','Winter','Year-Round'];
const SPORTS = [
  { value: 'BASEBALL', label: '⚾ Baseball' },
  { value: 'SOFTBALL', label: '🥎 Softball' },
  { value: 'BASKETBALL', label: '🏀 Basketball' },
  { value: 'SOCCER', label: '⚽ Soccer' },
  { value: 'FLAG_FOOTBALL', label: '🏈 Flag Football' },
  { value: 'OTHER', label: '🏅 Other' },
];

interface OrgForm {
  name: string; description: string; website: string; city: string; state: string;
  ageDivisions: string[]; seasons: string[]; sports: string[];
}

const emptyForm: OrgForm = { name: '', description: '', website: '', city: '', state: '', ageDivisions: [], seasons: [], sports: [] };

function MultiSelect({ label, options, selected, onChange, renderOption }: {
  label: string; options: string[]; selected: string[]; onChange: (v: string[]) => void; renderOption?: (v: string) => string;
}) {
  const toggle = (val: string) => onChange(selected.includes(val) ? selected.filter(v => v !== val) : [...selected, val]);
  return (
    <div>
      <label className="block text-sm font-medium text-gray-600 mb-2">{label}</label>
      <div className="flex flex-wrap gap-1.5">
        {options.map(opt => (
          <button key={opt} type="button" onClick={() => toggle(opt)}
            className={`px-2.5 py-1 rounded-full text-xs font-medium border transition active:scale-95 ${
              selected.includes(opt)
                ? 'bg-primary text-white border-primary'
                : 'bg-white text-gray-600 border-gray-200 hover:border-primary hover:text-primary'
            }`}>
            {renderOption ? renderOption(opt) : opt}
          </button>
        ))}
      </div>
    </div>
  );
}

function OrgFormFields({ form, setForm, onSubmit, onCancel, submitLabel }: {
  form: OrgForm; setForm: (f: OrgForm) => void; onSubmit: (e: FormEvent) => void; onCancel: () => void; submitLabel: string;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-600 mb-1">Organization Name *</label>
          <input placeholder="e.g. Midwest Youth Baseball League" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required
            className="w-full px-4 py-2.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none text-base sm:text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">City</label>
          <input placeholder="City" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })}
            className="w-full px-4 py-2.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none text-base sm:text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">State</label>
          <select value={form.state} onChange={e => setForm({ ...form, state: e.target.value })}
            className="w-full px-4 py-2.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none bg-white text-base sm:text-sm">
            <option value="">Select State...</option>
            {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-600 mb-1">Description</label>
          <textarea placeholder="Brief description of your organization" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
            className="w-full px-4 py-2.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none text-base sm:text-sm" rows={2} />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-600 mb-1">Website</label>
          <input placeholder="https://..." value={form.website} onChange={e => setForm({ ...form, website: e.target.value })}
            className="w-full px-4 py-2.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none text-base sm:text-sm" />
        </div>
      </div>

      <MultiSelect label="Sports" options={SPORTS.map(s => s.value)} selected={form.sports} onChange={v => setForm({ ...form, sports: v })}
        renderOption={v => SPORTS.find(s => s.value === v)?.label || v} />

      <MultiSelect label="Age Divisions" options={AGE_DIVISIONS} selected={form.ageDivisions} onChange={v => setForm({ ...form, ageDivisions: v })} />

      <MultiSelect label="Seasons" options={SEASONS_OPTIONS} selected={form.seasons} onChange={v => setForm({ ...form, seasons: v })} />

      <div className="flex flex-col sm:flex-row gap-2 pt-2">
        <button type="submit" className="px-5 py-2.5 sm:py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition w-full sm:w-auto">{submitLabel}</button>
        <button type="button" onClick={onCancel} className="px-5 py-2.5 sm:py-2 bg-gray-200 rounded-lg text-sm w-full sm:w-auto">Cancel</button>
      </div>
    </form>
  );
}

export default function AdminDashboard() {
  const { user, token } = useAuth();
  const { data: orgs, refetch: refetchOrgs } = useApi<any[]>('/organizations');
  const { data: teams } = useApi<any[]>('/teams');
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<OrgForm>({ ...emptyForm });
  const [editForm, setEditForm] = useState<OrgForm>({ ...emptyForm });

  const handleCreateOrg = async (e: FormEvent) => {
    e.preventDefault();
    await api('/organizations', { method: 'POST', body: form, token: token! });
    setForm({ ...emptyForm });
    setShowCreate(false);
    refetchOrgs();
  };

  const startEdit = (org: any) => {
    setEditingId(org.id);
    setEditForm({
      name: org.name || '', description: org.description || '', website: org.website || '',
      city: org.city || '', state: org.state || '',
      ageDivisions: org.ageDivisions || [], seasons: org.seasons || [], sports: org.sports || [],
    });
    setShowCreate(false);
  };

  const handleEdit = async (e: FormEvent) => {
    e.preventDefault();
    await api(`/organizations/${editingId}`, { method: 'PUT', body: editForm, token: token! });
    setEditingId(null);
    refetchOrgs();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this organization? This cannot be undone.')) return;
    await api(`/organizations/${id}`, { method: 'DELETE', token: token! });
    refetchOrgs();
  };

  const sportLabel = (v: string) => {
    const map: Record<string,string> = { BASEBALL:'⚾', SOFTBALL:'🥎', BASKETBALL:'🏀', SOCCER:'⚽', FLAG_FOOTBALL:'🏈', OTHER:'🏅' };
    return map[v] || '🏅';
  };

  return (
    <div className="px-1 sm:px-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-secondary">Organization Admin 🏢</h1>
          <p className="text-gray-500 mt-1 text-sm sm:text-base">Welcome back, {user?.firstName}!</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
          <h2 className="text-lg font-semibold text-secondary">My Organizations</h2>
          <button onClick={() => { setShowCreate(!showCreate); setEditingId(null); }}
            className="px-4 py-2.5 sm:py-2 bg-primary hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition w-full sm:w-auto">
            {showCreate ? 'Cancel' : '+ New Organization'}
          </button>
        </div>

        {showCreate && (
          <div className="mb-6 p-4 bg-slate rounded-lg">
            <h3 className="text-base font-semibold text-secondary mb-3">Create Organization</h3>
            <OrgFormFields form={form} setForm={setForm} onSubmit={handleCreateOrg} onCancel={() => setShowCreate(false)} submitLabel="Create Organization" />
          </div>
        )}

        {orgs?.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-3">🏢</div>
            <p className="text-gray-400 text-sm mb-3">No organizations yet.</p>
            <button onClick={() => setShowCreate(true)} className="text-sm text-primary hover:underline font-medium">Create your first organization</button>
          </div>
        ) : (
          <div className="space-y-3">
            {orgs?.map((org: any) => (
              <div key={org.id}>
                {editingId === org.id ? (
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h3 className="text-base font-semibold text-secondary mb-3">Edit Organization</h3>
                    <OrgFormFields form={editForm} setForm={setEditForm} onSubmit={handleEdit} onCancel={() => setEditingId(null)} submitLabel="Save Changes" />
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate rounded-lg gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-secondary">{org.name}</p>
                        {org.sports?.map((s: string) => (
                          <span key={s} className="text-sm">{sportLabel(s)}</span>
                        ))}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-gray-500">
                        {org.city && org.state && <span>📍 {org.city}, {org.state}</span>}
                        <span>👥 {org._count?.teams || 0} teams</span>
                      </div>
                      {org.ageDivisions?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {org.ageDivisions.map((d: string) => (
                            <span key={d} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{d}</span>
                          ))}
                        </div>
                      )}
                      {org.seasons?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {org.seasons.map((s: string) => (
                            <span key={s} className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">{s}</span>
                          ))}
                        </div>
                      )}
                      {org.description && <p className="text-sm text-gray-400 mt-1">{org.description}</p>}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => startEdit(org)} className="p-1.5 text-gray-400 hover:text-primary transition">✏️</button>
                      <button onClick={() => handleDelete(org.id)} className="p-1.5 text-gray-300 hover:text-red-500 transition">✕</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
