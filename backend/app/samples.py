"""Demo seed messages. Raw input only - scores and analysis are generated at runtime."""

SAMPLE_MESSAGES = [
    {
        "title": "MFA Onboarding Flow v2",
        "team": "Product",
        "text": """We strongly recommend enabling two-factor authentication (2FA/MFA) on your account to protect against unauthorized access attempts.

To complete TOTP enrollment, navigate to Settings > Security > Two-Factor Authentication. You will need an authenticator app such as Google Authenticator or Authy to scan the QR code and generate TOTP codes.

If you lose access to your authenticator app, you can use your backup recovery codes. Store these codes securely as they cannot be regenerated. Contact support if you exhaust all recovery options.

Note: SMS-based 2FA is deprecated in favor of app-based TOTP due to SIM-swapping vulnerabilities.""",
    },
    {
        "title": "Password Reset Email",
        "team": "UX Writing",
        "text": """You recently requested a password reset for your account. Click the link below to reset your password. This link will expire in 24 hours.

If you did not request a password reset, please ignore this email. Your account remains secure and your password has not been changed.

Reset password link: [Reset My Password]

For security reasons, this link can only be used once. If you need assistance, contact our support team.""",
    },
    {
        "title": "Phishing Warning Banner",
        "team": "Security",
        "text": """SECURITY ALERT: This email may be a phishing attempt. Threat actors frequently use spoofed sender addresses to conduct credential harvesting attacks. Do not click any links or download attachments. If you believe this email is malicious, report it to your IT Security team immediately using the Report Phishing button.""",
    },
    {
        "title": "Two-Factor Auth Setup Guide",
        "team": "Product",
        "text": """Setting up two-factor authentication adds an extra layer of security to your account.

Step 1: Go to your Account Settings and select Security.
Step 2: Click on "Two-Factor Authentication" and select Enable.
Step 3: Choose your preferred 2FA method: Authenticator App or SMS.
Step 4: If using an Authenticator App, scan the QR code displayed on screen.
Step 5: Enter the 6-digit TOTP code from your authenticator app.
Step 6: Save your backup codes in a secure location.

Your account is now protected with 2FA.""",
    },
    {
        "title": "Login Alert Notification",
        "team": "Security",
        "text": """New sign-in to your account.

We noticed a new sign-in to your account from a new device.

When: Today at 2:34 PM
Where: London, UK
Device: iPhone 14

Was this you? Yes, that was me: no further action needed. No, that was not me: secure my account now.

If you did not sign in, tap "Secure my account" and we will help you lock it down immediately.""",
    },
    {
        "title": "Account Recovery Guide",
        "team": "UX Writing",
        "text": """Account Recovery Process.

To recover access to your account, you must complete identity verification (KYC). You will need to provide government-issued photo ID and proof of account ownership.

If your account is linked via OAuth/SSO, recovery requires session invalidation and re-authorization through your identity provider. Contact your organization's IT administrator if SSO-based recovery is required.

Standard recovery SLA is 3-5 business days.""",
    },
]
