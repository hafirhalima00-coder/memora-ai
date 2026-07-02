# Memora AI

A **trust-aware AI memory system** that stores memories with **confidence scores** instead of assuming every remembered fact is always correct.

```
┌─────────────────────────────────────────────────────┐
│                   Memora AI                          │
│          Trust-Aware Memory System                   │
│    ┌────────────────────────────────────────┐        │
│    │  Confidence  ←  Conflict Detection     │        │
│    │    Engine          & Resolution         │        │
│    │       ↕                ↕                │        │
│    │  Verification  ←  Memory Timeline      │        │
│    │    Center           & Graph             │        │
│    └────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────┘
```

## Features

### 1. **Memory Dashboard**
- Total, trusted, unverified, expired, and conflicting memory counts
- Average confidence score
- Recent memories and upcoming expirations
- Quick actions to create new memories

### 2. **Memory Cards**
- Rich card UI with category color coding
- Confidence progress bars
- Verification status badges
- Source attribution and timestamps
- Tag support

### 3. **Confidence Engine**
- **Multi-factor scoring**: source reliability, confirmation count, contradiction penalty, age decay
- **Formula**: `confidence = baseScore + confirmationBonus - contradictionPenalty - ageDecay`
- **Base score**: starts at 0.3× source reliability multiplier
- **Confirmation bonus**: +0.15 per confirmation (max +0.6)
- **Contradiction penalty**: -0.2 per contradiction
- **Age decay**: -0.002/day after 90 days
- Scores clamped to [0, 1]

### 4. **Conflict Detection**
- Detects contradictions in location, identity, and factual categories
- Creates explicit conflict records instead of overwriting
- Supports resolution: keep A, keep B, merge, or reject both
- Automatically adjusts confidence for conflicting memories

### 5. **Verification Center**
- Queue of unverified and conflicting memories
- One-click confirm/reject actions
- Manual confidence increase
- Full verification history per memory

### 6. **Memory Timeline**
- Chronological visualization of all memory events
- Filterable by event type (created, confirmed, rejected, expired, etc.)
- Rich icons and color coding per event type

### 7. **Memory Graph**
- Interactive SVG-based relationship visualization
- Pan, zoom, and reset controls
- Nodes sized by confidence, colored by category
- Edge types: contradicts (red), supports (green), related (purple)
- Hover tooltips with memory details

### 8. **Explainability**
- Every memory includes: why it exists, where it came from, confidence calculation breakdown, and full verification history
- Transparency in every confidence score

### 9. **Analytics**
- Confidence distribution chart
- Expiring memories timeline
- Verification trends
- Category and source distribution

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Next.js 16 App Router                │
├─────────────────────────────────────────────────────────┤
│                    Client Layer                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────┐  │
│  │Dashboard │ │Memories  │ │Conflicts │ │Verification│  │
│  │  Page    │ │  Page    │ │  Page    │ │   Page    │  │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └─────┬─────┘  │
│       │            │            │              │        │
│  ┌────▼────────────▼────────────▼──────────────▼────┐   │
│  │               API Client (api-client.ts)          │   │
│  │          fetch() → /api/* endpoints               │   │
│  └──────────────────────┬───────────────────────────┘   │
├──────────────────────────┼──────────────────────────────┤
│                    API Layer (Server)                    │
│  ┌───────┐ ┌──────────┐ ┌──────┐ ┌──────────────────┐  │
│  │/api/  │ │/api/     │ │/api/ │ │/api/             │  │
│  │memories│ │dashboard │ │graph │ │verification      │  │
│  └───┬───┘ └────┬─────┘ └──┬───┘ └────────┬─────────┘  │
│      └──────────┼──────────┼───────────────┘            │
├─────────────────┼──────────┼────────────────────────────┤
│           Service Layer                                 │
│  ┌────────────┐ ┌──────────────┐ ┌──────────────────┐  │
│  │MemoryService│ │ConfidenceEng.│ │ConflictDetector  │  │
│  └─────┬──────┘ └──────┬───────┘ └────────┬─────────┘  │
│        │               │                   │            │
│  ┌─────▼───────────────▼───────────────────▼────────┐   │
│  │           SQLite Database (better-sqlite3)        │   │
│  │  memories │ sources │ memory_conflicts │          │   │
│  │  verification_events                              │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## Getting Started

### Prerequisites

- **Node.js** 20+ 
- **npm** 10+

### Installation

```bash
# Clone the repository
git clone https://github.com/hafirhalima00-coder/memora-ai.git
cd memora-ai

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
npm start
```

### Docker

```bash
# Build and run with Docker Compose
docker compose up --build
```

## Running Tests

```bash
npm test
```

## Docker Support

```bash
# Build the image
docker build -t memora-ai .

# Run with Docker Compose
docker compose up -d
```

The Docker setup includes:
- Multi-stage build for smaller image size
- Non-root user for security
- Persistent SQLite data volume
- Health checks

## GitHub Actions CI

The CI pipeline (`./.github/workflows/ci.yml`) runs on every push and PR:

1. **Lint** - ESLint checks
2. **Build** - Next.js production build
3. **Test** - Vitest test suite

## Database Schema

```sql
-- Sources of memory data
CREATE TABLE sources (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  reliability TEXT CHECK(reliability IN ('high','medium','low','unknown')),
  type TEXT CHECK(type IN ('user_input','ai_inference','observation','import','api'))
);

-- Core memory store
CREATE TABLE memories (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  value TEXT NOT NULL,
  category TEXT CHECK(category IN ('preference','fact','habit','goal','opinion','relationship','location','event','identity','knowledge')),
  confidence REAL DEFAULT 0.5,
  source_id TEXT REFERENCES sources(id),
  verification_status TEXT CHECK(status IN ('verified','unverified','conflicting','expired','rejected')),
  confirmation_count INTEGER DEFAULT 0,
  contradiction_count INTEGER DEFAULT 0,
  tags TEXT DEFAULT '[]',
  explanation TEXT DEFAULT '',
  created_at TEXT,
  updated_at TEXT,
  last_verified_at TEXT,
  expires_at TEXT
);

-- Detected conflicts
CREATE TABLE memory_conflicts (
  id TEXT PRIMARY KEY,
  memory_id_a TEXT REFERENCES memories(id),
  memory_id_b TEXT REFERENCES memories(id),
  value_a TEXT, value_b TEXT,
  category TEXT,
  detected_at TEXT,
  resolved_at TEXT,
  resolution TEXT CHECK(resolution IN ('keep_a','keep_b','merge','reject_both')),
  explanation TEXT DEFAULT ''
);

-- Audit log
CREATE TABLE verification_events (
  id TEXT PRIMARY KEY,
  memory_id TEXT REFERENCES memories(id),
  action TEXT CHECK(action IN ('confirm','reject','edit','increase_confidence','decrease_confidence')),
  user_id TEXT,
  previous_confidence REAL,
  new_confidence REAL,
  note TEXT DEFAULT '',
  created_at TEXT
);
```

## How the Confidence Engine Works

```
                          ┌─────────────────────┐
                          │ Source Reliability   │
                          │  high:  ×1.0        │
                          │  medium: ×0.7       │
                          │  low:   ×0.4        │
                          │  unknown: ×0.3      │
                          └──────────┬──────────┘
                                     ↓
                          ┌─────────────────────┐
                          │ Base Score          │
                          │ 0.3 × multiplier    │
                          └──────────┬──────────┘
                                     ↓
┌─────────────────┐     ┌─────────────────────┐
│ Confirmation    │────→│    CONFIDENCE       │
│ Bonus: +0.15/ea │     │    = 0.0 - 1.0     │
│ Max: +0.6       │     │                     │
└─────────────────┘     └──────────┬──────────┘
                                     ↑
┌─────────────────┐     ┌─────────────────────┐
│ Contradiction   │────→│ Final Check         │
│ Penalty: -0.2/ea│     │ Clamp to [0, 1]     │
└─────────────────┘     └─────────────────────┘

┌─────────────────┐
│ Age Decay       │
│ -0.002/day after │
│ 90 days         │
└─────────────────┘
```

## Confidence Levels

| Level | Range | Color |
|-------|-------|-------|
| Very High | 90-100% | Emerald |
| High | 70-89% | Green |
| Medium | 50-69% | Yellow |
| Low | 30-49% | Orange |
| Very Low | 0-29% | Red |

## Tech Stack

| Technology | Purpose |
|------------|---------|
| **Next.js 16** | React framework (App Router) |
| **TypeScript** | Type safety |
| **Tailwind CSS v4** | Styling |
| **shadcn/ui** | Component primitives |
| **better-sqlite3** | SQLite database |
| **Lucide React** | Icons |
| **Vitest** | Unit testing |
| **Docker** | Containerization |

## Vercel Deployment

For Vercel deployment, replace `better-sqlite3` with **Turso** (serverless SQLite) or use **Neon** (serverless Postgres):

```bash
npm uninstall better-sqlite3 @types/better-sqlite3
npm install @libsql/client
```

Update the database connection layer to use the libsql client, and set `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` environment variables in Vercel.

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes (server-side)
│   ├── analytics/         # Analytics page
│   ├── conflicts/         # Conflict detection page
│   ├── graph/            # Memory graph page
│   ├── memories/         # Memory CRUD pages
│   ├── timeline/         # Timeline page
│   └── verification/     # Verification center
├── components/
│   ├── ui/               # shadcn-style primitives
│   ├── layout/           # Sidebar, theme toggle
│   ├── memory/           # Memory card
│   ├── confidence/       # Confidence badge
│   ├── conflict/         # Conflict card
│   ├── verification/     # Verification panel
│   ├── timeline/         # Timeline visualization
│   ├── graph/            # SVG graph visualization
│   ├── dashboard/        # Stats cards
│   └── analytics/        # Charts
├── lib/
│   ├── types/            # TypeScript types
│   ├── db/               # SQLite connection & schema
│   ├── services/         # Business logic services
│   ├── utils/            # Utility functions
│   └── api-client.ts     # Client-side API wrapper
```

## License

MIT

---

> **built by Halima Hafir**
