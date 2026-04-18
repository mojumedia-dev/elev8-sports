import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../hooks/useApi';
import Card from '../components/Card';
import { StarDisplay } from '../components/StarRating';

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

export default function Coaches() {
  const { user } = useAuth();
  const hasLocation = !!(user?.city || user?.zipCode);
  const [nearbyOnly, setNearbyOnly] = useState(hasLocation);
  const [sport, setSport] = useState('');
  const [specialty, setSpecialty] = useState('');

  const qs = new URLSearchParams();
  if (nearbyOnly && hasLocation) qs.set('nearby', 'true');
  if (sport) qs.set('sport', sport);
  if (specialty) qs.set('specialty', specialty);
  const path = `/coach-profiles${qs.toString() ? `?${qs}` : ''}`;
  const { data: coaches, loading } = useApi<any[]>(path, [nearbyOnly, sport, specialty]);

  const { data: myProfile } = useApi<any>('/coach-profiles/me');

  return (
    <div className="px-1 sm:px-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-secondary">Find a Coach 🏋️</h1>
          <p className="text-gray-500 mt-1 text-sm sm:text-base">Specialty coaches for private lessons near you.</p>
        </div>
        <Link to="/coach-profile" className="px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition text-center">
          {myProfile ? 'Edit My Coach Profile' : '+ Become a Coach'}
        </Link>
      </div>

      {hasLocation && (
        <div className="mb-4 flex items-center gap-2 text-sm flex-wrap">
          <button onClick={() => setNearbyOnly(true)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${nearbyOnly ? 'bg-primary text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-primary'}`}>
            📍 Near {user?.city || user?.zipCode}
          </button>
          <button onClick={() => setNearbyOnly(false)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${!nearbyOnly ? 'bg-primary text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-primary'}`}>
            🌎 All Locations
          </button>
        </div>
      )}

      <div className="mb-6 flex flex-wrap gap-3">
        <select value={sport} onChange={e => setSport(e.target.value)}
          className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none bg-white text-base sm:text-sm">
          <option value="">All Sports</option>
          {SPORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <select value={specialty} onChange={e => setSpecialty(e.target.value)}
          className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none bg-white text-base sm:text-sm">
          <option value="">All Specialties</option>
          {COMMON_SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {loading ? (
        <p className="text-gray-400 text-center py-12">Loading coaches...</p>
      ) : !coaches || coaches.length === 0 ? (
        <Card><p className="text-gray-400 text-center py-8">No coaches match your filters yet. Be the first — click "Become a Coach" above.</p></Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {coaches.map((c: any) => (
            <Link key={c.id} to={`/coaches/${c.id}`} className="block">
              <Card className="h-full hover:shadow-md transition">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-xl shrink-0">🏋️</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-secondary">{c.user?.firstName} {c.user?.lastName}</h3>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {c.sports?.slice(0, 3).map((s: string) => (
                        <span key={s} className="text-xs bg-slate px-2 py-0.5 rounded-full">
                          {SPORTS.find(sp => sp.value === s)?.label || s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                {c.specialties?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {c.specialties.slice(0, 4).map((s: string) => (
                      <span key={s} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{s}</span>
                    ))}
                  </div>
                )}
                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                  {c.city && <span>📍 {c.city}{c.state ? `, ${c.state}` : ''}</span>}
                  {c.hourlyRate && <span>💵 ${c.hourlyRate}/hr</span>}
                  {c.yearsExperience && <span>🏆 {c.yearsExperience}y exp</span>}
                </div>
                <div className="mt-2">
                  <StarDisplay avg={c.rating?.avg} count={c.rating?.count || 0} />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
