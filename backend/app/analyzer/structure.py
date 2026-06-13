"""Detects structural and tone problems in a piece of text.

Checks: passive voice patterns, whether numbered steps are present, ALL CAPS and
fear-vocabulary that alarm rather than guide, reassurance signals, and sentences
over 22 words. Results feed directly into the step_clarity and inclusivity scores.
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import List

from .text_utils import split_sentences, words, is_all_caps

_BE_FORMS = r"(?:is|are|was|were|be|been being|been|being)"
# "to be" + word ending in -ed/-en within 2 words, e.g. "is deprecated", "has been changed"
_PASSIVE_RE = re.compile(
    r"\b(?:is|are|was|were|be|been|being)\b(?:\s+\w+){0,2}\s+\b\w+(?:ed|en)\b",
    re.IGNORECASE,
)

# numbered or bulleted step lines
_STEP_LINE_RE = re.compile(r"^\s*(?:\d+[.)]|[-*•]|step\s+\d+)", re.IGNORECASE | re.MULTILINE)

# 3+ of these in a single text triggers the "Fear-inducing tone" issue
_FEAR_WORDS = {
    "alert", "warning", "danger", "immediately", "urgent", "critical",
    "attack", "attacks", "compromised", "breach", "threat", "victim",
    "malicious", "suspicious", "unauthorized", "vulnerability", "exploit",
}

# any match here means the text has a reassurance signal; absence costs points in inclusivity
_REASSURANCE_RE = re.compile(
    r"\b(?:we will help|your account is safe|no (?:further )?action needed|"
    r"don't worry|do not worry|we('| a)re here|you are safe|we have not|"
    r"contact (?:our )?support|we will (?:guide|email|let you know|investigate))\b",
    re.IGNORECASE,
)

# sentences that start with (or have in position 2) one of these are counted as action sentences
# 2+ action sentences with no numbered list triggers the "Missing step-by-step structure" issue
_ACTION_VERBS = {
    "open", "tap", "click", "select", "choose", "enter", "type", "scan",
    "download", "go", "navigate", "save", "store", "contact", "report",
    "verify", "confirm", "check", "do", "press", "find", "visit", "call",
}

LONG_SENTENCE_WORDS = 22  # threshold for flagging a sentence; each one over this costs -7 step_clarity and -4 inclusivity


@dataclass
class StructureStats:
    has_steps: bool
    step_count: int
    action_sentence_count: int
    passive_sentences: List[str] = field(default_factory=list)
    long_sentences: List[str] = field(default_factory=list)
    shouting_tokens: List[str] = field(default_factory=list)
    fear_words: List[str] = field(default_factory=list)
    has_reassurance: bool = False


def _is_action_sentence(sentence: str) -> bool:
    toks = words(sentence)
    if not toks:
        return False
    # imperative usually starts with the verb, but allow a leading step number
    first = toks[0].lower()
    return first in _ACTION_VERBS or any(t.lower() in _ACTION_VERBS for t in toks[:2])


def analyze_structure(text: str) -> StructureStats:
    sentences = split_sentences(text)
    step_matches = _STEP_LINE_RE.findall(text or "")

    passive = [s for s in sentences if _PASSIVE_RE.search(s)]

    long_sents = [s for s in sentences if len(words(s)) > LONG_SENTENCE_WORDS]

    shouting = []
    for tok in re.findall(r"[A-Za-z]{3,}", text or ""):
        if is_all_caps(tok):
            shouting.append(tok)

    fear = []
    lowered = (text or "").lower()
    for fw in _FEAR_WORDS:
        if re.search(r"\b" + re.escape(fw) + r"\b", lowered):
            fear.append(fw)

    action_count = sum(1 for s in sentences if _is_action_sentence(s))

    return StructureStats(
        has_steps=len(step_matches) >= 2,
        step_count=len(step_matches),
        action_sentence_count=action_count,
        passive_sentences=passive,
        long_sentences=long_sents,
        shouting_tokens=sorted(set(shouting)),
        fear_words=sorted(set(fear)),
        has_reassurance=bool(_REASSURANCE_RE.search(text or "")),
    )
