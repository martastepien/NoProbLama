"""NoProbLama FastAPI app.

Endpoints:
  POST /api/analyze          run the engine on submitted text, store and return the review
  GET  /api/reviews          list all stored reviews, newest first
  GET  /api/reviews/{id}     fetch one review by id
  GET  /api/guidelines       return the plain-language writing guidelines
  GET  /api/insights         aggregate stats across all reviews (avg score, top terms, persona impact)
"""
from __future__ import annotations

from collections import Counter
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .storage import store
from .guidelines import GUIDELINES
from .analyzer.personas import PERSONAS
from .analyzer.ai import ai_available, ai_rewrite, AIError

app = FastAPI(title="NoProbLama API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # dev only; tighten for production
    allow_methods=["*"],
    allow_headers=["*"],
)


class AnalyzeRequest(BaseModel):
    text: str
    title: Optional[str] = ""
    team: Optional[str] = ""


# persona issue strings that start with these are positive feedback, not real problems;
# /insights filters them out when counting issues per persona
_POSITIVE_PREFIXES = (
    "Clear", "Structure", "Short", "Numbered steps help",
)


@app.get("/api/health")
def health():
    return {"status": "ok", "reviews": len(store.list())}


@app.post("/api/analyze")
def analyze_endpoint(req: AnalyzeRequest):
    if not req.text or not req.text.strip():
        raise HTTPException(status_code=400, detail="Text is required.")
    return store.create(req.text, title=req.title or "", team=req.team or "")


@app.get("/api/reviews")
def list_reviews():
    return store.list()


@app.get("/api/reviews/{review_id}")
def get_review(review_id: str):
    review = store.get(review_id)
    if not review:
        raise HTTPException(status_code=404, detail="Review not found.")
    return review


@app.get("/api/guidelines")
def get_guidelines():
    return GUIDELINES


@app.get("/api/ai-status")
def ai_status():
    """Lets the frontend show or hide the AI rewrite button."""
    return {"available": ai_available()}


@app.post("/api/reviews/{review_id}/ai-rewrite")
def ai_rewrite_endpoint(review_id: str):
    """Produce a high-quality plain-language rewrite with the LLM, on demand.

    The rule-based rewrite is always available on the review itself; this is an
    optional, explicitly-requested upgrade.
    """
    review = store.get(review_id)
    if not review:
        raise HTTPException(status_code=404, detail="Review not found.")
    try:
        result = ai_rewrite(review["originalText"], issues=review.get("issues"))
    except AIError as e:
        # 503: feature unavailable / failed. Frontend falls back to rule-based.
        raise HTTPException(status_code=503, detail=str(e))
    return result


@app.get("/api/insights")
def get_insights():
    reviews = store.list()
    if not reviews:
        return {
            "totalReviews": 0,
            "avgScore": 0,
            "riskCounts": {"high": 0, "medium": 0, "low": 0},
            "avgBreakdown": [],
            "topFlaggedTerms": [],
            "topIssueTypes": [],
            "personaImpact": [],
        }

    risk_counts = Counter(r["risk"] for r in reviews)
    avg_score = round(sum(r["score"] for r in reviews) / len(reviews))

    # average each breakdown category across all reviews
    breakdown_totals: Counter = Counter()
    breakdown_n: Counter = Counter()
    for r in reviews:
        for b in r["scoreBreakdown"]:
            breakdown_totals[b["label"]] += b["val"]
            breakdown_n[b["label"]] += 1
    avg_breakdown = [
        {"label": k, "val": round(breakdown_totals[k] / breakdown_n[k])}
        for k in breakdown_totals
    ]

    term_counter: Counter = Counter()
    for r in reviews:
        for t in r["flaggedTerms"]:
            term_counter[t.lower()] += 1
    top_terms = [{"term": t, "count": c} for t, c in term_counter.most_common(8)]

    issue_counter: Counter = Counter()
    for r in reviews:
        for i in r["issues"]:
            issue_counter[i["type"]] += 1
    top_issues = [{"type": t, "count": c} for t, c in issue_counter.most_common(8)]

    # count real issues per persona, skip the positive feedback strings
    persona_impact = []
    for p in PERSONAS:
        total = 0
        for r in reviews:
            for issue in r["personaIssues"].get(p, []):
                if not issue.startswith(_POSITIVE_PREFIXES):
                    total += 1
        persona_impact.append({"persona": p, "issues": total})

    return {
        "totalReviews": len(reviews),
        "avgScore": avg_score,
        "riskCounts": {
            "high": risk_counts.get("high", 0),
            "medium": risk_counts.get("medium", 0),
            "low": risk_counts.get("low", 0),
        },
        "avgBreakdown": avg_breakdown,
        "topFlaggedTerms": top_terms,
        "topIssueTypes": top_issues,
        "personaImpact": persona_impact,
    }
