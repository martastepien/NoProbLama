"""Runs all detectors on the input text and assembles the full review object.

Score is a weighted average of four components:
  readability (30%) + jargon-free (30%) + step clarity (20%) + inclusivity (20%)
Risk band: low >= 70, medium >= 50, high below that.
"""
from __future__ import annotations

import re
from datetime import datetime
from typing import Dict, List

from .jargon import find_jargon, unique_terms, JargonHit
from .readability import analyze_readability
from .structure import analyze_structure, StructureStats
from .personas import build_persona_issues
from .rewrite import rewrite
from .text_utils import split_sentences
from .criteria_engine import evaluate_criteria

# these acronyms get a dedicated "Assumes prior knowledge" issue on top of general jargon flagging
_ACRONYM_TERMS = {"mfa", "2fa", "totp", "sso", "oauth", "kyc", "sla", "otp", "vpn"}

_TAG_RULES = [
    (r"\bmfa\b|multi-factor", "MFA"),
    (r"\b2fa\b|two-factor", "2FA"),
    (r"\btotp\b|authenticator", "Authenticator"),
    (r"phishing|scam|spoof", "Phishing"),
    (r"password", "Password"),
    (r"reset", "Password reset"),
    (r"login|sign-?in", "Login"),
    (r"recovery|recover", "Recovery"),
    (r"onboard", "Onboarding"),
    (r"alert|notification|warning", "Alert"),
    (r"email", "Email"),
]


def _clamp(v: float, lo: float = 0.0, hi: float = 100.0) -> int:
    return int(round(max(lo, min(hi, v))))


def _weighted_jargon_per_100w(jargon: List[JargonHit], word_count: int) -> float:
    weighted = sum(h.severity for h in jargon)
    return (weighted / max(1, word_count)) * 100.0


def _make_tags(text: str, jargon: List[JargonHit]) -> List[str]:
    low = (text or "").lower()
    tags: List[str] = []
    for pattern, tag in _TAG_RULES:
        if re.search(pattern, low) and tag not in tags:
            tags.append(tag)
    return tags[:4]


def _excerpt(sentence: str, limit: int = 120) -> str:
    s = sentence.strip().replace("\n", " ")
    return s if len(s) <= limit else s[: limit - 1].rstrip() + "…"


def _build_issues(
    jargon: List[JargonHit],
    structure: StructureStats,
    text: str,
) -> List[Dict]:
    issues: List[Dict] = []
    heavy = [h for h in jargon if h.severity >= 3]
    acronyms = sorted({h.matched for h in jargon if h.term in _ACRONYM_TERMS})

    if jargon:
        sample = sorted({h.matched for h in (heavy or jargon)})[:3]
        issues.append({
            "type": "Unexplained jargon",
            "severity": "High" if heavy else "Medium",
            "excerpt": ", ".join(f'"{t}"' for t in sample),
            "recommendation": (
                f'Replace technical terms with plain language. For example, use '
                f'"{jargon[0].plain}" instead of "{jargon[0].matched}".'
            ),
        })

    if acronyms:
        issues.append({
            "type": "Assumes prior knowledge",
            "severity": "High",
            "excerpt": f"Assumes the reader knows what {', '.join(acronyms)} mean.",
            "recommendation": "Add a one-sentence definition the first time each term appears.",
        })

    if structure.action_sentence_count >= 2 and not structure.has_steps:
        issues.append({
            "type": "Missing step-by-step structure",
            "severity": "Medium",
            "excerpt": "Instructions are written as dense paragraphs rather than numbered steps.",
            "recommendation": "Break each action into a numbered list, one action per step.",
        })

    if structure.shouting_tokens or len(structure.fear_words) >= 3:
        ev = ", ".join(structure.shouting_tokens[:3]) or ", ".join(structure.fear_words[:3])
        issues.append({
            "type": "Fear-inducing tone",
            "severity": "High",
            "excerpt": f"Alarm wording ({ev}) creates panic, not clarity.",
            "recommendation": "Use calm, clear language. Lead with what to do, not what is wrong.",
        })

    if structure.passive_sentences:
        issues.append({
            "type": "Passive voice",
            "severity": "Medium",
            "excerpt": _excerpt(structure.passive_sentences[0]),
            "recommendation": "Use active voice and tell the reader directly what to do.",
        })

    if structure.long_sentences:
        issues.append({
            "type": "Sentences too long",
            "severity": "Low",
            "excerpt": _excerpt(structure.long_sentences[0]),
            "recommendation": "Split long sentences. Aim for one idea per sentence, under ~20 words.",
        })

    if not structure.has_reassurance:
        issues.append({
            "type": "No reassurance or fallback",
            "severity": "Low",
            "excerpt": "The message does not tell the reader they are safe or where to get help.",
            "recommendation": 'Add a calm closing line, e.g. "If you get stuck, contact support and we will help."',
        })

    return issues


def analyze(text: str, title: str = "", team: str = "") -> Dict:
    text = (text or "").strip()
    read = analyze_readability(text)
    jargon = find_jargon(text)
    structure = analyze_structure(text)
    personas = build_persona_issues(jargon, structure, read)

    # 24-criteria Accessibility/Utility scoring (Pass/Fail/Not-applicable).
    crit = evaluate_criteria(text, read, jargon, structure)
    score = crit["overall"]

    # Safety cap: a message that is genuinely unreadable for under-represented
    # readers should never land above High risk, even if it passes many Utility
    # checks. Triggers if the Accessibility pillar is weak, or there are several
    # heavy (severity-3) jargon terms a layperson won't know. Kept transparent
    # via cap_reason so the score drop is never mysterious.
    accessibility = next((p["val"] for p in crit["pillars"] if p["label"] == "Accessibility"), 100)
    heavy_terms = sorted({h.matched for h in jargon if h.severity >= 3})
    cap_reason = ""
    if score >= 50 and (accessibility < 60 or len(heavy_terms) >= 2):
        reasons = []
        if accessibility < 60:
            reasons.append(f"the Accessibility pillar scored {accessibility}")
        if len(heavy_terms) >= 2:
            reasons.append(f"{len(heavy_terms)} heavy jargon terms ({', '.join(heavy_terms[:3])})")
        cap_reason = (
            "Capped to High risk because " + " and ".join(reasons)
            + ". Under-represented readers likely cannot understand this message."
        )
        score = 49

    risk = "low" if score >= 70 else "medium" if score >= 50 else "high"

    # Detected issues = the criteria that FAILED, most severe first.
    sev_rank = {"High": 0, "Medium": 1, "Low": 2}
    failed = sorted(
        (r for r in crit["criteria"] if r["status"] == "fail"),
        key=lambda r: sev_rank.get(r["severity"], 3),
    )
    issues = [{
        "type": r["title"],
        "severity": r["severity"],
        "excerpt": r["evidence"],
        "recommendation": r["fix"],
        "pillar": r["pillar"],
        "branch": r["branch"],
    } for r in failed]

    applicable = [r for r in crit["criteria"] if r["status"] != "na"]
    passed = [r for r in applicable if r["status"] == "pass"]

    return {
        "title": title or _auto_title(text),
        "team": team or "Unassigned",
        "date": datetime.utcnow().strftime("%b %d, %Y"),
        "score": score,
        "risk": risk,
        "capped": bool(cap_reason),
        "capReason": cap_reason,
        "tags": _make_tags(text, jargon),
        "originalText": text,
        "suggestedRewrite": rewrite(text),
        "flaggedTerms": unique_terms(jargon),
        "keyTerms": _key_terms(jargon),
        # scoreBreakdown bars are the two pillars (kept generic for the frontend).
        "scoreBreakdown": [{"label": p["label"], "val": p["val"]} for p in crit["pillars"]],
        "pillars": crit["pillars"],
        "branches": crit["branches"],
        "criteria": crit["criteria"],
        "issues": issues,
        "personaIssues": personas,
        "metrics": {
            "fleschReadingEase": read.flesch_reading_ease,
            "fleschKincaidGrade": read.flesch_kincaid_grade,
            "wordCount": read.word_count,
            "sentenceCount": read.sentence_count,
            "avgSentenceLength": read.avg_sentence_length,
            "jargonCount": len(jargon),
            "passiveCount": len(structure.passive_sentences),
            "hasSteps": structure.has_steps,
            "criteriaPassed": len(passed),
            "criteriaApplicable": len(applicable),
        },
    }


def _key_terms(jargon: List[JargonHit]) -> List[Dict]:
    """One entry per distinct jargon term found, with its plain word and a
    reader-facing definition. Powers the "Key terms explained" panel."""
    seen = set()
    out: List[Dict] = []
    for h in jargon:
        if h.term in seen:
            continue
        seen.add(h.term)
        out.append({"term": h.matched, "plain": h.plain, "definition": h.definition})
    return out


def _auto_title(text: str) -> str:
    first = split_sentences(text)
    if not first:
        return "Untitled review"
    words_ = first[0].split()
    title = " ".join(words_[:6])
    return (title[:60] + "…") if len(title) > 60 else title
