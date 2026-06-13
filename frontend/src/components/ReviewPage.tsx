import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { AlertTriangle, Info, CheckCircle, XCircle, MinusCircle, ChevronRight, ChevronDown, Sparkles, Copy, Check, ArrowLeft, Zap, Loader2, Wand2 } from "lucide-react";
import { fetchReview, fetchReviews, analyzeText, scoreColor, fetchAiStatus, requestAiRewrite } from "../services/api";
import { InfoTip } from "./InfoTip";
import { SCORE_CRITERIA, OVERALL_CRITERIA, PERSONA_CRITERIA, PERSONA_OVERVIEW, ISSUES_CRITERIA, KEY_TERMS_CRITERIA, CHECKS_CRITERIA, BRANCHES_CRITERIA } from "../lib/criteria";

const severityStyle: Record<string, { bg: string; color: string; icon: React.ElementType }> = {
  High:   { bg: "#fdf0f0", color: "#a02020", icon: AlertTriangle },
  Medium: { bg: "#f0edfb", color: "#6b5dc8", icon: Info },
  Low:    { bg: "#e8f5f7", color: "#0b7189", icon: CheckCircle },
};

const statusStyle: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  pass: { icon: CheckCircle, color: "#0b7189", bg: "#e8f5f7", label: "Pass" },
  fail: { icon: XCircle, color: "#a02020", bg: "#fdf0f0", label: "Fail" },
  na: { icon: MinusCircle, color: "#9a93ad", bg: "#edeaf5", label: "N/A" },
};

const PILLAR_ORDER = ["Accessibility", "Utility"];

function ScoreCircle({ score }: { score: number }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - score / 100);
  const color = scoreColor(score);
  const label = score >= 70 ? "Good accessibility" : score >= 50 ? "Needs improvement" : "High risk";
  return (
    <div className="flex flex-col items-center">
      <svg width="128" height="128" viewBox="0 0 128 128">
        <circle cx="64" cy="64" r={r} fill="none" stroke="#edeaf5" strokeWidth="8" />
        <circle cx="64" cy="64" r={r} fill="none" stroke={color}
          strokeWidth="8" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={offset}
          transform="rotate(-90 64 64)"
        />
        <text x="64" y="58" textAnchor="middle" fontSize="30" fontWeight="700" fill="#170a1c" fontFamily="DM Mono, monospace">{score}</text>
        <text x="64" y="76" textAnchor="middle" fontSize="11" fill="#6b6480" fontFamily="Inter, sans-serif">out of 100</text>
      </svg>
      <p style={{ fontSize: "0.8rem", fontWeight: 600, color, marginTop: "2px" }}>{label}</p>
    </div>
  );
}

// New review input: actually runs the analyzer on the backend.
function NewReviewPane() {
  const navigate = useNavigate();
  const [text, setText] = useState("");
  const [title, setTitle] = useState("");
  const [team, setTeam] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const handleAnalyze = async () => {
    if (!text.trim()) {
      setError("Paste a security message to analyze.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const result = await analyzeText({ text, title, team });
      navigate(`/review/${result.id}`);
    } catch (e: any) {
      setError(e?.message || "Something went wrong. Is the backend running?");
      setBusy(false);
    }
  };

  return (
    <div style={{ height: "calc(100vh - 60px)", background: "#f6f4fb", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: "600px", padding: "0 24px" }}>
        <div
          className="rounded-2xl p-6"
          style={{ background: "#ffffff", border: "1px solid rgba(23,10,28,0.07)", boxShadow: "0 4px 24px rgba(23,10,28,0.06)" }}
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded flex items-center justify-center" style={{ background: "#0b7189" }}>
              <Sparkles size={12} color="white" />
            </div>
            <h2 style={{ fontSize: "1rem", fontWeight: 600, color: "#170a1c" }}>New Accessibility Review</h2>
          </div>

          <div className="flex gap-2 mb-3">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title (optional)"
              className="flex-1 outline-none"
              style={{ fontSize: "0.85rem", color: "#170a1c", background: "#f6f4fb", borderRadius: "8px", padding: "10px 12px", border: "1px solid rgba(23,10,28,0.07)" }}
            />
            <input
              value={team}
              onChange={(e) => setTeam(e.target.value)}
              placeholder="Team (optional)"
              className="outline-none"
              style={{ width: "150px", fontSize: "0.85rem", color: "#170a1c", background: "#f6f4fb", borderRadius: "8px", padding: "10px 12px", border: "1px solid rgba(23,10,28,0.07)" }}
            />
          </div>

          <textarea
            className="w-full resize-none outline-none"
            style={{
              fontSize: "0.9rem", lineHeight: 1.7, minHeight: "180px",
              color: "#170a1c", background: "#f6f4fb",
              borderRadius: "8px", padding: "14px",
              border: "1px solid rgba(23,10,28,0.07)", fontFamily: "inherit",
            }}
            placeholder="Paste cybersecurity instruction, email, or security flow text..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />

          {error && (
            <p style={{ fontSize: "0.78rem", color: "#a02020", marginTop: "10px" }}>{error}</p>
          )}

          <div className="flex items-center justify-between mt-4">
            <p style={{ fontSize: "0.78rem", color: "#6b6480" }}>Supports MFA flows, login alerts, phishing warnings, password resets</p>
            <button
              onClick={handleAnalyze}
              disabled={busy}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150 hover:opacity-90 disabled:opacity-60"
              style={{ background: "#228cdb", color: "#ffffff" }}
            >
              {busy ? <Loader2 size={13} className="animate-spin" /> : <Zap size={13} />}
              {busy ? "Analyzing…" : "Analyze"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ReviewPage() {
  const { id } = useParams<{ id: string }>();

  if (!id || id === "new") return <NewReviewPane />;
  return <ReviewAnalysis reviewId={id} />;
}

function ReviewAnalysis({ reviewId }: { reviewId: string }) {
  const navigate = useNavigate();
  const [review, setReview] = useState<any>(null);
  const [order, setOrder] = useState<string[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "missing">("loading");
  const [activePersona, setActivePersona] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [showChecks, setShowChecks] = useState(false);

  // Optional AI rewrite state.
  const [aiAvailable, setAiAvailable] = useState(false);
  const [aiText, setAiText] = useState<string>("");
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState<string>("");
  const [showAi, setShowAi] = useState(false);

  useEffect(() => {
    setStatus("loading");
    // Reset AI state when navigating between reviews.
    setAiText("");
    setShowAi(false);
    setAiError("");
    Promise.all([fetchReview(reviewId), fetchReviews().catch(() => [])])
      .then(([r, list]) => {
        setReview(r);
        setActivePersona(Object.keys(r.personaIssues)[0]);
        setOrder((list as any[]).map((x) => x.id));
        setStatus("ready");
      })
      .catch(() => setStatus("missing"));
    fetchAiStatus().then((s) => setAiAvailable(!!s.available)).catch(() => setAiAvailable(false));
  }, [reviewId]);

  if (status === "loading") {
    return (
      <div style={{ height: "calc(100vh - 60px)", display: "flex", alignItems: "center", justifyContent: "center", color: "#6b6480" }}>
        <Loader2 size={18} className="animate-spin" style={{ marginRight: 8 }} /> Loading analysis…
      </div>
    );
  }
  if (status === "missing" || !review) return <NewReviewPane />;

  const shownRewrite = showAi && aiText ? aiText : review.suggestedRewrite;

  const handleCopy = () => {
    navigator.clipboard.writeText(shownRewrite);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAiRewrite = async () => {
    if (aiText) {
      setShowAi(true);
      return;
    }
    setAiBusy(true);
    setAiError("");
    try {
      const res = await requestAiRewrite(reviewId);
      setAiText(res.rewrite);
      setShowAi(true);
    } catch (e: any) {
      setAiError(e?.message || "AI rewrite failed. Showing the rule-based version.");
    } finally {
      setAiBusy(false);
    }
  };

  const idx = order.indexOf(reviewId);

  return (
    <div
      style={{
        height: "calc(100vh - 60px)",
        background: "#f6f4fb",
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        overflow: "hidden",
      }}
    >
      {/* LEFT: Original document */}
      <div style={{ borderRight: "1px solid rgba(23,10,28,0.08)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(23,10,28,0.07)", background: "#ffffff", flexShrink: 0 }}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/reviews")}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors hover:bg-[#f6f4fb]"
              style={{ color: "#6b6480", border: "1px solid rgba(23,10,28,0.08)" }}
            >
              <ArrowLeft size={12} />
              All reviews
            </button>
            <div className="flex-1 min-w-0">
              <p style={{ fontSize: "0.78rem", color: "#6b6480" }}>
                {review.team} · {review.date}
              </p>
              <p style={{ fontSize: "0.925rem", fontWeight: 600, color: "#170a1c" }} className="truncate">
                {review.title}
              </p>
            </div>
            <span className="px-2 py-0.5 rounded-md text-xs font-medium" style={{ background: "#edeaf5", color: "#6b6480" }}>
              Original
            </span>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
          <div style={{
            background: "#ffffff", borderRadius: "10px", padding: "20px 24px",
            border: "1px solid rgba(23,10,28,0.07)", fontSize: "0.9rem",
            lineHeight: 1.85, color: "#2d2340", whiteSpace: "pre-wrap", fontFamily: "inherit",
          }}>
            {review.originalText}
          </div>

          {review.flaggedTerms.length > 0 && (
            <div className="mt-4">
              <p style={{ fontSize: "0.72rem", fontWeight: 600, color: "#6b6480", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Flagged terms
              </p>
              <div className="flex flex-wrap gap-2">
                {review.flaggedTerms.map((term: string) => (
                  <span key={term} className="px-2.5 py-1 rounded-md text-xs font-medium" style={{ background: "#fdf0f0", color: "#a02020", border: "1px solid rgba(160,32,32,0.12)" }}>
                    {term}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 flex items-center justify-between">
            {idx > 0 && (
              <button
                onClick={() => navigate(`/review/${order[idx - 1]}`)}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg transition-colors hover:bg-white"
                style={{ color: "#6b6480" }}
              >
                <ArrowLeft size={12} /> Previous review
              </button>
            )}
            <div className="flex-1" />
            {idx >= 0 && idx < order.length - 1 && (
              <button
                onClick={() => navigate(`/review/${order[idx + 1]}`)}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg transition-colors hover:bg-white"
                style={{ color: "#228cdb" }}
              >
                Next review <ChevronRight size={12} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT: Analysis */}
      <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(23,10,28,0.07)", background: "#ffffff", flexShrink: 0, display: "flex", alignItems: "center", gap: "8px" }}>
          <div className="w-5 h-5 rounded flex items-center justify-center" style={{ background: "#0b7189" }}>
            <Sparkles size={11} color="white" />
          </div>
          <p style={{ fontSize: "0.925rem", fontWeight: 600, color: "#170a1c" }}>Accessibility Analysis</p>
          <div className="flex-1" />
          <span
            className="px-2 py-0.5 rounded text-xs font-medium"
            style={{ background: "#e8f5f7", color: "#0b7189" }}
          >
            {review.issues.length} issue{review.issues.length !== 1 ? "s" : ""} detected
          </span>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }} className="space-y-4">
          {review.capped && (
            <div className="rounded-xl p-3 flex items-start gap-2" style={{ background: "#fdf0f0", border: "1px solid rgba(160,32,32,0.18)" }}>
              <AlertTriangle size={14} style={{ color: "#a02020", marginTop: "1px", flexShrink: 0 }} />
              <p style={{ fontSize: "0.78rem", color: "#a02020", lineHeight: 1.5 }}>{review.capReason}</p>
            </div>
          )}
          <div className="rounded-xl p-4 flex items-center gap-5" style={{ background: "#ffffff", border: "1px solid rgba(23,10,28,0.07)" }}>
            <ScoreCircle score={review.score} />
            <div className="flex-1">
              <p style={{ fontSize: "0.78rem", fontWeight: 600, color: "#6b6480", marginBottom: "10px" }} className="flex items-center gap-1.5">
                Score breakdown <InfoTip text={OVERALL_CRITERIA} />
              </p>
              {review.scoreBreakdown.map(({ label, val }: any) => (
                <div key={label} className="flex items-center gap-2 mb-2">
                  <span style={{ fontSize: "0.72rem", color: "#6b6480", minWidth: "78px" }} className="flex items-center gap-1">
                    {label} <InfoTip text={SCORE_CRITERIA[label] ?? ""} />
                  </span>
                  <div className="flex-1 rounded-full overflow-hidden" style={{ height: "4px", background: "#edeaf5" }}>
                    <div style={{ width: `${val}%`, height: "100%", background: scoreColor(val), borderRadius: "9999px" }} />
                  </div>
                  <span style={{ fontSize: "0.72rem", fontFamily: "DM Mono, monospace", color: "#170a1c", minWidth: "22px" }}>{val}</span>
                </div>
              ))}
            </div>
          </div>

          {review.metrics && (
            <div className="rounded-xl p-4 grid grid-cols-3 gap-3" style={{ background: "#ffffff", border: "1px solid rgba(23,10,28,0.07)" }}>
              {[
                { k: "Reading ease", v: review.metrics.fleschReadingEase },
                { k: "Grade level", v: review.metrics.fleschKincaidGrade },
                { k: "Jargon terms", v: review.metrics.jargonCount },
              ].map(({ k, v }) => (
                <div key={k} className="text-center">
                  <p style={{ fontSize: "1.2rem", fontWeight: 700, color: "#170a1c", fontFamily: "DM Mono, monospace" }}>{v}</p>
                  <p style={{ fontSize: "0.68rem", color: "#6b6480" }}>{k}</p>
                </div>
              ))}
            </div>
          )}

          {/* Branch breakdown (8 branches, 4 per pillar) */}
          {review.branches && review.branches.length > 0 && (
            <div className="rounded-xl p-4" style={{ background: "#ffffff", border: "1px solid rgba(23,10,28,0.07)" }}>
              <p style={{ fontSize: "0.78rem", fontWeight: 600, color: "#6b6480", marginBottom: "10px" }} className="flex items-center gap-1.5">
                Branch breakdown <InfoTip text={BRANCHES_CRITERIA} />
              </p>
              {PILLAR_ORDER.map((pillar) => (
                <div key={pillar} style={{ marginBottom: "8px" }}>
                  <p style={{ fontSize: "0.7rem", fontWeight: 700, color: pillar === "Accessibility" ? "#0b7189" : "#6b5dc8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>{pillar}</p>
                  {review.branches.filter((b: any) => b.pillar === pillar).map((b: any) => (
                    <div key={b.branch} className="flex items-center gap-2 mb-1.5">
                      <span style={{ fontSize: "0.7rem", color: "#6b6480", width: "140px", flexShrink: 0 }}>{b.branch}</span>
                      <div className="flex-1 rounded-full overflow-hidden" style={{ height: "4px", background: "#edeaf5" }}>
                        <div style={{ width: b.applicable ? `${b.val}%` : "0%", height: "100%", background: scoreColor(b.val), borderRadius: "9999px" }} />
                      </div>
                      <span style={{ fontSize: "0.68rem", fontFamily: "DM Mono, monospace", color: b.applicable ? "#170a1c" : "#c4bdd4", minWidth: "40px", textAlign: "right" }}>
                        {b.applicable ? `${b.passed}/${b.applicable}` : "n/a"}
                      </span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}

          {/* Transparency: all 24 checks */}
          {review.criteria && review.criteria.length > 0 && (
            <div className="rounded-xl overflow-hidden" style={{ background: "#ffffff", border: "1px solid rgba(23,10,28,0.07)" }}>
              <button
                onClick={() => setShowChecks((s) => !s)}
                className="w-full flex items-center gap-2 px-4 py-3 text-left transition-colors hover:bg-[#f6f4fb]"
              >
                <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "#170a1c" }} className="flex items-center gap-1.5">
                  All 24 checks ({review.metrics?.criteriaPassed ?? 0}/{review.metrics?.criteriaApplicable ?? 0} applicable passed) <InfoTip text={CHECKS_CRITERIA} />
                </span>
                <div className="flex-1" />
                <ChevronDown size={16} style={{ color: "#6b6480", transform: showChecks ? "rotate(180deg)" : undefined, transition: "0.2s" }} />
              </button>
              {showChecks && (
                <div style={{ borderTop: "1px solid rgba(23,10,28,0.06)" }}>
                  {PILLAR_ORDER.map((pillar) => (
                    <div key={pillar}>
                      <p style={{ fontSize: "0.7rem", fontWeight: 700, color: "#6b6480", textTransform: "uppercase", letterSpacing: "0.05em", padding: "8px 16px", background: "#f6f4fb" }}>{pillar}</p>
                      {review.criteria.filter((c: any) => c.pillar === pillar).map((c: any) => {
                        const st = statusStyle[c.status] ?? statusStyle.na;
                        const Icon = st.icon;
                        return (
                          <div key={c.id} className="px-4 py-2.5 flex items-start gap-2.5" style={{ borderBottom: "1px solid rgba(23,10,28,0.04)" }}>
                            <Icon size={14} style={{ color: st.color, marginTop: "2px", flexShrink: 0 }} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#170a1c" }}>{c.title}</span>
                                <span className="px-1.5 py-0.5 rounded text-xs font-semibold" style={{ background: st.bg, color: st.color, fontSize: "0.62rem" }}>{st.label}</span>
                              </div>
                              <p style={{ fontSize: "0.72rem", color: "#6b6480", lineHeight: 1.45, marginTop: "2px" }}>{c.rule}</p>
                              {c.evidence && (
                                <p style={{ fontSize: "0.68rem", color: "#9a93ad", fontStyle: "italic", marginTop: "1px" }}>{c.evidence}</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {review.issues.length > 0 && (
            <div>
              <p style={{ fontSize: "0.72rem", fontWeight: 600, color: "#6b6480", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.06em" }} className="flex items-center gap-1.5">
                Detected Issues ({review.issues.length}) <InfoTip text={ISSUES_CRITERIA} />
              </p>
              <div className="space-y-2">
                {review.issues.map((issue: any, i: number) => {
                  const sev = severityStyle[issue.severity];
                  const Icon = sev.icon;
                  return (
                    <div key={i} className="rounded-lg p-3.5" style={{ background: "#ffffff", border: "1px solid rgba(23,10,28,0.07)" }}>
                      <div className="flex items-center gap-2 mb-1.5">
                        <Icon size={13} style={{ color: sev.color }} />
                        <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#170a1c", flex: 1 }}>{issue.type}</span>
                        <span className="px-1.5 py-0.5 rounded text-xs font-semibold" style={{ background: sev.bg, color: sev.color }}>
                          {issue.severity}
                        </span>
                      </div>
                      <p style={{ fontSize: "0.78rem", color: "#6b6480", fontStyle: "italic", marginBottom: "6px", lineHeight: 1.5 }}>
                        {issue.excerpt}
                      </p>
                      <div className="flex gap-1.5 items-start">
                        <ChevronRight size={12} style={{ color: "#228cdb", marginTop: "2px" }} />
                        <p style={{ fontSize: "0.78rem", color: "#170a1c", lineHeight: 1.55 }}>{issue.recommendation}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {review.keyTerms && review.keyTerms.length > 0 && (
            <div>
              <p style={{ fontSize: "0.72rem", fontWeight: 600, color: "#6b6480", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.06em" }} className="flex items-center gap-1.5">
                Key terms explained ({review.keyTerms.length}) <InfoTip text={KEY_TERMS_CRITERIA} />
              </p>
              <div className="grid gap-2" style={{ gridTemplateColumns: "1fr 1fr" }}>
                {review.keyTerms.map((t: any, i: number) => (
                  <div key={i} className="rounded-lg p-3" style={{ background: "#ffffff", border: "1px solid rgba(23,10,28,0.07)" }}>
                    <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                      <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "#170a1c" }}>{t.term}</span>
                      <span className="px-1.5 py-0.5 rounded" style={{ fontSize: "0.66rem", background: "#f0edfb", color: "#6b5dc8" }}>{t.plain}</span>
                    </div>
                    <p style={{ fontSize: "0.76rem", color: "#6b6480", lineHeight: 1.5 }}>{t.definition}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <p style={{ fontSize: "0.72rem", fontWeight: 600, color: "#6b6480", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Suggested Rewrite
            </p>
            <div className="rounded-lg p-4" style={{ background: "#ffffff", border: `1px solid ${showAi ? "rgba(156,149,220,0.35)" : "rgba(11,113,137,0.18)"}` }}>
              <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
                <span
                  className="px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1"
                  style={showAi ? { background: "#f0edfb", color: "#6b5dc8" } : { background: "#e8f5f7", color: "#0b7189" }}
                >
                  {showAi && <Sparkles size={10} />}
                  {showAi ? "AI plain-language version" : "Plain language version"}
                </span>
                <div className="flex items-center gap-1.5">
                  {aiAvailable && !aiText && (
                    <button
                      onClick={handleAiRewrite}
                      disabled={aiBusy}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold transition-all disabled:opacity-60"
                      style={{ background: "#9c95dc", color: "#ffffff" }}
                    >
                      {aiBusy ? <Loader2 size={11} className="animate-spin" /> : <Wand2 size={11} />}
                      {aiBusy ? "Writing…" : "AI rewrite"}
                    </button>
                  )}
                  {aiText && (
                    <div className="flex rounded overflow-hidden" style={{ border: "1px solid rgba(23,10,28,0.10)" }}>
                      <button
                        onClick={() => setShowAi(false)}
                        className="px-2 py-1 text-xs font-medium"
                        style={{ background: !showAi ? "#0b7189" : "#ffffff", color: !showAi ? "#ffffff" : "#6b6480" }}
                      >
                        Rule-based
                      </button>
                      <button
                        onClick={() => setShowAi(true)}
                        className="px-2 py-1 text-xs font-medium flex items-center gap-1"
                        style={{ background: showAi ? "#9c95dc" : "#ffffff", color: showAi ? "#ffffff" : "#6b6480" }}
                      >
                        <Sparkles size={10} /> AI
                      </button>
                    </div>
                  )}
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-all"
                    style={{ background: "#edeaf5", color: "#6b6480" }}
                  >
                    {copied ? <Check size={11} /> : <Copy size={11} />}
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>
              </div>
              {aiError && (
                <p style={{ fontSize: "0.75rem", color: "#a02020", marginBottom: "8px" }}>{aiError}</p>
              )}
              <p style={{ fontSize: "0.85rem", color: "#170a1c", lineHeight: 1.75, whiteSpace: "pre-wrap" }}>
                {shownRewrite}
              </p>
            </div>
          </div>

          <div>
            <p style={{ fontSize: "0.72rem", fontWeight: 600, color: "#6b6480", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.06em" }} className="flex items-center gap-1.5">
              Persona Impact <InfoTip text={PERSONA_OVERVIEW} />
            </p>
            <div className="flex gap-1.5 mb-3 flex-wrap">
              {Object.keys(review.personaIssues).map((persona) => (
                <button
                  key={persona}
                  onClick={() => setActivePersona(persona)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150"
                  style={{
                    background: activePersona === persona ? "#9c95dc" : "#ffffff",
                    color: activePersona === persona ? "#ffffff" : "#6b6480",
                    border: `1px solid ${activePersona === persona ? "#9c95dc" : "rgba(23,10,28,0.08)"}`,
                  }}
                >
                  {persona}
                </button>
              ))}
            </div>
            <div className="rounded-lg p-4" style={{ background: "#ffffff", border: "1px solid rgba(23,10,28,0.07)" }}>
              {PERSONA_CRITERIA[activePersona] && (
                <p style={{ fontSize: "0.74rem", color: "#6b6480", lineHeight: 1.55, marginBottom: "10px", paddingBottom: "10px", borderBottom: "1px solid rgba(23,10,28,0.06)" }}>
                  <span style={{ color: "#9c95dc", fontWeight: 600 }}>Who this is: </span>
                  {PERSONA_CRITERIA[activePersona]}
                </p>
              )}
              <ul className="space-y-2">
                {(review.personaIssues[activePersona] || []).map((issue: string, i: number) => (
                  <li key={i} className="flex gap-2 items-start">
                    <span className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5" style={{ background: "#c19ab7" }} />
                    <span style={{ fontSize: "0.82rem", color: "#5a4a6a", lineHeight: 1.6 }}>{issue}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
