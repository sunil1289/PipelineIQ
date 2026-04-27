import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { deletePipeline } from "../api/api";
import { formatDistanceToNow } from "date-fns";

const STATUS = {
  SUCCESS: {
    dot: "#16a34a",
    label: "Success",
    bg: "#f0fdf4",
    color: "#15803d",
    border: "rgba(34,197,94,0.3)",
  },
  FAILED: {
    dot: "#dc2626",
    label: "Failed",
    bg: "#fff1f2",
    color: "#dc2626",
    border: "rgba(239,68,68,0.3)",
  },
  FAILURE: {
    dot: "#dc2626",
    label: "Failed",
    bg: "#fff1f2",
    color: "#dc2626",
    border: "rgba(239,68,68,0.3)",
  },
  RUNNING: {
    dot: "#9333ea",
    label: "Running",
    bg: "#faf5ff",
    color: "#7e22ce",
    border: "rgba(168,85,247,0.3)",
  },
  ABORTED: {
    dot: "#64748b",
    label: "Aborted",
    bg: "#f8fafc",
    color: "#475569",
    border: "rgba(100,116,139,0.3)",
  },
};

const FILTERS = ["ALL", "SUCCESS", "FAILED", "RUNNING"];

function fmtDuration(ms) {
  if (!ms) return "—";
  const s = Math.round(ms / 1000);
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`;
}

function timeAgo(ts) {
  if (!ts) return "—";
  try {
    return formatDistanceToNow(new Date(ts), { addSuffix: true });
  } catch {
    return "—";
  }
}

function StatusPill({ status }) {
  const s = STATUS[status] || STATUS.ABORTED;
  const icons = {
    SUCCESS: "✓",
    FAILED: "✗",
    FAILURE: "✗",
    RUNNING: "⟳",
    ABORTED: "◉",
  };
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "4px 12px",
        borderRadius: "999px",
        fontSize: "11px",
        fontWeight: 700,
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`,
        whiteSpace: "nowrap",
        letterSpacing: "0.02em",
      }}
    >
      <span
        style={{
          width: "6px",
          height: "6px",
          borderRadius: "50%",
          background: s.dot,
          flexShrink: 0,
          animation: status === "RUNNING" ? "pulse 1.5s infinite" : "none",
        }}
      />
      {icons[status] || "◉"} {s.label}
    </span>
  );
}

function SortIcon({ active, dir }) {
  return (
    <span
      style={{
        marginLeft: "5px",
        fontSize: "9px",
        opacity: active ? 1 : 0.3,
        transition: "opacity 0.15s",
      }}
    >
      {active ? (dir === "asc" ? "▲" : "▼") : "⇅"}
    </span>
  );
}

function ColHeader({ label, sortKey: sk, currentSort, currentDir, onSort }) {
  const active = currentSort === sk;
  const [hover, setHover] = useState(false);
  return (
    <th
      onClick={() => sk && onSort(sk)}
      onMouseEnter={() => sk && setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        padding: "13px 18px",
        textAlign: "left",
        fontSize: "11px",
        fontWeight: 700,
        color: hover || active ? "var(--blue-600)" : "var(--text-muted)",
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        whiteSpace: "nowrap",
        cursor: sk ? "pointer" : "default",
        userSelect: "none",
        background: "var(--bg-elevated)",
        borderBottom: "2px solid var(--border-subtle)",
        position: "sticky",
        top: 0,
        zIndex: 1,
        transition: "color 0.15s ease",
        boxShadow: "0 2px 4px rgba(0,0,0,0.04)",
      }}
    >
      {label}
      {sk && <SortIcon active={active} dir={currentDir} />}
    </th>
  );
}

function PipelineRow({ pipeline: p, onDelete, deleting, index }) {
  const navigate = useNavigate();
  const [hover, setHover] = useState(false);
  const [deleteHover, setDeleteHover] = useState(false);
  const isEven = index % 2 === 0;

  return (
    <tr
      onClick={() => navigate(`/pipeline/${p.id}`)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        cursor: "pointer",
        background: hover
          ? "rgba(59,130,246,0.07)"
          : isEven
            ? "var(--bg-surface)"
            : "var(--bg-elevated)",
        borderBottom: "1px solid var(--border-subtle)",
        transition: "background 0.18s ease",
      }}
    >
      <td style={{ padding: "14px 18px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span
            style={{
              width: "9px",
              height: "9px",
              borderRadius: "50%",
              flexShrink: 0,
              background: (STATUS[p.status] || STATUS.ABORTED).dot,
              boxShadow: hover
                ? `0 0 8px ${(STATUS[p.status] || STATUS.ABORTED).dot}88`
                : "none",
              transition: "box-shadow 0.2s ease",
            }}
          />
          <div>
            <div
              style={{
                fontSize: "13px",
                fontWeight: 700,
                color: hover ? "var(--blue-600)" : "var(--text-primary)",
                fontFamily: "var(--font-mono)",
                transition: "color 0.15s ease",
                letterSpacing: "-0.01em",
              }}
            >
              {p.jobName}
            </div>
            <div
              style={{
                fontSize: "10px",
                color: "var(--text-muted)",
                marginTop: "3px",
                fontFamily: "var(--font-mono)",
              }}
            >
              #{p.buildNumber} · {p.branch || "main"}
            </div>
          </div>
        </div>
      </td>

      <td style={{ padding: "14px 18px" }}>
        <StatusPill status={p.status} />
      </td>

      <td style={{ padding: "14px 18px" }}>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            padding: "3px 10px",
            borderRadius: "8px",
            background: "var(--bg-elevated)",
            border: "1px solid var(--border-subtle)",
            fontSize: "11px",
            fontFamily: "var(--font-mono)",
            color: "var(--text-secondary)",
            fontWeight: 600,
          }}
        >
          ⎇ {p.branch || "main"}
        </span>
      </td>

      <td style={{ padding: "14px 18px" }}>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "3px 10px",
            borderRadius: "8px",
            background: "var(--blue-50)",
            border: "1px solid var(--border-default)",
            fontSize: "11px",
            fontFamily: "var(--font-mono)",
            color: "var(--blue-700)",
            fontWeight: 700,
          }}
        >
          #{p.buildNumber}
        </span>
      </td>

      <td style={{ padding: "14px 18px" }}>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            fontSize: "12px",
            color: "var(--text-secondary)",
            fontFamily: "var(--font-mono)",
            fontWeight: 600,
          }}
        >
          <span style={{ opacity: 0.5 }}>⏱</span>
          {fmtDuration(p.duration)}
        </span>
      </td>

      <td style={{ padding: "14px 18px", whiteSpace: "nowrap" }}>
        <span
          style={{
            fontSize: "11px",
            color: "var(--text-muted)",
            fontFamily: "var(--font-mono)",
          }}
        >
          {timeAgo(p.timestamp)}
        </span>
      </td>

      <td style={{ padding: "14px 18px" }} onClick={(e) => e.stopPropagation()}>
        <button
          onMouseEnter={() => setDeleteHover(true)}
          onMouseLeave={() => setDeleteHover(false)}
          onClick={(e) => onDelete(e, p.id)}
          disabled={deleting === p.id}
          title="Delete pipeline"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            padding: "5px 13px",
            borderRadius: "8px",
            border: "1px solid",
            borderColor: deleteHover ? "#dc2626" : "rgba(239,68,68,0.3)",
            background: deleteHover ? "#dc2626" : "rgba(239,68,68,0.06)",
            color: deleteHover ? "#ffffff" : "#dc2626",
            fontSize: "11px",
            fontWeight: 700,
            cursor: "pointer",
            transition: "all 0.18s ease",
            letterSpacing: "0.02em",
          }}
        >
          {deleting === p.id ? <span className="spinner" /> : "✕ Delete"}
        </button>
      </td>
    </tr>
  );
}

export default function PipelineTable({ pipelines = [], onRefresh }) {
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [deletingId, setDeleting] = useState(null);
  const [sortKey, setSortKey] = useState("timestamp");
  const [sortDir, setSortDir] = useState("desc");
  const [searchFocus, setSearchFocus] = useState(false);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm("Delete this pipeline record?")) return;
    setDeleting(id);
    try {
      await deletePipeline(id);
      onRefresh?.();
    } catch (err) {
      alert("Delete failed: " + err.message);
    } finally {
      setDeleting(null);
    }
  };

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("desc");
    }
    setPage(1);
  };

  const filtered = pipelines
    .filter((p) => {
      if (filter === "ALL") return true;
      if (filter === "FAILED")
        return p.status === "FAILED" || p.status === "FAILURE";
      return p.status === filter;
    })
    .filter(
      (p) => !search || p.jobName?.toLowerCase().includes(search.toLowerCase()),
    )
    .sort((a, b) => {
      let av = a[sortKey],
        bv = b[sortKey];
      if (sortKey === "timestamp") {
        av = new Date(av || 0);
        bv = new Date(bv || 0);
      }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const counts = {
    ALL: pipelines.length,
    SUCCESS: pipelines.filter((p) => p.status === "SUCCESS").length,
    FAILED: pipelines.filter(
      (p) => p.status === "FAILED" || p.status === "FAILURE",
    ).length,
    RUNNING: pipelines.filter((p) => p.status === "RUNNING").length,
  };

  const dotColors = {
    SUCCESS: "#16a34a",
    FAILED: "#dc2626",
    RUNNING: "#9333ea",
    ALL: "var(--blue-500)",
  };

  const COLS = [
    { label: "Job Name", sk: "jobName" },
    { label: "Status", sk: "status" },
    { label: "Branch", sk: "branch" },
    { label: "Build #", sk: "buildNumber" },
    { label: "Duration", sk: "duration" },
    { label: "Time", sk: "timestamp" },
    { label: "Actions", sk: null },
  ];

  return (
    <div
      style={{
        overflow: "hidden",
        borderRadius: "var(--radius-lg)",
        border: "1px solid var(--border-subtle)",
        boxShadow: "var(--shadow-md)",
        background: "var(--bg-surface)",
      }}
    >
      {/* Toolbar */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: "12px",
          padding: "16px 20px",
          borderBottom: "1px solid var(--border-subtle)",
          background: "var(--bg-surface)",
        }}
      >
        <div style={{ flex: 1, minWidth: "120px" }}>
          <div
            style={{
              fontSize: "14px",
              fontWeight: 800,
              color: "var(--text-primary)",
              letterSpacing: "-0.02em",
            }}
          >
            Pipeline Runs
          </div>
          <div
            style={{
              fontSize: "11px",
              color: "var(--text-muted)",
              fontFamily: "var(--font-mono)",
              marginTop: "2px",
            }}
          >
            {filtered.length} of {pipelines.length} records
          </div>
        </div>

        {/* Search */}
        <div style={{ position: "relative" }}>
          <span
            style={{
              position: "absolute",
              left: "11px",
              top: "50%",
              transform: "translateY(-50%)",
              width: "15px",
              height: "15px",
              borderRadius: "50%",
              border: "2.5px solid #f59e0b",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none",
              flexShrink: 0,
            }}
          >
            <span
              style={{
                position: "absolute",
                bottom: "-5px",
                right: "-5px",
                width: "6px",
                height: "2.5px",
                background: "#f59e0b",
                borderRadius: "2px",
                transform: "rotate(45deg)",
                transformOrigin: "right center",
              }}
            />
          </span>
          <input
            type="text"
            placeholder="Search jobs…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            onFocus={() => setSearchFocus(true)}
            onBlur={() => setSearchFocus(false)}
            style={{
              width: "200px",
              padding: "8px 32px 8px 34px",
              borderRadius: "10px",
              border: "1px solid",
              borderColor: searchFocus ? "#f59e0b" : "rgba(245,158,11,0.35)",
              background: "var(--bg-elevated)",
              color: "var(--text-primary)",
              fontSize: "12px",
              outline: "none",
              boxShadow: searchFocus
                ? "0 0 0 3px rgba(245,158,11,0.12)"
                : "none",
              transition: "all 0.18s ease",
              fontFamily: "var(--font-body)",
              fontWeight: 500,
            }}
          />
          {search && (
            <button
              onClick={() => {
                setSearch("");
                setPage(1);
              }}
              style={{
                position: "absolute",
                right: "8px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                color: "var(--text-muted)",
                cursor: "pointer",
                fontSize: "11px",
                padding: "0",
                display: "flex",
                alignItems: "center",
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter tabs */}
        <div
          style={{
            display: "flex",
            gap: "2px",
            padding: "3px",
            background: "var(--bg-elevated)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "10px",
          }}
        >
          {FILTERS.map((f) => {
            const active = filter === f;
            return (
              <button
                key={f}
                onClick={() => {
                  setFilter(f);
                  setPage(1);
                }}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "5px 13px",
                  borderRadius: "8px",
                  border: "1px solid",
                  borderColor: active ? "var(--border-default)" : "transparent",
                  background: active ? "var(--bg-surface)" : "transparent",
                  color: active ? "var(--text-primary)" : "var(--text-muted)",
                  fontSize: "11px",
                  fontWeight: active ? 700 : 500,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  fontFamily: "var(--font-body)",
                  boxShadow: active ? "var(--shadow-sm)" : "none",
                }}
              >
                {f !== "ALL" && (
                  <span
                    style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      background: active ? dotColors[f] : "var(--text-muted)",
                      flexShrink: 0,
                      transition: "background 0.15s",
                    }}
                  />
                )}
                {f}
                <span
                  style={{
                    padding: "1px 6px",
                    borderRadius: "999px",
                    background: active ? "var(--blue-100)" : "var(--bg-base)",
                    color: active ? "var(--blue-700)" : "var(--text-muted)",
                    fontSize: "10px",
                    fontWeight: 700,
                    fontFamily: "var(--font-mono)",
                    transition: "all 0.15s",
                  }}
                >
                  {counts[f]}
                </span>
              </button>
            );
          })}
        </div>

        {(search || filter !== "ALL") && (
          <button
            onClick={() => {
              setSearch("");
              setFilter("ALL");
              setPage(1);
            }}
            style={{
              background: "none",
              border: "1px solid var(--border-subtle)",
              color: "var(--text-muted)",
              fontSize: "11px",
              cursor: "pointer",
              fontFamily: "var(--font-mono)",
              padding: "6px 12px",
              borderRadius: "8px",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#dc2626";
              e.currentTarget.style.borderColor = "#dc2626";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--text-muted)";
              e.currentTarget.style.borderColor = "var(--border-subtle)";
            }}
          >
            Clear ✕
          </button>
        )}
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "13px",
          }}
        >
          <thead>
            <tr>
              {COLS.map(({ label, sk }) => (
                <ColHeader
                  key={label}
                  label={label}
                  sortKey={sk}
                  currentSort={sortKey}
                  currentDir={sortDir}
                  onSort={toggleSort}
                />
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <div style={{ padding: "72px 24px", textAlign: "center" }}>
                    <div
                      style={{
                        fontSize: "40px",
                        marginBottom: "14px",
                        opacity: 0.2,
                      }}
                    >
                      {search ? "🔍" : "📭"}
                    </div>
                    <p
                      style={{
                        fontSize: "14px",
                        fontWeight: 700,
                        color: "var(--text-primary)",
                        marginBottom: "6px",
                      }}
                    >
                      {search || filter !== "ALL"
                        ? "No match found"
                        : "No pipeline data yet"}
                    </p>
                    <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                      {search || filter !== "ALL"
                        ? ""
                        : "Connect Jenkins to see builds here"}
                    </p>
                    {(search || filter !== "ALL") && (
                      <button
                        onClick={() => {
                          setSearch("");
                          setFilter("ALL");
                        }}
                        style={{
                          marginTop: "18px",
                          padding: "8px 20px",
                          borderRadius: "10px",
                          border: "1px solid var(--border-default)",
                          background: "var(--bg-elevated)",
                          color: "var(--text-secondary)",
                          fontSize: "12px",
                          fontWeight: 600,
                          cursor: "pointer",
                          fontFamily: "var(--font-body)",
                          transition: "all 0.15s",
                        }}
                      >
                        Clear filters
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              paginated.map((p, i) => (
                <PipelineRow
                  key={p.id}
                  pipeline={p}
                  onDelete={handleDelete}
                  deleting={deletingId}
                  index={i}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer + Pagination */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "10px",
          padding: "12px 20px",
          borderTop: "1px solid var(--border-subtle)",
          background: "var(--bg-elevated)",
          fontSize: "11px",
          color: "var(--text-muted)",
          fontFamily: "var(--font-mono)",
        }}
      >
        <div style={{ display: "flex", gap: "14px", alignItems: "center" }}>
          {["SUCCESS", "FAILED", "RUNNING"].map((s) => (
            <span
              key={s}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                fontWeight: 600,
              }}
            >
              <span
                style={{
                  width: "7px",
                  height: "7px",
                  borderRadius: "50%",
                  background: (STATUS[s] || {}).dot,
                }}
              />
              <span style={{ color: "var(--text-secondary)" }}>
                {counts[s]}
              </span>
              <span style={{ color: "var(--text-muted)" }}>
                {s.toLowerCase()}
              </span>
            </span>
          ))}
        </div>

        {totalPages > 1 && (
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{
                padding: "4px 12px",
                borderRadius: "8px",
                border: "1px solid var(--border-default)",
                background: "var(--bg-surface)",
                color: "var(--text-secondary)",
                fontSize: "11px",
                fontWeight: 600,
                cursor: page === 1 ? "not-allowed" : "pointer",
                opacity: page === 1 ? 0.4 : 1,
                transition: "all 0.15s",
                fontFamily: "var(--font-mono)",
              }}
            >
              ← Prev
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
              <button
                key={pg}
                onClick={() => setPage(pg)}
                style={{
                  width: "30px",
                  height: "28px",
                  borderRadius: "8px",
                  border: "1px solid",
                  borderColor:
                    pg === page ? "var(--blue-500)" : "var(--border-subtle)",
                  background:
                    pg === page ? "var(--blue-600)" : "var(--bg-surface)",
                  color: pg === page ? "#ffffff" : "var(--text-muted)",
                  fontSize: "11px",
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.15s",
                  fontFamily: "var(--font-mono)",
                }}
              >
                {pg}
              </button>
            ))}

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              style={{
                padding: "4px 12px",
                borderRadius: "8px",
                border: "1px solid var(--border-default)",
                background: "var(--bg-surface)",
                color: "var(--text-secondary)",
                fontSize: "11px",
                fontWeight: 600,
                cursor: page === totalPages ? "not-allowed" : "pointer",
                opacity: page === totalPages ? 0.4 : 1,
                transition: "all 0.15s",
                fontFamily: "var(--font-mono)",
              }}
            >
              Next →
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:0.4;} }
        input::placeholder { color: rgba(245,158,11,0.5); }
      `}</style>
    </div>
  );
}
