import { useEffect, useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../hooks/useApi';
import { api } from '../utils/api';
import Card from '../components/Card';

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'
];

const SPORTS = [
  { value: 'BASEBALL', label: '⚾ Baseball' },
  { value: 'SOFTBALL', label: '🥎 Softball' },
  { value: 'BASKETBALL', label: '🏀 Basketball' },
  { value: 'SOCCER', label: '⚽ Soccer' },
  { value: 'FLAG_FOOTBALL', label: '🏈 Flag Football' },
  { value: 'OTHER', label: '🏅 Other' },
];

const COMMON_SPECIALTIES = [
  'Pitching', 'Catching', 'Hitting', 'Fielding', 'Base Running',
  'Shooting', 'Dribbling', 'Goalie', 'Defense', 'Strength & Conditioning',
];

interface Form {
  bio: string; sports: string[]; specialties: string[];
  hourlyRate: string; yearsExperience: string; certifications: string[];
  city: string; state: string; zipCode: string;
  contactEmail: string; contactPhone: string; acceptingClients: boolean;
}

const emptyForm: Form = {
  bio: '', sports: [], specialties: [], hourlyRate: '', yearsExperience: '', certifications: [],
  city: '', state: '', zipCode: '', contactEmail: '', contactPhone: '', acceptingClients: true,
};

function Chips({ label, options, selected, onChange, allowCustom }: {
  label: string; options: string[]; selected: string[]; onChange: (v: string[]) => void; allowCustom?: boolean;
}) {
  const [custom, setCustom] = useState('');
  const toggle = (v: string) => onChange(selected.includes(v) ? selected.filter(x => x !== v) : [...selected, v]);
  const addCustom = () => { const v = custom.trim(); if (v && !selected.includes(v)) onChange([...selected, v]); setCustom(''); };
  return (
    <div>
      <label className="block text-sm font-medium text-gray-600 mb-2">{label}</label>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {[...new Set([...options, ...selected])].map(opt => (
          <button key={opt} type="button" onClick={() => toggle(opt)}
            className={`px-2.5 py-1 rounded-full text-xs font-medium border transition ${
              selected.includes(opt) ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-200 hover:border-primary'
            }`}>
            {opt}
          </button>
        ))}
      </div>
      {allowCustom && (
        <div className="flex gap-2">
          <input value={custom} onChange={e => setCustom(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustom(); } }}
            placeholder="Add custom..."
            className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-primary/30" />
          <button type="button" onClick={addCustom} className="px-3 py-1.5 bg-gray-200 rounded-lg text-xs">Add</button>
        </div>
      )}
    </div>
  );
}

export default function CoachProfileEdit() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const { data: profile, loading, refetch } = useApi<any>('/coach-profiles/me');
  const [form, setForm] = useState<Form>(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setForm({
        bio: profile.bio || '',
        sports: profile.sports || [],
        specialties: profile.specialties || [],
        hourlyRate: profile.hourlyRate?.toString() || '',
        yearsExperience: profile.yearsExperience?.toString() || '',
        certifications: profile.certifications || [],
        city: profile.city || user?.city || '',
        state: profile.state || user?.state || '',
        zipCode: profile.zipCode || user?.zipCode || '',
        contactEmail: profile.contactEmail || user?.email || '',
        contactPhone: profile.contactPhone || '',
        acceptingClients: profile.acceptingClients !== undefined ? profile.acceptingClients : true,
      });
    } else if (!loading) {
      setForm(f => ({
        ...f,
        city: user?.city || '', state: user?.state || '', zipCode: user?.zipCode || '',
        contactEmail: user?.email || '',
      }));
    }
  }, [profile, loading, user]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api('/coach-profiles/me', { method: 'PUT', token: token!, body: form });
      refetch();
      navigate('/coaches');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete your coach profile? This removes your listing from the directory.')) return;
    await api('/coach-profiles/me', { method: 'DELETE', token: token! });
    navigate('/coaches');
  };

  if (loading) return <div className="text-center py-12 text-gray-400">Loading...</div>;

  return (
    <div className="px-1 sm:px-0 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-secondary">{profile ? 'Edit Coach Profile' : 'Become a Coach'}</h1>
        <p className="text-gray-500 mt-1 text-sm">Set up your lesson-coach listing. Parents will find you via the Coaches directory.</p>
      </div>

      <Card>
        <form onSubmit={submit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Bio</label>
            <textarea value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} rows={3} placeholder="Tell parents about your coaching experience..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/30" />
          </div>

          <Chips label="Sports you coach" options={SPORTS.map(s => s.value)} selected={form.sports} onChange={v => setForm({ ...form, sports: v })} />
          <Chips label="Specialties" options={COMMON_SPECIALTIES} selected={form.specialties} onChange={v => setForm({ ...form, specialties: v })} allowCustom />
          <Chips label="Certifications" options={[]} selected={form.certifications} onChange={v => setForm({ ...form, certifications: v })} allowCustom />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Hourly Rate ($)</label>
              <input type="number" min="0" value={form.hourlyRate} onChange={e => setForm({ ...form, hourlyRate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Years Experience</label>
              <input type="number" min="0" value={form.yearsExperience} onChange={e => setForm({ ...form, yearsExperience: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-[1fr_120px_120px] gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">City</label>
              <input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">State</label>
              <select value={form.state} onChange={e => setForm({ ...form, state: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none bg-white">
                <option value="">—</option>
                {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Zip</label>
              <input value={form.zipCode} onChange={e => setForm({ ...form, zipCode: e.target.value.replace(/[^0-9]/g, '').slice(0, 5) })} inputMode="numeric"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Contact Email</label>
              <input type="email" value={form.contactEmail} onChange={e => setForm({ ...form, contactEmail: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Contact Phone</label>
              <input value={form.contactPhone} onChange={e => setForm({ ...form, contactPhone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.acceptingClients} onChange={e => setForm({ ...form, acceptingClients: e.target.checked })} />
            <span>Currently accepting new clients</span>
          </label>

          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <button type="submit" disabled={saving} className="px-5 py-2.5 bg-primary text-white rounded-lg text-sm font-medium disabled:opacity-50 w-full sm:w-auto">
              {saving ? 'Saving...' : profile ? 'Save Changes' : 'Create Profile'}
            </button>
            {profile && (
              <button type="button" onClick={handleDelete} className="px-5 py-2.5 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition w-full sm:w-auto">
                Delete Profile
              </button>
            )}
          </div>
        </form>
      </Card>
    </div>
  );
}
