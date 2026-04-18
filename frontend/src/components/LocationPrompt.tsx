import { useState, FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'
];

const STATE_NAME_TO_ABBR: Record<string, string> = {
  Alabama:'AL',Alaska:'AK',Arizona:'AZ',Arkansas:'AR',California:'CA',Colorado:'CO',Connecticut:'CT',
  Delaware:'DE',Florida:'FL',Georgia:'GA',Hawaii:'HI',Idaho:'ID',Illinois:'IL',Indiana:'IN',Iowa:'IA',
  Kansas:'KS',Kentucky:'KY',Louisiana:'LA',Maine:'ME',Maryland:'MD',Massachusetts:'MA',Michigan:'MI',
  Minnesota:'MN',Mississippi:'MS',Missouri:'MO',Montana:'MT',Nebraska:'NE',Nevada:'NV','New Hampshire':'NH',
  'New Jersey':'NJ','New Mexico':'NM','New York':'NY','North Carolina':'NC','North Dakota':'ND',Ohio:'OH',
  Oklahoma:'OK',Oregon:'OR',Pennsylvania:'PA','Rhode Island':'RI','South Carolina':'SC','South Dakota':'SD',
  Tennessee:'TN',Texas:'TX',Utah:'UT',Vermont:'VT',Virginia:'VA',Washington:'WA','West Virginia':'WV',
  Wisconsin:'WI',Wyoming:'WY','District of Columbia':'DC',
};

export default function LocationPrompt() {
  const { user, token, refreshUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [city, setCity] = useState(user?.city || '');
  const [state, setState] = useState(user?.state || '');
  const [zipCode, setZipCode] = useState<string>(user?.zipCode || '');
  const [saving, setSaving] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [detectError, setDetectError] = useState('');

  const detect = async (autoSave: boolean) => {
    setDetectError('');
    if (!('geolocation' in navigator)) {
      setDetectError('Geolocation not supported on this device.');
      return;
    }
    setDetecting(true);
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000, maximumAge: 60000 });
      });
      const { latitude, longitude } = pos.coords;
      const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
      if (!res.ok) throw new Error('Reverse geocoding failed');
      const data = await res.json();
      const detectedCity: string = data.city || data.locality || data.principalSubdivision || '';
      const stateFull: string = data.principalSubdivision || '';
      const detectedState = STATE_NAME_TO_ABBR[stateFull] || (stateFull.length === 2 ? stateFull : '');
      const detectedZip: string = (data.postcode || '').toString().slice(0, 5);
      if (!detectedCity && !detectedZip) {
        setDetectError('Could not determine your location.');
        return;
      }
      setCity(detectedCity);
      setState(detectedState);
      setZipCode(detectedZip);
      if (autoSave && detectedCity && detectedState) {
        setSaving(true);
        try {
          await api('/users/me', { method: 'PUT', token: token!, body: { city: detectedCity, state: detectedState, zipCode: detectedZip } });
          await refreshUser();
          setEditing(false);
        } finally {
          setSaving(false);
        }
      } else {
        setEditing(true);
      }
    } catch (err: any) {
      const code = err?.code;
      if (code === 1) setDetectError('Location permission denied. Enable it in browser settings.');
      else if (code === 2) setDetectError('Location unavailable. Try entering it manually.');
      else if (code === 3) setDetectError('Location request timed out. Try again.');
      else setDetectError('Could not detect location.');
    } finally {
      setDetecting(false);
    }
  };

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
          📍 Showing local content for <strong>{user?.city}{user?.state ? `, ${user?.state}` : ''}{user?.zipCode ? ` ${user?.zipCode}` : ''}</strong>
        </span>
        <button onClick={() => setEditing(true)} className="text-primary hover:underline text-xs">Change</button>
      </div>
    );
  }

  return (
    <div className="mb-4 sm:mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
      {!editing && !hasLocation && (
        <div className="flex flex-col gap-3">
          <div>
            <p className="font-medium text-amber-900 text-sm">📍 Set your location to see local leagues, teams, tryouts and coaches</p>
            <p className="text-xs text-amber-700 mt-0.5">We match you with content in your area based on your city or zip code.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <button onClick={() => detect(true)} disabled={detecting || saving}
              className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 transition disabled:opacity-60 flex items-center justify-center gap-1.5">
              {detecting ? 'Detecting...' : saving ? 'Saving...' : '📡 Use My Location'}
            </button>
            <button onClick={() => setEditing(true)} disabled={detecting || saving}
              className="px-4 py-2 bg-white border border-amber-300 text-amber-900 rounded-lg text-sm font-medium hover:bg-amber-100 transition">
              Enter Manually
            </button>
          </div>
          {detectError && <p className="text-xs text-red-600">{detectError}</p>}
        </div>
      )}
      {editing && (
        <form onSubmit={save} className="space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <p className="font-medium text-amber-900 text-sm">Your Location</p>
            <button type="button" onClick={() => detect(false)} disabled={detecting}
              className="text-xs px-2.5 py-1 bg-white border border-amber-300 text-amber-900 rounded hover:bg-amber-100 disabled:opacity-60">
              {detecting ? 'Detecting...' : '📡 Use My Location'}
            </button>
          </div>
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
          {detectError && <p className="text-xs text-red-600">{detectError}</p>}
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
