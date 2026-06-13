"""Optional AI rewrite layer (OpenAI).

This is a deliberate *enhancement*, not the core. The rule-based engine still does
all scoring and issue detection (deterministic, explainable, offline). The LLM is
used only for the one job it clearly does better - producing a natural, human-quality
plain-language rewrite - and only when the user explicitly asks for it.

Design choices:
  - Key is read from the environment / a local .env (never committed).
  - If no key is set, ai_available() is False and the API hides the feature.
  - Any failure raises AIError so the endpoint can fall back gracefully; the demo
    never breaks because of a missing key, network blip, or rate limit.
"""
from __future__ import annotations

import os
from typing import Dict, List, Optional

try:
    from dotenv import load_dotenv
    # Load backend/.env if present (looks up from this file's package root).
    load_dotenv()
except Exception:  # python-dotenv is optional
    pass

MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

_SYSTEM_PROMPT = """You are an accessibility editor for cybersecurity messages.
Rewrite the message so it is clear, calm, and easy to act on for three groups who
are often left behind: non-technical users, older adults, and people who read
English as a second language.

Rules:
- Define every security term in plain words the first time it appears.
- Use short sentences (aim for under 15 words).
- Put any actions into a numbered list, one action per step.
- Use active voice and lead with what to do, not what is wrong.
- Never use ALL CAPS, alarm words, or fear. Stay reassuring.
- Keep all factual details exactly (links, times, codes, names).
- End with one short reassuring line and where to get help.

Output ONLY the rewritten message. No preamble, no explanation, no markdown headers."""


class AIError(RuntimeError):
    """Raised when an AI rewrite cannot be produced."""


def ai_available() -> bool:
    return bool(os.getenv("OPENAI_API_KEY"))


def ai_rewrite(text: str, issues: Optional[List[Dict]] = None, timeout: float = 30.0) -> Dict:
    """Return {'rewrite': str, 'model': str}. Raises AIError on any problem."""
    if not text or not text.strip():
        raise AIError("No text to rewrite.")
    if not ai_available():
        raise AIError("AI is not configured. Set OPENAI_API_KEY to enable it.")

    try:
        from openai import OpenAI
    except ImportError as e:
        raise AIError("The 'openai' package is not installed. Run: pip install openai") from e

    # Steer the model with the issues the rule engine already found.
    hint = ""
    if issues:
        labels = "; ".join(f"{i['type']}" for i in issues[:6])
        hint = f"\n\nKnown problems detected by our analyzer to fix: {labels}."

    try:
        client = OpenAI(timeout=timeout)
        resp = client.chat.completions.create(
            model=MODEL,
            temperature=0.3,
            max_tokens=600,
            messages=[
                {"role": "system", "content": _SYSTEM_PROMPT},
                {"role": "user", "content": f"Rewrite this security message:\n\n{text}{hint}"},
            ],
        )
    except Exception as e:  # network, auth, rate limit, etc.
        raise AIError(f"AI request failed: {e}") from e

    content = (resp.choices[0].message.content or "").strip()
    if not content:
        raise AIError("AI returned an empty response.")
    return {"rewrite": content, "model": MODEL}
