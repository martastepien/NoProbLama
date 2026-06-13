# NoProbLama

A tool for security and UX teams to check whether their security messages (MFA flows, login alerts, phishing warnings, password resets) are actually understandable — especially for non-technical users, older adults, and non-native English speakers.

Built for the Adyen "under-representation in cyber security" hackathon challenge.

---

## How it works

Paste any security message. The backend runs it through a rule-based engine and returns a score, flagged issues, a persona breakdown, and a plain-language rewrite. Everything is computed live — no hardcoded results.

**Score (0-100)** comes from **24 binary checks** in two equal pillars (`analyzer/criteria_engine.py`):
- **Accessibility (12 checks):** language simplicity, cognitive load, consistent terminology, motor/memory needs — can people read and understand it?
- **Utility (12 checks):** straightforward instructions, clear feedback, an obvious secure option, helpful error messages — can people act safely?

Each check returns **pass / fail / not-applicable**. Score = `passed ÷ applicable × 100`, so checks that don't apply to a message (e.g. an error message for a simple alert) are excluded and short, single-purpose messages aren't penalised for affordances they never needed (the same way WCAG conformance handles non-applicable criteria). The supporting detectors (Flesch readability, the jargon dictionary, passive-voice / step / tone detection) feed those checks.

**Risk band:** low (≥70) / medium (≥50) / high (<50)

**Persona issues** are generated separately for three reader profiles:
- Non-technical: severity-3 jargon, missing steps, fear tone
- Older adult: unfamiliar acronyms, avg sentence length >18 words, no human contact path
- Non-native English: passive voice, long sentences, compound technical terms

The jargon dictionary (`analyzer/jargon.py`) maps ~35 cybersecurity terms to plain replacements, definitions, and severity weights. It's designed to be extended with your own product vocabulary.

---

## Running it

Two terminals:

**Backend** (http://localhost:8000)
```bash
cd backend
pip install -r requirements.txt
python3 -m uvicorn app.main:app --reload --port 8000
```

**Frontend** (http://localhost:5173)
```bash
cd frontend
npm install
npm run dev
```

The frontend proxies `/api/*` to the backend via Vite config, so no env vars needed locally.

**Tests**
```bash
cd backend && python3 -m pytest -q
```

---

## Optional: AI rewrite

The rule-based engine handles all scoring and detection. You can also enable an on-demand AI rewrite via OpenAI (`gpt-4o-mini`) for a more natural result:

```bash
cp backend/.env.example backend/.env
# add your OPENAI_API_KEY to backend/.env
```

The AI rewrite button appears on each review once a key is set. If no key is present, the button is hidden and everything else works normally.

---

## API

| Method | Path | What it does |
|--------|------|--------------|
| POST | `/api/analyze` | Run the engine on `{text, title?, team?}`, store and return the review |
| GET | `/api/reviews` | All reviews, newest first |
| GET | `/api/reviews/{id}` | One review by id |
| GET | `/api/insights` | Aggregates across all reviews: avg score, top terms, persona impact |
| GET | `/api/guidelines` | The six plain-language writing guidelines |
| GET | `/api/health` | Health check |
