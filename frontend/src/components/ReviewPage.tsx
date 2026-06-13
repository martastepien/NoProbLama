import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { AlertTriangle, Info, CheckCircle, ChevronRight, Sparkles, Copy, Check, ArrowLeft, Zap, Loader2 } from "lucide-react";
import { fetchReview, fetchReviews, analyzeText, scoreColor } from "../services/api";

const severityStyle: Record<string, { bg: string; color: string; icon: React.ElementType }> = {
  High:   { bg: "#fdf0f0", color: "#a02020", icon: AlertTriangle },
  Medium: { bg: "#f0edfb", color: "#6b5dc8", icon: Info },
  Low:    { bg: "#e8f5f7", color: "#0b7189", icon: CheckCircle },
};

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

  useEffect(() => {
    setStatus("loading");
    Promise.all([fetchReview(reviewId), fetchReviews().catch(() => [])])
      .then(([r, list]) => {
        setReview(r);
        setActivePersona(Object.keys(r.personaIssues)[0]);
        setOrder((list as any[]).map((x) => x.id));
        setStatus("ready");
      })
      .catch(() => setStatus("missing"));
  }, [reviewId]);

  if (status === "loading") {
    return (
      <div style={{ height: "calc(100vh - 60px)", display: "flex", alignItems: "center", justifyContent: "center", color: "#6b6480" }}>
        <Loader2 size={18} className="animate-spin" style={{ marginRight: 8 }} /> Loading analysis…
      </div>
    );
  }
  if (status === "missing" || !review) return <NewReviewPane />;

  const handleCopy = () => {
    navigator.clipboard.writeText(review.suggestedRewrite);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
          <div className="rounded-xl p-4 flex items-center gap-5" style={{ background: "#ffffff", border: "1px solid rgba(23,10,28,0.07)" }}>
            <ScoreCircle score={review.score} />
            <div className="flex-1">
              <p style={{ fontSize: "0.78rem", fontWeight: 600, color: "#6b6480", marginBottom: "10px" }}>Score breakdown</p>
              {review.scoreBreakdown.map(({ label, val }: any) => (
                <div key={label} className="flex items-center gap-2 mb-2">
                  <span style={{ fontSize: "0.72rem", color: "#6b6480", minWidth: "78px" }}>{label}</span>
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

          {review.issues.length > 0 && (
            <div>
              <p style={{ fontSize: "0.72rem", fontWeight: 600, color: "#6b6480", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Detected Issues ({review.issues.length})
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

          <div>
            <p style={{ fontSize: "0.72rem", fontWeight: 600, color: "#6b6480", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Suggested Rewrite
            </p>
            <div className="rounded-lg p-4" style={{ background: "#ffffff", border: "1px solid rgba(11,113,137,0.18)" }}>
              <div className="flex items-center justify-between mb-3">
                <span className="px-2 py-0.5 rounded text-xs font-medium" style={{ background: "#e8f5f7", color: "#0b7189" }}>
                  Plain language version
                </span>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-all"
                  style={{ background: "#edeaf5", color: "#6b6480" }}
                >
                  {copied ? <Check size={11} /> : <Copy size={11} />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
              <p style={{ fontSize: "0.85rem", color: "#170a1c", lineHeight: 1.75, whiteSpace: "pre-wrap" }}>
                {review.suggestedRewrite}
              </p>
            </div>
          </div>

          <div>
            <p style={{ fontSize: "0.72rem", fontWeight: 600, color: "#6b6480", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Persona Impact
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
