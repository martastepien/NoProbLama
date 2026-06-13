# NoProbLama Demo Dataset

Six paste-ready messages for the live demo. They are deliberately different in
length, topic, and what they get wrong, and they spread across the whole score
range, so you can show the engine reacting, not just repeating one verdict.
All numbers below are from the current engine and were verified by running them.

## How scoring works (say this once)

Every message is scored against 24 yes/no checks in two equal pillars:

- Accessibility (12 checks): can people read and understand it?
- Utility (12 checks): once understood, can people act safely?

Each check is Pass, Fail, or Not-applicable. Score = passed divided by applicable,
as a percentage. Checks that do not apply to a message are excluded, so a short,
clear message is not punished for lacking a form or an error it never needed.
Bands: 70 and above Good, 50 to 69 Moderate, below 50 High risk.

Safety cap: if the Accessibility pillar is below 60, or there are 2 or more heavy
jargon terms a layperson will not know, the message is capped to High risk no
matter how well it does on Utility. A red banner explains why. A message a
non-technical, older, or non-native reader genuinely cannot read should never be
rated Good.

Demo flow: start ugly (sample 1 or 2), open "All 24 checks" to show Pass/Fail/NA
with evidence, click an info icon to prove the criteria are transparent, switch
persona tabs, then finish on sample 6 (a green score) to show it rewards clarity.

---

## 1. Phishing alert: fear plus jargon  (49, High, safety-capped)

Length: medium (about 47 words). Tests the calm-tone check and the safety cap.

```
SECURITY ALERT: This email may be a phishing attempt. Threat actors frequently use spoofed sender addresses to conduct credential harvesting attacks against unsuspecting victims. Do not click any links or download attachments. If you believe this email is malicious, report it to your IT Security team immediately.
```

Point out: check 22 (calm wording) fails on "SECURITY ALERT" and "immediately",
and the safety cap fires on the heavy terms "spoofed" and "credential harvesting",
so it lands High with a red banner even though it does say "Do not click". Show
the rewrite calming it down, and the AI rewrite if your key is set.

---

## 2. Account recovery: enterprise jargon at end users  (49, High, safety-capped)

Length: short (about 28 words). Tests jargon aimed at the wrong audience.

```
To recover access you must complete identity verification (KYC). If your account uses OAuth/SSO, recovery requires session invalidation through your identity provider. Standard SLA is 3-5 business days.
```

Point out: KYC, OAuth, SSO and SLA all land in the Key terms panel with plain
definitions; the safety cap fires on the heavy terms; the "Older adult" persona
flags the missing human contact path.

---

## 3. Data-breach notice: one giant sentence  (43, High)

Length: long (about 71 words), but it is a single sentence. Tests readability.

```
We are writing to inform you that, following a recent security incident identified by our monitoring systems, it has been determined that some of your personal information may have potentially been accessed by an unauthorized third party, and while we have no evidence at this time that the information has been misused, we recommend as a precaution that you reset your password and review your recent account activity for anything unfamiliar.
```

Point out: checks 1 and 6 fail on sentence length, reading ease is very low, and
the rewrite breaks it into short, calm sentences. Good proof that length alone is
not the problem, structure is.

---

## 4. Hostile error message  (45, High)

Length: one line (9 words). Tests that even tiny messages are judged.

```
Error: invalid credentials. Authentication failed. Re-enter and try again.
```

Point out: check 22 fails on "invalid" and "failed" (blame words), and
"credentials" is flagged jargon. Shows the engine handles micro-copy, not just
long emails.

---

## 5. Password policy update: passive voice  (50, Moderate)

Length: medium (about 49 words). Tests the passive-voice checks.

```
Please be advised that your password is required to be changed. Passwords created before this year are considered no longer compliant and have been flagged for rotation. Once your new password has been submitted, all active sessions will be terminated and you will be asked to sign in again.
```

Point out: checks 2 and 16 fail because nobody is named as the actor ("is required
to be changed", "have been flagged"); the "Non-native English" persona flags the
same passive constructions.

---

## 6. Two-step login setup: clear and supportive  (69, Moderate, best of the set)

Length: longest (about 74 words), and it still scores well. Tests the Utility
positives and shows length does not decide the score.

```
Turn on a second login step to keep your account safe. It adds one quick check, a code from your phone, so only you can sign in.
1. Open Settings and tap Security.
2. Tap Turn on second login step.
3. We will text a code to your phone. Type it in to confirm.
App codes are the safest option. Lost your phone? Use a backup code to get back in. Need help? Contact our support team.
```

Point out: numbered steps, it states the benefit ("keep your account safe"),
flags the safe option ("safest option"), and offers help, so Utility passes a lot.
Open "All 24 checks" and show how many Pass here versus sample 1. This is your
"good example" to end on.

---

## One-line cheat sheet for the demo

| # | Message | Score | What it proves |
|---|---------|-------|----------------|
| 1 | Phishing alert | 49 High (capped) | calm-tone check + safety cap |
| 2 | Account recovery | 49 High (capped) | enterprise jargon + Key terms |
| 3 | Data-breach one sentence | 43 High | readability, length is not the issue |
| 4 | Hostile error | 45 High | micro-copy is judged too |
| 5 | Passive policy | 50 Moderate | passive voice / hidden actor |
| 6 | Two-step setup | 69 Moderate | rewards clear, supportive writing |
