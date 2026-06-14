import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Search, Filter, ChevronRight, Clock, Tag, Trash2 } from "lucide-react";
import { fetchReviews, deleteReview, scoreColor, riskBadge } from "../services/api";

function ScoreRing({ score, size = 48 }: { score: number; size?: number }) {
  const r = size * 0.37;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - score / 100);
  const color = scoreColor(score);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#edeaf5" strokeWidth="3.5" />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke={color}
        strokeWidth="3.5" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text
        x={size / 2} y={size / 2 + 4}
        textAnchor="middle" fontSize={size * 0.26}
        fontWeight="700" fill="#170a1c"
        fontFamily="DM Mono, monospace"
      >
        {score}
      </text>
    </svg>
  );
}

const teamColors: Record<string, { bg: string; color: string }> = {
  "Product":    { bg: "#eef6ff", color: "#1a6bb5" },
  "Security":   { bg: "#fdf0f0", color: "#a02020" },
  "UX Writing": { bg: "#f0edfb", color: "#6b5dc8" },
  "IT":         { bg: "#e8f5f7", color: "#0b7189" },
};

export function ReviewsListPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState<"all" | "high" | "medium" | "low">("all");
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = () => fetchReviews().then(setReviews).catch(() => {}).finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const handleDelete = async (e: React.MouseEvent, review: any) => {
    e.stopPropagation();
    if (!window.confirm(`Delete the review "${review.title}"? This cannot be undone.`)) return;
    setDeletingId(review.id);
    try {
      await deleteReview(review.id);
      setReviews((prev) => prev.filter((r) => r.id !== review.id));
    } catch {
      window.alert("Could not delete this review.");
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = reviews.filter((r) => {
    const matchesQuery = r.title.toLowerCase().includes(query.toLowerCase()) ||
      r.team.toLowerCase().includes(query.toLowerCase()) ||
      r.tags.some((t) => t.toLowerCase().includes(query.toLowerCase()));
    const matchesRisk = riskFilter === "all" || r.risk === riskFilter;
    return matchesQuery && matchesRisk;
  });

  return (
    <div style={{ minHeight: "calc(100vh - 60px)", background: "#f6f4fb", overflowY: "auto" }}>
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 style={{ color: "#170a1c", fontSize: "1.35rem", fontWeight: 700, letterSpacing: "-0.025em" }}>
            Reviews
          </h1>
          <p style={{ color: "#6b6480", fontSize: "0.875rem", marginTop: "2px" }}>
            {reviews.length} documents analyzed. Click any review to see the full AI analysis.
          </p>
        </div>

        {/* Search + filter bar */}
        <div className="flex items-center gap-3 mb-6">
          <div
            className="flex items-center gap-2 flex-1 rounded-lg px-3 py-2"
            style={{ background: "#ffffff", border: "1px solid rgba(23,10,28,0.09)" }}
          >
            <Search size={14} style={{ color: "#6b6480", flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Search by title, team, or tag..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 outline-none bg-transparent text-sm"
              style={{ color: "#170a1c", fontFamily: "inherit" }}
            />
          </div>
          <div className="flex items-center gap-1.5">
            <Filter size={13} style={{ color: "#6b6480" }} />
            {(["all", "high", "medium", "low"] as const).map((level) => {
              const labels = { all: "All", high: "High risk", medium: "Moderate", low: "Good" };
              const active = riskFilter === level;
              return (
                <button
                  key={level}
                  onClick={() => setRiskFilter(level)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150"
                  style={{
                    background: active ? "#170a1c" : "#ffffff",
                    color: active ? "#ffffff" : "#6b6480",
                    border: `1px solid ${active ? "#170a1c" : "rgba(23,10,28,0.09)"}`,
                  }}
                >
                  {labels[level]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Reviews grid */}
        <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))" }}>
          {filtered.map((review) => {
            const badge = riskBadge[review.risk];
            const team = teamColors[review.team] ?? { bg: "#edeaf5", color: "#6b6480" };
            return (
              <div
                key={review.id}
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/review/${review.id}`)}
                onKeyDown={(e) => { if (e.key === "Enter") navigate(`/review/${review.id}`); }}
                className="text-left rounded-xl p-5 transition-all duration-150 group"
                style={{
                  background: "#ffffff",
                  border: "1px solid rgba(23,10,28,0.07)",
                  boxShadow: "0 1px 4px rgba(23,10,28,0.04)",
                  cursor: "pointer",
                  opacity: deletingId === review.id ? 0.5 : 1,
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 16px rgba(23,10,28,0.09)";
                  (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(34,140,219,0.25)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.boxShadow = "0 1px 4px rgba(23,10,28,0.04)";
                  (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(23,10,28,0.07)";
                }}
              >
                {/* Top row */}
                <div className="flex items-start justify-between mb-4">
                  <ScoreRing score={review.score} size={52} />
                  <div className="flex items-center gap-2">
                    <span
                      className="px-2 py-0.5 rounded text-xs font-medium"
                      style={{ background: badge.bg, color: badge.color }}
                    >
                      {badge.label}
                    </span>
                    <button
                      onClick={(e) => handleDelete(e, review)}
                      title="Delete review"
                      aria-label="Delete review"
                      className="flex items-center justify-center rounded transition-colors"
                      style={{ width: 24, height: 24, color: "#c4bdd4" }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#a02020"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#c4bdd4"; }}
                    >
                      <Trash2 size={14} />
                    </button>
                    <ChevronRight
                      size={14}
                      style={{ color: "#c4bdd4", transition: "transform 0.15s" }}
                      className="group-hover:translate-x-0.5"
                    />
                  </div>
                </div>

                {/* Title + meta */}
                <p style={{ fontSize: "0.925rem", fontWeight: 600, color: "#170a1c", marginBottom: "6px", lineHeight: 1.3 }}>
                  {review.title}
                </p>

                <div className="flex items-center gap-2 mb-3">
                  <span
                    className="px-2 py-0.5 rounded text-xs font-medium"
                    style={{ background: team.bg, color: team.color }}
                  >
                    {review.team}
                  </span>
                  <span style={{ fontSize: "0.72rem", color: "#6b6480" }}>
                    <Clock size={10} className="inline mr-1" />
                    {review.date}
                  </span>
                  <span style={{ fontSize: "0.72rem", color: "#6b6480" }}>
                    {review.issues.length} issue{review.issues.length !== 1 ? "s" : ""}
                  </span>
                </div>

                {/* Tags */}
                {review.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    <Tag size={10} style={{ color: "#c19ab7", marginTop: "2px" }} />
                    {review.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-1.5 py-0.5 rounded text-xs"
                        style={{ background: "#f0edfb", color: "#6b5dc8" }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Score bar strip */}
                <div className="mt-4 grid grid-cols-4 gap-1">
                  {review.scoreBreakdown.map(({ label, val }) => (
                    <div key={label}>
                      <div className="rounded-full overflow-hidden mb-1" style={{ height: "3px", background: "#edeaf5" }}>
                        <div style={{ width: `${val}%`, height: "100%", background: scoreColor(val), borderRadius: "9999px" }} />
                      </div>
                      <p style={{ fontSize: "0.65rem", color: "#6b6480", textAlign: "center" }}>{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div
            className="rounded-xl p-12 text-center"
            style={{ background: "#ffffff", border: "1px dashed rgba(23,10,28,0.12)" }}
          >
            <p style={{ color: "#6b6480", fontSize: "0.925rem" }}>
              {loading ? "Loading reviews…" : "No reviews match your search."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
