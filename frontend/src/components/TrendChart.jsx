
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// ── Custom tooltip ────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border-default)",
        borderRadius: "var(--radius-md)",
        padding: "10px 14px",
        fontSize: "12px",
        boxShadow: "var(--shadow-lg)",
      }}
    >
      <p
        style={{
          fontWeight: 700,
          color: "var(--text-primary)",
          marginBottom: "8px",
        }}
      >
        {label}
      </p>
      {payload.map((p) => (
        <div
          key={p.dataKey}
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
              background: p.stroke,
              display: "inline-block",
            }}
          />
          <span
            style={{
              color: "var(--text-secondary)",
              textTransform: "capitalize",
            }}
          >
            {p.dataKey}
          </span>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontWeight: 700,
              color: "var(--text-primary)",
              marginLeft: "auto",
            }}
          >
            {p.value}
          </span>
        </div>
      ))}
    </div>
  );
};

const TICK_STYLE = {
  fontSize: 11,
  fill: "var(--text-muted)",
  fontFamily: "var(--font-mono, monospace)",
};

// ── TrendChart ────────────────────────────────────────────────────────────────
export default function TrendChart({ data }) {
  const formatted = (data || []).map((d) => ({
    ...d,
    date: new Date(d.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
  }));

  if (!data?.length) {
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
        <span style={{ fontSize: "32px", opacity: 0.25 }}>📈</span>
        <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
          Trend data appears after 24h of syncing
        </p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart
        data={formatted}
        margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
      >
        <defs>
          <linearGradient id="gradSuccess" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--green-500)" stopOpacity={0.18} />
            <stop offset="95%" stopColor="var(--green-500)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gradFailed" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--red-500)" stopOpacity={0.18} />
            <stop offset="95%" stopColor="var(--red-500)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="var(--border-subtle)"
          vertical={false}
        />
        <XAxis
          dataKey="date"
          tick={TICK_STYLE}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={TICK_STYLE}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <Tooltip
          content={<CustomTooltip />}
          cursor={{ stroke: "var(--border-default)", strokeWidth: 1 }}
        />
        <Area
          type="monotone"
          dataKey="success"
          stroke="var(--green-500)"
          strokeWidth={2.5}
          fill="url(#gradSuccess)"
          dot={false}
          activeDot={{
            r: 4,
            fill: "var(--green-500)",
            stroke: "var(--bg-surface)",
            strokeWidth: 2,
          }}
        />
        <Area
          type="monotone"
          dataKey="failed"
          stroke="var(--red-500)"
          strokeWidth={2.5}
          fill="url(#gradFailed)"
          dot={false}
          activeDot={{
            r: 4,
            fill: "var(--red-500)",
            stroke: "var(--bg-surface)",
            strokeWidth: 2,
          }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
