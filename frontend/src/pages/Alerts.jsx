import { useState, useEffect, useCallback, useRef } from "react";
import { getAlerts, acknowledgeAlert, acknowledgeAllAlerts } from "../api/api";
import { formatDistanceToNow, format } from "date-fns";
import {
  CircleCheck,
  CircleDashed,
  Bell,
  BellOff,
  Download,
  RefreshCw,
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────
const POLL_INTERVAL = 20_000;

const SEV = {
  CRITICAL: {
    pill: { className: "pill pill-danger" },
    iconBg: "var(--red-50)",
    iconColor: "var(--red-600)",
    border: "rgba(239,68,68,0.18)",
    dot: "#ef4444",
    rank: 0,
    label: "Critical",
    symbol: "C",
  },
  HIGH: {
    pill: {
      style: {
        background: "var(--amber-50)",
        color: "var(--amber-text)",
        borderColor: "rgba(245,158,11,0.25)",
      },
    },
    iconBg: "var(--amber-50)",
    iconColor: "var(--amber-text)",
    border: "rgba(245,158,11,0.18)",
    dot: "#f59e0b",
    rank: 1,
    label: "High",
    symbol: "H",
  },
  MEDIUM: {
    pill: { className: "pill pill-running" },
    iconBg: "var(--purple-50)",
    iconColor: "var(--purple-text)",
    border: "rgba(168,85,247,0.18)",
    dot: "#a855f7",
    rank: 2,
    label: "Medium",
    symbol: "M",
  },
  LOW: {
    pill: { className: "pill pill-aborted" },
    iconBg: "var(--bg-elevated)",
    iconColor: "var(--text-muted)",
    border: "var(--border-subtle)",
    dot: "#94a3b8",
    rank: 3,
    label: "Low",
    symbol: "L",
  },
};

const FILTERS = [
  { key: "unacked", label: "Open" },
  { key: "all", label: "All" },
  { key: "acked", label: "Acknowledged" },
];

const SORT_OPTIONS = [
  { key: "newest", label: "Newest first" },
  { key: "oldest", label: "Oldest first" },
  { key: "severity", label: "By severity" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function timeAgo(ts) {
  if (!ts) return "—";
  try {
    return formatDistanceToNow(new Date(ts), { addSuffix: true });
  } catch {
    return "—";
  }
}

function fmtDate(ts) {
  if (!ts) return "—";
  try {
    return format(new Date(ts), "MMM d, HH:mm");
  } catch {
    return "—";
  }
}

function sortAlerts(alerts, sortKey) {
  const copy = [...alerts];
  if (sortKey === "newest")
    return copy.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  if (sortKey === "oldest")
    return copy.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  if (sortKey === "severity")
    return copy.sort(
      (a, b) => (SEV[a.severity]?.rank ?? 9) - (SEV[b.severity]?.rank ?? 9),
    );
  return copy;
}

function downloadReport(alerts) {
  try {
    const payload = {
      exportedAt: new Date().toISOString(),
      total: alerts.length,
      acknowledged: alerts.filter((a) => a.acknowledged).length,
      alerts,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `alerts-${format(new Date(), "yyyy-MM-dd")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error("Export failed:", err);
  }
}

// ─── SeverityBadge ────────────────────────────────────────────────────────────
function SeverityBadge({ severity }) {
  const sev = SEV[severity] ?? SEV.CRITICAL;
  const { className, style } = sev.pill;
  return (
    <span className={className ?? "pill"} style={style}>
      <span
        style={{
          width: "5px",
          height: "5px",
          borderRadius: "50%",
          background: sev.dot,
          display: "inline-block",
          flexShrink: 0,
        }}
      />
      {sev.label}
    </span>
  );
}

// ─── AlertCard ────────────────────────────────────────────────────────────────
function AlertCard({ alert, onAck, acking, index }) {
  const sev = SEV[alert.severity] ?? SEV.CRITICAL;
  const acked = alert.acknowledged;
  const isAcking = acking === alert.id;

  return (
    <div
      className="card animate-in"
      style={{
        display: "flex",
        gap: "14px",
        alignItems: "flex-start",
        padding: "16px 18px",
        animationDelay: `${index * 0.04}s`,
        opacity: acked ? 0.6 : 1,
        transition: "opacity 0.4s ease, box-shadow 0.15s ease",
        borderLeft: `3px solid ${acked ? "var(--border-subtle)" : sev.dot}`,
        borderRadius: "var(--radius-lg)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Severity icon tile */}
      <div
        style={{
          width: "36px",
          height: "36px",
          flexShrink: 0,
          borderRadius: "var(--radius-md)",
          background: acked ? "var(--bg-elevated)" : sev.iconBg,
          border: `1px solid ${acked ? "var(--border-subtle)" : sev.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "11px",
          fontWeight: 700,
          color: acked ? "var(--text-muted)" : sev.iconColor,
          fontFamily: "var(--font-mono)",
          transition: "all 0.3s ease",
          userSelect: "none",
        }}
      >
        {acked ? "✓" : sev.symbol}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Top row */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: "7px",
            marginBottom: "5px",
          }}
        >
          <span
            style={{
              fontSize: "13px",
              fontWeight: 700,
              color: acked ? "var(--text-secondary)" : "var(--text-primary)",
              fontFamily: "var(--font-mono)",
              letterSpacing: "-0.01em",
            }}
          >
            {alert.jobName}
          </span>

          {!acked && <SeverityBadge severity={alert.severity} />}

          {acked && (
            <span className="pill pill-success" style={{ fontSize: "10px" }}>
              ✓ Acknowledged
            </span>
          )}
        </div>

        {/* Message */}
        <p
          style={{
            fontSize: "12px",
            color: "var(--text-secondary)",
            marginBottom: "9px",
            lineHeight: 1.65,
          }}
        >
          {alert.message}
        </p>

        {/* Meta row */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: "12px",
            fontSize: "11px",
            color: "var(--text-muted)",
            fontFamily: "var(--font-mono)",
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <span style={{ opacity: 0.6 }}>fired</span>
            {timeAgo(alert.createdAt)}
          </span>

          {alert.createdAt && (
            <span
              style={{
                padding: "1px 7px",
                borderRadius: "var(--radius-full)",
                background: "var(--bg-elevated)",
                border: "1px solid var(--border-subtle)",
                fontSize: "10px",
              }}
            >
              {fmtDate(alert.createdAt)}
            </span>
          )}

          {acked && alert.resolvedAt && (
            <span
              style={{
                color: "var(--green-600)",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <span style={{ opacity: 0.7 }}>resolved</span>
              {timeAgo(alert.resolvedAt)}
            </span>
          )}
        </div>
      </div>

      {/* Ack button */}
      {!acked && (
        <button
          className="btn btn-ghost"
          onClick={() => onAck(alert.id)}
          disabled={isAcking}
          style={{
            flexShrink: 0,
            fontSize: "12px",
            padding: "6px 12px",
            opacity: isAcking ? 0.7 : 1,
          }}
        >
          {isAcking ? (
            <span className="spinner" />
          ) : (
            <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Ack
            </span>
          )}
        </button>
      )}
    </div>
  );
}

// ─── Summary stats bar ────────────────────────────────────────────────────────
function StatsBar({ alerts }) {
  const total = alerts.length;
  const acked = alerts.filter((a) => a.acknowledged).length;
  const unacked = total - acked;
  const critical = alerts.filter(
    (a) => !a.acknowledged && a.severity === "CRITICAL",
  ).length;
  const high = alerts.filter(
    (a) => !a.acknowledged && a.severity === "HIGH",
  ).length;

  const stats = [
    {
      label: "Open",
      value: unacked,
      dot: unacked > 0 ? "#ef4444" : "var(--text-muted)",
    },
    {
      label: "Critical",
      value: critical,
      dot: critical > 0 ? "#ef4444" : "var(--text-muted)",
    },
    {
      label: "High",
      value: high,
      dot: high > 0 ? "#f59e0b" : "var(--text-muted)",
    },
    { label: "Resolved", value: acked, dot: "#22c55e" },
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: "10px",
        marginBottom: "24px",
      }}
    >
      {stats.map(({ label, value, dot }) => (
        <div
          key={label}
          className="card"
          style={{
            padding: "14px 16px",
            display: "flex",
            flexDirection: "column",
            gap: "4px",
          }}
        >
          <span
            style={{
              fontSize: "11px",
              color: "var(--text-muted)",
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
              gap: "5px",
            }}
          >
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: dot,
                flexShrink: 0,
                transition: "background 0.3s ease",
              }}
            />
            {label}
          </span>
          <span
            style={{
              fontSize: "22px",
              fontWeight: 700,
              color: "var(--text-primary)",
              fontFamily: "var(--font-mono)",
              letterSpacing: "-0.03em",
              lineHeight: 1,
            }}
          >
            {value}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({ filter }) {
  const isAllClear = filter === "unacked";
  return (
    <div
      className="card"
      style={{
        padding: "56px 24px",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "12px",
      }}
    >
      <div
        style={{
          width: "52px",
          height: "52px",
          borderRadius: "var(--radius-lg)",
          background: isAllClear ? "var(--green-50)" : "var(--bg-elevated)",
          border: "1px solid var(--border-subtle)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {isAllClear ? (
          <CircleCheck
            size={24}
            strokeWidth={1.5}
            style={{ color: "#22c55e" }}
          />
        ) : (
          <CircleDashed
            size={24}
            strokeWidth={1.5}
            style={{ color: "#94a3b8" }}
          />
        )}
      </div>
      <p
        style={{
          fontSize: "13px",
          fontWeight: 600,
          color: "var(--text-primary)",
        }}
      >
        {isAllClear ? "All clear" : "Nothing here"}
      </p>
      <p
        style={{
          fontSize: "12px",
          color: "var(--text-muted)",
          maxWidth: "240px",
        }}
      ></p>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div
      className="card"
      style={{
        padding: "16px 18px",
        display: "flex",
        gap: "14px",
        alignItems: "flex-start",
        borderLeft: "3px solid var(--border-subtle)",
      }}
    >
      <div
        className="skeleton"
        style={{
          width: "36px",
          height: "36px",
          borderRadius: "var(--radius-md)",
          flexShrink: 0,
        }}
      />
      <div style={{ flex: 1 }}>
        <div
          className="skeleton"
          style={{ height: "11px", width: "42%", marginBottom: "8px" }}
        />
        <div
          className="skeleton"
          style={{ height: "10px", width: "75%", marginBottom: "6px" }}
        />
        <div className="skeleton" style={{ height: "10px", width: "30%" }} />
      </div>
    </div>
  );
}


function ErrorBanner({ message, onRetry }) {
  return (
    <div
      className="animate-fade"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
        padding: "12px 16px",
        marginBottom: "20px",
        borderRadius: "var(--radius-md)",
        background: "var(--red-50)",
        border: "1px solid rgba(239,68,68,0.2)",
        color: "var(--red-text)",
        fontSize: "12px",
      }}
    >
      <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        {message}
      </span>
      <button
        onClick={onRetry}
        style={{
          fontSize: "11px",
          fontWeight: 600,
          color: "var(--red-600)",
          background: "none",
          border: "1px solid rgba(239,68,68,0.3)",
          borderRadius: "var(--radius-sm)",
          padding: "4px 10px",
          cursor: "pointer",
          fontFamily: "var(--font-body)",
        }}
      >
        Retry
      </button>
    </div>
  );
}

function FilterTabs({ filter, setFilter, counts }) {
  return (
    <div
      style={{
        display: "flex",
        gap: "4px",
        padding: "3px",
        background: "var(--bg-elevated)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-md)",
        width: "fit-content",
      }}
    >
      {FILTERS.map(({ key, label }) => {
        const count = counts[key] ?? 0;
        const isActive = filter === key;
        return (
          <button
            key={key}
            onClick={() => setFilter(key)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "5px 12px",
              borderRadius: "var(--radius-sm)",
              border: "none",
              background: isActive ? "var(--bg-surface)" : "transparent",
              color: isActive ? "var(--text-primary)" : "var(--text-muted)",
              fontSize: "12px",
              fontWeight: isActive ? 700 : 500,
              cursor: "pointer",
              transition: "all 150ms ease",
              boxShadow: isActive
                ? "0 1px 3px rgba(0,0,0,0.1), 0 0 0 1px var(--border-subtle)"
                : "none",
              fontFamily: "var(--font-body)",
              whiteSpace: "nowrap",
            }}
          >
            {label}
            <span
              style={{
                minWidth: "18px",
                padding: "1px 5px",
                borderRadius: "var(--radius-full)",
                background: isActive ? "var(--blue-50)" : "var(--bg-elevated)",
                color: isActive ? "var(--blue-600)" : "var(--text-muted)",
                fontSize: "10px",
                fontWeight: 700,
                textAlign: "center",
                border: isActive
                  ? "1px solid var(--border-default)"
                  : "1px solid transparent",
                transition: "all 150ms ease",
              }}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Sort select ──────────────────────────────────────────────────────────────
function SortSelect({ value, onChange }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        fontSize: "12px",
        fontWeight: 600,
        color: "var(--text-secondary)",
        background: "var(--bg-elevated)",
        border: "1px solid var(--border-default)",
        borderRadius: "var(--radius-md)",
        padding: "6px 10px",
        cursor: "pointer",
        outline: "none",
        fontFamily: "var(--font-body)",
        appearance: "none",
        paddingRight: "28px",
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%2394a3b8' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 8px center",
      }}
    >
      {SORT_OPTIONS.map(({ key, label }) => (
        <option key={key} value={key}>
          {label}
        </option>
      ))}
    </select>
  );
}

// ─── Live indicator ───────────────────────────────────────────────────────────
function LiveDot({ active }) {
  return (
    <span
      title={active ? "Polling every 20s" : "Paused"}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        fontSize: "11px",
        color: "var(--text-muted)",
        fontFamily: "var(--font-mono)",
      }}
    >
      <span
        style={{
          width: "6px",
          height: "6px",
          borderRadius: "50%",
          background: active ? "#22c55e" : "#94a3b8",
          ...(active ? { animation: "livePulse 2s ease infinite" } : {}),
        }}
      />
      live
      <style>{`@keyframes livePulse { 0%,100%{opacity:1} 50%{opacity:.35} }`}</style>
    </span>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ackingId, setAckingId] = useState(null);
  const [ackAll, setAckAll] = useState(false);
  const [filter, setFilter] = useState("unacked");
  const [sort, setSort] = useState("newest");
  const [isPolling, setIsPolling] = useState(true);
  const timerRef = useRef(null);

  // ── Data loading ─────────────────────────────────────────────────────────
  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading((prev) => prev); // keep existing skeleton on first load
    try {
      const res = await getAlerts();
      setAlerts(res.data ?? []);
      setError(null);
    } catch (err) {
      console.error("Failed to load alerts:", err);
      setError("Could not load alerts — is the backend running?");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!isPolling) {
      clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => load(true), POLL_INTERVAL);
    return () => clearInterval(timerRef.current);
  }, [isPolling, load]);

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleAck = async (id) => {
    setAckingId(id);
    try {
      await acknowledgeAlert(id);
      const now = new Date().toISOString();
      setAlerts((prev) =>
        prev.map((a) =>
          a.id === id ? { ...a, acknowledged: true, resolvedAt: now } : a,
        ),
      );
    } catch (err) {
      console.error("Ack failed:", err);
      alert(`Failed to acknowledge: ${err.message}`);
    } finally {
      setAckingId(null);
    }
  };

  const handleAckAll = async () => {
    if (!window.confirm("Acknowledge all open alerts?")) return;
    setAckAll(true);
    try {
      await acknowledgeAllAlerts();
      const now = new Date().toISOString();
      setAlerts((prev) =>
        prev.map((a) => ({ ...a, acknowledged: true, resolvedAt: now })),
      );
    } catch (err) {
      console.error("Ack-all failed:", err);
      alert(`Failed to acknowledge all: ${err.message}`);
    } finally {
      setAckAll(false);
    }
  };

  // ── Derived ───────────────────────────────────────────────────────────────
  const unacked = alerts.filter((a) => !a.acknowledged);
  const acked = alerts.filter((a) => a.acknowledged);

  const counts = {
    unacked: unacked.length,
    all: alerts.length,
    acked: acked.length,
  };

  const baseList =
    filter === "unacked" ? unacked : filter === "acked" ? acked : alerts;

  const displayed = sortAlerts(baseList, sort);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      className="main-content animate-in"
      style={{
        maxWidth: "var(--content-max)",
        margin: "0 auto",
        padding: "28px 24px",
      }}
    >
      {/* Page header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: "24px",
          gap: "16px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "4px",
            }}
          >
            <h1
              style={{
                fontSize: "20px",
                fontWeight: 700,
                color: "var(--text-primary)",
                letterSpacing: "-0.03em",
              }}
            >
              Alerts
            </h1>
            {unacked.length > 0 && (
              <span
                className="pill pill-danger"
                style={{ fontSize: "10px", letterSpacing: "0.02em" }}
              >
                {unacked.length} open
              </span>
            )}
            <LiveDot active={isPolling} />
          </div>
          <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>
            Build failure notifications from Jenkins
          </p>
        </div>

        {/* Action buttons */}
        <div
          style={{
            display: "flex",
            gap: "8px",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <button
            className="btn btn-ghost"
            onClick={() => setIsPolling((p) => !p)}
            title={isPolling ? "Pause auto-refresh" : "Resume auto-refresh"}
            style={{ fontSize: "12px", padding: "6px 12px" }}
          >
            {isPolling ? <BellOff size={13} /> : <Bell size={13} />}
            {isPolling ? "Pause" : "Resume"}
          </button>

          <button
            className="btn btn-ghost"
            onClick={() => downloadReport(alerts)}
            style={{ fontSize: "12px", padding: "6px 12px" }}
          >
            <Download size={13} />
            Export
          </button>

          <button
            className="btn btn-ghost"
            onClick={() => load()}
            style={{ fontSize: "12px", padding: "6px 12px" }}
          >
            <RefreshCw size={13} />
            Refresh
          </button>

          {unacked.length > 0 && (
            <button
              className="btn btn-primary"
              onClick={handleAckAll}
              disabled={ackAll}
              style={{ fontSize: "12px", padding: "6px 14px" }}
            >
              {ackAll ? (
                <span className="spinner" />
              ) : (
                <>
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Ack all
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Stats bar */}
      {!loading && alerts.length > 0 && <StatsBar alerts={alerts} />}

      {/* Error */}
      {error && <ErrorBanner message={error} onRetry={load} />}

      {/* Controls row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          marginBottom: "14px",
          flexWrap: "wrap",
        }}
      >
        <FilterTabs filter={filter} setFilter={setFilter} counts={counts} />
        <SortSelect value={sort} onChange={setSort} />
      </div>

      {/* List */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <EmptyState filter={filter} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {displayed.map((alert, i) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onAck={handleAck}
              acking={ackingId}
              index={i}
            />
          ))}
        </div>
      )}

      {/* Footer */}
      {!loading && alerts.length > 0 && (
        <p
          style={{
            marginTop: "18px",
            textAlign: "center",
            fontSize: "11px",
            color: "var(--text-muted)",
            fontFamily: "var(--font-mono)",
          }}
        >
          {acked.length} / {alerts.length} resolved
          {" · "}last refreshed {fmtDate(new Date().toISOString())}
        </p>
      )}
    </div>
  );
}
