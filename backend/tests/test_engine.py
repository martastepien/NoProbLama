"""Basic tests for the engine and API. Run with: cd backend && python3 -m pytest -q"""
from fastapi.testclient import TestClient

from app.analyzer import analyze
from app.analyzer.readability import analyze_readability
from app.analyzer.jargon import find_jargon
from app.main import app

JARGON_HEAVY = (
    "SECURITY ALERT: Threat actors use spoofed addresses to conduct "
    "credential harvesting. Complete TOTP enrollment via your authenticator app."
)
PLAIN = (
    "We noticed a new sign-in from a new device. Was this you? "
    "If not, tap Secure my account and we will help you."
)


def test_readability_ranks_plain_above_jargon():
    assert analyze_readability(PLAIN).flesch_reading_ease > analyze_readability(JARGON_HEAVY).flesch_reading_ease


def test_jargon_detected_and_replaced():
    hits = find_jargon(JARGON_HEAVY)
    terms = {h.term for h in hits}
    assert "totp" in terms and "spoofed" in terms and "credential harvesting" in terms
    assert all(h.plain for h in hits)


def test_score_orders_by_accessibility():
    bad = analyze(JARGON_HEAVY)
    good = analyze(PLAIN)
    assert good["score"] > bad["score"]
    assert bad["risk"] == "high"
    assert good["risk"] in ("low", "medium")


def test_rewrite_removes_shouting_and_jargon():
    out = analyze(JARGON_HEAVY)["suggestedRewrite"]
    assert "SECURITY ALERT" not in out
    assert "TOTP" not in out
    assert "credential harvesting" not in out


def test_review_shape_is_complete():
    r = analyze(JARGON_HEAVY, title="X", team="Sec")
    for key in ("score", "risk", "scoreBreakdown", "issues", "personaIssues",
                "flaggedTerms", "suggestedRewrite", "tags", "metrics"):
        assert key in r
    assert len(r["scoreBreakdown"]) == 4
    assert set(r["personaIssues"]) == {"Non-technical", "Older adult", "Non-native English"}


def test_empty_text_is_safe():
    r = analyze("")
    assert r["score"] >= 0


def test_api_flow():
    c = TestClient(app)
    assert c.get("/api/health").json()["status"] == "ok"
    assert len(c.get("/api/reviews").json()) >= 6
    created = c.post("/api/analyze", json={"text": JARGON_HEAVY, "title": "T"}).json()
    assert created["id"]
    assert c.get(f"/api/reviews/{created['id']}").json()["title"] == "T"
    assert c.post("/api/analyze", json={"text": "  "}).status_code == 400
    assert c.get("/api/reviews/99999").status_code == 404
    ins = c.get("/api/insights").json()
    assert ins["totalReviews"] >= 6 and len(ins["avgBreakdown"]) == 4
