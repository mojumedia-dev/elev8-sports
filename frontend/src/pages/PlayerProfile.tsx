import { useParams, Link } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import Card from '../components/Card';
import { useState } from 'react';

const STAT_LABELS: Record<string, string> = {
  AT_BATS: 'AB', RUNS: 'R', HITS: 'H', DOUBLES: '2B', TRIPLES: '3B',
  HOME_RUNS: 'HR', RBI: 'RBI', WALKS: 'BB', STRIKEOUTS: 'SO',
  BATTING_AVG: 'AVG', ON_BASE_PCT: 'OBP', SLUGGING_PCT: 'SLG', OPS: 'OPS',
  HIT_BY_PITCH: 'HBP', SACRIFICES: 'SAC', SAC_FLIES: 'SF',
  STOLEN_BASES: 'SB', CAUGHT_STEALING: 'CS', GAMES_PLAYED: 'GP',
  PLATE_APPEARANCES: 'PA', TOTAL_BASES: 'TB',
  INNINGS_PITCHED: 'IP', WINS: 'W', LOSSES: 'L', SAVES: 'SV',
  ERA: 'ERA', PITCHING_STRIKEOUTS: 'K', PITCHING_WALKS: 'BB',
  PITCHING_HITS_ALLOWED: 'H', PITCHING_RUNS: 'R', EARNED_RUNS: 'ER',
  WHIP: 'WHIP', BATTERS_FACED: 'BF', PITCH_COUNT: 'PC',
};

const BATTING_ORDER = ['GAMES_PLAYED', 'AT_BATS', 'HITS', 'DOUBLES', 'TRIPLES', 'HOME_RUNS', 'RBI', 'RUNS', 'WALKS', 'STRIKEOUTS', 'BATTING_AVG', 'ON_BASE_PCT', 'SLUGGING_PCT', 'OPS', 'STOLEN_BASES'];
const PITCHING_ORDER = ['INNINGS_PITCHED', 'WINS', 'LOSSES', 'SAVES', 'ERA', 'PITCHING_STRIKEOUTS', 'PITCHING_WALKS', 'PITCHING_HITS_ALLOWED', 'EARNED_RUNS', 'WHIP'];

const HIGHLIGHT_STATS = new Set(['BATTING_AVG', 'HOME_RUNS', 'RBI', 'ERA', 'PITCHING_STRIKEOUTS']);

function StatBar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-mono text-gray-500 w-8 text-right">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-sm font-semibold text-secondary w-12 text-right">{value % 1 !== 0 ? value.toFixed(3) : value}</span>
    </div>
  );
}

export default function PlayerProfile() {
  const { childId } = useParams();
  const { data: stats, loading: statsLoading } = useApi<any[]>(`/imports/gamechanger/stats/${childId}`, [childId]);
  const { data: summary, loading: summaryLoading } = useApi<any>(`/imports/gamechanger/stats/${childId}/summary`, [childId]);
  const { data: children } = useApi<any[]>('/children');
  const [tab, setTab] = useState<'batting' | 'pitching'>('batting');

  const child = children?.find((c: any) => c.id === childId);
  const loading = statsLoading || summaryLoading;

  if (loading) return <div className="text-center py-12 text-gray-400">Loading player profile...</div>;

  const statSummary = summary?.summary || {};
  const battingStats = BATTING_ORDER.filter(s => statSummary[s]);
  const pitchingStats = PITCHING_ORDER.filter(s => statSummary[s]);
  const hasBatting = battingStats.length > 0;
  const hasPitching = pitchingStats.length > 0;

  // Highlight cards
  const highlights = Object.entries(statSummary)
    .filter(([key]) => HIGHLIGHT_STATS.has(key))
    .map(([key, val]: [string, any]) => ({ key, label: STAT_LABELS[key] || key, value: val.value }));

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center text-2xl">⚾</div>
          <div>
            <h1 className="text-3xl font-bold text-secondary">
              {child ? `${child.firstName} ${child.lastName}` : 'Player Profile'}
            </h1>
            <p className="text-gray-500">
              {summary?.totalStats || 0} stats imported
              {summary?.imports?.[0]?.teamName && ` · ${summary.imports[0].teamName}`}
            </p>
          </div>
        </div>
      </div>

      {/* Highlight Cards */}
      {highlights.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {highlights.map(h => (
            <Card key={h.key} className="text-center">
              <p className="text-xs text-gray-500 uppercase">{h.label}</p>
              <p className="text-2xl font-bold text-primary mt-1">
                {h.value % 1 !== 0 ? h.value.toFixed(3) : h.value}
              </p>
            </Card>
          ))}
        </div>
      )}

      {/* No stats state */}
      {(!stats || stats.length === 0) && (
        <Card className="text-center py-12">
          <p className="text-gray-400 text-lg mb-2">No stats imported yet</p>
          <p className="text-gray-400 text-sm mb-4">Import your GameChanger CSV to see stats here.</p>
          <Link to="/import-stats" className="px-5 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition">
            Import Stats
          </Link>
        </Card>
      )}

      {/* Stats Table */}
      {stats && stats.length > 0 && (
        <>
          {(hasBatting && hasPitching) && (
            <div className="flex bg-white rounded-lg border border-gray-200 mb-6 w-fit">
              <button onClick={() => setTab('batting')}
                className={`px-5 py-2 text-sm font-medium rounded-l-lg transition ${tab === 'batting' ? 'bg-primary text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
                Batting
              </button>
              <button onClick={() => setTab('pitching')}
                className={`px-5 py-2 text-sm font-medium rounded-r-lg transition ${tab === 'pitching' ? 'bg-primary text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
                Pitching
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Visual Bars */}
            <Card>
              <h2 className="text-lg font-semibold text-secondary mb-4">
                {tab === 'batting' ? '🏏 Batting Stats' : '⚾ Pitching Stats'}
              </h2>
              <div className="space-y-3">
                {(tab === 'batting' ? battingStats : pitchingStats).map(statType => {
                  const data = statSummary[statType];
                  if (!data) return null;
                  const maxVal = ['BATTING_AVG', 'ON_BASE_PCT', 'SLUGGING_PCT'].includes(statType) ? 1
                    : statType === 'ERA' ? 10
                    : Math.max(data.value * 1.5, 10);
                  return (
                    <StatBar
                      key={statType}
                      label={STAT_LABELS[statType] || statType}
                      value={data.value}
                      max={maxVal}
                    />
                  );
                })}
              </div>
            </Card>

            {/* Summary Table */}
            <Card>
              <h2 className="text-lg font-semibold text-secondary mb-4">Season Summary</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 text-gray-500 font-medium">Stat</th>
                      <th className="text-right py-2 text-gray-500 font-medium">Value</th>
                      <th className="text-right py-2 text-gray-500 font-medium">Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(tab === 'batting' ? battingStats : pitchingStats).map(statType => {
                      const data = statSummary[statType];
                      if (!data) return null;
                      return (
                        <tr key={statType} className="border-b border-gray-100">
                          <td className="py-2 font-medium text-secondary">{STAT_LABELS[statType] || statType}</td>
                          <td className="py-2 text-right font-mono">
                            {data.value % 1 !== 0 ? data.value.toFixed(3) : data.value}
                          </td>
                          <td className="py-2 text-right text-gray-400 text-xs">{data.type}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* Import History */}
          {summary?.imports?.length > 0 && (
            <Card className="mt-6">
              <h2 className="text-lg font-semibold text-secondary mb-4">Import History</h2>
              <div className="space-y-2">
                {summary.imports.map((imp: any) => (
                  <div key={imp.id} className="flex items-center justify-between p-3 bg-slate rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-secondary">
                        {imp.sport === 'SOFTBALL' ? '🥎' : '⚾'} {imp.sport}
                        {imp.teamName && ` — ${imp.teamName}`}
                      </p>
                      {imp.season && <p className="text-xs text-gray-500">{imp.season}</p>}
                    </div>
                    <p className="text-xs text-gray-400">{new Date(imp.importedAt).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}

      {/* GameChanger attribution */}
      <div className="mt-8 text-center text-xs text-gray-400">
        Stats imported from GameChanger. Elev8 Sports complements GameChanger — we don't replace your stat tracking, we enhance it.
      </div>
    </div>
  );
}
