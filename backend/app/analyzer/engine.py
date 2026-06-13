"""Main analysis engine. Takes raw text and returns a scored, persona-aware review."""
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

# acronyms that tend to confuse non-expert readers
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

    word_count = read.word_count
    wj = _weighted_jargon_per_100w(jargon, word_count)

    # component scores (0-100)
    readability_score = _clamp(read.flesch_reading_ease)

    jargon_free = _clamp(100 - min(85, wj * 4.0))

    step = 50.0
    if structure.has_steps:
        step += 32
    if structure.action_sentence_count >= 2 and not structure.has_steps:
        step -= 22
    step -= min(20, len(structure.long_sentences) * 7)
    step -= min(15, len(structure.passive_sentences) * 5)
    if structure.action_sentence_count == 0:
        step += 10  # probably not instructional, so don't dock points for missing steps
    step_clarity = _clamp(step)

    incl = 90.0
    incl -= min(35, wj * 2.0)
    if (structure.shouting_tokens or len(structure.fear_words) >= 3) and not structure.has_reassurance:
        incl -= 12
    if structure.action_sentence_count >= 2 and not structure.has_steps:
        incl -= 10
    incl += 8 if structure.has_reassurance else 0
    incl -= min(10, len(structure.long_sentences) * 4)
    inclusivity = _clamp(incl, 10, 100)

    score = _clamp(
        0.30 * readability_score
        + 0.30 * jargon_free
        + 0.20 * step_clarity
        + 0.20 * inclusivity
    )

    risk = "low" if score >= 70 else "medium" if score >= 50 else "high"

    issues = _build_issues(jargon, structure, text)

    return {
        "title": title or _auto_title(text),
        "team": team or "Unassigned",
        "date": datetime.utcnow().strftime("%b %d, %Y"),
        "score": score,
        "risk": risk,
        "tags": _make_tags(text, jargon),
        "originalText": text,
        "suggestedRewrite": rewrite(text),
        "flaggedTerms": unique_terms(jargon),
        "scoreBreakdown": [
            {"label": "Readability", "val": readability_score},
            {"label": "Jargon-free", "val": jargon_free},
            {"label": "Step clarity", "val": step_clarity},
            {"label": "Inclusivity", "val": inclusivity},
        ],
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
        },
    }


def _auto_title(text: str) -> str:
    first = split_sentences(text)
    if not first:
        return "Untitled review"
    words_ = first[0].split()
    title = " ".join(words_[:6])
    return (title[:60] + "…") if len(title) > 60 else title
