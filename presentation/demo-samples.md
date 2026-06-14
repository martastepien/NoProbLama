# NoProbLama Demo Dataset

## 1. Phishing alert: fear plus jargon  (49, High, safety-capped)

Length: medium (about 47 words). Tests the calm-tone check and the safety cap.

```
SECURITY ALERT: This email may be a phishing attempt. Threat actors frequently use spoofed sender addresses to conduct credential harvesting attacks against unsuspecting victims. Do not click any links or download attachments. If you believe this email is malicious, report it to your IT Security team immediately.
```

---

## 2. Account recovery: enterprise jargon at end users  (49, High, safety-capped)

Length: short (about 28 words). Tests jargon aimed at the wrong audience.

```
To recover access you must complete identity verification (KYC). If your account uses OAuth/SSO, recovery requires session invalidation through your identity provider. Standard SLA is 3-5 business days.
```

---

## 3. Data-breach notice: one giant sentence  (43, High)

Length: long (about 71 words), but it is a single sentence. Tests readability.

```
We are writing to inform you that, following a recent security incident identified by our monitoring systems, it has been determined that some of your personal information may have potentially been accessed by an unauthorized third party, and while we have no evidence at this time that the information has been misused, we recommend as a precaution that you reset your password and review your recent account activity for anything unfamiliar.
```

---

## 4. Hostile error message  (45, High)

Length: one line (9 words). Tests that even tiny messages are judged.

```
Error: invalid credentials. Authentication failed. Re-enter and try again.
```

---

## 5. Password policy update: passive voice  (50, Moderate)

Length: medium (about 49 words). Tests the passive-voice checks.

```
Please be advised that your password is required to be changed. Passwords created before this year are considered no longer compliant and have been flagged for rotation. Once your new password has been submitted, all active sessions will be terminated and you will be asked to sign in again.
```

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

---
