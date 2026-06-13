// Single source of truth for how every score, persona, and metric is defined.
// Written in plain English and kept faithful to the backend engine so the "i"
// tooltips are genuinely transparent, not marketing copy.

// The two pillars (keys match the labels returned by the API).
export const SCORE_CRITERIA = {
  "Accessibility":
    "Can people actually read and understand the message? 12 checks across language simplicity, cognitive load, consistent terminology, and motor/memory needs. Each check passes, fails, or doesn't apply.",
  "Utility":
    "Once understood, can people act safely and correctly? 12 checks across clear instructions, feedback and status, an obvious secure option, and helpful error messages. Each check passes, fails, or doesn't apply.",
};

// Overall score and the risk bands.
export const OVERALL_CRITERIA =
  "24 yes/no checks in two equal pillars (Accessibility and Utility). Score = checks passed ÷ checks that apply, as a percentage — checks that don't apply to this kind of message are excluded so a short, clear message isn't punished for lacking a form or an error it never needed. Bands: 70+ Good, 50–69 Needs improvement, below 50 High risk.";

export const CHECKS_CRITERIA =
  "Every one of the 24 checks, grouped by pillar and branch. Each shows pass, fail, or not-applicable, the exact rule, and the evidence from your text. Not-applicable checks don't count toward the score.";

export const BRANCHES_CRITERIA =
  "The 8 branches (4 per pillar). Each bar is the share of that branch's applicable checks that passed.";

export const RISK_CRITERIA =
  "Based on the overall score: Good = 70 or above, Moderate = 50–69, High risk = below 50.";

// The three reader personas we model (drawn from accessible-security research).
export const PERSONA_CRITERIA = {
  "Non-technical":
    "A capable adult with low security or digital literacy. We flag heavy unexplained jargon, actions written as paragraphs instead of numbered steps, and alarm-style wording that confuses rather than guides.",
  "Older adult":
    "An older reader who may be less familiar with apps and acronyms. We flag acronyms that aren't spelled out (MFA, TOTP, SSO, KYC…), long tiring sentences, and the absence of a human or phone contact path for help.",
  "Non-native English":
    "Someone reading English as a second language. We flag passive constructions, long high-effort sentences, and technical compound terms (like 'credential harvesting') that are hard to translate mentally.",
};

export const PERSONA_OVERVIEW =
  "We check the same text against three under-represented readers, because the same message can fail each of them for different reasons. Switch tabs to see the specific barriers for each.";

// Insight / dashboard metrics.
export const INSIGHT_CRITERIA = {
  avgScore:
    "The average overall accessibility score across every document you've analysed.",
  docsAnalyzed:
    "How many security messages have been run through the analyzer in this workspace.",
  highRisk:
    "How many documents scored below 50 overall (the High-risk band).",
  totalIssues:
    "The total number of problems flagged across all documents, counting each issue type once per document.",
  topIssues:
    "How many documents each problem type appears in. Bars are scaled to the most common issue, so the longest bar is the single most frequent problem; the number shows the raw count.",
  riskBreakdown:
    "How your documents split across the three risk bands (Good, Moderate, High risk), based on each one's overall score.",
  personaImpact:
    "The total number of comprehension barriers detected for each reader group across all documents. A higher bar means that group is currently the worst served by your security copy.",
  scoreByDoc:
    "Each analysed document's overall score, shown in the order it was analysed. Useful for spotting whether newer copy is improving.",
};

// Detected-issues panel and key terms.
export const ISSUES_CRITERIA =
  "Specific problems the engine found in this message, each with the exact text that triggered it, a severity, and a concrete fix. Severity reflects how much the issue blocks understanding.";

export const KEY_TERMS_CRITERIA =
  "Every security term we detected in the message, with a plain-language swap and a one-line definition a non-expert can understand. This is the documentation that's usually missing for under-represented readers.";

export const FLAGGED_TERMS_CRITERIA =
  "Words and acronyms in the original text that our cybersecurity dictionary considers likely to confuse a non-expert reader.";
