type MascotMode = "neutral" | "explaining" | "warning";

interface MascotProps {
  mode?: MascotMode;
  size?: number;
  className?: string;
}

export function Mascot({ mode = "neutral", size = 120, className = "" }: MascotProps) {
  const armAngle = mode === "explaining" ? -30 : mode === "warning" ? 10 : 0;
  const eyebrowOffset = mode === "warning" ? -3 : 0;
  const shieldColor = mode === "warning" ? "#f0956e" : "#3da899";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Glow aura */}
      <circle cx="60" cy="65" r="48" fill={shieldColor} fillOpacity="0.08" />

      {/* Body - soft rounded rectangle */}
      <rect x="36" y="62" width="48" height="42" rx="18" fill="#ede8f8" />

      {/* Left arm */}
      <g transform={`rotate(${mode === "explaining" ? armAngle : 0}, 36, 80)`}>
        <rect x="16" y="72" width="24" height="12" rx="6" fill="#ede8f8" />
      </g>

      {/* Right arm - raised when explaining */}
      <g transform={`rotate(${mode === "explaining" ? -armAngle - 20 : 0}, 84, 80)`}>
        <rect x="80" y="72" width="24" height="12" rx="6" fill="#ede8f8" />
      </g>

      {/* Head */}
      <circle cx="60" cy="50" r="26" fill="#fdf6ee" />
      <circle cx="60" cy="50" r="26" stroke="#e8dff5" strokeWidth="2" fill="none" />

      {/* Eyebrows */}
      <path
        d={`M 47 ${40 + eyebrowOffset} Q 51 ${37 + eyebrowOffset} 55 ${40 + eyebrowOffset}`}
        stroke="#5b4e8c"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d={`M 65 ${40 + eyebrowOffset} Q 69 ${37 + eyebrowOffset} 73 ${40 + eyebrowOffset}`}
        stroke="#5b4e8c"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />

      {/* Eyes */}
      <circle cx="51" cy="47" r="4.5" fill="#5b4e8c" />
      <circle cx="69" cy="47" r="4.5" fill="#5b4e8c" />
      <circle cx="52.5" cy="45.5" r="1.5" fill="white" />
      <circle cx="70.5" cy="45.5" r="1.5" fill="white" />

      {/* Smile - wider when neutral, softer when warning */}
      {mode === "warning" ? (
        <path d="M 51 57 Q 60 56 69 57" stroke="#5b4e8c" strokeWidth="2" strokeLinecap="round" fill="none" />
      ) : (
        <path d="M 50 56 Q 60 63 70 56" stroke="#5b4e8c" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      )}

      {/* Shield icon on body */}
      <path
        d="M60 70 L54 73 L54 79 Q54 84 60 87 Q66 84 66 79 L66 73 Z"
        fill={shieldColor}
        fillOpacity="0.9"
      />
      <path
        d="M57 79 L59 81 L63 77"
        stroke="white"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Pointer hand when explaining */}
      {mode === "explaining" && (
        <circle cx="12" cy="74" r="5" fill="#fdf6ee" stroke="#e8dff5" strokeWidth="1.5" />
      )}

      {/* Caution badge when warning */}
      {mode === "warning" && (
        <g transform="translate(78, 28)">
          <circle cx="12" cy="12" r="11" fill="#fef3ee" stroke="#f0956e" strokeWidth="1.5" />
          <text x="12" y="17" textAnchor="middle" fontSize="14" fill="#f0956e">!</text>
        </g>
      )}
    </svg>
  );
}
