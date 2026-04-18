import { useState, FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'
];

export default function LocationPrompt() {
  const { user, token, refreshUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [city, setCity] = useState(user?.city || '');
  const [state, setState] = useState(user?.state || '');
  const [zipCode, setZipCode] = useState<string>(user?.zipCode || '');
  const [saving, setSaving] = useState(false);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api('/users/me', { method: 'PUT', token: token!, body: { city: city.trim(), state, zipCode: zipCode.trim() } });
      await refreshUser();
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const hasLocation = !!(user?.city || user?.zipCode);

  if (hasLocation && !editing) {
    return (
      <div className="mb-4 flex items-center justify-between p-3 bg-slate rounded-lg text-sm">
        <span className="text-gray-600">
          📍 Showing local content for <strong>{user?.city}{user?.state ? `, ${user?.state}` : ''}{user?.zipCode ? ` ${(user as any).zipCode}` : ''}</strong>
        </span>
        <button onClick={() => setEditing(true)} className="text-primary hover:underline text-xs">Change</button>
      </div>
    );
  }

  return (
    <div className="mb-4 sm:mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
      {!editing && !hasLocation && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <p className="font-medium text-amber-900 text-sm">📍 Set your location to see local leagues, teams, tryouts and coaches</p>
            <p className="text-xs text-amber-700 mt-0.5">We match you with content in your area based on your city or zip code.</p>
          </div>
          <button onClick={() => setEditing(true)} className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 transition w-full sm:w-auto">
            Set Location
          </button>
        </div>
      )}
      {editing && (
        <form onSubmit={save} className="space-y-3">
          <p className="font-medium text-amber-900 text-sm">Your Location</p>
          <div className="grid grid-cols-2 sm:grid-cols-[1fr_120px_120px] gap-2">
            <input value={city} onChange={e => setCity(e.target.value)} placeholder="City" required
              className="col-span-2 sm:col-span-1 px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/30" />
            <select value={state} onChange={e => setState(e.target.value)} required
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none bg-white">
              <option value="">State</option>
              {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <input value={zipCode} onChange={e => setZipCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 5))}
              inputMode="numeric" placeholder="Zip"
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium disabled:opacity-50">
              {saving ? 'Saving...' : 'Save'}
            </button>
            {hasLocation && (
              <button type="button" onClick={() => setEditing(false)} className="px-3 py-2 bg-gray-200 rounded-lg text-sm">Cancel</button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
