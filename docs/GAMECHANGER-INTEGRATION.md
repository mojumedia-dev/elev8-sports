# GameChanger Integration Strategy

## Philosophy

**Elev8 Sports complements GameChanger — we don't replace your stat tracking, we enhance it.**

GameChanger is the gold standard for live game scoring and stat tracking in youth baseball and softball. We don't compete with that. Instead, we import those stats to give families and coaches a richer experience:

- Player profiles with imported stats
- Season-over-season development tracking
- Stats integrated with team management, scheduling, and communication

## Current: CSV Import

### How It Works

1. **Export from GameChanger:** In the GameChanger app, go to Team → Stats → Export → CSV
2. **Upload to Elev8:** Go to Import Stats page, select the child, sport, and upload the CSV
3. **Auto-parsing:** Our parser handles GameChanger's CSV format for both batting and pitching stats
4. **Player matching:** If the CSV has multiple players, we match by child name; if only one player, we import all stats

### Supported Stat Columns

**Batting:** AB, R, H, 2B, 3B, HR, RBI, BB, SO, AVG, OBP, SLG, OPS, HBP, SAC, SF, SB, CS, GP, PA, TB

**Pitching:** IP, W, L, SV, ERA, K, BB, H, R, ER, WHIP, BF, PC, HBP, WP

### Sports Supported
- ⚾ Baseball
- 🥎 Softball (same stat columns, tracked separately)

## Future: API Partnership

### Phase 2 Vision

We'd like to partner with GameChanger to offer direct API integration:

- **OAuth connection:** Parents link their GameChanger account
- **Auto-sync:** Stats import automatically after each game
- **Real-time updates:** No manual CSV export needed
- **Richer data:** Access to play-by-play, game logs, and more

### Why This Benefits GameChanger
- We drive engagement with their platform (parents need GC for the stats)
- We don't replicate their scoring/tracking features
- We extend their reach into the team management space
- Cross-promotion opportunity

## Data Model

### GameChangerImport
Tracks each CSV upload with raw data preservation and parsed results.

### PlayerStats
Individual stat records linked to a child, sport, season, and optionally a specific game date. Source tracking distinguishes GameChanger imports from any future manual entries.

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/imports/gamechanger/upload-csv` | POST | Upload and parse a GameChanger CSV |
| `/api/imports/gamechanger/stats/:childId` | GET | Get all stats for a child |
| `/api/imports/gamechanger/stats/:childId/summary` | GET | Season averages and trends |
| `/api/imports/gamechanger/imports` | GET | List all imports for current user |
