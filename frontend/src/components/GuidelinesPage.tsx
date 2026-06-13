import { useEffect, useState } from "react";
import { CheckCircle, XCircle, BookOpen, Shield, Users, FileText, ChevronDown } from "lucide-react";
import { fetchGuidelines } from "../services/api";

// Icons / accent colours are presentation-only and cycle across the guidelines
// returned by the API.
const ICONS = [BookOpen, FileText, Users, Shield];
const COLORS = ["#228cdb", "#0b7189", "#9c95dc", "#c19ab7"];

function mapGuideline(g: any, i: number) {
  return {
    id: g.id,
    icon: ICONS[i % ICONS.length],
    color: COLORS[i % COLORS.length],
    title: g.title,
    rule: g.principle,
    before: g.antiPattern,
    after: g.pattern,
  };
}

const mistakes = [
  { mistake: "Using acronyms without explanation", example: '"Enable 2FA via TOTP"', fix: 'Spell it out: "Turn on two-step login using an authenticator app"' },
  { mistake: "Burying the action in a long paragraph", example: '"For enhanced security, it is recommended that users consider enabling..."', fix: 'Lead with the action: "Turn on two-step login. Here is how:"' },
  { mistake: "Explaining why before what", example: '"To protect against credential stuffing and phishing attacks, MFA should be..."', fix: 'Lead with what, follow with why: "Set up two-step login. It adds a second check so only you can access your account."' },
  { mistake: "Using technical error messages verbatim", example: '"Error 403: TOTP token expired. Re-authenticate."', fix: '"Your login code has expired. Please open your authenticator app and enter the new 6-digit code shown."' },
  { mistake: "Assuming device literacy", example: '"Scan the QR code with your authenticator app"', fix: '"Open your authenticator app, tap the + button, then point your camera at the code on screen."' },
];

export function GuidelinesPage() {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"principles" | "mistakes" | "checklist">("principles");
  const [principles, setPrinciples] = useState<any[]>([]);

  useEffect(() => {
    fetchGuidelines()
      .then((data) => {
        const mapped = data.map(mapGuideline);
        setPrinciples(mapped);
        if (mapped[0]) setExpanded(mapped[0].id);
      })
      .catch(() => {});
  }, []);

  const checklist = [
    { item: "All technical terms are defined on first use", category: "Language" },
    { item: "Instructions use numbered steps, not paragraphs", category: "Structure" },
    { item: "Sentences are under 20 words where possible", category: "Readability" },
    { item: "Active voice is used throughout", category: "Language" },
    { item: "A fallback path is provided for every critical action", category: "Safety" },
    { item: "No abbreviations are used without expansion", category: "Language" },
    { item: "Error messages use plain language and next steps", category: "Errors" },
    { item: "Tested with at least one non-technical reader", category: "Testing" },
    { item: "Screen reader compatibility confirmed", category: "Accessibility" },
    { item: "Reading grade level is at or below Grade 8", category: "Readability" },
  ];

  const [checked, setChecked] = useState<Set<number>>(new Set());
  const toggle = (i: number) => {
    setChecked((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  return (
    <div style={{ minHeight: "calc(100vh - 60px)", background: "#f6f4fb", overflowY: "auto" }}>
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-7">
          <div>
            <h1 style={{ color: "#170a1c", fontSize: "1.35rem", fontWeight: 700, letterSpacing: "-0.025em" }}>
              Accessibility Guidelines
            </h1>
            <p style={{ color: "#6b6480", fontSize: "0.875rem", marginTop: "2px" }}>
              Writing standards for inclusive, accessible cybersecurity communication.
            </p>
          </div>
          <span
            className="px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{ background: "#e8f5f7", color: "#0b7189", border: "1px solid rgba(11,113,137,0.15)" }}
          >
            v2.1 · Aug 2025
          </span>
        </div>

        {/* Tabs */}
        <div
          className="flex gap-1 mb-6 p-1 rounded-lg"
          style={{ background: "#ffffff", border: "1px solid rgba(23,10,28,0.07)", display: "inline-flex" }}
        >
          {(["principles", "mistakes", "checklist"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-4 py-1.5 rounded-md text-sm font-medium capitalize transition-all duration-150"
              style={{
                background: activeTab === tab ? "#228cdb" : "transparent",
                color: activeTab === tab ? "#ffffff" : "#6b6480",
              }}
            >
              {tab === "principles" ? "Best Practices" : tab === "mistakes" ? "Common Mistakes" : "Review Checklist"}
            </button>
          ))}
        </div>

        {/* Best Practices */}
        {activeTab === "principles" && (
          <div className="space-y-3">
            {principles.map((p) => {
              const isOpen = expanded === p.id;
              const Icon = p.icon;
              return (
                <div
                  key={p.id}
                  className="rounded-xl overflow-hidden"
                  style={{ background: "#ffffff", border: `1px solid ${isOpen ? p.color + "30" : "rgba(23,10,28,0.07)"}` }}
                >
                  <button
                    className="w-full flex items-center gap-3 px-5 py-4 text-left transition-colors duration-150 hover:bg-[#f6f4fb]"
                    onClick={() => setExpanded(isOpen ? null : p.id)}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: `${p.color}14` }}
                    >
                      <Icon size={15} style={{ color: p.color }} />
                    </div>
                    <div className="flex-1">
                      <p style={{ fontSize: "0.925rem", fontWeight: 600, color: "#170a1c" }}>{p.title}</p>
                      {!isOpen && (
                        <p style={{ fontSize: "0.78rem", color: "#6b6480", marginTop: "1px" }} className="line-clamp-1">
                          {p.rule}
                        </p>
                      )}
                    </div>
                    <ChevronDown
                      size={16}
                      style={{ color: "#6b6480", transform: isOpen ? "rotate(180deg)" : undefined, transition: "0.2s" }}
                    />
                  </button>

                  {isOpen && (
                    <div style={{ borderTop: "1px solid rgba(23,10,28,0.06)" }}>
                      <div className="px-5 py-4">
                        <p style={{ fontSize: "0.875rem", color: "#5a4a6a", lineHeight: 1.7, marginBottom: "16px" }}>
                          {p.rule}
                        </p>
                        <div className="grid gap-3" style={{ gridTemplateColumns: "1fr 1fr" }}>
                          {/* Before */}
                          <div className="rounded-lg p-4" style={{ background: "#fdf0f0", border: "1px solid rgba(160,32,32,0.12)" }}>
                            <div className="flex items-center gap-1.5 mb-2">
                              <XCircle size={13} style={{ color: "#a02020" }} />
                              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#a02020", textTransform: "uppercase", letterSpacing: "0.05em" }}>Before</span>
                            </div>
                            <p style={{ fontSize: "0.85rem", color: "#5a2020", lineHeight: 1.65, whiteSpace: "pre-wrap" }}>{p.before}</p>
                          </div>
                          {/* After */}
                          <div className="rounded-lg p-4" style={{ background: "#e8f5f7", border: "1px solid rgba(11,113,137,0.15)" }}>
                            <div className="flex items-center gap-1.5 mb-2">
                              <CheckCircle size={13} style={{ color: "#0b7189" }} />
                              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#0b7189", textTransform: "uppercase", letterSpacing: "0.05em" }}>After</span>
                            </div>
                            <p style={{ fontSize: "0.85rem", color: "#1a4a54", lineHeight: 1.65, whiteSpace: "pre-wrap" }}>{p.after}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Common Mistakes */}
        {activeTab === "mistakes" && (
          <div className="space-y-3">
            {mistakes.map(({ mistake, example, fix }, i) => (
              <div
                key={i}
                className="rounded-xl p-5"
                style={{ background: "#ffffff", border: "1px solid rgba(23,10,28,0.07)" }}
              >
                <div className="flex items-start gap-3 mb-3">
                  <div
                    className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: "#fdf0f0" }}
                  >
                    <XCircle size={13} style={{ color: "#a02020" }} />
                  </div>
                  <p style={{ fontSize: "0.925rem", fontWeight: 600, color: "#170a1c" }}>{mistake}</p>
                </div>
                <div className="grid gap-3 ml-9" style={{ gridTemplateColumns: "1fr 1fr" }}>
                  <div className="rounded-lg p-3" style={{ background: "#fdf0f0" }}>
                    <p style={{ fontSize: "0.72rem", fontWeight: 700, color: "#a02020", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" }}>
                      Problematic
                    </p>
                    <p style={{ fontSize: "0.82rem", color: "#5a2020", lineHeight: 1.6, fontStyle: "italic" }}>{example}</p>
                  </div>
                  <div className="rounded-lg p-3" style={{ background: "#e8f5f7" }}>
                    <p style={{ fontSize: "0.72rem", fontWeight: 700, color: "#0b7189", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" }}>
                      Better
                    </p>
                    <p style={{ fontSize: "0.82rem", color: "#1a4a54", lineHeight: 1.6 }}>{fix}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Checklist */}
        {activeTab === "checklist" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <p style={{ fontSize: "0.875rem", color: "#6b6480" }}>
                Check off each item before publishing any security instruction.
              </p>
              <span
                className="px-3 py-1.5 rounded-lg text-sm font-semibold"
                style={{
                  background: checked.size === checklist.length ? "#e8f5f7" : "#edeaf5",
                  color: checked.size === checklist.length ? "#0b7189" : "#6b6480",
                  fontFamily: "DM Mono, monospace",
                }}
              >
                {checked.size} / {checklist.length}
              </span>
            </div>
            <div className="space-y-2">
              {checklist.map(({ item, category }, i) => (
                <button
                  key={i}
                  onClick={() => toggle(i)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left transition-all duration-150"
                  style={{
                    background: checked.has(i) ? "#e8f5f7" : "#ffffff",
                    border: `1px solid ${checked.has(i) ? "rgba(11,113,137,0.18)" : "rgba(23,10,28,0.07)"}`,
                  }}
                >
                  <div
                    className="w-5 h-5 rounded flex items-center justify-center shrink-0"
                    style={{
                      background: checked.has(i) ? "#0b7189" : "#edeaf5",
                      border: `1.5px solid ${checked.has(i) ? "#0b7189" : "rgba(23,10,28,0.15)"}`,
                    }}
                  >
                    {checked.has(i) && <CheckCircle size={11} color="white" />}
                  </div>
                  <span
                    style={{
                      fontSize: "0.875rem",
                      color: checked.has(i) ? "#0b7189" : "#170a1c",
                      fontWeight: 500,
                      flex: 1,
                      textDecoration: checked.has(i) ? "line-through" : "none",
                      opacity: checked.has(i) ? 0.7 : 1,
                    }}
                  >
                    {item}
                  </span>
                  <span
                    className="px-2 py-0.5 rounded text-xs font-medium shrink-0"
                    style={{ background: "#edeaf5", color: "#6b6480" }}
                  >
                    {category}
                  </span>
                </button>
              ))}
            </div>

            {checked.size === checklist.length && (
              <div
                className="mt-5 rounded-xl p-4 flex items-center gap-3"
                style={{ background: "#e8f5f7", border: "1px solid rgba(11,113,137,0.20)" }}
              >
                <CheckCircle size={20} style={{ color: "#0b7189", flexShrink: 0 }} />
                <div>
                  <p style={{ fontSize: "0.9rem", fontWeight: 600, color: "#0b7189" }}>All items complete</p>
                  <p style={{ fontSize: "0.8rem", color: "#2a6a72" }}>
                    This document meets CypherClear accessibility standards. Ready to publish.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
