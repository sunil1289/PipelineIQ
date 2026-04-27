
import { useEffect, useRef, useState } from "react";

// ── Color tokens (all via CSS vars set in globals.css) ───────────────────────
const COLOR_MAP = {
  blue: {
    accent: "var(--blue-500)",
    bg: "var(--blue-50)",
    border: "var(--border-default)",
    text: "var(--blue-700)",
    dot: "var(--blue-500)",
  },
  green: {
    accent: "var(--green-500)",
    bg: "var(--green-50)",
    border: "rgba(34,197,94,0.22)",
    text: "var(--green-600)",
    dot: "var(--green-500)",
  },
  red: {
    accent: "var(--red-500)",
    bg: "var(--red-50)",
    border: "rgba(239,68,68,0.22)",
    text: "var(--red-600)",
    dot: "var(--red-500)",
  },
  amber: {
    accent: "#f59e0b",
    bg: "var(--amber-50)",
    border: "rgba(245,158,11,0.22)",
    text: "var(--amber-text)",
    dot: "#f59e0b",
  },
  purple: {
    accent: "#a855f7",
    bg: "var(--purple-50)",
    border: "rgba(168,85,247,0.22)",
    text: "var(--purple-text)",
    dot: "#a855f7",
  },
};

// ── Ripple helper ────────────────────────────────────────────────────────────
function useRipple() {
  const [ripples, setRipples] = useState([]);

  const addRipple = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const id = Date.now();
    setRipples((r) => [
      ...r,
      { id, x: e.clientX - rect.left, y: e.clientY - rect.top },
    ]);
    setTimeout(() => setRipples((r) => r.filter((rp) => rp.id !== id)), 600);
  };

  return { ripples, addRipple };
}

// ── StatCard ─────────────────────────────────────────────────────────────────
export default function StatCard({
  title,
  value,
  subtitle,
  color = "blue",
  icon,
  trend,
  onClick,
  className = "",
}) {
  const c = COLOR_MAP[color] || COLOR_MAP.blue;
  const numRef = useRef(null);
  const { ripples, addRipple } = useRipple();
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);

  // Bounce the number when value changes
  useEffect(() => {
    if (!numRef.current) return;
    numRef.current.style.animation = "none";
    void numRef.current.offsetHeight;
    numRef.current.style.animation = "";
  }, [value]);

  const handleClick = (e) => {
    addRipple(e);
    onClick?.(e);
  };

  return (
    <div
      className={className}
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
        setPressed(false);
      }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      style={{
        position: "relative",
        overflow: "hidden",
        padding: "18px 18px 16px",
        background: "var(--bg-surface)",
        border: "1px solid",
        borderColor: hovered ? c.border : "var(--border-subtle)",
        borderRadius: "var(--radius-lg)",
        boxShadow: hovered
          ? `var(--shadow-md), 0 0 0 3px ${c.bg}`
          : "var(--shadow-sm)",
        cursor: onClick ? "pointer" : "default",
        transform: pressed
          ? "scale(0.98) translateY(0)"
          : hovered
            ? "translateY(-3px)"
            : "translateY(0)",
        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        userSelect: "none",
      }}
    >
      {/* Accent strip */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "3px",
          background: c.accent,
          opacity: hovered ? 1 : 0,
          transition: "opacity 0.2s ease",
          borderRadius: "var(--radius-lg) var(--radius-lg) 0 0",
        }}
      />

      {/* Ripples */}
      {ripples.map((rp) => (
        <span
          key={rp.id}
          style={{
            position: "absolute",
            borderRadius: "50%",
            width: "120px",
            height: "120px",
            left: rp.x - 60,
            top: rp.y - 60,
            background: c.accent,
            opacity: 0,
            pointerEvents: "none",
            animation: "rippleOut 0.6s ease-out forwards",
          }}
        />
      ))}

      {/* Header row */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: "12px",
        }}
      >
        <span
          style={{
            fontSize: "10px",
            fontWeight: 700,
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.07em",
          }}
        >
          {title}
        </span>
        {icon && (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "5px 7px",
              borderRadius: "var(--radius-sm)",
              background: "var(--bg-surface)", 
              border: `1px solid ${c.border}`,
              lineHeight: 1,
              transition: "transform 0.2s ease",
              transform: hovered ? "scale(1.12) rotate(-4deg)" : "scale(1)",
            }}
          >
            {typeof icon === "string" &&
            (icon.endsWith(".png") ||
              icon.endsWith(".svg") ||
              icon.endsWith(".jpg") ||
              icon.startsWith("/") ||
              icon.startsWith("data:")) ? (
              <img
                src={icon}
                alt=""
                style={{
                  width: "18px",
                  height: "18px",
                  objectFit: "contain",
                  display: "block",
                }}
              />
            ) : (
              icon
            )}
          </span>
        )}
      </div>


      <div
        ref={numRef}
        style={{
          fontSize: "28px",
          fontWeight: 800,
          fontFamily: "var(--font-mono)",
          letterSpacing: "-0.04em",
          lineHeight: 1,
          color: c.text,
          marginBottom: "6px",
          animation: "countBounce 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both",
        }}
      >
        {value ?? "—"}
      </div>

      {/* Subtitle */}
      {subtitle && (
        <div
          style={{
            fontSize: "11px",
            color: "var(--text-muted)",
            lineHeight: 1.4,
          }}
        >
          {subtitle}
        </div>
      )}

      {/* Trend */}
      {trend !== undefined && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            marginTop: "8px",
            fontSize: "11px",
            fontWeight: 700,
            fontFamily: "var(--font-mono)",
            color: trend >= 0 ? "var(--green-600)" : "var(--red-600)",
          }}
        >
          <span>{trend >= 0 ? "↑" : "↓"}</span>
          <span>{Math.abs(trend)}% vs last week</span>
        </div>
      )}

      <style>{`
        @keyframes rippleOut {
          0%   { transform: scale(0); opacity: 0.18; }
          100% { transform: scale(1); opacity: 0; }
        }
        @keyframes countBounce {
          0%   { opacity: 0; transform: translateY(6px) scale(0.94); }
          60%  { transform: translateY(-2px) scale(1.02); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
