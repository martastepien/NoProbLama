import { useEffect, useState } from "react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { TrendingDown, FileText, AlertTriangle, Users, Zap, TrendingUp, Minus } from "lucide-react";
import { fetchInsights, fetchReviews } from "../services/api";
import { InfoTip } from "./InfoTip";
import { INSIGHT_CRITERIA } from "../lib/criteria";

const personaColors: Record<string, string> = {
  "Non-technical": "#c19ab7",
  "Older adult": "#9c95dc",
  "Non-native English": "#228cdb",
};

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: "#ffffff", border: "1px solid rgba(23,10,28,0.10)", borderRadius: "8px", padding: "8px 12px", boxShadow: "0 4px 12px rgba(23,10,28,0.08)" }}>
        <p style={{ fontSize: "0.75rem", color: "#6b6480", marginBottom: "2px" }}>{label}</p>
        <p style={{ fontSize: "0.9rem", fontWeight: 700, color: "#170a1c", fontFamily: "DM Mono, monospace" }}>
          {payload[0].value}
          <span style={{ fontSize: "0.75rem", fontWeight: 400, color: "#6b6480" }}> / 100</span>
        </p>
      </div>
    );
  }
  return null;
};

const BarTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: "#ffffff", border: "1px solid rgba(23,10,28,0.10)", borderRadius: "8px", padding: "8px 12px", boxShadow: "0 4px 12px rgba(23,10,28,0.08)" }}>
        <p style={{ fontSize: "0.75rem", color: "#6b6480", marginBottom: "2px" }}>{label}</p>
        <p style={{ fontSize: "0.9rem", fontWeight: 700, color: "#170a1c", fontFamily: "DM Mono, monospace" }}>
          {payload[0].value} <span style={{ fontSize: "0.75rem", fontWeight: 400, color: "#6b6480" }}>occurrences</span>
        </p>
      </div>
    );
  }
  return null;
};

export function InsightsPage() {
  const [insights, setInsights] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([fetchInsights(), fetchReviews()])
      .then(([i, r]) => {
        setInsights(i);
        setReviews(r);
      })
      .catch(() => {});
  }, []);

  const total = insights?.totalReviews ?? 0;
  const totalIssues = (insights?.topIssueTypes ?? []).reduce((s: number, t: any) => s + t.count, 0);

  // Trend: review scores in chronological order (API returns newest first).
  const trendData = [...reviews].reverse().map((r) => ({ week: r.date?.replace(/,.*/, "") ?? "", score: r.score }));

  const issueData = (insights?.topIssueTypes ?? []).map((t: any) => ({
    category: t.type.length > 16 ? t.type.slice(0, 15) + "…" : t.type,
    count: t.count,
  }));

  const riskDocs = reviews
    .filter((r) => r.score < 50)
    .sort((a, b) => a.score - b.score)
    .slice(0, 6)
    .map((r) => ({ title: r.title, score: r.score, team: r.team, date: r.date?.replace(/,.*/, "") ?? "" }));

  const personaImpactRaw = insights?.personaImpact ?? [];
  const maxImpact = Math.max(1, ...personaImpactRaw.map((p: any) => p.issues));
  const personaImpact = personaImpactRaw.map((p: any) => ({
    persona: p.persona,
    issues: p.issues,
    pct: Math.round((p.issues / maxImpact) * 100),
    color: personaColors[p.persona] ?? "#9c95dc",
  }));
  const topPersona = [...personaImpact].sort((a, b) => b.issues - a.issues)[0];

  const kpis = [
    { label: "Avg. accessibility score", value: String(insights?.avgScore ?? "–"), delta: "Across all reviews", up: null, icon: TrendingUp, color: "#228cdb", info: INSIGHT_CRITERIA.avgScore },
    { label: "Documents analyzed", value: String(total), delta: "In your workspace", up: true, icon: FileText, color: "#0b7189", info: INSIGHT_CRITERIA.docsAnalyzed },
    { label: "High-risk documents", value: String(insights?.riskCounts?.high ?? 0), delta: "Score below 50", up: false, icon: AlertTriangle, color: "#a02020", info: INSIGHT_CRITERIA.highRisk },
    { label: "Total issues flagged", value: String(totalIssues), delta: "Across all reviews", up: null, icon: Zap, color: "#9c95dc", info: INSIGHT_CRITERIA.totalIssues },
  ];

  return (
    <div style={{ minHeight: "calc(100vh - 60px)", background: "#f6f4fb", overflowY: "auto" }}>
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-start justify-between mb-7">
          <div>
            <h1 style={{ color: "#170a1c", fontSize: "1.35rem", fontWeight: 700, letterSpacing: "-0.025em" }}>
              Insights
            </h1>
            <p style={{ color: "#6b6480", fontSize: "0.875rem", marginTop: "2px" }}>
              Trends and patterns across {total} reviewed document{total === 1 ? "" : "s"}.
            </p>
          </div>
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {kpis.map(({ label, value, delta, up, icon: Icon, color, info }) => (
            <div key={label} className="rounded-xl p-4" style={{ background: "#ffffff", border: "1px solid rgba(23,10,28,0.07)" }}>
              <div className="flex items-center justify-between mb-3">
                <span style={{ fontSize: "0.78rem", color: "#6b6480", fontWeight: 500 }} className="flex items-center gap-1">
                  {label} <InfoTip text={info} />
                </span>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${color}14` }}>
                  <Icon size={13} style={{ color }} />
                </div>
              </div>
              <p style={{ fontSize: "1.75rem", fontWeight: 700, color: "#170a1c", fontFamily: "DM Mono, monospace", letterSpacing: "-0.02em", lineHeight: 1 }}>
                {value}
              </p>
              <div className="flex items-center gap-1 mt-1.5">
                {up === true && <TrendingUp size={11} style={{ color: "#0b7189" }} />}
                {up === false && <TrendingDown size={11} style={{ color: "#a02020" }} />}
                {up === null && <Minus size={11} style={{ color: "#6b6480" }} />}
                <span style={{ fontSize: "0.72rem", color: "#6b6480" }}>{delta}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Charts row */}
        <div className="grid gap-5 mb-5" style={{ gridTemplateColumns: "1fr 1fr" }}>
          <div className="rounded-xl p-5" style={{ background: "#ffffff", border: "1px solid rgba(23,10,28,0.07)" }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 style={{ fontSize: "0.925rem", fontWeight: 600, color: "#170a1c" }} className="flex items-center gap-1.5">
                  Accessibility Score by Document <InfoTip text={INSIGHT_CRITERIA.scoreByDoc} />
                </h3>
                <p style={{ fontSize: "0.75rem", color: "#6b6480", marginTop: "1px" }}>In order analyzed</p>
              </div>
              <span style={{ fontSize: "1.4rem", fontWeight: 700, color: "#228cdb", fontFamily: "DM Mono, monospace" }}>{insights?.avgScore ?? "–"}</span>
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={trendData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(23,10,28,0.05)" vertical={false} />
                <XAxis dataKey="week" tick={{ fontSize: 10, fill: "#6b6480" }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "#6b6480" }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="score" stroke="#228cdb" strokeWidth={2} fill="#228cdb" fillOpacity={0.08} dot={{ r: 3, fill: "#228cdb", strokeWidth: 0 }} activeDot={{ r: 4, fill: "#228cdb" }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-xl p-5" style={{ background: "#ffffff", border: "1px solid rgba(23,10,28,0.07)" }}>
            <div className="mb-4">
              <h3 style={{ fontSize: "0.925rem", fontWeight: 600, color: "#170a1c" }} className="flex items-center gap-1.5">
                Most Common Issues <InfoTip text={INSIGHT_CRITERIA.topIssues} />
              </h3>
              <p style={{ fontSize: "0.75rem", color: "#6b6480", marginTop: "1px" }}>Occurrences across all reviews</p>
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={issueData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barSize={20}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(23,10,28,0.05)" vertical={false} />
                <XAxis dataKey="category" tick={{ fontSize: 9, fill: "#6b6480" }} axisLine={false} tickLine={false} interval={0} />
                <YAxis tick={{ fontSize: 10, fill: "#6b6480" }} axisLine={false} tickLine={false} />
                <Tooltip content={<BarTooltip />} />
                <Bar dataKey="count" fill="#9c95dc" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bottom row */}
        <div className="grid gap-5" style={{ gridTemplateColumns: "1fr 1fr" }}>
          <div className="rounded-xl" style={{ background: "#ffffff", border: "1px solid rgba(23,10,28,0.07)" }}>
            <div className="px-5 py-3.5" style={{ borderBottom: "1px solid rgba(23,10,28,0.06)" }}>
              <h3 style={{ fontSize: "0.925rem", fontWeight: 600, color: "#170a1c" }}>High-Risk Documents</h3>
              <p style={{ fontSize: "0.75rem", color: "#6b6480", marginTop: "1px" }}>Accessibility score below 50</p>
            </div>
            {riskDocs.length === 0 && (
              <p className="px-5 py-6" style={{ fontSize: "0.85rem", color: "#6b6480" }}>No high-risk documents. Nice.</p>
            )}
            {riskDocs.map((doc, i) => (
              <div key={doc.title + i} className="px-5 py-3 flex items-center gap-3" style={{ borderBottom: i < riskDocs.length - 1 ? "1px solid rgba(23,10,28,0.05)" : "none" }}>
                <div className="px-2 py-0.5 rounded shrink-0" style={{ background: "#fdf0f0", minWidth: "32px", textAlign: "center" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#a02020", fontFamily: "DM Mono, monospace" }}>{doc.score}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p style={{ fontSize: "0.85rem", fontWeight: 500, color: "#170a1c" }} className="truncate">{doc.title}</p>
                  <p style={{ fontSize: "0.72rem", color: "#6b6480" }}>{doc.team} · {doc.date}</p>
                </div>
                <AlertTriangle size={13} style={{ color: "#c19ab7" }} />
              </div>
            ))}
          </div>

          <div className="rounded-xl p-5" style={{ background: "#ffffff", border: "1px solid rgba(23,10,28,0.07)" }}>
            <div className="flex items-center gap-2 mb-4">
              <Users size={14} style={{ color: "#9c95dc" }} />
              <h3 style={{ fontSize: "0.925rem", fontWeight: 600, color: "#170a1c" }} className="flex items-center gap-1.5">
                Persona Impact Index <InfoTip text={INSIGHT_CRITERIA.personaImpact} />
              </h3>
            </div>
            <p style={{ fontSize: "0.78rem", color: "#6b6480", lineHeight: 1.6, marginBottom: "16px" }}>
              Number of comprehension barriers detected for each under-represented user group.
            </p>
            <div className="space-y-4">
              {personaImpact.map(({ persona, issues, pct, color }: any) => (
                <div key={persona}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span style={{ fontSize: "0.825rem", color: "#170a1c", fontWeight: 500 }}>{persona}</span>
                    <span style={{ fontSize: "0.8rem", fontWeight: 700, color, fontFamily: "DM Mono, monospace" }}>{issues}</span>
                  </div>
                  <div className="rounded-full overflow-hidden" style={{ height: "6px", background: "#edeaf5" }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: "9999px" }} />
                  </div>
                </div>
              ))}
            </div>
            {topPersona && (
              <div className="mt-4 rounded-lg p-3" style={{ background: "#f0edfb" }}>
                <p style={{ fontSize: "0.775rem", color: "#5b4ec0", lineHeight: 1.6 }}>
                  "{topPersona.persona}" readers face the most barriers ({topPersona.issues} flagged across all documents).
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
