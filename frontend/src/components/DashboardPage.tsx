import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { ChevronRight, Clock } from "lucide-react";
import { fetchReviews, fetchInsights, scoreColor, riskBadge } from "../services/api";
import logo from "../imports/Noproblammalogo.png";

function ScoreRing({ score, size = 44 }: { score: number; size?: number }) {
  const r = size * 0.38;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - score / 100);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#edeaf5" strokeWidth="3.5" />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke={scoreColor(score)}
        strokeWidth="3.5" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text
        x={size / 2} y={size / 2 + 4}
        textAnchor="middle" fontSize={size * 0.28}
        fontWeight="600" fill="#170a1c"
        fontFamily="DM Mono, monospace"
      >
        {score}
      </text>
    </svg>
  );
}

export function DashboardPage() {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState<any[]>([]);
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchReviews(), fetchInsights()])
      .then(([r, i]) => {
        setReviews(r);
        setInsights(i);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const highRiskCount = insights?.riskCounts?.high ?? reviews.filter((r) => r.risk === "high").length;
  const recentReviews = reviews.slice(0, 5);
  const total = reviews.length;

  // Top issues -> percentage of documents affected.
  const topIssues = (insights?.topIssueTypes ?? []).slice(0, 3).map((t: any) => ({
    label: t.type,
    value: `${total ? Math.round((t.count / total) * 100) : 0}% of docs`,
    pct: total ? Math.round((t.count / total) * 100) : 0,
  }));
  const issueColors = ["#9c95dc", "#c19ab7", "#228cdb"];

  const riskRows = [
    { key: "high", label: "High risk", bg: "#fdf0f0", text: "#a02020" },
    { key: "medium", label: "Moderate", bg: "#f0edfb", text: "#6b5dc8" },
    { key: "low", label: "Good", bg: "#e8f5f7", text: "#0b7189" },
  ].map((row) => {
    const count = insights?.riskCounts?.[row.key] ?? 0;
    return { ...row, count, pct: total ? Math.round((count / total) * 100) : 0 };
  });

  return (
    <div style={{ minHeight: "calc(100vh - 60px)", background: "#f6f4fb", overflowY: "auto" }}>
      <div className="max-w-5xl mx-auto px-6 py-10">

        {/* Centered hero */}
        <div className="text-center mb-10">
          <img
            src={logo}
            alt="Noproblamma mascot"
            style={{ width: "108px", height: "108px", objectFit: "contain", margin: "0 auto 16px" }}
          />
          <h1 style={{ fontSize: "2rem", fontWeight: 800, color: "#170a1c", letterSpacing: "-0.035em", lineHeight: 1 }}>
            Noproblamma
          </h1>
          <p style={{ fontSize: "0.9rem", color: "#9c95dc", fontWeight: 600, marginTop: "6px", letterSpacing: "0.01em" }}>
            Make security understandable.
          </p>
          <p style={{ fontSize: "0.925rem", color: "#6b6480", marginTop: "12px", lineHeight: 1.65 }}>
            You have <strong style={{ color: "#170a1c" }}>{total} document{total === 1 ? "" : "s"}</strong> in your workspace.{" "}
            {highRiskCount > 0 ? (
              <span style={{ color: "#a02020" }}>
                {highRiskCount} need{highRiskCount === 1 ? "s" : ""} attention.
              </span>
            ) : (
              <span style={{ color: "#0b7189" }}>All looking good.</span>
            )}
          </p>
        </div>

        {/* Main two-column */}
        <div className="grid gap-5" style={{ gridTemplateColumns: "1fr 300px" }}>

          {/* Left: Recent reviews */}
          <div
            className="rounded-xl"
            style={{ background: "#ffffff", border: "1px solid rgba(23,10,28,0.07)" }}
          >
            <div
              className="px-5 py-3.5 flex items-center justify-between"
              style={{ borderBottom: "1px solid rgba(23,10,28,0.06)" }}
            >
              <h2 style={{ color: "#170a1c", fontSize: "0.925rem", fontWeight: 600 }}>Recent Reviews</h2>
              <button
                style={{ fontSize: "0.78rem", color: "#228cdb", fontWeight: 500 }}
                onClick={() => navigate("/reviews")}
              >
                View all
              </button>
            </div>

            {loading && (
              <div className="px-5 py-8 text-center" style={{ fontSize: "0.85rem", color: "#6b6480" }}>
                Loading reviews…
              </div>
            )}

            {!loading && recentReviews.length === 0 && (
              <div className="px-5 py-8 text-center" style={{ fontSize: "0.85rem", color: "#6b6480" }}>
                No reviews yet. Start one with “New Review”.
              </div>
            )}

            {recentReviews.map((review, i) => {
              const badge = riskBadge[review.risk];
              return (
                <button
                  key={review.id}
                  onClick={() => navigate(`/review/${review.id}`)}
                  className="w-full text-left px-5 py-3.5 flex items-center gap-4 transition-colors duration-150 hover:bg-[#f6f4fb]"
                  style={{ borderBottom: i < recentReviews.length - 1 ? "1px solid rgba(23,10,28,0.05)" : "none" }}
                >
                  <ScoreRing score={review.score} size={44} />
                  <div className="flex-1 min-w-0">
                    <p style={{ fontSize: "0.9rem", fontWeight: 500, color: "#170a1c" }} className="truncate">
                      {review.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Clock size={11} style={{ color: "#6b6480" }} />
                      <span style={{ fontSize: "0.72rem", color: "#6b6480" }}>{review.date}</span>
                      <span style={{ fontSize: "0.72rem", color: "#6b6480" }}>
                        {review.issues.length} issue{review.issues.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="px-2 py-0.5 rounded-md text-xs font-medium" style={{ background: badge.bg, color: badge.color }}>
                      {badge.label}
                    </span>
                    <ChevronRight size={14} style={{ color: "#c4bdd4" }} />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right: Insights + Risk */}
          <div className="flex flex-col gap-4">
            <div className="rounded-xl p-5" style={{ background: "#ffffff", border: "1px solid rgba(23,10,28,0.07)" }}>
              <h2 style={{ color: "#170a1c", fontSize: "0.925rem", fontWeight: 600, marginBottom: "14px" }}>
                Insights
              </h2>
              <div className="space-y-3.5">
                {topIssues.length === 0 && (
                  <p style={{ fontSize: "0.78rem", color: "#6b6480" }}>No issues detected yet.</p>
                )}
                {topIssues.map(({ label, value, pct }: any, idx: number) => (
                  <div key={label}>
                    <div className="flex justify-between mb-1">
                      <span style={{ fontSize: "0.75rem", color: "#6b6480" }}>{label}</span>
                      <span style={{ fontSize: "0.75rem", color: "#170a1c", fontWeight: 500 }}>{value}</span>
                    </div>
                    <div className="rounded-full overflow-hidden" style={{ height: "4px", background: "#edeaf5" }}>
                      <div style={{ width: `${pct}%`, height: "100%", background: issueColors[idx % 3], borderRadius: "9999px" }} />
                    </div>
                  </div>
                ))}
              </div>
              {insights?.avgScore != null && (
                <div className="mt-4 rounded-lg p-3" style={{ background: "#f0edfb" }}>
                  <p style={{ fontSize: "0.775rem", color: "#5b4ec0", lineHeight: 1.6 }}>
                    Average accessibility score across your workspace is {insights.avgScore} / 100.
                  </p>
                </div>
              )}
            </div>

            <div className="rounded-xl p-5" style={{ background: "#ffffff", border: "1px solid rgba(23,10,28,0.07)" }}>
              <h2 style={{ color: "#170a1c", fontSize: "0.925rem", fontWeight: 600, marginBottom: "14px" }}>
                Risk Breakdown
              </h2>
              {riskRows.map(({ label, count, pct, bg, text }) => (
                <div key={label} className="flex items-center gap-3 mb-2.5">
                  <div className="rounded px-2 py-0.5 shrink-0" style={{ background: bg, minWidth: "72px", textAlign: "center" }}>
                    <span style={{ fontSize: "0.72rem", fontWeight: 600, color: text }}>{label}</span>
                  </div>
                  <div className="flex-1 rounded-full overflow-hidden" style={{ height: "4px", background: "#edeaf5" }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: text, borderRadius: "9999px" }} />
                  </div>
                  <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#170a1c", minWidth: "16px", textAlign: "right", fontFamily: "DM Mono, monospace" }}>
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
