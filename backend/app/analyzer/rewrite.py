"""Rule-based plain-language rewriter, no LLM.

Pipeline applied in order:
  1. swap jargon for plain replacements from the JARGON dict
  2. collapse duplicates created by swapping (e.g. "2FA/MFA" -> same phrase twice)
  3. title-case ALL-CAPS words and soften repeated exclamation marks
  4. sort sentences into intro / action steps / reassurance buckets
  5. rebuild as: intro (max 2 sentences) + numbered steps + reassuring close
"""
from __future__ import annotations

import re
from typing import List

from .jargon import _pattern, JARGON
from .structure import _ACTION_VERBS
from .text_utils import split_sentences, words


def _swap_jargon(text: str) -> str:
    def repl(m: re.Match) -> str:
        key = m.group(1).lower()
        plain = JARGON[key]["plain"]
        # match the capitalisation of the original token
        if m.group(1)[:1].isupper():
            return plain[:1].upper() + plain[1:]
        return plain
    return _pattern.sub(repl, text)


def _dedupe_phrases(text: str) -> str:
    """Remove duplicates left by jargon swapping, e.g. "A/A" or "A (A)" -> "A"."""
    text = re.sub(r"\b([\w ]+?)\s*/\s*\1\b", r"\1", text, flags=re.IGNORECASE)
    text = re.sub(r"\b([\w ]+?)\s*\(\s*\1\s*\)", r"\1", text, flags=re.IGNORECASE)
    return text


def _calm_shouting(text: str) -> str:
    def repl(m: re.Match) -> str:
        word = m.group(0)
        return word[:1].upper() + word[1:].lower()
    # title-case any run of 3+ uppercase letters (e.g. "ALERT" -> "Alert")
    text = re.sub(r"\b[A-Z]{3,}\b", repl, text)
    # multiple exclamation marks -> single period; lone ! -> period
    text = re.sub(r"!{2,}", ".", text)
    text = text.replace("!", ".")
    return text


def _is_action(sentence: str) -> bool:
    toks = words(sentence)
    if not toks:
        return False
    return toks[0].lower() in _ACTION_VERBS or any(
        t.lower() in _ACTION_VERBS for t in toks[:2]
    )


def _strip_step_prefix(sentence: str) -> str:
    return re.sub(r"^\s*(?:\d+[.)]|[-*•]|step\s+\d+[:.]?)\s*", "", sentence, flags=re.IGNORECASE).strip()


def rewrite(text: str) -> str:
    cleaned = _calm_shouting(_dedupe_phrases(_swap_jargon(text or "")))
    sentences = [_strip_step_prefix(s) for s in split_sentences(cleaned)]
    sentences = [s for s in sentences if s]

    intro: List[str] = []
    steps: List[str] = []
    closing: List[str] = []

    for s in sentences:
        if _is_action(s):
            steps.append(s.rstrip("."))
        elif re.search(r"\b(safe|no action|did not|didn'?t|help|contact|reassur)", s, re.IGNORECASE):
            closing.append(s)
        else:
            intro.append(s)

    parts: List[str] = []

    if intro:
        # lead with one or two plain sentences max
        parts.append(" ".join(intro[:2]))
    elif steps:
        parts.append("Here is what to do, one step at a time:")

    if steps:
        if intro:
            parts.append("\nHere is what to do:")
        numbered = "\n".join(f"{i}. {s}." for i, s in enumerate(steps, start=1))
        parts.append(numbered)

    if closing:
        parts.append("\n" + " ".join(closing[:2]))
    else:
        parts.append("\nIf anything looks wrong or you get stuck, contact our support team and we will help you.")

    result = "\n".join(p for p in parts if p).strip()
    # clean up any extra blank lines
    result = re.sub(r"\n{3,}", "\n\n", result)
    return result
