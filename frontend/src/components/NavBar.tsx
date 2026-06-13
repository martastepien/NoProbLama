import { Plus } from "lucide-react";
import { NavLink, useNavigate } from "react-router";
import logo from "../imports/Noproblammalogo.png";

const navItems = [
  { to: "/", label: "Dashboard" },
  { to: "/reviews", label: "Reviews" },
  { to: "/insights", label: "Insights" },
  { to: "/guidelines", label: "Guidelines" },
];

export function NavBar() {
  const navigate = useNavigate();

  return (
    <header
      style={{
        background: "#ffffff",
        borderBottom: "1px solid rgba(23,10,28,0.08)",
        height: "60px",
      }}
      className="sticky top-0 z-50 flex items-center"
    >
      <div className="w-full max-w-7xl mx-auto px-6 flex items-center justify-between">
        <NavLink to="/" className="flex items-center gap-2.5 shrink-0">
          <img src={logo} alt="NoProbLama logo" style={{ width: "32px", height: "32px", objectFit: "contain" }} />
          <span style={{ color: "#170a1c", letterSpacing: "-0.025em", fontSize: "1rem" }} className="font-bold">
            NoProbLama
          </span>
        </NavLink>

        <nav className="flex items-center gap-0.5">
          {navItems.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              style={({ isActive }) => ({
                padding: "6px 14px",
                borderRadius: "6px",
                fontSize: "0.85rem",
                fontWeight: 500,
                color: isActive ? "#170a1c" : "#6b6480",
                background: isActive ? "#edeaf5" : "transparent",
                transition: "all 0.15s",
              })}
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <button
          onClick={() => navigate("/review/new")}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150 hover:opacity-90 active:scale-[0.98]"
          style={{ background: "#228cdb", color: "#ffffff", fontSize: "0.85rem" }}
        >
          <Plus size={14} />
          New Review
        </button>
      </div>
    </header>
  );
}
