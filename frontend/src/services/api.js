// Thin client for the NoProbLama analysis API.
// In dev, Vite proxies "/api" to the FastAPI backend (see vite.config.js).
// Override with VITE_API_BASE for a separately hosted backend.

const BASE = import.meta.env.VITE_API_BASE ?? "";

async function request(path, options) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      detail = (await res.json()).detail ?? detail;
    } catch {
      /* ignore */
    }
    throw new Error(detail);
  }
  return res.json();
}

export const fetchReviews = () => request("/api/reviews");
export const fetchReview = (id) => request(`/api/reviews/${id}`);
export const fetchInsights = () => request("/api/insights");
export const fetchGuidelines = () => request("/api/guidelines");
export const analyzeText = ({ text, title = "", team = "" }) =>
  request("/api/analyze", {
    method: "POST",
    body: JSON.stringify({ text, title, team }),
  });

// Optional AI rewrite layer.
export const fetchAiStatus = () => request("/api/ai-status");
export const requestAiRewrite = (id) =>
  request(`/api/reviews/${id}/ai-rewrite`, { method: "POST" });

// ---- shared UI helpers (pure, no data) -------------------------------------

export function scoreColor(score) {
  if (score >= 70) return "#0b7189";
  if (score >= 50) return "#9c95dc";
  return "#c19ab7";
}

export const riskBadge = {
  high: { bg: "#fdf0f0", color: "#a02020", label: "High risk" },
  medium: { bg: "#f0edfb", color: "#6b5dc8", label: "Moderate" },
  low: { bg: "#e8f5f7", color: "#0b7189", label: "Good" },
};
