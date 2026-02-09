import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../hooks/useApi';
import { api } from '../utils/api';
import Card from '../components/Card';
import { Link } from 'react-router-dom';

const SPORTS = [
  { value: 'BASEBALL', label: '⚾ Baseball' },
  { value: 'SOFTBALL', label: '🥎 Softball' },
  { value: 'BASKETBALL', label: '🏀 Basketball' },
  { value: 'SOCCER', label: '⚽ Soccer' },
  { value: 'FLAG_FOOTBALL', label: '🏈 Flag Football' },
  { value: 'OTHER', label: '🏅 Other' },
];

const POSITIONS_BY_SPORT: Record<string, string[]> = {
  BASEBALL: ['Pitcher', 'Catcher', 'First Base', 'Second Base', 'Third Base', 'Shortstop', 'Left Field', 'Center Field', 'Right Field', 'Designated Hitter'],
  SOFTBALL: ['Pitcher', 'Catcher', 'First Base', 'Second Base', 'Third Base', 'Shortstop', 'Left Field', 'Center Field', 'Right Field', 'Designated Player'],
  BASKETBALL: ['Point Guard', 'Shooting Guard', 'Small Forward', 'Power Forward', 'Center'],
  SOCCER: ['Goalkeeper', 'Center Back', 'Full Back', 'Wing Back', 'Defensive Mid', 'Central Mid', 'Attacking Mid', 'Winger', 'Striker'],
  FLAG_FOOTBALL: ['Quarterback', 'Running Back', 'Wide Receiver', 'Center', 'Rusher', 'Linebacker', 'Defensive Back', 'Safety'],
  OTHER: [],
};

const sportEmoji: Record<string, string> = { BASEBALL: '⚾', SOFTBALL: '🥎', BASKETBALL: '🏀', SOCCER: '⚽', FLAG_FOOTBALL: '🏈', OTHER: '🏅' };

export default function Children() {
  const { token } = useAuth();
  const { data: children, refetch } = useApi<any[]>('/children');
  const [showForm, setShowForm] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [sport, setSport] = useState('');
  const [positions, setPositions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const availablePositions = sport ? POSITIONS_BY_SPORT[sport] || [] : [];

  const togglePosition = (pos: string) => {
    setPositions(prev => prev.includes(pos) ? prev.filter(p => p !== pos) : [...prev, pos]);
  };

  const handleSportChange = (newSport: string) => {
    setSport(newSport);
    setPositions([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName) { setError('First and last name are required'); return; }
    setLoading(true);
    setError('');
    try {
      await api('/children', {
        method: 'POST', token: token!,
        body: { firstName, lastName, dateOfBirth: dateOfBirth || null, sport: sport || null, positions },
      });
      setFirstName(''); setLastName(''); setDateOfBirth(''); setSport(''); setPositions([]); setShowForm(false);
      refetch();
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this child?')) return;
    await api(`/children/${id}`, { method: 'DELETE', token: token! });
    refetch();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-secondary">My Children</h1>
          <p className="text-gray-500 mt-1">Manage your children's profiles, sports, and positions.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition">
          {showForm ? 'Cancel' : '+ Add Child'}
        </button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <h2 className="text-lg font-semibold text-secondary mb-4">Add a Child</h2>
          {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">First Name *</label>
                <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none" placeholder="First name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Last Name *</label>
                <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none" placeholder="Last name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Date of Birth</label>
                <input type="date" value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)} className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Sport</label>
                <select value={sport} onChange={e => handleSportChange(e.target.value)} className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none bg-white">
                  <option value="">Select a sport...</option>
                  {SPORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
            </div>

            {sport && availablePositions.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Positions <span className="text-gray-400">(select all that apply)</span></label>
                <div className="flex flex-wrap gap-2">
                  {availablePositions.map(pos => (
                    <button key={pos} type="button" onClick={() => togglePosition(pos)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium border transition ${
                        positions.includes(pos)
                          ? 'bg-primary text-white border-primary'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-primary hover:text-primary'
                      }`}>
                      {pos}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <button type="submit" disabled={loading} className="bg-primary text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50">
                {loading ? 'Adding...' : 'Add Child'}
              </button>
            </div>
          </form>
        </Card>
      )}

      {!children || children.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <div className="text-5xl mb-4">👧👦</div>
            <h3 className="text-xl font-semibold text-secondary mb-2">No children added yet</h3>
            <p className="text-gray-400 mb-4">Add your child's profile to start tracking their sports, teams, and stats.</p>
            <button onClick={() => setShowForm(true)} className="bg-primary text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition">
              + Add Your First Child
            </button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {children.map((child: any) => (
            <Card key={child.id}>
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-xl font-bold text-primary">
                  {child.firstName[0]}{child.lastName[0]}
                </div>
                <button onClick={() => handleDelete(child.id)} className="text-gray-300 hover:text-red-500 transition text-sm">✕</button>
              </div>
              <h3 className="text-lg font-semibold text-secondary mt-3">{child.firstName} {child.lastName}</h3>
              {child.dateOfBirth && <p className="text-sm text-gray-500">Born: {new Date(child.dateOfBirth).toLocaleDateString()}</p>}
              {child.sport && <p className="text-sm text-gray-500 mt-1">{sportEmoji[child.sport] || '🏅'} {child.sport.replace('_', ' ')}</p>}
              {child.positions?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {child.positions.map((pos: string) => (
                    <span key={pos} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{pos}</span>
                  ))}
                </div>
              )}
              <p className="text-sm text-gray-400 mt-2">{child.teamMembers?.length || 0} teams</p>
              <div className="flex gap-2 mt-4">
                <Link to={`/players/${child.id}`} className="text-sm text-primary hover:underline font-medium">View Stats →</Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
