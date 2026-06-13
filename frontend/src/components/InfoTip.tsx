import { useState } from "react";
import { Info } from "lucide-react";

/**
 * Small "i" icon that reveals a plain-English explanation on hover / focus / tap.
 * Used to make every score, persona, and metric transparent: the user can always
 * see exactly how a number was defined.
 */
export function InfoTip({ text, width = 250 }: { text: string; width?: number }) {
  const [open, setOpen] = useState(false);

  return (
    <span style={{ position: "relative", display: "inline-flex", verticalAlign: "middle" }}>
      <button
        type="button"
        aria-label="How this is calculated"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
        style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          width: 15, height: 15, borderRadius: "50%", color: "#9c95dc", padding: 0,
        }}
      >
        <Info size={13} />
      </button>
      {open && (
        <span
          role="tooltip"
          style={{
            position: "absolute", zIndex: 60, top: "20px", left: "0",
            width, background: "#170a1c", color: "#ffffff",
            fontSize: "0.72rem", lineHeight: 1.55, fontWeight: 400,
            textTransform: "none", letterSpacing: "normal",
            padding: "9px 11px", borderRadius: 8,
            boxShadow: "0 8px 24px rgba(23,10,28,0.22)",
            whiteSpace: "normal",
          }}
        >
          {text}
        </span>
      )}
    </span>
  );
}
