import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import Card from '../components/Card';

export default function Directory() {
  const { data: teams } = useApi<any[]>('/teams');
  const { data: orgs } = useApi<any[]>('/organizations');
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-secondary">Directory</h1>
        <p className="text-gray-500 mt-1">Find teams and organizations.</p>
      </div>

      <div className="mb-6 flex items-center gap-4 flex-wrap">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search teams, organizations..."
          className="flex-1 max-w-md px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none" />
        {tab === 'teams' && (
          <select value={sportFilter} onChange={(e) => setSportFilter(e.target.value)}
            className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none">
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
              <div className="mt-2 flex items-center gap-3 text-sm text-gray-500">
                <span>👥 {team._count?.members || 0}</span>
                {team.ageGroup && <span>🏷 {team.ageGroup}</span>}
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
              <div className="mt-2 flex items-center gap-3 text-sm text-gray-500">
                <span>⚽ {org._count?.teams || 0} teams</span>
                {org.website && <a href={org.website} target="_blank" rel="noreferrer" className="text-primary hover:underline">Website</a>}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
