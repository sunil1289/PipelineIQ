import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getPipelineById, deletePipeline } from "../api/api";
import { formatDistanceToNow, format } from "date-fns";

// ── Status map ───────────────────────────────────────────────────────────────
const STATUS = {
  SUCCESS: {
    pillClass: "pill pill-success",
    label: "✓ Success",
    dot: "var(--green-500)",
  },
  FAILED: {
    pillClass: "pill pill-danger",
    label: "✗ Failed",
    dot: "var(--red-500)",
  },
  FAILURE: {
    pillClass: "pill pill-danger",
    label: "✗ Failed",
    dot: "var(--red-500)",
  },
  RUNNING: {
    pillClass: "pill pill-running",
    label: "⟳ Running",
    dot: "var(--purple-500)",
  },
  ABORTED: {
    pillClass: "pill pill-aborted",
    label: "◉ Aborted",
    dot: "#94a3b8",
  },
};

function fmtDuration(ms) {
  if (!ms) return "—";
  const s = Math.round(ms / 1000);
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`;
}

// ── Meta row ─────────────────────────────────────────────────────────────────
function MetaRow({ label, value, mono = false }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "10px 0",
        borderBottom: "1px solid var(--border-subtle)",
      }}
    >
      <span
        style={{
          fontSize: "12px",
          color: "var(--text-muted)",
          fontWeight: 500,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: "12px",
          fontWeight: 600,
          color: "var(--text-primary)",
          fontFamily: mono ? "var(--font-mono)" : "inherit",
          maxWidth: "60%",
          textAlign: "right",
          wordBreak: "break-all",
        }}
      >
        {value || "—"}
      </span>
    </div>
  );
}

// ── Section card ─────────────────────────────────────────────────────────────
function SectionCard({ title, subtitle, children }) {
  return (
    <div className="card" style={{ padding: "22px" }}>
      <div style={{ marginBottom: "18px" }}>
        <h2
          style={{
            fontSize: "14px",
            fontWeight: 700,
            color: "var(--text-primary)",
            marginBottom: "2px",
          }}
        >
          {title}
        </h2>
        {subtitle && (
          <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>
            {subtitle}
          </p>
        )}
      </div>
      {children}
    </div>
  );
}

// ── Download detail report ────────────────────────────────────────────────────
function downloadReport(pipeline) {
  const blob = new Blob([JSON.stringify(pipeline, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `build-${pipeline.jobName}-#${pipeline.buildNumber}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── PipelineDetail ───────────────────────────────────────────────────────────
export default function PipelineDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pipeline, setPipeline] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getPipelineById(id);
        setPipeline(res.data);
      } catch {
        setError("Pipeline not found or backend unreachable.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm("Permanently delete this pipeline record?")) return;
    setDeleting(true);
    try {
      await deletePipeline(id);
      navigate("/");
    } catch (err) {
      alert("Delete failed: " + err.message);
      setDeleting(false);
    }
  };

  // ── Loading ──
  if (loading)
    return (
      <div
        className="main-content"
        style={{
          maxWidth: "var(--content-max)",
          margin: "0 auto",
          padding: "28px 24px",
        }}
      >
        <div style={{ display: "flex", gap: "12px", marginBottom: "24px" }}>
          <div
            className="skeleton"
            style={{
              height: "36px",
              width: "80px",
              borderRadius: "var(--radius-md)",
            }}
          />
          <div
            className="skeleton"
            style={{
              height: "36px",
              flex: 1,
              borderRadius: "var(--radius-md)",
            }}
          />
        </div>
        <div
          className="skeleton"
          style={{
            height: "200px",
            borderRadius: "var(--radius-lg)",
            marginBottom: "16px",
          }}
        />
        <div
          className="skeleton"
          style={{ height: "140px", borderRadius: "var(--radius-lg)" }}
        />
      </div>
    );

  // ── Error ──
  if (error)
    return (
      <div
        className="main-content"
        style={{
          maxWidth: "var(--content-max)",
          margin: "0 auto",
          padding: "28px 24px",
        }}
      >
        <button
          className="btn btn-ghost"
          onClick={() => navigate(-1)}
          style={{ marginBottom: "20px" }}
        >
          ← Back
        </button>
        <div
          style={{
            padding: "40px",
            textAlign: "center",
            borderRadius: "var(--radius-lg)",
            background: "var(--red-50)",
            border: "1px solid rgba(239,68,68,0.2)",
            color: "var(--red-text)",
          }}
        >
          ⚠ {error}
        </div>
      </div>
    );

  const s = STATUS[pipeline.status] || STATUS.RUNNING;
  const ts = pipeline.timestamp ? new Date(pipeline.timestamp) : null;
  const isFailed =
    pipeline.status === "FAILED" || pipeline.status === "FAILURE";
  const total = (pipeline.testsPassed || 0) + (pipeline.testsFailed || 0);
  const pct = total > 0 ? Math.round((pipeline.testsPassed / total) * 100) : 0;

  return (
    <div
      className="main-content animate-in"
      style={{
        maxWidth: "var(--content-max)",
        margin: "0 auto",
        padding: "28px 24px",
      }}
    >
      {/* Header row */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "16px",
          marginBottom: "24px",
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <button className="btn btn-ghost" onClick={() => navigate(-1)}>
            ← Back
          </button>
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                flexWrap: "wrap",
              }}
            >
              <h1
                style={{
                  fontSize: "18px",
                  fontWeight: 700,
                  color: "var(--text-primary)",
                  letterSpacing: "-0.02em",
                  fontFamily: "var(--font-mono)",
                }}
              >
                {pipeline.jobName}
              </h1>
              <span className={s.pillClass}>{s.label}</span>
            </div>
            <p
              style={{
                fontSize: "12px",
                color: "var(--text-muted)",
                marginTop: "3px",
                fontFamily: "var(--font-mono)",
              }}
            >
              Build #{pipeline.buildNumber}
              {ts && ` · ${formatDistanceToNow(ts, { addSuffix: true })}`}
            </p>
          </div>
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          <button
            className="btn btn-ghost"
            onClick={() => downloadReport(pipeline)}
            title="Download build report"
          >
            ⬇ Export
          </button>
          <button
            className="btn btn-danger"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? <span className="spinner" /> : "🗑 Delete"}
          </button>
        </div>
      </div>

      {/* Failure banner */}
      {isFailed && (
        <div
          className="animate-fade"
          style={{
            display: "flex",
            gap: "12px",
            padding: "14px 18px",
            marginBottom: "20px",
            borderRadius: "var(--radius-md)",
            background: "var(--red-50)",
            border: "1px solid rgba(239,68,68,0.2)",
          }}
        >
          <span style={{ fontSize: "18px", flexShrink: 0 }}>✗</span>
          <div>
            <p
              style={{
                fontSize: "13px",
                fontWeight: 700,
                color: "var(--red-text)",
                marginBottom: "3px",
              }}
            >
              Build Failed
            </p>
            <p
              style={{
                fontSize: "12px",
                color: "var(--red-text)",
                opacity: 0.75,
              }}
            >
              {pipeline.failureReason || "No failure reason recorded."}
            </p>
          </div>
        </div>
      )}

      {/* Two columns */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "16px",
          marginBottom: "16px",
        }}
      >
        <SectionCard title="Build Details" subtitle="Metadata for this run">
          <MetaRow label="Job Name" value={pipeline.jobName} mono />
          <MetaRow label="Build #" value={`#${pipeline.buildNumber}`} mono />
          <MetaRow label="Status" value={s.label} />
          <MetaRow label="Branch" value={pipeline.branch} mono />
          <MetaRow label="Environment" value={pipeline.environment} />
          <MetaRow label="Triggered By" value={pipeline.triggeredBy} />
          <MetaRow
            label="Duration"
            value={fmtDuration(pipeline.duration)}
            mono
          />
          <MetaRow
            label="Timestamp"
            value={ts ? format(ts, "MMM d, yyyy · HH:mm:ss") : "—"}
          />
        </SectionCard>

        <SectionCard
          title="Test Results"
          subtitle={total > 0 ? `${total} tests ran` : "No test data recorded"}
        >
          {total > 0 ? (
            <>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "12px",
                  marginBottom: "8px",
                }}
              >
                <span style={{ color: "var(--green-600)", fontWeight: 600 }}>
                  Passed: {pipeline.testsPassed}
                </span>
                <span style={{ color: "var(--red-600)", fontWeight: 600 }}>
                  Failed: {pipeline.testsFailed}
                </span>
              </div>
              <div
                style={{
                  height: "6px",
                  borderRadius: "var(--radius-full)",
                  background: "var(--border-subtle)",
                  overflow: "hidden",
                  marginBottom: "4px",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${pct}%`,
                    borderRadius: "var(--radius-full)",
                    background:
                      pct === 100
                        ? "var(--green-500)"
                        : `linear-gradient(90deg, var(--green-500), var(--red-400))`,
                    transition: "width 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
                  }}
                />
              </div>
              <p
                style={{
                  textAlign: "right",
                  fontSize: "11px",
                  color: "var(--text-muted)",
                  fontFamily: "var(--font-mono)",
                  marginBottom: "20px",
                }}
              >
                {pct}% pass rate
              </p>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "12px",
                }}
              >
                <div
                  style={{
                    padding: "16px",
                    borderRadius: "var(--radius-md)",
                    textAlign: "center",
                    background: "var(--green-50)",
                    border: "1px solid rgba(34,197,94,0.15)",
                  }}
                >
                  <div
                    style={{
                      fontSize: "24px",
                      fontWeight: 700,
                      fontFamily: "var(--font-mono)",
                      color: "var(--green-600)",
                      marginBottom: "4px",
                    }}
                  >
                    {pipeline.testsPassed}
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                    Passed
                  </div>
                </div>
                <div
                  style={{
                    padding: "16px",
                    borderRadius: "var(--radius-md)",
                    textAlign: "center",
                    background: "var(--red-50)",
                    border: "1px solid rgba(239,68,68,0.15)",
                  }}
                >
                  <div
                    style={{
                      fontSize: "24px",
                      fontWeight: 700,
                      fontFamily: "var(--font-mono)",
                      color: "var(--red-600)",
                      marginBottom: "4px",
                    }}
                  >
                    {pipeline.testsFailed}
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                    Failed
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div
              style={{
                padding: "40px 0",
                textAlign: "center",
                color: "var(--text-muted)",
              }}
            >
              <div
                style={{ fontSize: "32px", marginBottom: "10px", opacity: 0.3 }}
              >
                🧪
              </div>
              <p style={{ fontSize: "13px" }}>No test data for this build</p>
            </div>
          )}

          {pipeline.artifactSize > 0 && (
            <div
              style={{
                marginTop: "16px",
                paddingTop: "14px",
                borderTop: "1px solid var(--border-subtle)",
              }}
            >
              <MetaRow
                label="Artifact Size"
                value={`${(pipeline.artifactSize / 1024 / 1024).toFixed(2)} MB`}
                mono
              />
            </div>
          )}
        </SectionCard>
      </div>

      {/* Error logs */}
      {pipeline.errorLogs?.length > 0 && (
        <SectionCard
          title="Error Logs"
          subtitle={`${pipeline.errorLogs.length} log ${pipeline.errorLogs.length === 1 ? "entry" : "entries"}`}
        >
          <div
            style={{
              background: "var(--bg-base)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-md)",
              padding: "14px 16px",
              fontFamily: "var(--font-mono)",
              fontSize: "12px",
              lineHeight: 1.8,
              maxHeight: "320px",
              overflowY: "auto",
            }}
          >
            {pipeline.errorLogs.map((line, i) => (
              <div
                key={i}
                style={{
                  padding: "2px 0",
                  borderBottom: "1px solid var(--border-subtle)",
                  color:
                    line.toLowerCase().includes("error") ||
                    line.toLowerCase().includes("fail")
                      ? "var(--red-600)"
                      : "var(--text-secondary)",
                  display: "flex",
                  gap: "12px",
                }}
              >
                <span
                  style={{
                    color: "var(--text-muted)",
                    userSelect: "none",
                    minWidth: "24px",
                  }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                {line}
              </div>
            ))}
          </div>
        </SectionCard>
      )}
    </div>
  );
}
