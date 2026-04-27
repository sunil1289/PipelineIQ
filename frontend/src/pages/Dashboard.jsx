import { useState, useEffect, useCallback } from "react";
import { getPipelines, getStats, getTrend } from "../api/api";
import StatCard from "../components/StatCard";
import PipelineChart from "../components/PipelineChart";
import TrendChart from "../components/TrendChart";
import PipelineTable from "../components/PipelineTable";
import WrenchIcon from "../assets/Wrench.png";
import TickIcon from "../assets/Tick.png";
import CrossIcon from "../assets/Cross.png";
import RunningIcon from "../assets/Running.png";
import TimeIcon from "../assets/Time.png";

function SkeletonCard() {
  return (
    <div className="card" style={{ padding: "20px" }}>
      <div
        className="skeleton"
        style={{ height: "11px", width: "55%", marginBottom: "14px" }}
      />
      <div
        className="skeleton"
        style={{ height: "32px", width: "40%", marginBottom: "10px" }}
      />
      <div className="skeleton" style={{ height: "9px", width: "70%" }} />
    </div>
  );
}

function SectionHeader({ title, subtitle }) {
  return (
    <div style={{ marginBottom: "14px" }}>
      <h2
        style={{
          fontSize: "13px",
          fontWeight: 600,
          color: "var(--text-primary)",
          letterSpacing: "-0.01em",
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
  );
}

function ErrorBanner({ message }) {
  return (
    <div
      className="animate-fade"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "12px 16px",
        marginBottom: "20px",
        borderRadius: "var(--radius-md)",
        background: "var(--red-50)",
        border: "1px solid rgba(239,68,68,0.2)",
        color: "var(--red-text)",
        fontSize: "13px",
      }}
    >
      <span style={{ fontSize: "16px" }}>⚠</span>
      <span>{message}</span>
    </div>
  );
}

export default function Dashboard() {
  const [pipelines, setPipelines] = useState([]);
  const [stats, setStats] = useState(null);
  const [trend, setTrend] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastSync, setLastSync] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const [pRes, sRes, tRes] = await Promise.all([
        getPipelines(),
        getStats(),
        getTrend(),
      ]);
      setPipelines(pRes.data || []);
      setStats(sRes.data || {});
      setTrend(tRes.data || []);
      setLastSync(new Date());
      setError(null);
    } catch (e) {
      setError(
        e?.message || "Could not reach backend — is Spring Boot running?",
      );
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
    const iv = setInterval(load, 30000);
    return () => clearInterval(iv);
  }, [load]);

  const handleDownload = () => {
    const report = {
      generatedAt: new Date().toISOString(),
      stats,
      pipelines,
      trend,
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pipeline-report-${new Date().toLocaleDateString().replace(/\//g, "-")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
  const statCards = [
    {
      title: "Total Builds",
      value: stats?.total ?? 0,
      subtitle: "All time",
      color: "blue",
      icon: WrenchIcon,
    },
    {
      title: "Success",
      value: stats?.success ?? 0,
      subtitle: `${stats?.successRate ?? 0}% success rate`,
      color: "green",
      icon: TickIcon,
    },
    {
      title: "Failed",
      value: stats?.failed ?? 0,
      subtitle: `${stats?.recentFailures ?? 0} in 24h`,
      color: "red",
      icon: CrossIcon,
    },
    {
      title: "Running",
      value: stats?.running ?? 0,
      subtitle: "In progress",
      color: "purple",
      icon: RunningIcon,
    },
    {
      title: "Avg Duration",
      value: `${stats?.avgDurationSeconds ?? 0}s`,
      subtitle: "Successful builds",
      color: "amber",
      icon: TimeIcon,
    },
  ];

  return (
    <div
      className="main-content animate-in"
      style={{
        maxWidth: "var(--content-max)",
        margin: "0 auto",
        padding: "28px 24px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: "28px",
          gap: "16px",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "22px",
              fontWeight: 700,
              color: "var(--text-primary)",
              letterSpacing: "-0.03em",
              marginBottom: "4px",
            }}
          >
            Pipeline Dashboard
          </h1>
          <p
            style={{
              fontSize: "12px",
              color: "var(--text-muted)",
              fontFamily: "var(--font-mono)",
            }}
          >
            {lastSync
              ? `Last synced · ${lastSync.toLocaleTimeString()}`
              : "Connecting to Jenkins…"}
          </p>
        </div>

        <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
          <button
            className="btn btn-ghost"
            onClick={handleDownload}
            title="Download JSON report"
          >
            ⬇ Export
          </button>
          <button
            className="btn btn-primary"
            onClick={() => load(true)}
            disabled={refreshing || loading}
          >
            {refreshing ? <span className="spinner" /> : "↺"}
            Refresh
          </button>
        </div>
      </div>

      {error && <ErrorBanner message={error} />}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
          gap: "14px",
          marginBottom: "24px",
        }}
      >
        {loading
          ? Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
          : statCards.map((c, i) => (
              <StatCard
                key={c.title}
                {...c}
                className={`animate-in stagger-${i + 1}`}
              />
            ))}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        <div className="card" style={{ padding: "20px" }}>
          <SectionHeader
            title="Pipeline Status"
            subtitle="Current build outcomes"
          />
          <PipelineChart pipelines={pipelines} />
        </div>
        <div className="card" style={{ padding: "20px" }}>
          <SectionHeader title="Build Trend" subtitle="30-day activity" />
          <TrendChart data={trend} />
        </div>
      </div>

      <div className="card" style={{ overflow: "hidden" }}>
        <PipelineTable pipelines={pipelines} onRefresh={() => load(true)} />
      </div>
    </div>
  );
}
