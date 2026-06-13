"""Cybersecurity jargon dictionary and detector.

Each entry has a plain-language replacement, a short definition, and a severity
score (1-3). Multi-word terms are matched longest-first so "authenticator app"
beats "authenticator". Easy to extend with your own product vocabulary.
"""
from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Dict, List

# term -> plain replacement, definition, severity (1-3)
JARGON: Dict[str, Dict] = {
    "totp": {
        "plain": "one-time code",
        "definition": "A 6-digit code that changes every 30 seconds, created by an app on your phone.",
        "severity": 3,
    },
    "mfa": {
        "plain": "a second login step",
        "definition": "Multi-factor authentication: a second check (like a code from your phone) on top of your password.",
        "severity": 3,
    },
    "2fa": {
        "plain": "a second login step",
        "definition": "Two-factor authentication: proving it is you in two ways, usually a password plus a code.",
        "severity": 2,
    },
    "authenticator app": {
        "plain": "a code-generating app",
        "definition": "A free phone app (like Google Authenticator) that creates login codes for you.",
        "severity": 2,
    },
    "authenticator": {
        "plain": "code app",
        "definition": "An app that creates login codes for you.",
        "severity": 2,
    },
    "qr code": {
        "plain": "square barcode",
        "definition": "A square pattern you point your phone camera at to scan.",
        "severity": 1,
    },
    "sim-swapping": {
        "plain": "phone-number theft",
        "definition": "A scam where someone takes over your phone number to intercept your codes.",
        "severity": 3,
    },
    "sim swapping": {
        "plain": "phone-number theft",
        "definition": "A scam where someone takes over your phone number to intercept your codes.",
        "severity": 3,
    },
    "recovery codes": {
        "plain": "backup codes",
        "definition": "One-time backup codes that let you log in if you lose your phone.",
        "severity": 1,
    },
    "backup codes": {
        "plain": "backup codes",
        "definition": "One-time codes that let you log in if you lose your phone. Keep them somewhere safe.",
        "severity": 1,
    },
    "deprecated": {
        "plain": "no longer used",
        "definition": "Something that has been retired and replaced by a newer option.",
        "severity": 2,
    },
    "phishing": {
        "plain": "scam message",
        "definition": "A fake message that tries to trick you into giving away passwords or money.",
        "severity": 2,
    },
    "spoofed": {
        "plain": "faked",
        "definition": "Made to look like it came from someone you trust, but it did not.",
        "severity": 3,
    },
    "spoofing": {
        "plain": "faking the sender",
        "definition": "Making a message look like it came from someone you trust.",
        "severity": 3,
    },
    "malicious payload": {
        "plain": "harmful file",
        "definition": "A file or link designed to harm your device or steal your information.",
        "severity": 3,
    },
    "credential harvesting": {
        "plain": "stealing your login details",
        "definition": "Tricking you into typing your username and password so they can be stolen.",
        "severity": 3,
    },
    "credentials": {
        "plain": "login details",
        "definition": "Your username and password.",
        "severity": 1,
    },
    "threat actor": {
        "plain": "attacker",
        "definition": "A person or group trying to break into accounts or systems.",
        "severity": 2,
    },
    "threat actors": {
        "plain": "attackers",
        "definition": "People or groups trying to break into accounts or systems.",
        "severity": 2,
    },
    "token": {
        "plain": "secure code",
        "definition": "A secret code the system uses to confirm a request is genuine.",
        "severity": 2,
    },
    "session": {
        "plain": "sign-in",
        "definition": "The period you stay logged in after signing in.",
        "severity": 1,
    },
    "session invalidation": {
        "plain": "signing you out everywhere",
        "definition": "Ending all of your active sign-ins so a new login is required.",
        "severity": 3,
    },
    "kyc": {
        "plain": "identity check",
        "definition": "'Know Your Customer': confirming who you are, usually with a photo ID.",
        "severity": 3,
    },
    "identity verification": {
        "plain": "identity check",
        "definition": "Confirming who you are, usually with a photo ID.",
        "severity": 1,
    },
    "oauth": {
        "plain": "sign in with another account",
        "definition": "A way to log in using an account you already have, like Google or Microsoft.",
        "severity": 3,
    },
    "sso": {
        "plain": "single company login",
        "definition": "'Single sign-on': one login your workplace uses for many tools.",
        "severity": 3,
    },
    "sso token": {
        "plain": "workplace login code",
        "definition": "A secure code from your workplace's single login system.",
        "severity": 3,
    },
    "identity provider": {
        "plain": "login provider",
        "definition": "The service that manages your login, like Google or Microsoft.",
        "severity": 2,
    },
    "sla": {
        "plain": "response time",
        "definition": "'Service level agreement': how long something is expected to take.",
        "severity": 2,
    },
    "encryption": {
        "plain": "scrambling for safety",
        "definition": "Scrambling information so only the right person can read it.",
        "severity": 1,
    },
    "end-to-end encryption": {
        "plain": "private scrambling",
        "definition": "Only you and the person you are messaging can read the contents.",
        "severity": 2,
    },
    "vpn": {
        "plain": "private connection",
        "definition": "A tool that creates a private, protected internet connection.",
        "severity": 2,
    },
    "malware": {
        "plain": "harmful software",
        "definition": "Software designed to damage your device or steal information.",
        "severity": 1,
    },
    "ransomware": {
        "plain": "lock-and-ransom software",
        "definition": "Harmful software that locks your files until you pay.",
        "severity": 2,
    },
    "two-factor authentication": {
        "plain": "a second login step",
        "definition": "Proving it is you in two ways, usually a password plus a code.",
        "severity": 1,
    },
    "multi-factor authentication": {
        "plain": "a second login step",
        "definition": "A second check (like a code from your phone) on top of your password.",
        "severity": 1,
    },
}


@dataclass
class JargonHit:
    term: str      # canonical dict key
    matched: str   # exact substring from the input
    start: int
    end: int
    plain: str
    definition: str
    severity: int


# one big regex, longest terms first so multi-word matches win
_terms_sorted = sorted(JARGON.keys(), key=len, reverse=True)
_pattern = re.compile(
    r"\b(" + "|".join(re.escape(t) for t in _terms_sorted) + r")\b",
    re.IGNORECASE,
)


def find_jargon(text: str) -> List[JargonHit]:
    """Return non-overlapping jargon hits in order of appearance."""
    hits: List[JargonHit] = []
    occupied = []  # ranges already claimed by a longer match

    for m in _pattern.finditer(text or ""):
        s, e = m.start(), m.end()
        if any(s < oe and e > os for os, oe in occupied):
            continue
        key = m.group(1).lower()
        entry = JARGON[key]
        hits.append(
            JargonHit(
                term=key,
                matched=m.group(1),
                start=s,
                end=e,
                plain=entry["plain"],
                definition=entry["definition"],
                severity=entry["severity"],
            )
        )
        occupied.append((s, e))
    return hits


def unique_terms(hits: List[JargonHit]) -> List[str]:
    """Deduplicated matched terms, in the order they first appeared."""
    seen = set()
    out = []
    for h in hits:
        low = h.matched.lower()
        if low not in seen:
            seen.add(low)
            out.append(h.matched)
    return out
