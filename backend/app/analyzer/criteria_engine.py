"""24-criteria Accessibility / Utility scoring engine.

Two pillars (Accessibility 50%, Utility 50%), each with 4 branches of 3 criteria.
Every criterion is a deterministic, offline check that returns one of:

    pass  - the message satisfies it
    fail  - the message violates it
    na    - the criterion does not apply to this kind of message

Final score = passed / (passed + failed) * 100, i.e. not-applicable checks are
excluded from the denominator. This is the key improvement over a flat /24: a
short, single-purpose message (e.g. a login alert) is not punished for lacking a
timeout, an error message, or a form it has no reason to contain - those simply
don't apply. This mirrors how WCAG conformance handles non-applicable criteria.

The framework (the 24 items) comes from teammate research into usable-security
and accessibility heuristics. The applicability gating and evidence reporting
are added here to keep the scores honest and explainable.
"""
from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Callable, Dict, List

from .readability import ReadabilityStats
from .structure import StructureStats, _ACTION_VERBS
from .text_utils import split_sentences, words

PASS, FAIL, NA = "pass", "fail", "na"

ACCESS = "Accessibility"
UTIL = "Utility"

IDIOMS = [
    "under the hood", "behind the scenes", "rule of thumb", "in a nutshell",
    "step up to the plate", "piece of cake", "ballpark", "touch base",
    "on the same page", "low-hanging fruit", "move the needle", "circle back",
    "bite the bullet", "hit the ground running", "back to square one",
    "the ball is in your court", "cut corners", "in the loop", "heads up",
    "down the line", "across the board", "at the end of the day",
]

# Each group lists interchangeable terms; using two variants of one group in a
# single message is an inconsistency (Item 7).
SYNONYM_GROUPS = [
    ["log in", "login", "sign in", "signin", "authenticate"],
    ["delete", "remove"],
    ["password", "passcode", "pin"],
    ["cancel", "abort"],
    ["phone", "mobile"],
    ["e-mail", "email"],
]


@dataclass
class Ctx:
    text: str
    read: ReadabilityStats
    structure: StructureStats
    jargon_severity: int
    sentences: List[str]
    max_sentence_words: int
    sentence_count: int

    def s(self, pattern: str) -> bool:
        return re.search(pattern, self.text, re.IGNORECASE) is not None


def _build_ctx(text, read, jargon, structure) -> Ctx:
    sents = split_sentences(text)
    counts = [len(words(s)) for s in sents] or [0]
    return Ctx(
        text=text or "",
        read=read,
        structure=structure,
        jargon_severity=sum(h.severity for h in jargon),
        sentences=sents,
        max_sentence_words=max(counts),
        sentence_count=len(sents),
    )


# --- context detectors (what kind of message is this?) ---------------------

def _ctx(c: Ctx) -> Dict[str, bool]:
    return {
        "risk": c.s(r"\b(risk|unauthor|compromis|breach|attack|scam|phish|suspicious|fraud|hack|stolen|locked out|malicious|threat)"),
        "error": c.s(r"\b(error|failed|fail|declin|invalid|incorrect|couldn'?t|cannot|can'?t|denied|not recognized|unable|problem with)"),
        "timeout": c.s(r"\b(expire|expires|expired|timeout|time out|valid for|within \d|\d+\s*(second|minute|hour))"),
        "input": c.s(r"\b(enter|type|paste|the code|password|passcode|\bpin\b|field|format|characters|digits|6-digit|one-time code)"),
        "consent": c.s(r"\b(agree|consent|terms|permission|i accept|authorize|opt[- ]?in|allow .{0,20}access)"),
        "defaults": c.s(r"\b(default|pre-?selected|automatically|enabled by default|turned on for you|standard setting)"),
        "choice": c.s(r"\b(option|choose|select (a|your|one|how)|method|prefer|recommended|either|two ways|which option)"),
        "state_change": c.s(r"\b(delete|disable|turn off|remove|reset|revoke|deactivate|erase|wipe|close your account|change your)"),
        "outcome": c.s(r"\b(has been|have been|successfully|is now|are now|completed|all set|we'?ve (saved|updated|changed|enabled))"),
        "promote": c.s(r"((set up|enable|turn on)[^.]{0,40}(two-?factor|2fa|mfa|authenticat|verification|security|protection)|protect your account)"),
        "access_grant": c.s(r"\b(access to your|granted access|connected|third-party app|sharing your|shared with|gave .{0,20}access|allow .{0,20}to access)"),
        "instructional": (c.structure.action_sentence_count >= 1) or c.structure.has_steps,
        "multistep": (c.structure.action_sentence_count >= 2) or (c.structure.step_count >= 2),
        "cta": bool(re.search(r"\[[^\]]+\]", c.text)) or c.structure.action_sentence_count >= 1,
    }


def _first_idiom(c: Ctx):
    low = c.text.lower()
    for idi in IDIOMS:
        if idi in low:
            return idi
    return None


def _synonym_conflicts(c: Ctx):
    low = c.text.lower()
    conflicts = []
    for group in SYNONYM_GROUPS:
        present = [v for v in group if re.search(r"\b" + re.escape(v) + r"\b", low)]
        if len(present) > 1:
            conflicts.append(present)
    return conflicts


def _action_label_ok(c: Ctx):
    # Imperative action sentences and bracketed CTA labels should start with a verb.
    labels = re.findall(r"\[([^\]]+)\]", c.text)
    starts = []
    for s in c.sentences:
        toks = words(s)
        if toks:
            starts.append(toks[0].lower() in _ACTION_VERBS)
    has_verb_imperative = any(starts)
    labels_ok = all((l.strip().split() or [""])[0].lower() in _ACTION_VERBS for l in labels) if labels else False
    return has_verb_imperative or labels_ok


# --- the 24 criteria --------------------------------------------------------
# Each entry: (id, pillar, branch, title, rule, fix, severity, evaluator)
# evaluator(ctx, ctxflags) -> (status, evidence)

def _yn(cond: bool):
    return PASS if cond else FAIL


SPECS: List[Dict] = [
    # ===== ACCESSIBILITY · Language Simplicity & Comprehension =====
    dict(id=1, pillar=ACCESS, branch="Language Simplicity", severity="High",
         title="Short, jargon-free risk statements",
         rule="No sentence over 15 words and no unexplained jargon.",
         fix="Shorten sentences to 15 words or fewer and define or remove technical terms.",
         fn=lambda c, f: (_yn(c.max_sentence_words <= 15 and c.jargon_severity == 0),
                          f"longest sentence {c.max_sentence_words} words, jargon weight {c.jargon_severity}")),
    dict(id=2, pillar=ACCESS, branch="Language Simplicity", severity="High",
         title="Plain language over technical syntax",
         rule="Flesch Reading Ease 60 or higher and no passive voice.",
         fix="Use shorter words and active voice to lift the reading-ease score above 60.",
         fn=lambda c, f: (_yn(c.read.flesch_reading_ease >= 60 and len(c.structure.passive_sentences) == 0),
                          f"reading ease {c.read.flesch_reading_ease}, passive sentences {len(c.structure.passive_sentences)}")),
    dict(id=3, pillar=ACCESS, branch="Language Simplicity", severity="Medium",
         title="Unambiguous statements about risk",
         rule="When describing risk, use definite words (will/must/is) and avoid hedging (might/maybe/could).",
         fix="Replace 'might/possibly/could' with definite wording so the risk is unambiguous.",
         fn=lambda c, f: (NA if not f["risk"] else _yn(c.s(r"\b(will|must|is|are|deleted|compromised)\b") and not c.s(r"\b(might|maybe|may|possibly|could|potentially|perhaps)\b")),
                          "hedging words present" if c.s(r"\b(might|maybe|may|possibly|could|potentially)\b") else "definite phrasing")),

    # ===== ACCESSIBILITY · Cognitive Load & Meaning =====
    dict(id=4, pillar=ACCESS, branch="Cognitive Load", severity="Medium",
         title="Literal phrasing (no idioms or metaphors)",
         rule="No idioms or implied metaphors that non-native readers can't translate literally.",
         fix="Replace idioms with literal wording.",
         fn=lambda c, f: ((FAIL, f"idiom: '{_first_idiom(c)}'") if _first_idiom(c) else (PASS, "no idioms found"))),
    dict(id=5, pillar=ACCESS, branch="Cognitive Load", severity="High",
         title="Explicit, verb-driven action labels",
         rule="Buttons and instructions start with a clear action verb (Open, Tap, Enter…).",
         fix="Begin each action or button label with a verb that says exactly what happens.",
         fn=lambda c, f: (NA if not f["cta"] else _yn(_action_label_ok(c)),
                          "actions start with a verb" if _action_label_ok(c) else "action label does not start with a verb")),
    dict(id=6, pillar=ACCESS, branch="Cognitive Load", severity="Medium",
         title="Information chunked into logical sentences",
         rule="Instructional text has at least 2 sentences and no sentence over 20 words.",
         fix="Break dense instructions into several short sentences (max ~20 words each).",
         fn=lambda c, f: (NA if not f["instructional"] else _yn(c.sentence_count >= 2 and c.max_sentence_words <= 20),
                          f"{c.sentence_count} sentences, longest {c.max_sentence_words} words")),

    # ===== ACCESSIBILITY · Textual Consistency =====
    dict(id=7, pillar=ACCESS, branch="Textual Consistency", severity="Medium",
         title="Consistent terminology",
         rule="The same idea uses one consistent term (not 'log in' and 'sign in' and 'authenticate').",
         fix="Pick one term per concept and use it everywhere.",
         fn=lambda c, f: ((FAIL, f"mixed terms: {_synonym_conflicts(c)[0]}") if _synonym_conflicts(c) else (PASS, "terminology is consistent"))),
    dict(id=8, pillar=ACCESS, branch="Textual Consistency", severity="Medium",
         title="Predictable sequence of instructions",
         rule="Multi-step instructions use sequential markers (1., First, Step 1).",
         fix="Number the steps so the order is unmistakable.",
         fn=lambda c, f: (NA if not f["multistep"] else _yn(bool(re.search(r"(^|\n)\s*(1[.\)]|first[,: ]|step\s*1)", c.text, re.IGNORECASE))),
                          "sequential markers present" if re.search(r"(^|\n)\s*(1[.\)]|first|step\s*1)", c.text, re.IGNORECASE) else "no numbered/sequential markers")),
    dict(id=9, pillar=ACCESS, branch="Textual Consistency", severity="Medium",
         title="No implied meaning in consent copy",
         rule="Consent uses explicit first-person statements (I agree / I understand / I confirm).",
         fix="Word consent as an explicit 'I agree…' statement.",
         fn=lambda c, f: (NA if not f["consent"] else _yn(c.s(r"\b(i agree|i understand|i confirm|i consent)\b")),
                          "explicit 'I' consent" if c.s(r"\b(i agree|i understand|i confirm)\b") else "consent is implied, not explicit")),

    # ===== ACCESSIBILITY · Motor & Memory Accommodations =====
    dict(id=10, pillar=ACCESS, branch="Motor & Memory", severity="Low",
         title="No demand to memorize strings",
         rule="The message never asks the user to memorize codes or details.",
         fix="Let users copy/save codes instead of memorizing them.",
         fn=lambda c, f: ((FAIL, "asks the user to memorize") if c.s(r"(memori[sz]e|remember this|keep this code in mind|by heart)") else (PASS, "no memorization demanded"))),
    dict(id=11, pillar=ACCESS, branch="Motor & Memory", severity="Low",
         title="Allows pasteable input",
         rule="When a code or string must be entered, pasting is not forbidden.",
         fix="Allow users to paste codes rather than retyping them.",
         fn=lambda c, f: (NA if not f["input"] else _yn(not c.s(r"(do not paste|cannot be pasted|no paste|don'?t paste|paste is disabled)")),
                          "pasting not forbidden" if not c.s(r"(do not paste|cannot be pasted|paste is disabled)") else "pasting is forbidden")),
    dict(id=12, pillar=ACCESS, branch="Motor & Memory", severity="Low",
         title="Time limits come with an extension path",
         rule="If a timeout or expiry is mentioned, the message also offers a way to get more time / a new code.",
         fix="Whenever you mention a deadline, add how to get more time or a fresh code.",
         fn=lambda c, f: (NA if not f["timeout"] else _yn(c.s(r"(extend|more time|resend|request another|send a new|get a new code|request a new)")),
                          "extension offered" if c.s(r"(extend|more time|resend|request another|new code)") else "deadline with no way to get more time")),

    # ===== UTILITY · Straightforward Instructions =====
    dict(id=13, pillar=UTIL, branch="Straightforward Instructions", severity="High",
         title="Clear hazard-avoidance instructions",
         rule="When there's a hazard, the text says explicitly what not to do (Do not / Never / To avoid).",
         fix="Spell out the protective action: 'Do not click any links.'",
         fn=lambda c, f: (NA if not f["risk"] else _yn(c.s(r"(to avoid|prevent this|do not|don'?t|never|avoid )")),
                          "explicit protective directive" if c.s(r"(do not|never|to avoid|avoid )") else "hazard named but no clear 'what not to do'")),
    dict(id=14, pillar=UTIL, branch="Straightforward Instructions", severity="High",
         title="Consequences explained before the action",
         rule="State-changing actions explain what will happen before the user acts.",
         fix="Tell the user the outcome first: 'This will sign you out of all devices.'",
         fn=lambda c, f: (NA if not f["state_change"] else _yn(c.s(r"(if you[^.]{0,60}(then|will)|this will (result|delete|remove|disable|sign you out|log you out|stop)|note: this will|once you|after you)")),
                          "consequence stated up front" if c.s(r"(this will|if you|once you|after you)") else "no consequence stated before the action")),
    dict(id=15, pillar=UTIL, branch="Straightforward Instructions", severity="Medium",
         title="Explicit format hints for inputs",
         rule="When input is required, the expected format is shown (e.g., 6 digits, must contain…).",
         fix="Show the required format inline: 'Enter the 6-digit code.'",
         fn=lambda c, f: (NA if not f["input"] else _yn(c.s(r"(format:|must contain|must be|at least \d|e\.g\.|example:|\d+[- ]?(digit|character)|uppercase)")),
                          "format hint present" if c.s(r"(format:|must contain|\d+[- ]?digit|e\.g\.|example:)") else "input requested but no format hint")),

    # ===== UTILITY · Clear Feedback & Status =====
    dict(id=16, pillar=UTIL, branch="Clear Feedback & Status", severity="Medium",
         title="Visible actor (active voice)",
         rule="It's clear who is acting (You / We / Your device), not hidden in passive voice.",
         fix="Name the actor: 'We noticed a new sign-in', not 'a new sign-in was noticed'.",
         fn=lambda c, f: (_yn(c.s(r"\b(you|we|your (device|account)|the system|this app|admin)\b") and len(c.structure.passive_sentences) == 0),
                          f"{len(c.structure.passive_sentences)} passive sentence(s)")),
    dict(id=17, pillar=UTIL, branch="Clear Feedback & Status", severity="Medium",
         title="Confirms outcomes explicitly",
         rule="When reporting an outcome, it confirms success in plain words (successfully / has been / is now).",
         fix="Add a clear confirmation: 'Your password has been changed.'",
         fn=lambda c, f: (NA if not f["outcome"] else _yn(c.s(r"(successfully|has been|have been|is now|are now|completed|all set)")),
                          "success confirmed" if c.s(r"(successfully|has been|is now|completed)") else "outcome implied but not confirmed")),
    dict(id=18, pillar=UTIL, branch="Clear Feedback & Status", severity="High",
         title="Errors include a plain-language fix",
         rule="Error or warning messages tell the user how to fix the problem.",
         fix="Pair every error with a next step: 'Please enter a valid email.'",
         fn=lambda c, f: (NA if not f["error"] else _yn(c.s(r"(to fix this|please update|please try|needs to be|must be|try again|check your|make sure|enter a valid)")),
                          "resolution offered" if c.s(r"(to fix|try again|please|make sure|check your)") else "error with no fix offered")),

    # ===== UTILITY · Obvious Security Option =====
    dict(id=19, pillar=UTIL, branch="Obvious Security Option", severity="Medium",
         title="Safe path is clearly flagged",
         rule="When options are offered, the safe choice is marked (Recommended / Most secure).",
         fix="Tag the safe option: 'App codes (recommended)'.",
         fn=lambda c, f: (NA if not f["choice"] else _yn(c.s(r"(recommended|safest|most secure|we suggest|we recommend|best option|preferred)")),
                          "safe option flagged" if c.s(r"(recommended|most secure|we recommend)") else "options given but none marked safest")),
    dict(id=20, pillar=UTIL, branch="Obvious Security Option", severity="Low",
         title="Secure defaults are explained",
         rule="When a setting is pre-selected, the text says why (By default / Standard setting).",
         fix="Explain pre-selected settings: 'This is on by default to keep you safe.'",
         fn=lambda c, f: (NA if not f["defaults"] else _yn(c.s(r"(by default|standard setting|automatically enabled|turned on for you|pre-?selected because)")),
                          "default explained" if c.s(r"(by default|standard setting|automatically)") else "default not explained")),
    dict(id=21, pillar=UTIL, branch="Obvious Security Option", severity="Medium",
         title="Explains the value of secure choices",
         rule="When asking the user to adopt a security step, it says what it protects.",
         fix="State the benefit: 'This protects your account so only you can sign in.'",
         fn=lambda c, f: (NA if not f["promote"] else _yn(c.s(r"(protects? your|secures? your|keeps? your[^.]{0,30}safe|so that only you|to keep you safe|prevents others)")),
                          "value explained" if c.s(r"(protects? your|secures? your|keep you safe)") else "security step has no stated benefit")),

    # ===== UTILITY · Explicit Error Messages =====
    dict(id=22, pillar=UTIL, branch="Explicit Error Messages", severity="High",
         title="Non-punitive, calm wording",
         rule="Errors and warnings stay calm: no blame words (invalid, illegal, fatal), no ALL-CAPS shouting, no alarm language (ALERT, immediately, urgent).",
         fix="Lead with what to do, not what's wrong. Drop ALL-CAPS and words like 'ALERT' or 'immediately'.",
         fn=lambda c, f: (NA, "no error or warning context") if not (f["error"] or f["risk"]) else (
             (FAIL, "hostile or alarmist wording")
             if (c.s(r"\b(invalid|illegal|fatal|wrong|aborted|forbidden|bad request)\b")
                 or len(c.structure.shouting_tokens) > 0
                 or c.s(r"\b(alert|immediately|urgent|critical|danger)\b"))
             else (PASS, "calm, non-punitive tone"))),
    dict(id=23, pillar=UTIL, branch="Explicit Error Messages", severity="Low",
         title="Verification cues prevent missed steps",
         rule="Multi-step or input tasks include checks (Please check / Make sure / Verify).",
         fix="Add a verification nudge: 'Make sure the code matches before continuing.'",
         fn=lambda c, f: (NA if not (f["input"] or f["multistep"]) else _yn(c.s(r"(please check|make sure|verify that|double-?check|ensure (you|that)|confirm that)")),
                          "verification cue present" if c.s(r"(make sure|verify|double-?check|please check)") else "no check to prevent mistakes")),
    dict(id=24, pillar=UTIL, branch="Explicit Error Messages", severity="Low",
         title="Clear way to revoke or undo",
         rule="When access is granted or something is enabled, the text says how to reverse it.",
         fix="Name the reversal: 'You can turn this off any time in Settings.'",
         fn=lambda c, f: (NA if not f["access_grant"] else _yn(c.s(r"(revoke|cancel this|undo|remove access|turn (this )?off|disable|disconnect|stop sharing)")),
                          "reversal named" if c.s(r"(revoke|undo|remove access|turn (this )?off|disconnect)") else "no way to undo / revoke given")),
]


def evaluate_criteria(text, read, jargon, structure) -> Dict:
    """Run all 24 criteria and assemble pillar/branch/overall scores."""
    c = _build_ctx(text, read, jargon, structure)
    flags = _ctx(c)

    results = []
    for spec in SPECS:
        status, evidence = spec["fn"](c, flags)
        results.append({
            "id": spec["id"],
            "pillar": spec["pillar"],
            "branch": spec["branch"],
            "title": spec["title"],
            "rule": spec["rule"],
            "fix": spec["fix"],
            "severity": spec["severity"],
            "status": status,
            "evidence": evidence,
        })

    def score_of(items):
        applicable = [r for r in items if r["status"] != NA]
        passed = [r for r in applicable if r["status"] == PASS]
        if not applicable:
            return None, 0, 0
        return round(len(passed) / len(applicable) * 100), len(passed), len(applicable)

    overall, _, _ = score_of(results)
    overall = overall if overall is not None else 0

    pillars = []
    for p in (ACCESS, UTIL):
        sc, passed, appl = score_of([r for r in results if r["pillar"] == p])
        pillars.append({"label": p, "val": sc if sc is not None else 0, "passed": passed, "applicable": appl})

    # branch order preserved as first seen
    branch_order = []
    for r in results:
        key = (r["pillar"], r["branch"])
        if key not in branch_order:
            branch_order.append(key)
    branches = []
    for p, b in branch_order:
        sc, passed, appl = score_of([r for r in results if r["pillar"] == p and r["branch"] == b])
        branches.append({"pillar": p, "branch": b, "val": sc if sc is not None else 0,
                          "passed": passed, "applicable": appl})

    return {
        "overall": overall,
        "pillars": pillars,
        "branches": branches,
        "criteria": results,
    }
