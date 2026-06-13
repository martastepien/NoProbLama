"""Text utilities: sentence splitting, word tokenisation, syllable counting. Pure Python, no NLP deps."""
from __future__ import annotations

import re
from typing import List

# split on sentence-ending punctuation or newlines (so bullet/step lines count separately)
_SENTENCE_SPLIT = re.compile(r"(?<=[.!?])\s+|\n+")
_WORD_RE = re.compile(r"[A-Za-z][A-Za-z'\-]*")
_VOWEL_GROUPS = re.compile(r"[aeiouy]+")


def split_sentences(text: str) -> List[str]:
    """Split text into non-empty, stripped sentences."""
    parts = _SENTENCE_SPLIT.split(text or "")
    return [p.strip() for p in parts if p and p.strip()]


def words(text: str) -> List[str]:
    """Return the alphabetic word tokens in *text*."""
    return _WORD_RE.findall(text or "")


def count_syllables(word: str) -> int:
    """Rough syllable count: count vowel groups, drop a silent trailing e."""
    w = word.lower()
    if not w:
        return 0
    groups = _VOWEL_GROUPS.findall(w)
    count = len(groups)
    # trailing silent 'e' (e.g. "make") doesn't count, unless it's the only vowel
    if w.endswith("e") and count > 1 and not w.endswith(("le", "ye")):
        count -= 1
    return max(1, count)


def syllables_in(text: str) -> int:
    return sum(count_syllables(w) for w in words(text))


def is_all_caps(token: str) -> bool:
    """True for all-caps tokens like 'ALERT' (3+ letters)."""
    letters = [c for c in token if c.isalpha()]
    return len(letters) >= 3 and all(c.isupper() for c in letters)
