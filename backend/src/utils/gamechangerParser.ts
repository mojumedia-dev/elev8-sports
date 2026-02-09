/**
 * GameChanger CSV Parser
 * Handles baseball and softball stat exports from GameChanger.
 * Supports batting and pitching stat columns.
 */

export interface ParsedPlayerStats {
  playerName: string;
  statType: string;
  statValue: number;
  category: 'BATTING' | 'PITCHING';
  gameDate?: string;
}

export interface ParseResult {
  players: ParsedPlayerStats[];
  teamName?: string;
  season?: string;
  sport: 'BASEBALL' | 'SOFTBALL';
  rawHeaders: string[];
  rowCount: number;
}

// GameChanger batting stat columns
const BATTING_COLUMNS: Record<string, string> = {
  'AB': 'AT_BATS',
  'R': 'RUNS',
  'H': 'HITS',
  '2B': 'DOUBLES',
  '3B': 'TRIPLES',
  'HR': 'HOME_RUNS',
  'RBI': 'RBI',
  'BB': 'WALKS',
  'SO': 'STRIKEOUTS',
  'AVG': 'BATTING_AVG',
  'OBP': 'ON_BASE_PCT',
  'SLG': 'SLUGGING_PCT',
  'OPS': 'OPS',
  'HBP': 'HIT_BY_PITCH',
  'SAC': 'SACRIFICES',
  'SF': 'SAC_FLIES',
  'SB': 'STOLEN_BASES',
  'CS': 'CAUGHT_STEALING',
  'GP': 'GAMES_PLAYED',
  'PA': 'PLATE_APPEARANCES',
  'TB': 'TOTAL_BASES',
};

// GameChanger pitching stat columns
const PITCHING_COLUMNS: Record<string, string> = {
  'IP': 'INNINGS_PITCHED',
  'W': 'WINS',
  'L': 'LOSSES',
  'SV': 'SAVES',
  'ERA': 'ERA',
  'K': 'PITCHING_STRIKEOUTS',
  'BB': 'PITCHING_WALKS',
  'H': 'PITCHING_HITS_ALLOWED',
  'R': 'PITCHING_RUNS',
  'ER': 'EARNED_RUNS',
  'WHIP': 'WHIP',
  'BF': 'BATTERS_FACED',
  'PC': 'PITCH_COUNT',
  'HBP': 'PITCHING_HBP',
  'WP': 'WILD_PITCHES',
};

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function detectCategory(headers: string[]): 'BATTING' | 'PITCHING' {
  const headerSet = new Set(headers.map(h => h.toUpperCase()));
  // If we see IP or ERA, it's pitching
  if (headerSet.has('IP') || headerSet.has('ERA') || headerSet.has('BF')) {
    return 'PITCHING';
  }
  return 'BATTING';
}

function detectSport(csvText: string): 'BASEBALL' | 'SOFTBALL' {
  const lower = csvText.toLowerCase();
  if (lower.includes('softball')) return 'SOFTBALL';
  return 'BASEBALL';
}

export function parseGameChangerCSV(csvText: string, sportOverride?: 'BASEBALL' | 'SOFTBALL'): ParseResult {
  const lines = csvText.split(/\r?\n/).filter(l => l.trim().length > 0);

  if (lines.length < 2) {
    throw new Error('CSV must have at least a header row and one data row');
  }

  // Try to detect team name from metadata rows (GameChanger sometimes includes them)
  let teamName: string | undefined;
  let season: string | undefined;
  let headerLineIndex = 0;

  // Look for metadata before the actual header
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const line = lines[i].toLowerCase();
    if (line.includes('team:') || line.includes('team name')) {
      teamName = parseCSVLine(lines[i])[1] || parseCSVLine(lines[i])[0].replace(/team:?\s*/i, '');
      headerLineIndex = i + 1;
    }
    if (line.includes('season:') || line.includes('season')) {
      season = parseCSVLine(lines[i])[1] || parseCSVLine(lines[i])[0].replace(/season:?\s*/i, '');
      headerLineIndex = i + 1;
    }
  }

  // Find the actual header row (has player name column + stat columns)
  for (let i = headerLineIndex; i < Math.min(10, lines.length); i++) {
    const cols = parseCSVLine(lines[i]);
    const upper = cols.map(c => c.toUpperCase());
    if (upper.includes('PLAYER') || upper.includes('NAME') || upper.includes('#') ||
        upper.some(c => c === 'AB' || c === 'IP' || c === 'AVG')) {
      headerLineIndex = i;
      break;
    }
  }

  const headers = parseCSVLine(lines[headerLineIndex]);
  const upperHeaders = headers.map(h => h.toUpperCase().trim());

  // Find name column
  const nameIdx = upperHeaders.findIndex(h =>
    h === 'PLAYER' || h === 'NAME' || h === 'PLAYER NAME' || h === 'PLAYERNAME'
  );
  const nameColIndex = nameIdx >= 0 ? nameIdx : 0; // Default to first column

  const category = detectCategory(upperHeaders);
  const sport = sportOverride || detectSport(csvText);
  const statColumns = category === 'BATTING' ? BATTING_COLUMNS : PITCHING_COLUMNS;

  const players: ParsedPlayerStats[] = [];

  for (let i = headerLineIndex + 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length < 2) continue;

    const playerName = values[nameColIndex];
    if (!playerName || playerName.toLowerCase() === 'totals' || playerName.toLowerCase() === 'team') continue;

    for (let j = 0; j < upperHeaders.length; j++) {
      const header = upperHeaders[j];
      // For pitching, use PITCHING_COLUMNS mapping; for batting use BATTING_COLUMNS
      const statType = statColumns[header];
      if (!statType) continue;

      const rawValue = values[j];
      if (rawValue === undefined || rawValue === '' || rawValue === '-') continue;

      const numValue = parseFloat(rawValue);
      if (isNaN(numValue)) continue;

      players.push({
        playerName,
        statType,
        statValue: numValue,
        category,
      });
    }
  }

  return {
    players,
    teamName,
    season,
    sport,
    rawHeaders: headers,
    rowCount: lines.length - headerLineIndex - 1,
  };
}

/**
 * Calculate season summary/averages from a list of stats
 */
export function calculateStatSummary(stats: { statType: string; statValue: number; gameDate?: Date | null }[]) {
  const grouped: Record<string, { total: number; count: number; values: number[] }> = {};

  for (const stat of stats) {
    if (!grouped[stat.statType]) {
      grouped[stat.statType] = { total: 0, count: 0, values: [] };
    }
    grouped[stat.statType].total += stat.statValue;
    grouped[stat.statType].count += 1;
    grouped[stat.statType].values.push(stat.statValue);
  }

  // Rate stats that should be averaged, not summed
  const RATE_STATS = new Set([
    'BATTING_AVG', 'ON_BASE_PCT', 'SLUGGING_PCT', 'OPS', 'ERA', 'WHIP',
  ]);

  const summary: Record<string, { value: number; type: 'sum' | 'average'; count: number }> = {};

  for (const [statType, data] of Object.entries(grouped)) {
    if (RATE_STATS.has(statType)) {
      summary[statType] = {
        value: Math.round((data.total / data.count) * 1000) / 1000,
        type: 'average',
        count: data.count,
      };
    } else {
      summary[statType] = {
        value: data.total,
        type: 'sum',
        count: data.count,
      };
    }
  }

  return summary;
}
