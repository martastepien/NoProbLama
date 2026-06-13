# NoProbLama Scoring Reference

How the score is built, the 24 checks, and the detectors that feed them. Faithful
to the backend code (`app/analyzer/`).

## The detectors (raw signals from the text)

Three small, offline detectors turn the pasted text into signals. They use plain
Python and regular expressions, no machine-learning model, so results are
deterministic and explainable.

**readability.py** computes the Flesch Reading Ease score:
`206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / word)`, clamped to
0 to 100. Higher means easier. It also returns the Flesch-Kincaid grade level,
the word and sentence counts, and the average and longest sentence length.
Syllables are estimated by counting vowel groups (in `text_utils.py`).

**jargon.py** holds a dictionary of about 35 cybersecurity terms. Each term maps
to a plain-language replacement, a one-line definition, and a severity from 1
(mild, like "password") to 3 (heavy, like "TOTP" or "SIM-swapping"). One combined
regex matches longest terms first, so "authenticator app" wins over
"authenticator" and nothing is double-counted. The output is the list of matched
terms with positions, and the sum of their severities.

**structure.py** finds structural and tone signals: passive voice (a "to be" form
followed within two words by a word ending in -ed or -en), numbered or bulleted
step lines, ALL-CAPS shouting tokens, alarm or fear words, reassurance phrases,
the count of imperative action sentences (those starting with a verb like Open,
Tap, Enter), and sentences longer than 22 words.

## How the score is computed

1. Each of the 24 checks returns one status: **pass**, **fail**, or **n/a**
   (not applicable to this kind of message).
2. `applicable = pass + fail` (n/a checks are dropped).
3. `score = round(passed / applicable * 100)`.
4. Pillar and branch scores use the same formula over their own checks.
5. Risk band: 70 and above is Good, 50 to 69 is Moderate, below 50 is High risk.

Excluding n/a checks is the key idea: a short, single-purpose message is not
punished for lacking an error message, a form, or a timeout it never needed.

## Pillar 1: Accessibility (can people read and understand it?)

### Branch: Language Simplicity
1. **Short, jargon-free risk statements.** Pass if no sentence is over 15 words
   and there is no unexplained jargon. (Always applies.)
2. **Plain language over technical syntax.** Pass if Flesch Reading Ease is 60 or
   higher and there is no passive voice. (Always applies.)
3. **Unambiguous statements about risk.** Applies when the text describes risk.
   Pass if it uses definite words (will, must, is) and avoids hedging (might,
   maybe, could, possibly).

### Branch: Cognitive Load
4. **Literal phrasing, no idioms.** Pass if it contains no idiom from a fixed
   list (for example "under the hood", "rule of thumb"). (Always applies.)
5. **Explicit, verb-driven action labels.** Applies when there are actions or
   buttons. Pass if they start with an action verb (Open, Tap, Enter).
6. **Information chunked into logical sentences.** Applies to instructional text.
   Pass if there are at least 2 sentences and none is over 20 words.

### Branch: Textual Consistency
7. **Consistent terminology.** Pass if the message does not mix synonyms for the
   same idea (for example "log in" and "sign in" and "authenticate"). (Always
   applies.)
8. **Predictable sequence of instructions.** Applies to multi-step text. Pass if
   it uses sequential markers (1., First, Step 1).
9. **No implied meaning in consent copy.** Applies when there is consent or
   permission language. Pass if consent is explicit ("I agree", "I understand").

### Branch: Motor and Memory
10. **No demand to memorize strings.** Pass unless the text tells the user to
    memorize or "remember this code". (Always applies.)
11. **Allows pasteable input.** Applies when a code or string must be entered.
    Pass unless pasting is forbidden.
12. **Time limits come with an extension path.** Applies when a timeout or expiry
    is mentioned. Pass if the text also offers more time, a resend, or a new code.

## Pillar 2: Utility (can people act safely and correctly?)

### Branch: Straightforward Instructions
13. **Clear hazard-avoidance instructions.** Applies when there is a hazard. Pass
    if it says explicitly what not to do (Do not, Never, To avoid).
14. **Consequences explained before the action.** Applies to state-changing
    actions (delete, disable, reset). Pass if the outcome is stated first
    ("This will sign you out of all devices").
15. **Explicit format hints for inputs.** Applies when input is requested. Pass if
    the expected format is shown ("the 6-digit code", "must contain", "e.g.").

### Branch: Clear Feedback and Status
16. **Visible actor (active voice).** Pass if it names who acts (You, We, Your
    device) and has no passive sentences. (Always applies.)
17. **Confirms outcomes explicitly.** Applies when reporting an outcome. Pass if
    it confirms success plainly ("has been changed", "is now on", "successfully").
18. **Errors include a plain-language fix.** Applies to error or warning text.
    Pass if it tells the user how to fix it ("try again", "enter a valid email").

### Branch: Obvious Security Option
19. **Safe path is clearly flagged.** Applies when options are offered. Pass if
    the safe choice is marked (Recommended, Most secure).
20. **Secure defaults are explained.** Applies when a setting is pre-selected.
    Pass if it says why (By default, Standard setting).
21. **Explains the value of secure choices.** Applies when asking the user to
    adopt a security step. Pass if it says what it protects ("protects your
    account").

### Branch: Explicit Error Messages
22. **Non-punitive, calm wording.** Applies to error or warning text. Fails on
    blame words (invalid, illegal, fatal, wrong, aborted), ALL-CAPS shouting, or
    alarm words (ALERT, immediately, urgent, critical, danger).
23. **Verification cues prevent missed steps.** Applies to input or multi-step
    tasks. Pass if it includes checks ("Please check", "Make sure", "Verify").
24. **Clear way to revoke or undo.** Applies when access is granted or something
    is enabled. Pass if it names the reversal (revoke, undo, remove access,
    turn off, disconnect).

## What else the engine returns

Alongside the score it also builds, from the same detector signals: the failed
checks as a Detected Issues list (each with evidence and a fix), per-persona
barriers for Non-technical, Older adult, and Non-native English readers, the Key
terms panel (every detected term with its plain word and definition), a
rule-based plain-language rewrite, and topic tags. The optional AI rewrite
(OpenAI) only rewrites text on request and never affects the score.
