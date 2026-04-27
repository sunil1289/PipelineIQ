import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const STATUS_COLORS = {
  SUCCESS: {
    color: "var(--green-500)",
    bg: "var(--green-50)",
    border: "rgba(34,197,94,0.22)",
    label: "Success",
  },
  FAILED: {
    color: "var(--red-500)",
    bg: "var(--red-50)",
    border: "rgba(239,68,68,0.22)",
    label: "Failed",
  },
  FAILURE: {
    color: "var(--red-500)",
    bg: "var(--red-50)",
    border: "rgba(239,68,68,0.22)",
    label: "Failed",
  },
  RUNNING: {
    color: "#a855f7",
    bg: "var(--purple-50)",
    border: "rgba(168,85,247,0.22)",
    label: "Running",
  },
  ABORTED: {
    color: "#94a3b8",
    bg: "var(--bg-elevated)",
    border: "var(--border-subtle)",
    label: "Aborted",
  },
};

const RADIAN = Math.PI / 180;

function CustomLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }) {
  if (percent < 0.05) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      dominantBaseline="central"
      style={{
        fontSize: "11px",
        fontWeight: 700,
        fill: "#fff",
        fontFamily: "var(--font-mono)",
      }}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border-default)",
        borderRadius: "var(--radius-md)",
        padding: "10px 14px",
        boxShadow: "var(--shadow-md)",
        fontSize: "12px",
        fontFamily: "var(--font-mono)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: "4px",
        }}
      >
        <span
          style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            background: d.payload.color,
            flexShrink: 0,
          }}
        />
        <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>
          {d.name}
        </span>
      </div>
      <div style={{ color: "var(--text-muted)" }}>
        Count:{" "}
        <strong style={{ color: "var(--text-primary)" }}>{d.value}</strong>
      </div>
      <div style={{ color: "var(--text-muted)" }}>
        Share:{" "}
        <strong style={{ color: "var(--text-primary)" }}>
          {(d.payload.percent * 100).toFixed(1)}%
        </strong>
      </div>
    </div>
  );
}

export default function PipelineChart({ pipelines = [] }) {
  const counts = {};
  for (const p of pipelines) {
    const key = p.status === "FAILURE" ? "FAILED" : p.status;
    if (!key) continue;
    counts[key] = (counts[key] || 0) + 1;
  }

  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  const data = Object.entries(counts)
    .filter(([, v]) => v > 0)
    .map(([key, value]) => ({
      name: STATUS_COLORS[key]?.label || key,
      value,
      color: STATUS_COLORS[key]?.color || "#94a3b8",
      bg: STATUS_COLORS[key]?.bg || "var(--bg-elevated)",
      border: STATUS_COLORS[key]?.border || "var(--border-subtle)",
      percent: total > 0 ? value / total : 0,
    }));

  if (total === 0) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "200px",
          gap: "10px",
        }}
      >
        <div style={{ fontSize: "28px", opacity: 0.2 }}>📊</div>
        <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>
          No pipeline data yet
        </p>
      </div>
    );
  }

  return (
    <div>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={90}
            paddingAngle={3}
            dataKey="value"
            labelLine={false}
            label={CustomLabel}
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} stroke="transparent" />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      {/* Center total label (fake — positioned below) */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginTop: "-8px",
          marginBottom: "12px",
        }}
      >
        <div
          style={{
            textAlign: "center",
            padding: "4px 16px",
            borderRadius: "var(--radius-full)",
            background: "var(--bg-elevated)",
            border: "1px solid var(--border-subtle)",
            fontSize: "11px",
            fontFamily: "var(--font-mono)",
            color: "var(--text-muted)",
          }}
        >
          Total{" "}
          <strong style={{ color: "var(--text-primary)" }}>{total}</strong>{" "}
          builds
        </div>
      </div>

      {/* Legend */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "8px",
          justifyContent: "center",
        }}
      >
        {data.map((d, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 12px",
              borderRadius: "var(--radius-full)",
              background: d.bg,
              border: `1px solid ${d.border}`,
              fontSize: "11px",
              fontWeight: 600,
              fontFamily: "var(--font-mono)",
              color: d.color,
            }}
          >
            <span
              style={{
                width: "7px",
                height: "7px",
                borderRadius: "50%",
                background: d.color,
              }}
            />
            {d.name}
            <span style={{ opacity: 0.7 }}>· {d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
