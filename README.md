# NoProbLama

**Make security understandable.** A tool for teams who write security communications
(MFA flows, login alerts, phishing warnings, password resets) so those messages are
understandable and accessible for everyone — especially under-represented readers:
non-technical users, older adults, and non-native English speakers.

Built for the Adyen "under-representation in cyber security" challenge. The product is an
*expert system that reviews security copy* and flags representation gaps, jargon, and
accessibility barriers, then suggests a plain-language rewrite.

---

## What's real (not hard-coded)

Every score, issue, rewrite and persona analysis is **computed at request time** by a
rule-based engine. Paste any security message and the backend analyses it live. The
six seed reviews on the dashboard are not canned data — they are produced by running the
same engine over sample input messages at startup (`backend/app/samples.py`).

The engine is deterministic, offline, and needs no API key, which makes it demo-proof and
explainable: a team can always see *why* a message scored the way it did.

### How the analysis works

| Module | What it does |
| --- | --- |
| `analyzer/readability.py` | Flesch Reading Ease + Flesch-Kincaid grade (sentence/word/syllable stats) |
| `analyzer/jargon.py` | Cybersecurity jargon dictionary → plain-language swaps, definitions, severity. Editable by teams. |
| `analyzer/structure.py` | Passive voice, numbered-step detection, ALL-CAPS/fear tone, long sentences, reassurance |
| `analyzer/personas.py` | Generates concrete issues per persona (Non-technical / Older adult / Non-native English) |
| `analyzer/rewrite.py` | Deterministic plain-language rewriter: swaps jargon, calms shouting, builds numbered steps |
| `analyzer/engine.py` | Combines the above into a 0–100 score (Readability, Jargon-free, Step clarity, Inclusivity), risk level, issues, tags |

Scoring weights: `0.30 readability + 0.30 jargon-free + 0.20 step clarity + 0.20 inclusivity`.
Risk: `≥70 good · 50–69 moderate · <50 high`.

---

## Architecture

```
NoProbLama/
├── backend/                 FastAPI + rule-based engine (Python, no API key)
│   ├── app/
│   │   ├── analyzer/        the analysis engine (see table above)
│   │   ├── main.py          REST API
│   │   ├── storage.py       in-memory review store (seeded via the real engine)
│   │   ├── samples.py       raw sample messages (input only)
│   │   └── guidelines.py    pattern / anti-pattern library
│   ├── tests/test_engine.py 7 passing tests
│   └── requirements.txt
└── frontend/                React 19 + Vite + Tailwind v4 (Figma design)
    └── src/
        ├── components/       Dashboard / Reviews / Review / Insights / Guidelines / NavBar
        └── services/api.js   single client for the backend
```

### API

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/api/analyze` | Analyse `{text, title?, team?}` → full review, stored |
| GET | `/api/reviews` | All reviews (newest first) |
| GET | `/api/reviews/{id}` | One review |
| GET | `/api/insights` | Aggregates: avg score, risk counts, top issues, persona impact |
| GET | `/api/guidelines` | Writing pattern / anti-pattern library |
| GET | `/api/health` | Health check |

---

## Run it

Two terminals.

**1. Backend** (http://localhost:8000)

```bash
cd backend
pip install -r requirements.txt
python3 -m uvicorn app.main:app --reload --port 8000
# or: ./run.sh
```

**2. Frontend** (http://localhost:5173)

```bash
cd frontend
npm install
npm run dev
```

The frontend proxies `/api/*` to the backend automatically (see `vite.config.js`), so no
env vars are needed in development. For a separately hosted backend, set `VITE_API_BASE`.

**Tests**

```bash
cd backend && python3 -m pytest -q
```

---

## Try it

Open the app, click **New Review**, and paste something like:

> SECURITY ALERT: Threat actors use spoofed addresses to conduct credential harvesting.
> Complete TOTP enrollment via your authenticator app.

You'll get a live score (~35, high risk), flagged jargon, persona-specific barriers, and a
calmer plain-language rewrite.

## Path to production

The store is a swappable in-memory class — replace with Postgres without touching the
engine or UI. The jargon dictionary and guidelines are data, so teams extend them without
code changes. The engine could later expose an optional LLM rewrite behind the same
interface, and the same rules can run as a CI lint check on security copy before publish.
