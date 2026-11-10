'use client';

import React, { useState, useEffect } from 'react';
import StatsChart from '../components/StatsChart';

interface TimeseriesItem {
  date: string;
  views: number;
  engagement: number;
  shares: number;
}

interface CategoryPerformanceItem {
  category: string;
  reach: number;
  avgEngagementRate: number;
}

interface ActivityItem {
  id: string;
  title: string;
  time: string;
  type: 'outreach' | 'milestone' | 'recipient' | 'campaign';
}

interface VideoItem {
  id: string;
  title: string;
  category: string;
  description: string;
  tags?: string[];
  [key: string]: any;
}

interface StatsData {
  overview: {
    totalViews: number;
    viewsGrowthPercent: number;
    totalEngagement: number;
    engagementGrowthPercent: number;
    activeRecipients: number;
    recipientsGrowthPercent: number;
    campaignConversionRate: number;
    conversionGrowthPercent: number;
  };
  timeseries: TimeseriesItem[];
  viewsByVideo: VideoItem[];
  categoryPerformance: CategoryPerformanceItem[];
  recentActivities: ActivityItem[];
}

const FALLBACK_STATS: StatsData = {
  overview: {
    totalViews: 24423,
    viewsGrowthPercent: 18.6,
    totalEngagement: 4120,
    engagementGrowthPercent: 12.3,
    activeRecipients: 28,
    recipientsGrowthPercent: 9.5,
    campaignConversionRate: 6.4,
    conversionGrowthPercent: 2.1
  },
  timeseries: [
    { date: "Aug 10", views: 1243, engagement: 210, shares: 48 },
    { date: "Aug 14", views: 892,  engagement: 164, shares: 31 },
    { date: "Aug 20", views: 2108, engagement: 380, shares: 94 },
    { date: "Aug 25", views: 3412, engagement: 590, shares: 140 },
    { date: "Aug 28", views: 1567, engagement: 280, shares: 67 },
    { date: "Sep 01", views: 987,  engagement: 178, shares: 42 },
    { date: "Sep 03", views: 2876, engagement: 502, shares: 121 },
    { date: "Sep 07", views: 2201, engagement: 389, shares: 89 },
    { date: "Sep 09", views: 3890, engagement: 680, shares: 176 },
    { date: "Sep 13", views: 1445, engagement: 251, shares: 58 }
  ],
  viewsByVideo: [],
  categoryPerformance: [
    { category: "Families Thrive",  reach: 10259, avgEngagementRate: 8.4 },
    { category: "Self Care",        reach: 8304,  avgEngagementRate: 7.2 },
    { category: "Community Support",reach: 3419,  avgEngagementRate: 6.8 },
    { category: "Crisis Resources", reach: 2442,  avgEngagementRate: 9.1 }
  ],
  recentActivities: [
    { id: "act-1", title: "Video shared with 3 community partners", time: "20 min ago", type: "outreach" },
    { id: "act-2", title: "'Raising Resilient Kids' crossed 2,800 views", time: "1 hour ago", type: "milestone" },
    { id: "act-3", title: "New partner onboarded: Sarah Jenkins", time: "3 hours ago", type: "recipient" },
    { id: "act-4", title: "Mindful Mornings clip distributed via newsletter", time: "Yesterday", type: "campaign" },
    { id: "act-5", title: "Sleep Science video added to 6 outreach queues", time: "2 days ago", type: "outreach" },
  ]
};

const ACTIVITY_TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  outreach:   { bg: '#f0fbfa', text: '#0d6e63' },
  milestone:  { bg: '#fef3c7', text: '#b45309' },
  recipient:  { bg: '#ede9fe', text: '#5b21b6' },
  campaign:   { bg: '#dbeafe', text: '#1e40af' },
};

function formatNum(n: number) {
  if (!n) return '0';
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000)    return (n / 1000).toFixed(1) + 'K';
  return n.toLocaleString();
}

export default function Statistics() {
  const [stats, setStats] = useState<StatsData>(FALLBACK_STATS);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [startDate, setStartDate] = useState('2026-01-01');
  const [endDate,   setEndDate]   = useState('2026-09-14');
  const [keyword,   setKeyword]   = useState('');

  useEffect(() => {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

    // Fetch aggregated stats
    fetch(`${API_BASE_URL}/api/stats?startDate=${startDate}&endDate=${endDate}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(j => {
        if (j.data) {
          setStats(prev => ({
            ...prev,
            overview:             j.data.overview             || prev.overview,
            timeseries:           j.data.timeseries           || prev.timeseries,
            viewsByVideo:         j.data.viewsByVideo         || prev.viewsByVideo,
            categoryPerformance:  j.data.categoryPerformance  || prev.categoryPerformance,
            recentActivities:     j.data.recentActivities     || prev.recentActivities,
          }));
        }
      })
      .catch(() => {});

    // Fetch videos for chart
    fetch(`${API_BASE_URL}/api/videos?limit=50`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(j => { if (j.videos) setVideos(j.videos); })
      .catch(() => {});
  }, [startDate, endDate]);

  // ── Keyword filtering ──────────────────────────────────────────────
  const kw = keyword.trim().toLowerCase();
  const allVideos = videos.length ? videos : stats.viewsByVideo || [];

  const filteredVideos = kw
    ? allVideos.filter(v => {
        const haystack = [
          v.title || '',
          v.category || '',
          v.description || '',
          ...(v.tags || []),
        ].join(' ').toLowerCase();
        return haystack.includes(kw);
      })
    : allVideos;

  const filteredCategories = kw
    ? stats.categoryPerformance.filter(cat =>
        cat.category.toLowerCase().includes(kw)
      )
    : stats.categoryPerformance;

  const kpis = [
    { label: 'Total Video Views',      value: formatNum(stats.overview.totalViews),         growth: stats.overview.viewsGrowthPercent,      key: 'views' },
    { label: 'Total Engagements',      value: formatNum(stats.overview.totalEngagement),      growth: stats.overview.engagementGrowthPercent,  key: 'engagement' },
    { label: 'Active Recipients',      value: stats.overview.activeRecipients,              growth: stats.overview.recipientsGrowthPercent,  key: 'recipients' },
    { label: 'Campaign Conversion',    value: `${stats.overview.campaignConversionRate}%`,   growth: stats.overview.conversionGrowthPercent,  key: 'conversion' },
  ];

  return (
    <div>
      {/* Page heading + filters */}
      <div className="section-heading">
        <h2 className="section-title">Analytics &amp; Insights</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {/* Keyword search */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <svg
              width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.2"
              style={{ position: 'absolute', left: 10, pointerEvents: 'none' }}
            >
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
              id="stats-keyword-filter"
              type="text"
              placeholder="Filter by keyword…"
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              style={{
                paddingLeft: 32,
                paddingRight: keyword ? 32 : 12,
                paddingTop: 7,
                paddingBottom: 7,
                fontSize: 12.5,
                border: '1px solid #e5e7eb',
                borderRadius: 8,
                background: '#fff',
                color: '#111827',
                outline: 'none',
                width: 185,
                transition: 'border-color 0.15s, box-shadow 0.15s',
                boxShadow: kw ? '0 0 0 2px rgba(13,110,99,0.15)' : 'none',
                borderColor: kw ? '#0d6e63' : '#e5e7eb',
              }}
              onFocus={e => { e.target.style.borderColor = '#0d6e63'; e.target.style.boxShadow = '0 0 0 2px rgba(13,110,99,0.15)'; }}
              onBlur={e => { if (!kw) { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none'; } }}
            />
            {keyword && (
              <button
                onClick={() => setKeyword('')}
                title="Clear filter"
                style={{
                  position: 'absolute', right: 8, background: 'none', border: 'none',
                  cursor: 'pointer', color: '#9ca3af', padding: 2, display: 'flex',
                  alignItems: 'center', lineHeight: 1,
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Date range */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input
              type="date"
              className="date-input"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
            />
            <span style={{ fontSize: 13, color: '#9ca3af' }}>–</span>
            <input
              type="date"
              className="date-input"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
            />
            <button className="filter-btn">
              Filter
            </button>
          </div>
        </div>
      </div>

      {/* Active keyword badge */}
      {kw && (
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: '#e6f7f6', border: '1px solid #b2ebe7',
          borderRadius: 20, padding: '4px 12px',
          fontSize: 12, fontWeight: 600, color: '#0d6e63',
          marginBottom: 18,
        }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          Filtered by: <em style={{ fontStyle: 'normal', color: '#0f7a6e' }}>&ldquo;{keyword}&rdquo;</em>
          <button onClick={() => setKeyword('')} style={{
            marginLeft: 2, background: 'none', border: 'none', cursor: 'pointer',
            color: '#0d6e63', display: 'flex', alignItems: 'center', padding: 0,
          }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="stats-kpi-grid">
        {kpis.map(k => (
          <div key={k.key} className="kpi-card">
            <div className="kpi-label">{k.label}</div>
            <div className="kpi-value">{k.value}</div>
            <div className="kpi-growth">+{k.growth}% <span>vs last period</span></div>
          </div>
        ))}
      </div>

      {/* Charts — uses filtered videos */}
      <StatsChart
        videos={filteredVideos}
        timeseries={stats.timeseries}
        startDate={startDate}
        endDate={endDate}
      />

      {/* Bottom split: Category Performance + Activity Feed */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 16 }}>

        {/* Category Performance — visual horizontal bars */}
        <div className="chart-card">
          <div className="chart-card-header">
            <div>
              <div className="chart-card-title">Content Category Reach</div>
              <div className="chart-card-sub">Reach volume and avg. engagement rate per content category</div>
            </div>
          </div>
          {filteredCategories.length === 0 ? (
            <div style={{
              padding: '28px 0', textAlign: 'center',
              color: '#9ca3af', fontSize: 13,
            }}>
              No categories match &ldquo;{keyword}&rdquo;
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 4 }}>
              {filteredCategories.map((cat, i) => {
                const maxReach = Math.max(...filteredCategories.map(c => c.reach));
                const barPct = ((cat.reach / maxReach) * 100).toFixed(1);
                const BAR_COLORS = ['#0d6e63', '#17bfaf', '#7c3aed', '#f97316'];
                const color = BAR_COLORS[i % BAR_COLORS.length];
                return (
                  <div key={cat.category}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <span style={{ fontSize: 12.5, fontWeight: 600, color: '#374151' }}>{cat.category}</span>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <span style={{ fontSize: 12, color: '#6b7280' }}>{formatNum(cat.reach)} reach</span>
                        <span style={{
                          fontSize: 11, fontWeight: 700, color: '#059669',
                          background: '#d1fae5', borderRadius: 4, padding: '1px 6px'
                        }}>{cat.avgEngagementRate}% eng.</span>
                      </div>
                    </div>
                    <div style={{ height: 10, background: '#f3f4f6', borderRadius: 6, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${barPct}%`,
                        background: color,
                        borderRadius: 6,
                        transition: 'width 0.6s ease',
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Activity Feed — with type badges */}
        <div className="chart-card">
          <div className="chart-card-header">
            <div>
              <div className="chart-card-title">Recent Activity</div>
              <div className="chart-card-sub">Latest outreach actions</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {stats.recentActivities.map(act => {
              const c = ACTIVITY_TYPE_COLORS[act.type] || ACTIVITY_TYPE_COLORS.outreach;
              return (
                <div key={act.id} style={{
                  padding: '10px 12px',
                  borderRadius: 8,
                  background: c.bg,
                  border: `1px solid ${c.bg}`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: '#111827', flex: 1 }}>{act.title}</div>
                    <span style={{
                      fontSize: 10, fontWeight: 700, color: c.text,
                      background: 'white', borderRadius: 4, padding: '1px 6px',
                      textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap',
                      border: `1px solid ${c.text}22`,
                    }}>{act.type}</span>
                  </div>
                  <div style={{ fontSize: 11.5, color: '#9ca3af' }}>{act.time}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}