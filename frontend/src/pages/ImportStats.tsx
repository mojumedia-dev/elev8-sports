import { useState, useRef, FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../hooks/useApi';
import { api } from '../utils/api';
import Card from '../components/Card';
import { Link } from 'react-router-dom';

const SPORTS = [
  { value: 'BASEBALL', label: '⚾ Baseball' },
  { value: 'SOFTBALL', label: '🥎 Softball' },
];

export default function ImportStats() {
  const { token } = useAuth();
  const { data: children } = useApi<any[]>('/children');
  const { data: imports, refetch: refetchImports } = useApi<any[]>('/imports/gamechanger/imports');
  const fileRef = useRef<HTMLInputElement>(null);

  const [selectedChild, setSelectedChild] = useState('');
  const [sport, setSport] = useState('BASEBALL');
  const [season, setSeason] = useState('');
  const [teamName, setTeamName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const handleUpload = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setResult(null);

    const file = fileRef.current?.files?.[0];
    if (!file) {
      setError('Please select a CSV file');
      return;
    }
    if (!selectedChild) {
      setError('Please select a child');
      return;
    }

    setUploading(true);
    try {
      const csvData = await file.text();
      const res = await api<any>('/imports/gamechanger/upload-csv', {
        method: 'POST',
        body: { csvData, childId: selectedChild, sport, season: season || undefined, teamName: teamName || undefined },
        token: token!,
      });
      setResult(res);
      refetchImports();
      if (fileRef.current) fileRef.current.value = '';
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-secondary">Import Stats 📊</h1>
        <p className="text-gray-500 mt-1">Import your stats from GameChanger — we enhance your data, not replace it.</p>
      </div>

      {/* GameChanger Branding */}
      <Card className="mb-6 border-l-4 border-l-green-500">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-2xl flex-shrink-0">📈</div>
          <div>
            <h3 className="font-semibold text-secondary">Import your stats from GameChanger</h3>
            <p className="text-sm text-gray-500 mt-1">
              Elev8 Sports complements GameChanger — we don't replace your stat tracking, we enhance it.
              Export your stats from GameChanger as CSV and upload them here to build your player profile.
            </p>
            <p className="text-xs text-gray-400 mt-2">
              In GameChanger: Team → Stats → Export → CSV. Upload the file below.
            </p>
          </div>
        </div>
      </Card>

      {/* Upload Form */}
      <Card className="mb-6">
        <h2 className="text-lg font-semibold text-secondary mb-4">Upload GameChanger CSV</h2>
        <form onSubmit={handleUpload} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Player</label>
              <select value={selectedChild} onChange={(e) => setSelectedChild(e.target.value)} required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none">
                <option value="">Select a child...</option>
                {children?.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sport</label>
              <select value={sport} onChange={(e) => setSport(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none">
                {SPORTS.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Season (optional)</label>
              <input value={season} onChange={(e) => setSeason(e.target.value)} placeholder="e.g., Spring 2026"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Team Name (optional)</label>
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

          <button type="submit" disabled={uploading}
            className="px-6 py-2.5 bg-primary hover:bg-primary-dark text-white font-medium rounded-lg transition disabled:opacity-50">
            {uploading ? 'Importing...' : '📤 Import Stats'}
          </button>
        </form>
      </Card>

      {/* Result */}
      {result && (
        <Card className="mb-6 border-l-4 border-l-green-500">
          <h3 className="font-semibold text-green-700 mb-2">✅ Import Successful!</h3>
          <div className="text-sm text-gray-600 space-y-1">
            <p><strong>{result.statsCreated}</strong> stats imported</p>
            <p>Players found: {result.playersFound?.join(', ')}</p>
            {result.matchedPlayer !== 'all' && <p>Matched to: {result.matchedPlayer}</p>}
          </div>
          {selectedChild && (
            <Link to={`/players/${selectedChild}`}
              className="inline-block mt-3 text-sm text-primary hover:underline font-medium">
              View Player Profile →
            </Link>
          )}
        </Card>
      )}

      {/* Import History */}
      <Card>
        <h2 className="text-lg font-semibold text-secondary mb-4">Import History</h2>
        {!imports || imports.length === 0 ? (
          <p className="text-gray-400 text-sm">No imports yet. Upload your first GameChanger CSV above!</p>
        ) : (
          <div className="space-y-3">
            {imports.map((imp: any) => (
              <div key={imp.id} className="flex items-center justify-between p-3 bg-slate rounded-lg">
                <div>
                  <p className="font-medium text-secondary">
                    {imp.child?.firstName} {imp.child?.lastName}
                    {imp.teamName && <span className="text-gray-500"> — {imp.teamName}</span>}
                  </p>
                  <p className="text-sm text-gray-500">
                    {imp.sport === 'SOFTBALL' ? '🥎' : '⚾'} {imp.sport} · {imp._count?.stats || 0} stats
                    {imp.season && ` · ${imp.season}`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">{new Date(imp.importedAt).toLocaleDateString()}</p>
                  <Link to={`/players/${imp.childId}`} className="text-xs text-primary hover:underline">View</Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
