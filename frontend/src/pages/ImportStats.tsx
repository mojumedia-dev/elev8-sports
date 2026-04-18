import { useState, useRef, FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../hooks/useApi';
import { api } from '../utils/api';
import Card from '../components/Card';
import { Link } from 'react-router-dom';

type Mode = 'team' | 'child' | 'manual';

const SPORTS = [
  { value: 'BASEBALL', label: '⚾ Baseball' },
  { value: 'SOFTBALL', label: '🥎 Softball' },
];

const MANUAL_BATTING = [
  { key: 'GAMES_PLAYED', label: 'GP' },
  { key: 'AT_BATS', label: 'AB' },
  { key: 'HITS', label: 'H' },
  { key: 'DOUBLES', label: '2B' },
  { key: 'TRIPLES', label: '3B' },
  { key: 'HOME_RUNS', label: 'HR' },
  { key: 'RBI', label: 'RBI' },
  { key: 'RUNS', label: 'R' },
  { key: 'WALKS', label: 'BB' },
  { key: 'STRIKEOUTS', label: 'SO' },
  { key: 'STOLEN_BASES', label: 'SB' },
];

const MANUAL_PITCHING = [
  { key: 'INNINGS_PITCHED', label: 'IP' },
  { key: 'PITCHING_STRIKEOUTS', label: 'K' },
  { key: 'PITCHING_WALKS', label: 'BB' },
  { key: 'PITCHING_HITS_ALLOWED', label: 'H' },
  { key: 'EARNED_RUNS', label: 'ER' },
  { key: 'WINS', label: 'W' },
  { key: 'LOSSES', label: 'L' },
];

export default function ImportStats() {
  const { token, activeRole } = useAuth();
  const isCoach = activeRole === 'COACH';

  const { data: children } = useApi<any[]>('/children');
  const { data: teams } = useApi<any[]>('/teams');
  const { data: imports, refetch: refetchImports } = useApi<any[]>('/imports/gamechanger/imports');

  const [mode, setMode] = useState<Mode>(isCoach ? 'team' : 'child');

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-secondary">Stats 📊</h1>
        <p className="text-gray-500 mt-1 text-sm sm:text-base">
          Import from GameChanger or log games manually — Elev8 enhances your data, doesn't replace it.
        </p>
      </div>

      {/* Mode tabs */}
      <div className="flex flex-col sm:flex-row gap-2 mb-6 bg-white rounded-lg border border-gray-200 p-1 w-full sm:w-fit">
        <button onClick={() => setMode('team')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition ${mode === 'team' ? 'bg-primary text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
          🏆 Team CSV (coach)
        </button>
        <button onClick={() => setMode('child')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition ${mode === 'child' ? 'bg-primary text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
          👧 My Kid CSV
        </button>
        <button onClick={() => setMode('manual')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition ${mode === 'manual' ? 'bg-primary text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
          ✏️ Log a Game
        </button>
      </div>

      {mode === 'team' && (
        <TeamUpload token={token!} teams={teams || []} onUploaded={refetchImports} />
      )}
      {mode === 'child' && (
        <ChildUpload token={token!} children={children || []} onUploaded={refetchImports} />
      )}
      {mode === 'manual' && (
        <ManualLog token={token!} children={children || []} onLogged={refetchImports} />
      )}

      <Card className="mt-6">
        <h2 className="text-lg font-semibold text-secondary mb-4">Recent Imports</h2>
        {!imports || imports.length === 0 ? (
          <p className="text-gray-400 text-sm">No imports yet.</p>
        ) : (
          <div className="space-y-3">
            {imports.map((imp: any) => (
              <div key={imp.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-slate rounded-lg gap-2">
                <div>
                  <p className="font-medium text-secondary text-sm">
                    {imp.scope === 'TEAM' ? '🏆 ' : '👧 '}
                    {imp.scope === 'TEAM' ? imp.team?.name : `${imp.child?.firstName} ${imp.child?.lastName}`}
                    {imp.teamName && imp.scope !== 'TEAM' && <span className="text-gray-500"> — {imp.teamName}</span>}
                  </p>
                  <p className="text-xs text-gray-500">
                    {imp.sport === 'SOFTBALL' ? '🥎' : '⚾'} {imp.sport} · {imp._count?.stats || 0} stats
                    {imp._count?.unclaimed > 0 && <span className="text-amber-600"> · {imp._count.unclaimed} unclaimed</span>}
                    {imp.season && ` · ${imp.season}`}
                  </p>
                </div>
                <div className="flex flex-col sm:items-end gap-1">
                  <p className="text-xs text-gray-400">{new Date(imp.importedAt).toLocaleDateString()}</p>
                  {imp.scope === 'TEAM' && imp.teamId && (
                    <Link to={`/teams/${imp.teamId}`} className="text-xs text-primary hover:underline">View Team</Link>
                  )}
                  {imp.scope === 'CHILD' && imp.childId && (
                    <Link to={`/players/${imp.childId}`} className="text-xs text-primary hover:underline">View Profile</Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function TeamUpload({ token, teams, onUploaded }: { token: string; teams: any[]; onUploaded: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [teamId, setTeamId] = useState('');
  const [sport, setSport] = useState('BASEBALL');
  const [season, setSeason] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(''); setResult(null);
    const file = fileRef.current?.files?.[0];
    if (!file || !teamId) { setError('Pick a team and a CSV file'); return; }
    setBusy(true);
    try {
      const csvData = await file.text();
      const res = await api<any>('/imports/gamechanger/upload-team-csv', {
        method: 'POST', token,
        body: { csvData, teamId, sport, season: season || undefined },
      });
      setResult(res);
      onUploaded();
      if (fileRef.current) fileRef.current.value = '';
    } catch (e: any) {
      setError(e.message || 'Upload failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <div className="border-l-4 border-l-primary -ml-6 pl-6 mb-4">
        <h2 className="text-lg font-semibold text-secondary">Upload Team CSV (coaches)</h2>
        <p className="text-sm text-gray-500 mt-1">
          In GameChanger Staff app: <strong>Team → Stats → Export → CSV</strong>. Upload here and stats
          distribute to every player on your Elev8 roster by name match. Unmatched rows go to a queue
          parents can claim.
        </p>
      </div>

      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Team</label>
            <select value={teamId} onChange={(e) => setTeamId(e.target.value)} required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none">
              <option value="">Select a team...</option>
              {teams.map(t => <option key={t.id} value={t.id}>{t.name} ({t.sport})</option>)}
            </select>
            {teams.length === 0 && (
              <p className="text-xs text-amber-600 mt-1">No teams yet. Create a team first under Teams.</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sport</label>
            <select value={sport} onChange={(e) => setSport(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none">
              {SPORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Season (optional)</label>
            <input value={season} onChange={(e) => setSeason(e.target.value)} placeholder="e.g., Spring 2026"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">CSV File</label>
          <input ref={fileRef} type="file" accept=".csv,.txt" required
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-sm file:bg-primary/10 file:text-primary file:font-medium" />
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button type="submit" disabled={busy}
          className="w-full sm:w-auto px-6 py-2.5 bg-primary hover:bg-primary-dark text-white font-medium rounded-lg transition disabled:opacity-50">
          {busy ? 'Distributing...' : '📤 Upload & Distribute'}
        </button>
      </form>

      {result && (
        <div className="mt-4 p-4 bg-green-50 border-l-4 border-l-green-500 rounded-lg">
          <h3 className="font-semibold text-green-700 mb-2">✅ Imported</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li><strong>{result.statsCreated}</strong> stats distributed to roster</li>
            <li><strong>{result.matchedPlayers?.length || 0}</strong> players matched: {result.matchedPlayers?.join(', ') || '—'}</li>
            {result.unclaimedCreated > 0 && (
              <li className="text-amber-700">
                <strong>{result.unclaimedCreated}</strong> stats unmatched ({result.unmatchedPlayers?.length || 0} players):{' '}
                {result.unmatchedPlayers?.join(', ')}
                <p className="text-xs text-amber-600 mt-1">Parents can claim these from the team page.</p>
              </li>
            )}
          </ul>
        </div>
      )}
    </Card>
  );
}

function ChildUpload({ token, children, onUploaded }: { token: string; children: any[]; onUploaded: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [childId, setChildId] = useState('');
  const [sport, setSport] = useState('BASEBALL');
  const [season, setSeason] = useState('');
  const [teamName, setTeamName] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(''); setResult(null);
    const file = fileRef.current?.files?.[0];
    if (!file || !childId) { setError('Pick a child and a CSV file'); return; }
    setBusy(true);
    try {
      const csvData = await file.text();
      const res = await api<any>('/imports/gamechanger/upload-csv', {
        method: 'POST', token,
        body: { csvData, childId, sport, season: season || undefined, teamName: teamName || undefined },
      });
      setResult(res);
      onUploaded();
      if (fileRef.current) fileRef.current.value = '';
    } catch (e: any) {
      setError(e.message || 'Upload failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <div className="border-l-4 border-l-accent -ml-6 pl-6 mb-4">
        <h2 className="text-lg font-semibold text-secondary">Upload My Kid's CSV</h2>
        <p className="text-sm text-gray-500 mt-1">
          GameChanger restricts CSV export to Staff accounts. If your coach can share the CSV, you can
          upload it here and we'll filter to just your kid's stats.
        </p>
      </div>

      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Player</label>
            <select value={childId} onChange={(e) => setChildId(e.target.value)} required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none">
              <option value="">Select a child...</option>
              {children.map(c => <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sport</label>
            <select value={sport} onChange={(e) => setSport(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none">
              {SPORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Season (optional)</label>
            <input value={season} onChange={(e) => setSeason(e.target.value)} placeholder="e.g., Spring 2026"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Team name (optional)</label>
            <input value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder="e.g., Thunder 12U"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">CSV File</label>
          <input ref={fileRef} type="file" accept=".csv,.txt" required
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-sm file:bg-primary/10 file:text-primary file:font-medium" />
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button type="submit" disabled={busy}
          className="w-full sm:w-auto px-6 py-2.5 bg-primary hover:bg-primary-dark text-white font-medium rounded-lg transition disabled:opacity-50">
          {busy ? 'Importing...' : '📤 Import Stats'}
        </button>
      </form>

      {result && (
        <div className="mt-4 p-4 bg-green-50 border-l-4 border-l-green-500 rounded-lg">
          <h3 className="font-semibold text-green-700 mb-1">✅ Import Successful</h3>
          <p className="text-sm text-gray-600"><strong>{result.statsCreated}</strong> stats imported</p>
          {childId && (
            <Link to={`/players/${childId}`} className="inline-block mt-2 text-sm text-primary hover:underline font-medium">
              View Player Profile →
            </Link>
          )}
        </div>
      )}
    </Card>
  );
}

function ManualLog({ token, children, onLogged }: { token: string; children: any[]; onLogged: () => void }) {
  const [childId, setChildId] = useState('');
  const [sport, setSport] = useState<'BASEBALL' | 'SOFTBALL'>('BASEBALL');
  const [category, setCategory] = useState<'BATTING' | 'PITCHING'>('BATTING');
  const [gameDate, setGameDate] = useState(new Date().toISOString().slice(0, 10));
  const [season, setSeason] = useState('');
  const [stats, setStats] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fields = category === 'BATTING' ? MANUAL_BATTING : MANUAL_PITCHING;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!childId) { setError('Pick a player'); return; }

    const numeric: Record<string, number> = {};
    for (const [k, v] of Object.entries(stats)) {
      if (v === '' || v == null) continue;
      const n = Number(v);
      if (!Number.isFinite(n)) { setError(`Invalid value for ${k}`); return; }
      numeric[k] = n;
    }
    if (Object.keys(numeric).length === 0) { setError('Enter at least one stat'); return; }

    setBusy(true);
    try {
      const res = await api<any>('/imports/gamechanger/log-game', {
        method: 'POST', token,
        body: { childId, sport, season: season || undefined, gameDate, stats: numeric },
      });
      setSuccess(`Logged ${res.statsCreated} stats`);
      setStats({});
      onLogged();
    } catch (e: any) {
      setError(e.message || 'Log failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <div className="border-l-4 border-l-green-500 -ml-6 pl-6 mb-4">
        <h2 className="text-lg font-semibold text-secondary">Log a Game Manually</h2>
        <p className="text-sm text-gray-500 mt-1">
          No CSV access? Enter your kid's stats from a single game right here.
        </p>
      </div>

      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Player</label>
            <select value={childId} onChange={(e) => setChildId(e.target.value)} required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none">
              <option value="">Select a child...</option>
              {children.map(c => <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sport</label>
            <select value={sport} onChange={(e) => setSport(e.target.value as any)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none">
              {SPORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Game date</label>
            <input type="date" value={gameDate} onChange={(e) => setGameDate(e.target.value)} required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Season (optional)</label>
            <input value={season} onChange={(e) => setSeason(e.target.value)} placeholder="e.g., Spring 2026"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none" />
          </div>
        </div>

        <div className="flex bg-white rounded-lg border border-gray-200 w-fit">
          <button type="button" onClick={() => setCategory('BATTING')}
            className={`px-4 py-2 text-sm font-medium rounded-l-lg transition ${category === 'BATTING' ? 'bg-primary text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
            Batting
          </button>
          <button type="button" onClick={() => setCategory('PITCHING')}
            className={`px-4 py-2 text-sm font-medium rounded-r-lg transition ${category === 'PITCHING' ? 'bg-primary text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
            Pitching
          </button>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {fields.map(f => (
            <div key={f.key}>
              <label className="block text-xs font-mono text-gray-500 mb-1">{f.label}</label>
              <input type="number" step="any" inputMode="decimal"
                value={stats[f.key] ?? ''}
                onChange={(e) => setStats(s => ({ ...s, [f.key]: e.target.value }))}
                className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm" />
            </div>
          ))}
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}
        {success && <p className="text-green-600 text-sm">{success}</p>}

        <button type="submit" disabled={busy}
          className="w-full sm:w-auto px-6 py-2.5 bg-primary hover:bg-primary-dark text-white font-medium rounded-lg transition disabled:opacity-50">
          {busy ? 'Logging...' : '✅ Log Game'}
        </button>
      </form>
    </Card>
  );
}
