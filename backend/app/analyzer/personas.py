"""Generates per-persona issue lists from what the detectors found.

Non-technical: flags severity-3 jargon, missing numbered steps, and fear tone.
Older adult: flags known-confusing acronyms (MFA/TOTP/SSO etc), avg sentence length > 18 words, no human contact path.
Non-native English: flags passive voice, long sentences, and compound technical terms.
Each persona gets a positive note if no issues are found.
"""
from __future__ import annotations

from typing import Dict, List

from .jargon import JargonHit
from .readability import ReadabilityStats
from .structure import StructureStats

PERSONAS = ["Non-technical", "Older adult", "Non-native English"]


def build_persona_issues(
    jargon: List[JargonHit],
    structure: StructureStats,
    readability: ReadabilityStats,
) -> Dict[str, List[str]]:
    terms = [h.matched for h in jargon]
    heavy_terms = [h.matched for h in jargon if h.severity >= 3]
    distinct = sorted({t.lower() for t in terms})

    out: Dict[str, List[str]] = {p: [] for p in PERSONAS}

    # Non-technical reader
    nt = out["Non-technical"]
    if heavy_terms:
        nt.append(f"Does not know what {', '.join(sorted(set(heavy_terms))[:3])} mean")
    elif distinct:
        nt.append(f"Unexplained terms reduce understanding: {', '.join(distinct[:3])}")
    if not structure.has_steps and structure.action_sentence_count >= 2:
        nt.append("Actions are written as paragraphs instead of numbered steps")
    if structure.shouting_tokens or structure.fear_words:
        nt.append("Alarm-style wording creates confusion rather than a clear next step")
    if not nt:
        nt.append("Clear and easy to act on for a non-technical reader")

    # Older adult
    oa = out["Older adult"]
    acronyms = [t for t in distinct if len(t) <= 5 and t.upper() == t.upper() and any(c.isalpha() for c in t)]
    if any(h.term in {"mfa", "2fa", "totp", "sso", "oauth", "kyc", "sla"} for h in jargon):
        oa.append("Acronyms are unfamiliar and not spelled out")
    if readability.avg_sentence_length > 18:
        oa.append("Long sentences are tiring to follow")
    if not structure.has_reassurance:
        oa.append("No phone number or human contact option for live help")
    if structure.has_steps:
        oa.append("Numbered steps help, but each step could confirm success")
    if not oa:
        oa.append("Structure and tone are well suited to this reader")

    # Non-native English speaker
    nn = out["Non-native English"]
    if structure.passive_sentences:
        nn.append("Passive constructions reduce clarity")
    if structure.long_sentences:
        nn.append("Long sentences increase cognitive load")
    if heavy_terms:
        nn.append("Technical compound terms are hard to translate mentally")
    if not structure.has_steps and structure.action_sentence_count >= 2:
        nn.append("No numbered steps to anchor comprehension")
    if not nn:
        nn.append("Short, plain sentences make this accessible")

    return out
