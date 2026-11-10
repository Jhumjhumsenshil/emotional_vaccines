'use client';

import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  PieChart, Pie, Cell,
  ComposedChart, Line,
} from 'recharts';

/* ── Palette ─────────────────────────────────────────── */
const C = {
  teal:    '#0d6e63',
  tealLt:  '#17bfaf',
  orange:  '#f97316',
  violet:  '#7c3aed',
  sky:     '#0ea5e9',
  rose:    '#f43f5e',
};

export interface VideoItem {
  id: string;
  title: string;
  views: number;
  recipientCount?: number;
  [key: string]: any;
}

export interface TimeseriesItem {
  date: string;
  views: number;
  engagement: number;
  shares: number;
  [key: string]: any;
}

export interface StatsChartProps {
  videos?: VideoItem[];
  timeseries?: TimeseriesItem[];
  startDate?: string;
  endDate?: string;
}

interface TooltipPayloadItem {
  dataKey: string;
  name: string;
  value: number | string;
  color?: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}

/* ── Shared custom tooltip ───────────────────────────── */
const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div style={{
      background: 'white',
      border: '1px solid #e5e7eb',
      borderRadius: 10,
      padding: '10px 14px',
      boxShadow: '0 8px 24px rgba(0,0,0,0.10)',
      fontSize: 12,
      minWidth: 140,
    }}>
      <div style={{ fontWeight: 700, color: '#111827', marginBottom: 6, borderBottom: '1px solid #f3f4f6', paddingBottom: 4 }}>{label}</div>
      {payload.map(p => (
        <div key={p.dataKey} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontWeight: 600, marginTop: 3 }}>
          <span style={{ color: '#6b7280', fontWeight: 500 }}>{p.name}</span>
          <span style={{ color: p.color }}>{typeof p.value === 'number' && p.value > 999 ? p.value.toLocaleString() : p.value}</span>
        </div>
      ))}
    </div>
  );
};

interface ChartHeaderProps {
  title: string;
  sub: string;
}

/* ── Section header ──────────────────────────────────── */
const ChartHeader = ({ title, sub }: ChartHeaderProps) => (
  <div className="chart-card-header">
    <div>
      <div className="chart-card-title">{title}</div>
      <div className="chart-card-sub">{sub}</div>
    </div>
  </div>
);

interface LegendPillProps {
  color: string;
  label: string;
}

/* ── Legend pill ─────────────────────────────────────── */
const LegendPill = ({ color, label }: LegendPillProps) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginRight: 14, fontSize: 11.5, color: '#374151' }}>
    <span style={{ width: 10, height: 10, borderRadius: 2, background: color, display: 'inline-block' }} />
    {label}
  </span>
);

interface PieLabelProps {
  cx?: number;
  cy?: number;
  midAngle?: number;
  innerRadius?: number;
  outerRadius?: number;
  percent?: number;
}

/* ── Pie inner label ─────────────────────────────────── */
const renderPieLabel = ({ cx = 0, cy = 0, midAngle = 0, innerRadius = 0, outerRadius = 0, percent = 0 }: PieLabelProps) => {
  if (percent < 0.06) return null;
  const RADIAN = Math.PI / 180;
  const r = innerRadius + (outerRadius - innerRadius) * 0.55;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" style={{ fontSize: 11, fontWeight: 700 }}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

/* ══════════════════════════════════════════════════════ */
export default function StatsChart({ videos = [], timeseries = [], startDate, endDate }: StatsChartProps) {

  /* 1. Stacked bar: views + recipients per video */
  const barData = [...videos]
    .sort((a, b) => b.views - a.views)
    .slice(0, 8)
    .map(v => ({
      name: v.title.length > 22 ? v.title.slice(0, 22) + '…' : v.title,
      Views: v.views,
      Recipients: v.recipientCount || 0,
    }));

  /* 2. Composed: bars (views) + line (engagement rate %) */
  const composedData = (timeseries || []).map(d => ({
    ...d,
    engRate: d.views > 0 ? +((d.engagement / d.views) * 100).toFixed(1) : 0,
  }));

  /* 3. Radar: category metrics (normalised 0-100) */
  const radarData = [
    { subject: 'Families Thrive',   Reach: 84, Engagement: 72, Shares: 65 },
    { subject: 'Self Care',         Reach: 68, Engagement: 60, Shares: 55 },
    { subject: 'Community Support', Reach: 45, Engagement: 58, Shares: 48 },
    { subject: 'Crisis Resources',  Reach: 52, Engagement: 78, Shares: 70 },
  ];

  /* 4. Donut: content-type distribution */
  const donutData = [
    { name: 'Outreach Videos',  value: 44, color: C.teal   },
    { name: 'Milestone Clips',  value: 28, color: C.orange  },
    { name: 'Campaign Content', value: 18, color: C.violet  },
    { name: 'Partner Shares',   value: 10, color: C.sky     },
  ];

  /* 5. Conversion funnel */
  const funnelData = [
    { stage: 'Distributed', count: 24423, fill: C.teal    },
    { stage: 'Opened',      count: 16880, fill: C.tealLt  },
    { stage: 'Engaged',     count: 8421,  fill: C.sky     },
    { stage: 'Shared',      count: 3204,  fill: C.violet  },
    { stage: 'Converted',   count: 1563,  fill: C.orange  },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── Row 1: Stacked Bar + Area ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        {/* Stacked Bar */}
        <div className="chart-card">
          <ChartHeader
            title="Views vs Recipients per Video"
            sub="Top 8 videos — stacked views and recipient count"
          />
          <div style={{ marginBottom: 8 }}>
            <LegendPill color={C.teal}   label="Views" />
            <LegendPill color={C.orange} label="Recipients" />
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={barData} margin={{ top: 4, right: 8, left: 0, bottom: 64 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10.5, fill: '#6b7280' }}
                angle={-38}
                textAnchor="end"
                interval={0}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)}
                label={{ value: 'Count', angle: -90, position: 'insideLeft', offset: 10, style: { fontSize: 10, fill: '#9ca3af' } }}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f0fbfa' }} />
              <Bar dataKey="Views"      stackId="a" fill={C.teal}   radius={[0, 0, 0, 0]} name="Views" />
              <Bar dataKey="Recipients" stackId="a" fill={C.orange} radius={[4, 4, 0, 0]} name="Recipients" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Area Chart */}
        <div className="chart-card">
          <ChartHeader
            title="Engagement Trend Over Time"
            sub="Views, engagement, and shares across selected date range"
          />
          <div style={{ marginBottom: 8 }}>
            <LegendPill color={C.teal}   label="Views" />
            <LegendPill color={C.tealLt} label="Engagement" />
            <LegendPill color={C.orange} label="Shares" />
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={timeseries} margin={{ top: 4, right: 8, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="gViews"  x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={C.teal}   stopOpacity={0.22} />
                  <stop offset="95%" stopColor={C.teal}   stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gEngage" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={C.tealLt} stopOpacity={0.20} />
                  <stop offset="95%" stopColor={C.tealLt} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gShares" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={C.orange} stopOpacity={0.18} />
                  <stop offset="95%" stopColor={C.orange} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
              <YAxis
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)}
                label={{ value: 'Count', angle: -90, position: 'insideLeft', offset: 10, style: { fontSize: 10, fill: '#9ca3af' } }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="views"      stroke={C.teal}   strokeWidth={2} fill="url(#gViews)"  dot={{ r: 3, fill: C.teal }}   name="Views" />
              <Area type="monotone" dataKey="engagement" stroke={C.tealLt} strokeWidth={2} fill="url(#gEngage)" dot={{ r: 3, fill: C.tealLt }} name="Engagement" />
              <Area type="monotone" dataKey="shares"     stroke={C.orange} strokeWidth={2} fill="url(#gShares)" dot={{ r: 3, fill: C.orange }} name="Shares" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Row 2: Composed + Radar ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 16 }}>

        {/* Composed: Views bar + Engagement Rate line */}
        <div className="chart-card">
          <ChartHeader
            title="Views & Engagement Rate"
            sub="Bars = absolute views · Line = engagement rate (%) — dual Y-axis"
          />
          <div style={{ marginBottom: 8 }}>
            <LegendPill color={C.teal} label="Views (left axis)" />
            <LegendPill color={C.rose} label="Eng. Rate % (right axis)" />
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <ComposedChart data={composedData} margin={{ top: 4, right: 36, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
              <YAxis
                yAxisId="left"
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)}
                label={{ value: 'Views', angle: -90, position: 'insideLeft', offset: 10, style: { fontSize: 10, fill: '#9ca3af' } }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => `${v}%`}
                label={{ value: 'Eng. %', angle: 90, position: 'insideRight', offset: 12, style: { fontSize: 10, fill: '#9ca3af' } }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar  yAxisId="left"  dataKey="views"   fill={C.teal} radius={[4, 4, 0, 0]} name="Views"     opacity={0.85} />
              <Line yAxisId="right" dataKey="engRate" stroke={C.rose} strokeWidth={2.5} dot={{ r: 4, fill: C.rose }} name="Eng. Rate %" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Radar: Category multi-metric */}
        <div className="chart-card">
          <ChartHeader
            title="Category Radar"
            sub="Normalised reach, engagement & shares per category (0–100)"
          />
          <div style={{ marginBottom: 4 }}>
            <LegendPill color={C.teal}   label="Reach" />
            <LegendPill color={C.orange} label="Engagement" />
            <LegendPill color={C.violet} label="Shares" />
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <RadarChart data={radarData} margin={{ top: 10, right: 24, left: 24, bottom: 10 }}>
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: '#374151' }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10, fill: '#9ca3af' }} tickCount={4} />
              <Radar name="Reach"    dataKey="Reach"    stroke={C.teal}   fill={C.teal}   fillOpacity={0.18} strokeWidth={2} />
              <Radar name="Engagement" dataKey="Engagement" stroke={C.orange} fill={C.orange} fillOpacity={0.15} strokeWidth={2} />
              <Radar name="Shares"    dataKey="Shares"    stroke={C.violet} fill={C.violet} fillOpacity={0.12} strokeWidth={2} />
              <Tooltip content={<CustomTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Row 3: Donut + Funnel ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '0.8fr 1.2fr', gap: 16 }}>

        {/* Donut: Content-type distribution */}
        <div className="chart-card">
          <ChartHeader
            title="Content Type Distribution"
            sub="Share of distributed content by type"
          />
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={donutData}
                cx="50%"
                cy="50%"
                innerRadius={56}
                outerRadius={92}
                paddingAngle={3}
                dataKey="value"
                labelLine={false}
                label={renderPieLabel}
              >
                {donutData.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <Tooltip
                formatter={(val: any, name: any) => [`${val}%`, name]}
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 0', marginTop: 4, justifyContent: 'center' }}>
            {donutData.map(d => <LegendPill key={d.name} color={d.color} label={`${d.name} (${d.value}%)`} />)}
          </div>
        </div>

        {/* Conversion Funnel */}
        <div className="chart-card">
          <ChartHeader
            title="Outreach Conversion Funnel"
            sub="How distributed content converts through each engagement stage"
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
            {funnelData.map(d => {
              const pct = ((d.count / funnelData[0].count) * 100).toFixed(1);
              return (
                <div key={d.stage}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{d.stage}</span>
                    <span style={{ fontSize: 12, color: '#6b7280' }}>
                      {d.count.toLocaleString()}
                      <span style={{ color: '#9ca3af', fontSize: 11 }}> ({pct}%)</span>
                    </span>
                  </div>
                  <div style={{ height: 26, background: '#f3f4f6', borderRadius: 6, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${pct}%`,
                      background: d.fill,
                      borderRadius: 6,
                      transition: 'width 0.6s ease',
                    }} />
                  </div>
                </div>
              );
            })}
            <div style={{ marginTop: 8, fontSize: 11.5, color: '#9ca3af', textAlign: 'right' }}>
              Overall conversion: <strong style={{ color: C.orange }}>
                {((funnelData[4].count / funnelData[0].count) * 100).toFixed(1)}%
              </strong> of distributed content
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}