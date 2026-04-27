import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { getAlertCount } from "../api/api";
import { useTheme, useWideView } from "./useTheme";
import Logo from "../assets/Logo.png";

function NavLink({ to, label, active }) {
  return (
    <Link
      to={to}
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "6px 14px",
        borderRadius: "var(--radius-md)",
        fontSize: "13px",
        fontWeight: active ? 600 : 500,
        textDecoration: "none",
        color: active ? "var(--blue-600)" : "var(--text-secondary)",
        background: active ? "var(--blue-50)" : "transparent",
        border: active
          ? "1px solid var(--border-default)"
          : "1px solid transparent",
        transition: "all var(--transition)",
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.color = "var(--blue-600)";
          e.currentTarget.style.background = "var(--blue-50)";
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.color = "var(--text-secondary)";
          e.currentTarget.style.background = "transparent";
        }
      }}
    >
      {label}
    </Link>
  );
}

function AlertNavLink({ to, active, count }) {
  return (
    <Link
      to={to}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "7px",
        padding: "6px 14px",
        borderRadius: "var(--radius-md)",
        fontSize: "13px",
        fontWeight: active ? 600 : 500,
        textDecoration: "none",
        color: active
          ? "var(--blue-600)"
          : count > 0
            ? "var(--red-600)"
            : "var(--text-secondary)",
        background: active ? "var(--blue-50)" : "transparent",
        border: active
          ? "1px solid var(--border-default)"
          : "1px solid transparent",
        transition: "all var(--transition)",
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.color =
            count > 0 ? "var(--red-600)" : "var(--blue-600)";
          e.currentTarget.style.background =
            count > 0 ? "var(--red-50)" : "var(--blue-50)";
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.color =
            count > 0 ? "var(--red-600)" : "var(--text-secondary)";
          e.currentTarget.style.background = "transparent";
        }
      }}
    >
      Alerts
      {count > 0 && (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            minWidth: "18px",
            height: "18px",
            padding: "0 5px",
            borderRadius: "var(--radius-full)",
            background: "var(--red-500)",
            color: "#fff",
            fontSize: "10px",
            fontWeight: 700,
            fontFamily: "var(--font-mono)",
            lineHeight: 1,
            animation: "fadeIn 0.3s ease",
          }}
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}

function IconBtn({ onClick, title, children, active }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      title={title}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: "34px",
        height: "34px",
        borderRadius: "var(--radius-md)",
        border: "1px solid",
        borderColor:
          active || hover ? "var(--border-default)" : "var(--border-subtle)",
        background: active
          ? "var(--blue-50)"
          : hover
            ? "var(--bg-elevated)"
            : "transparent",
        color: active
          ? "var(--blue-600)"
          : hover
            ? "var(--text-primary)"
            : "var(--text-muted)",
        cursor: "pointer",
        fontSize: "15px",
        transition: "all var(--transition)",
      }}
    >
      {children}
    </button>
  );
}

export default function Navbar({ onDownload }) {
  const [alertCount, setAlertCount] = useState(0);
  const [online, setOnline] = useState(true);
  const location = useLocation();
  const { theme, toggle: toggleTheme } = useTheme();
  const { wide, toggle: toggleWide } = useWideView();

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await getAlertCount();
        setAlertCount(res.data.count || 0);
        setOnline(true);
      } catch {
        setOnline(false);
      }
    };
    fetchCount();
    const iv = setInterval(fetchCount, 15000);
    return () => clearInterval(iv);
  }, []);

  const isActive = (path) => location.pathname === path;

  return (
    <nav
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        height: "var(--nav-height)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
        background: "var(--bg-overlay)",
        borderBottom: "1px solid var(--border-subtle)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        boxShadow: "var(--shadow-sm)",
        transition: "background 0.3s ease, border-color 0.3s ease",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <img
          src={Logo}
          alt="PipelineIQ"
          style={{ height: "90px", width: "auto", objectFit: "contain" }}
        />
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "4px",
          padding: "4px",
          background: "var(--bg-elevated)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-md)",
        }}
      >
        <NavLink to="/" label="Dashboard" active={isActive("/")} />
        <AlertNavLink
          to="/alerts"
          active={isActive("/alerts")}
          count={alertCount}
        />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "5px 12px",
            borderRadius: "var(--radius-full)",
            border: "1px solid",
            borderColor: online
              ? "rgba(34,197,94,0.25)"
              : "rgba(239,68,68,0.25)",
            background: online ? "var(--green-50)" : "var(--red-50)",
            fontSize: "11px",
            fontWeight: 600,
            fontFamily: "var(--font-mono)",
            color: online ? "var(--green-text)" : "var(--red-text)",
            transition: "all 0.3s ease",
          }}
        >
          <span
            className={online ? "pulse-dot" : ""}
            style={{
              width: "7px",
              height: "7px",
              borderRadius: "50%",
              background: online ? "var(--green-500)" : "var(--red-500)",
              flexShrink: 0,
            }}
          />
          {online ? "Live" : "Offline"}
        </div>

        <div
          style={{
            width: "1px",
            height: "20px",
            background: "var(--border-subtle)",
          }}
        />

        <IconBtn
          onClick={toggleWide}
          title={wide ? "Normal view" : "Wide view"}
          active={wide}
        >
          {wide ? "⊟" : "⊞"}
        </IconBtn>

        {onDownload && (
          <IconBtn onClick={onDownload} title="Download report">
            ⬇
          </IconBtn>
        )}

        <IconBtn
          onClick={toggleTheme}
          title={theme === "light" ? "Switch to dark" : "Switch to light"}
        >
          {theme === "light" ? "🌙" : "☀️"}
        </IconBtn>
      </div>
    </nav>
  );
}
