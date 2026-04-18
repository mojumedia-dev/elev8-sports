import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';

export default function Directory() {
  const { user } = useAuth();
  const hasLocation = !!user?.city;
  const [nearbyOnly, setNearbyOnly] = useState(hasLocation);

  const teamsPath = nearbyOnly && hasLocation ? '/teams/nearby' : '/teams';
  const orgsPath = nearbyOnly && hasLocation ? '/organizations/nearby' : '/organizations';
  const { data: teams } = useApi<any[]>(teamsPath, [nearbyOnly, hasLocation]);
  const { data: orgs } = useApi<any[]>(orgsPath, [nearbyOnly, hasLocation]);

  const [search, setSearch] = useState('');
  const [sportFilter, setSportFilter] = useState('');
  const [tab, setTab] = useState<'teams' | 'orgs'>('teams');

  const filteredTeams = teams?.filter((t: any) => {
    const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase()) || t.sport.toLowerCase().includes(search.toLowerCase());
    const matchesSport = !sportFilter || t.sport === sportFilter;
    return matchesSearch && matchesSport;
  }) || [];

  const filteredOrgs = orgs?.filter((o: any) =>
    o.name.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <div>
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-secondary">Directory</h1>
        <p className="text-gray-500 mt-1 text-sm sm:text-base">Find teams and organizations.</p>
      </div>

      {hasLocation && (
        <div className="mb-4 flex items-center gap-2 text-sm">
          <button onClick={() => setNearbyOnly(true)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${nearbyOnly ? 'bg-primary text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-primary'}`}>
            📍 Near {user?.city}
          </button>
          <button onClick={() => setNearbyOnly(false)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${!nearbyOnly ? 'bg-primary text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-primary'}`}>
            🌎 All Locations
          </button>
        </div>
      )}
      {!hasLocation && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-900">
          📍 Set your city on the dashboard to see teams and organizations near you.
        </div>
      )}

      <div className="mb-6 flex items-center gap-3 flex-wrap">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search teams, organizations..."
          className="flex-1 min-w-[200px] max-w-md px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none text-base sm:text-sm" />
        {tab === 'teams' && (
          <select value={sportFilter} onChange={(e) => setSportFilter(e.target.value)}
            className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none bg-white text-base sm:text-sm">
            <option value="">All Sports</option>
            <option value="BASEBALL">⚾ Baseball</option>
            <option value="SOFTBALL">🥎 Softball</option>
            <option value="BASKETBALL">🏀 Basketball</option>
            <option value="SOCCER">⚽ Soccer</option>
            <option value="FLAG_FOOTBALL">🏈 Flag Football</option>
          </select>
        )}
        <div className="flex bg-white rounded-lg border border-gray-200">
          <button onClick={() => setTab('teams')}
            className={`px-4 py-2 text-sm font-medium rounded-l-lg transition ${tab === 'teams' ? 'bg-primary text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
            Teams
          </button>
          <button onClick={() => setTab('orgs')}
            className={`px-4 py-2 text-sm font-medium rounded-r-lg transition ${tab === 'orgs' ? 'bg-primary text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
            Organizations
          </button>
        </div>
      </div>

      {tab === 'teams' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTeams.length === 0 ? (
            <Card className="col-span-full"><p className="text-gray-400 text-center py-4">No teams found.</p></Card>
          ) : filteredTeams.map((team: any) => (
            <Card key={team.id} className="hover:shadow-md transition">
              <h3 className="font-semibold text-secondary">{team.name}</h3>
              <p className="text-sm text-primary">{team.sport}</p>
              <div className="mt-2 flex items-center gap-3 text-sm text-gray-500 flex-wrap">
                <span>👥 {team._count?.members || 0}</span>
                {team.ageGroup && <span>🏷 {team.ageGroup}</span>}
                {(team.city || team.organization?.city) && <span>📍 {team.city || team.organization?.city}</span>}
              </div>
              {team.organization && <p className="mt-2 text-xs text-accent font-medium">{team.organization.name}</p>}
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrgs.length === 0 ? (
            <Card className="col-span-full"><p className="text-gray-400 text-center py-4">No organizations found.</p></Card>
          ) : filteredOrgs.map((org: any) => (
            <Card key={org.id} className="hover:shadow-md transition">
              <h3 className="font-semibold text-secondary">{org.name}</h3>
              {org.description && <p className="text-sm text-gray-500 mt-1">{org.description}</p>}
              <div className="mt-2 flex items-center gap-3 text-sm text-gray-500 flex-wrap">
                <span>⚽ {org._count?.teams || 0} teams</span>
                {org.city && org.state && <span>📍 {org.city}, {org.state}</span>}
                {org.website && <a href={org.website} target="_blank" rel="noreferrer" className="text-primary hover:underline">Website</a>}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
