# Elev8 Sports — Competitive Intelligence & Integration Research
*Compiled: February 8, 2026*

---

## Executive Summary

The youth sports tech market is fragmented. No single platform owns the full lifecycle from **registration → team management → live scoring/stats → highlights → player development → recruiting**. Each competitor dominates 1-2 pieces. Elev8's opportunity is to be the **connective tissue** — particularly between stat tracking (GameChanger), highlight creation, and player profile/recruiting, which is a gap nobody fills well for youth athletes.

---

## Competitive Landscape Overview

### 1. GameChanger (gc.com)
**Owner:** DICK'S Sporting Goods (acquired 2016)
**Core Features:** Live scoring, real-time stats, play-by-play, live streaming (via iPhone camera), team management, scheduling, messaging
**Target Audience:** Youth baseball/softball primarily; expanding to basketball, soccer, hockey, lacrosse, football, volleyball
**Pricing:**
- Free tier: basic team management, scheduling
- Premium: **$99.99/year** (2025 price, up from $49.99 in 2021 — aggressive annual increases causing user frustration)
- Premium includes: live streaming, advanced stats, video clips, spray charts

**Strengths:**
- Dominant in baseball/softball stat tracking — nearly ubiquitous
- Excellent real-time scoring UX on mobile
- Deep stat library (batting avg, ERA, OBP, SLG, OPS, WHIP, etc.)
- Live streaming from phone camera is killer feature
- League/tournament leaderboards
- CSV export for season stats

**Weaknesses:**
- **Rapidly increasing prices** creating user resentment (doubled in 4 years)
- No public API — this is a major pain point (see integration section below)
- Multi-sport support is shallow compared to baseball
- No recruiting/profile features
- No highlight reel creation tools
- Desktop/web experience lags behind mobile
- Team management features are basic compared to TeamSnap

**What Elev8 can exploit:** Price frustration, no highlight tools, no player profiles/recruiting, no public API means data is trapped inside GC

---

### 2. TeamSnap
**Owner:** Private (acquired by Waud Capital in 2021)
**Core Features:** Team management, scheduling, availability tracking, messaging, payment collection, photo/video sharing, registration (for leagues)
**Target Audience:** Recreational to travel teams across all sports; leagues and clubs
**Pricing:**
- Free: limited to 1 team, basic features
- Team plans: ~$13-25/mo per team (Basic to Premium)
- League/Club: custom pricing, per-player fees
- API access on higher-tier plans

**Strengths:**
- Best-in-class team communication and scheduling
- Availability tracking is beloved by coaches
- Huge installed base (25M+ users claimed)
- Open API available
- Works for any sport

**Weaknesses:**
- **No live scoring or stats** — purely management/communication
- Per-team pricing adds up fast for multi-team families
- Photo/video sharing is basic (no highlight tools)
- UI feels dated
- Registration features lag behind SportsEngine/LeagueApps

**What Elev8 can exploit:** No stats, no highlights, no player development — TeamSnap users need a complementary platform

---

### 3. SportsEngine (NBC Sports Next)
**Owner:** NBC Universal / Comcast
**Core Features:** Registration, website builder, league management, tournament management (via SportsEngine Tourney/Tourney Machine), scheduling, background checks, digital cards
**Target Audience:** National governing bodies (NGBs), state associations, large leagues and clubs
**Pricing:**
- Transaction-based: ~3-4% per registration transaction
- Platform fees for website/management tools
- Premium tiers for larger organizations

**Strengths:**
- Deep enterprise features for large organizations
- Official partner of many NGBs (USA Hockey, US Lacrosse, etc.)
- SportsEngine Tourney (formerly Tourney Machine) is strong for tournament brackets
- Background check integration
- Digital membership cards

**Weaknesses:**
- **Overkill for individual teams** — designed for org-level management
- Expensive for small leagues
- UX is clunky and enterprise-feeling
- Mobile app is poorly rated
- No stats tracking, no highlight features
- Website builder produces generic-looking sites

**What Elev8 can exploit:** Terrible UX, no athlete-facing features, over-engineered for small/medium orgs

---

### 4. SportsEngine Tourney (formerly Tourney Machine)
**Core Features:** Tournament bracket management, automated scheduling engine, score reporting, standings, mobile app for schedules/scores, coach/parent communication
**Target Audience:** Tournament directors and organizers
**Pricing:** Per-tournament licensing (custom quotes)

**Strengths:**
- Best-in-class scheduling algorithm for bracket tournaments
- Real-time bracket updates
- Good mobile experience for viewing schedules/results
- Text/email notifications

**Weaknesses:**
- Narrow scope — tournaments only
- Now bundled into SportsEngine ecosystem (vendor lock-in)
- No stats beyond W/L, no player-level data
- No integration with stat-tracking apps

**What Elev8 can exploit:** Tournament results don't flow into player profiles anywhere — Elev8 could be that bridge

---

### 5. MOJO Sports (mojo.sport)
**Core Features:** Practice plans, coaching drills (video-guided), team management, age-appropriate skill development, scheduling
**Target Audience:** Volunteer/parent coaches with limited experience; ages 3-12 primarily
**Pricing:**
- Free for coaches (team management, basic drills)
- Premium subscription for families: ~$8-15/mo (expanded drill library, training plans)
- **MLB partnership** — official grassroots coaching app of Major League Baseball

**Strengths:**
- Unique niche: coaching content/education
- Beautiful UX, very modern
- MLB partnership gives credibility
- Addresses a real pain point (volunteer coaches don't know what to teach)
- Video-guided drills are engaging

**Weaknesses:**
- Very young age range (3-12), not for competitive/travel teams
- No live scoring or stats
- Limited sport coverage (baseball, soccer, basketball, flag football)
- No recruiting or player profile features
- Coaching content becomes less relevant as kids get older and have paid coaches

**What Elev8 can exploit:** MOJO stops where competitive youth sports begin. Elev8 can pick up at age 10+ where coaching content matters less but stats, highlights, and recruiting matter more.

---

### 6. LeagueApps
**Core Features:** Online registration, payment processing, scheduling, facility management, custom websites, mobile app, waiver management
**Target Audience:** League operators, clubs, training facilities
**Pricing:**
- Free tier available (limited)
- Transaction-based: processing fees per registration
- Optional annual fees for branded apps and custom website design
- API available

**Strengths:**
- Strong registration/payment workflow
- Flexible pricing rules (early bird, sibling discounts, installments)
- Good facility management tools
- API available for integrations
- Modern UI compared to SportsEngine

**Weaknesses:**
- Primarily a registration/operations platform — no game-day features
- No stats, no scoring, no highlights
- Mobile app is for participants, limited admin features on mobile
- Smaller market share than SportsEngine or TeamSnap

**What Elev8 can exploit:** League operators using LeagueApps have zero game-day or athlete-development tools — natural integration partner

---

### 7. Sports Connect
**Owner:** Dick's Sporting Goods / GameChanger (same parent)
**Core Features:** Online registration, league websites, scheduling, volunteer management, fan wear shops
**Target Audience:** Community/recreational leagues (especially Little League-affiliated)
**Pricing:** Transaction-based registration fees

**Strengths:**
- Official Little League registration partner
- Simple, straightforward registration flow
- Integration with GameChanger ecosystem (same owner)
- Volunteer management tools

**Weaknesses:**
- Narrow market (primarily Little League/recreational baseball)
- Basic feature set
- Limited customization
- No stats, no athlete features

**What Elev8 can exploit:** Captive Little League audience that already uses GameChanger — Elev8 can complement this workflow

---

### 8. Hudl
**Core Features:** Video analysis, game film breakdown, highlight reels, recruiting tools, performance analytics, live streaming
**Target Audience:** High school and college primarily; expanding to club/youth
**Pricing:**
- Club/Youth: **minimum ~$400/year** (major price increase from $99)
- High School: package pricing (school-wide deals)
- Individual athlete highlights: Hudl app is free to create basic highlights

**Strengths:**
- Gold standard for game film and video analysis
- Recruiting network — college coaches use Hudl
- AI-powered automatic stat tracking from video
- Professional-grade tools

**Weaknesses:**
- **Pricing explosion** — $400+ makes it inaccessible for most youth teams
- Complex/overwhelming for casual users
- Overkill for 10U baseball
- Focused on football, basketball — limited sport coverage for youth
- Not designed for real-time scoring/stats during games

**What Elev8 can exploit:** Hudl's price increase has left a massive gap in affordable youth highlight/recruiting tools. This is arguably Elev8's biggest opportunity.

---

### 9. Other Notable Players

| Platform | Niche | Notes |
|----------|-------|-------|
| **Exposure Events** | Tournament scheduling/registration | Competitor to Tourney Machine, strong in basketball |
| **PlayMetrics** | Youth soccer club management | Soccer-specific, good training/development tracking |
| **MaxPreps** | High school stats/rankings | CBS Sports owned, public stats database, no team management |
| **SportsPlus** | League management/registration | Newer entrant, affordable alternative to SportsEngine |
| **Jersey Watch** | League websites/registration | Budget-friendly, basic features |

---

## Feature Comparison Matrix

| Feature | GameChanger | TeamSnap | SportsEngine | MOJO | LeagueApps | Hudl | Sports Connect |
|---------|:-----------:|:--------:|:------------:|:----:|:----------:|:----:|:--------------:|
| Live Scoring | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Real-time Stats | ✅ | ❌ | ❌ | ❌ | ❌ | 🔶* | ❌ |
| Live Streaming | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Team Management | 🔶 | ✅ | ✅ | 🔶 | 🔶 | ❌ | 🔶 |
| Scheduling | 🔶 | ✅ | ✅ | 🔶 | ✅ | ❌ | ✅ |
| Registration | ❌ | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ |
| Payment Processing | ❌ | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ |
| Highlight Reels | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Player Profiles | ❌ | ❌ | ❌ | ❌ | ❌ | 🔶 | ❌ |
| Recruiting Tools | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Coaching Content | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Tournament Brackets | 🔶 | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Public API | ❌ | ✅ | 🔶 | ❌ | ✅ | 🔶 | ❌ |
| CSV Export | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ |
| Multi-sport | 🔶 | ✅ | ✅ | 🔶 | ✅ | 🔶 | ❌ |

✅ = Strong  |  🔶 = Partial/Limited  |  ❌ = Not available
\* Hudl stats are post-game from video analysis, not real-time

---

## GameChanger Integration Deep Dive

### API Status: NO PUBLIC API
GameChanger does **not** offer a public API, developer program, or OAuth integration. This is confirmed across multiple Reddit threads and community discussions (2021-2024). Repeated user requests have gone unanswered.

### What Exists (Unofficial)
As of mid-2024, community members discovered that `web.gc.com` exposes internal REST endpoints that are more accessible than before:

**Known endpoints (unofficial, subject to change):**
- `/auth` — token refresh for `gc-token`
- `/bats-starting-lineups/latest/{GAME_ID}` — batting orders
- `/teams/{TEAM_ID}/player` — player IDs, names, numbers
- Various stats endpoints accessible via browser dev tools
- Game IDs visible in URLs when viewing games on web

**Authentication:** Cookie-based `gc-token`, obtained via `/auth` endpoint after login. No OAuth, no API keys.

### Official Data Export Options
1. **CSV Export (Season Stats)** — Available to Staff accounts on baseball, softball, and basketball teams
   - Export season totals from the app
   - Includes standard stats (BA, ERA, HR, RBI, etc. for baseball)
   - Must be done manually per team per season
   - No automated/scheduled export

2. **League/Tournament Leaderboards** — If using GC for head-to-head scoring within a league
   - Centralized stats across teams
   - CSV export of leaderboard data
   - Requires league to use GC's scoring for all games

### Integration Plan for Elev8

**Phase 1: Manual Import (MVP)**
- Build a CSV import tool that accepts GameChanger stat exports
- Map GC's CSV columns to Elev8's data model
- Support baseball/softball stats first (GC's strongest sport)
- Provide clear instructions: "Export from GC → Upload to Elev8"
- **Timeline: Sprint 1-2**

**Phase 2: Semi-Automated Scraping (Careful)**
- Use the unofficial web API endpoints to pull stats for public games/teams
- Requires user to authenticate with their GC credentials (proxy login)
- ⚠️ **Legal risk**: This likely violates GC's ToS — proceed with caution
- Build as an internal tool first, not a public feature
- Monitor for API changes (no stability guarantees)
- **Timeline: Sprint 3-4, only if Phase 1 validates demand**

**Phase 3: Partnership/Official Integration**
- Once Elev8 has traction, approach GameChanger/DICK'S for a data partnership
- Pitch: "We're driving engagement for your users, not competing"
- Elev8 does highlights/profiles, GC does scoring — complementary
- Sports Connect (same parent company) could be the leverage point
- **Timeline: 6-12 months post-launch**

**Phase 4: Build Own Scoring (Long-term)**
- If GC partnership fails or pricing continues to alienate users
- Build lightweight live scoring as an alternative
- Import historical GC data, then users can switch
- **Timeline: 12-18 months, only if strategically necessary**

### Data Available from GameChanger (via CSV)

**Baseball/Softball:**
| Hitting | Pitching | Fielding |
|---------|----------|----------|
| BA, OBP, SLG, OPS | ERA, WHIP | Errors |
| AB, H, 2B, 3B, HR | IP, K, BB | Putouts |
| RBI, R, BB, SO | H, R, ER | Assists |
| SB, CS | W, L, SV | Fielding % |
| HBP, SAC | Pitches, Strikes | |

**Basketball:** Points, rebounds, assists, steals, blocks, turnovers, FG%, 3P%, FT%

**Other sports:** More limited — basic stats only

---

## Mobile vs Desktop Feature Strategy

### How Top Apps Split Mobile/Desktop

| App | Mobile-First? | Desktop Strength |
|-----|:------------:|-----------------|
| GameChanger | ✅ Yes | Stats review, CSV export, streaming viewer |
| TeamSnap | ✅ Yes | Admin/management, reporting |
| SportsEngine | ❌ Desktop-first | Admin portal, registration setup |
| MOJO | ✅ Yes | Minimal desktop presence |
| LeagueApps | ❌ Desktop-first | Admin, registration setup |
| Hudl | 🔶 Hybrid | Video editing, detailed analysis |

### Recommendation for Elev8

**Mobile-first, desktop-enhanced.** Here's why:

**Mobile (80% of user time):**
- Parents are at games on their phones
- Quick highlight clip creation/sharing
- Stat viewing during/after games
- Push notifications for game updates
- Player profile viewing
- Social sharing

**Desktop (20% — power users and admins):**
- Detailed stat analysis and comparison
- Full highlight reel editing
- Bulk CSV import from GameChanger
- League/tournament admin features
- Recruiting profile management
- Report generation

**Key principle:** Every critical action should be possible on mobile. Desktop adds depth and power-user features, not gated functionality.

---

## Market Gaps & Opportunities

### Gap 1: Stats → Highlights → Recruiting Pipeline (🎯 PRIMARY OPPORTUNITY)
**Nobody connects the dots.** GameChanger tracks stats. Hudl does video. Neither creates a player profile that combines both and makes it recruitable. Parents currently:
1. Score on GameChanger
2. Record video on their phone
3. Manually create highlights (or pay $400+ for Hudl)
4. Build a recruiting profile on a separate website
5. Email coaches individually

**Elev8 opportunity:** Unify steps 2-5. Import stats from GC, overlay on video, auto-generate highlight reels, build a player profile, connect to recruiting.

### Gap 2: Affordable Highlight/Video Tools (Post-Hudl Price Hike)
Hudl going from $99 to $400+ left a **massive** underserved market of youth/travel teams that want basic video and highlights but can't justify $400. There is no good mid-tier option.

### Gap 3: Multi-Sport Athlete Profiles
Most platforms are siloed by sport. A kid who plays baseball, basketball, and soccer has stats scattered across different apps with no unified view. No platform creates a comprehensive athlete profile.

### Gap 4: Underserved Sports
**Well-served:** Baseball/softball (GameChanger), football (Hudl), basketball (decent across platforms)
**Underserved:**
- 🥍 **Lacrosse** — growing fast, limited stat tracking
- ⚽ **Soccer** — no dominant stat tracker for youth
- 🏐 **Volleyball** — very limited options
- 🏒 **Hockey** — SportsEngine has org management but weak stats
- 🏊 **Swimming/Track** — time-based sports poorly served by team apps
- 🥊 **Combat sports / wrestling** — almost nothing exists
- 🏈 **Flag football** — exploding participation (Olympics 2028), no dedicated platform

### Gap 5: The "Athlete Brand" for Youth
Social media matters even for 14-year-olds in recruiting now. No platform helps young athletes build a proper digital presence that's:
- Parent-controlled
- Stats-verified
- Highlight-integrated
- Recruiter-friendly
- Not just an Instagram page

---

## Recommended Differentiators for Elev8

### 1. **"Import from GameChanger" as a Launch Feature**
Make this the hook. Every baseball/softball parent knows GC. "Your stats, elevated" as a tagline. Import CSV, create beautiful player profiles. This alone gets you into the ecosystem.

### 2. **AI-Powered Highlight Generation**
Phone video + stat overlay + auto-clip detection = affordable highlights that parents actually share. Position as "Hudl for youth, at 1/10 the price."

### 3. **Unified Athlete Profile**
One profile per athlete across all sports and seasons. Cumulative stats, highlights, achievements, coach endorsements. Think "LinkedIn for youth athletes."

### 4. **Flag Football First-Mover**
With flag football entering the 2028 Olympics, participation is exploding. ZERO platforms have purpose-built flag football stat tracking. Be first.

### 5. **Price It Right**
- Free tier: 1 athlete profile, basic stats, limited highlights
- Family plan: $5-8/mo (up to 4 athletes, unlimited highlights, full stats)
- Team plan: $15-20/mo (team stats, shared highlights, team page)
- League/tournament: custom pricing

Stay **well under** GameChanger's $100/yr and Hudl's $400/yr. The market is begging for affordability.

### 6. **Social-First Sharing**
Highlight clips auto-formatted for Instagram Reels, TikTok, YouTube Shorts. One-tap share with stat overlays. This is how you go viral and get organic growth. No competitor does this well.

---

## Integration Strategy

### Standard Integrations in This Space
- **GameChanger** → Stats import (CSV, unofficial API)
- **TeamSnap** → Team roster sync (public API available)
- **LeagueApps** → Registration/schedule data (API available)
- **Social media** → Share highlights to Instagram, TikTok, YouTube, X
- **Payment processors** → Stripe, Square
- **Calendar** → Google Calendar, Apple Calendar (schedule sync)
- **Cloud storage** → Video storage (AWS S3 / Cloudflare R2)

### Priority Integration Roadmap
1. **GameChanger CSV import** — Launch feature
2. **Social media sharing** — Launch feature
3. **TeamSnap roster sync** — Month 2-3
4. **LeagueApps data pull** — Month 3-4
5. **Calendar sync** — Month 2
6. **Hudl video import** — Month 4-6 (for users migrating away)

---

## Key Recommendations for Adam

1. **Don't try to replace GameChanger or TeamSnap.** Complement them. Be the layer on top that turns raw stats and phone video into athlete profiles and highlights.

2. **Start with baseball/softball.** It's where GameChanger is dominant, where the most stat data exists, and where parents are most engaged with tracking. Expand to other sports after proving the model.

3. **The affordable highlight reel is your wedge.** Hudl priced out youth. Every travel ball parent wants a highlight reel for their kid. Make it dead simple and cheap.

4. **Flag football is your blue ocean.** No one owns this space. 2028 Olympics will drive massive participation growth. Build the definitive flag football platform.

5. **GameChanger integration is table stakes, not the product.** Import stats to create value on top of them — don't try to be a stat tracker. Be the place stats go to become something useful.

6. **Mobile-first, always.** Parents are in the bleachers, not at desks. Every feature should work on a phone first.

---

*This document should be updated quarterly as the competitive landscape evolves. Next review: May 2026.*
