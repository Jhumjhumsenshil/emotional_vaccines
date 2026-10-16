'use client';

/**
 * Report Viewer Dashboard  (/report-viewer)
 *
 * Accessible to users with role: "Report Viewer", "Super Admin", "Administrator"
 *
 * All chart data is currently sourced from analyticsService.ts which uses
 * ⚠️ MOCK DATA.  See that file for instructions on switching to real APIs.
 */

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '../components/layout/AppLayout';
import {
  fetchGroupWatchCounts,
  fetchGroupCompletion,
  fetchMostWatchedVideos,
  fetchAvgWatchTimeByGroup,
  fetchEngagementComparison,
  fetchAnalyticsSummary,
  getAvailableGroups,
  getAvailableVideos,
  formatDuration,
  type GroupWatchCount,
  type GroupCompletion,
  type MostWatchedVideo,
  type GroupAvgWatchTime,
  type GroupEngagement,
  type AnalyticsSummary,
  type AnalyticsFilters,
} from '../../services/analyticsService';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface CurrentUser {
  id: number;
  name: string;
  role: string;
}

// ---------------------------------------------------------------------------
// Colour palette shared across all charts
// ---------------------------------------------------------------------------
const GROUP_COLORS = [
  '#2563EB', // blue
  '#059669', // green
  '#D97706', // amber
  '#7C3AED', // violet
  '#DC2626', // red
];

// ---------------------------------------------------------------------------
// Tiny inline chart primitives (SVG-based, no external library)
// ---------------------------------------------------------------------------

function BarChart({
  data,
  valueKey,
  labelKey,
  maxValue,
  unit = '',
  height = 180,
}: {
  data: Record<string, number | string>[];
  valueKey: string;
  labelKey: string;
  maxValue?: number;
  unit?: string;
  height?: number;
}) {
  const values = data.map((d) => Number(d[valueKey]));
  const max = maxValue ?? Math.max(...values, 1);
  const barWidth = 100 / (data.length * 2 - 1); // percent width per bar with gaps

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <div
        style={{
          minWidth: data.length * 64,
          height,
          position: 'relative',
          display: 'flex',
          alignItems: 'flex-end',
          gap: 8,
          padding: '0 4px',
        }}
      >
        {data.map((d, i) => {
          const value = Number(d[valueKey]);
          const pct = max > 0 ? (value / max) * 100 : 0;
          return (
            <div
              key={String(d[labelKey])}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-end',
                height: '100%',
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: GROUP_COLORS[i % GROUP_COLORS.length],
                  marginBottom: 2,
                }}
              >
                {value}{unit}
              </div>
              <div
                style={{
                  width: '100%',
                  height: `${Math.max(pct, 2)}%`,
                  backgroundColor: GROUP_COLORS[i % GROUP_COLORS.length],
                  borderRadius: '4px 4px 0 0',
                  opacity: 0.85,
                  transition: 'height 0.4s ease',
                  position: 'relative',
                }}
                title={`${d[labelKey]}: ${value}${unit}`}
              />
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: '#6B7280',
                  marginTop: 4,
                  textAlign: 'center',
                  whiteSpace: 'nowrap',
                }}
              >
                {String(d[labelKey])}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function HorizontalProgressBar({
  label,
  value,
  max = 100,
  color,
  unit = '',
}: {
  label: string;
  value: number;
  max?: number;
  color: string;
  unit?: string;
}) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div style={{ marginBottom: 10 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 12,
          fontWeight: 600,
          marginBottom: 4,
          color: '#374151',
        }}
      >
        <span>{label}</span>
        <span style={{ color }}>
          {value}
          {unit}
        </span>
      </div>
      <div
        style={{
          height: 8,
          background: '#F3F4F6',
          borderRadius: 4,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${pct}%`,
            background: color,
            borderRadius: 4,
            transition: 'width 0.5s ease',
          }}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------
function SkeletonCard({ height = 200 }: { height?: number }) {
  return (
    <div
      style={{
        height,
        background: 'linear-gradient(90deg, #F3F4F6 25%, #E5E7EB 50%, #F3F4F6 75%)',
        backgroundSize: '200% 100%',
        animation: 'skeletonPulse 1.4s ease infinite',
        borderRadius: 10,
      }}
    />
  );
}

// ---------------------------------------------------------------------------
// Section wrapper
// ---------------------------------------------------------------------------
function SectionCard({
  title,
  subtitle,
  children,
  badge,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  badge?: string;
}) {
  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid #E5E7EB',
        borderRadius: 12,
        padding: '1.25rem 1.5rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: '1rem',
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: '#111827',
            }}
          >
            {title}
          </div>
          {subtitle && (
            <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>
              {subtitle}
            </div>
          )}
        </div>
        {badge && (
          <span
            style={{
              background: '#FFF7ED',
              color: '#B45309',
              border: '1px solid #FDE68A',
              borderRadius: 9999,
              fontSize: 10,
              fontWeight: 700,
              padding: '2px 8px',
              letterSpacing: '0.04em',
              flexShrink: 0,
            }}
          >
            {badge}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stat card
// ---------------------------------------------------------------------------
function StatCard({
  label,
  value,
  icon,
  iconBg,
}: {
  label: string;
  value: string | number;
  icon: string;
  iconBg: string;
}) {
  return (
    <div className="stat-card">
      <div className="stat-info">
        <div className="stat-label">{label}</div>
        <div className="stat-value">{value}</div>
      </div>
      <div className="stat-icon" style={{ background: iconBg }}>
        {icon}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------
function EmptyState({ message }: { message: string }) {
  return (
    <div
      style={{
        textAlign: 'center',
        padding: '2.5rem 1rem',
        color: '#9CA3AF',
        fontSize: 13,
      }}
    >
      <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
      <div>{message}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Error state
// ---------------------------------------------------------------------------
function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div
      style={{
        textAlign: 'center',
        padding: '2rem 1rem',
        color: '#EF4444',
        fontSize: 13,
      }}
    >
      <div style={{ fontSize: 28, marginBottom: 8 }}>⚠️</div>
      <div style={{ marginBottom: 12 }}>{message}</div>
      <button
        onClick={onRetry}
        style={{
          padding: '0.4rem 0.9rem',
          background: '#FEF2F2',
          color: '#DC2626',
          border: '1px solid #FECACA',
          borderRadius: 6,
          fontSize: 12,
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        Retry
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Legend dot
// ---------------------------------------------------------------------------
function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#6B7280' }}>
      <span
        style={{
          width: 10,
          height: 10,
          borderRadius: '50%',
          background: color,
          display: 'inline-block',
          flexShrink: 0,
        }}
      />
      {label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Main Dashboard Component
// ---------------------------------------------------------------------------
export default function ReportViewerDashboard() {
  const router = useRouter();

  // Auth
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  // Filters
  const today = new Date().toISOString().slice(0, 10);
  const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const [startDate, setStartDate] = useState(sixMonthsAgo);
  const [endDate, setEndDate] = useState(today);
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [selectedVideo, setSelectedVideo] = useState<string>('');

  const availableGroups = getAvailableGroups();
  const availableVideos = getAvailableVideos();

  // Data state
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [watchCounts, setWatchCounts] = useState<GroupWatchCount[]>([]);
  const [completion, setCompletion] = useState<GroupCompletion[]>([]);
  const [topVideos, setTopVideos] = useState<MostWatchedVideo[]>([]);
  const [avgWatchTime, setAvgWatchTime] = useState<GroupAvgWatchTime[]>([]);
  const [engagement, setEngagement] = useState<GroupEngagement[]>([]);

  // Loading / error states per section
  const [loadingAll, setLoadingAll] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Auth check
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) {
      router.push('/login');
      return;
    }
    try {
      const parsed: CurrentUser = JSON.parse(stored);
      const allowedRoles = ['Report Viewer', 'Super Admin', 'Administrator'];
      if (!allowedRoles.includes(parsed.role)) {
        router.push('/dashboard');
        return;
      }
      setCurrentUser(parsed);
    } catch {
      router.push('/login');
    }
    setAuthChecked(true);
  }, [router]);

  // ---------------------------------------------------------------------------
  // Data fetch
  // ---------------------------------------------------------------------------
  const buildFilters = useCallback(
    (): AnalyticsFilters => ({
      startDate,
      endDate,
      group: selectedGroup || null,
      videoId: selectedVideo || null,
    }),
    [startDate, endDate, selectedGroup, selectedVideo],
  );

  const loadData = useCallback(async () => {
    setLoadingAll(true);
    setError(null);
    const filters = buildFilters();

    try {
      const [
        summaryData,
        watchCountData,
        completionData,
        topVideoData,
        avgWatchData,
        engagementData,
      ] = await Promise.all([
        fetchAnalyticsSummary(filters),
        fetchGroupWatchCounts(filters),
        fetchGroupCompletion(filters),
        fetchMostWatchedVideos(filters),
        fetchAvgWatchTimeByGroup(filters),
        fetchEngagementComparison(filters),
      ]);

      setSummary(summaryData);
      setWatchCounts(watchCountData);
      setCompletion(completionData);
      setTopVideos(topVideoData);
      setAvgWatchTime(avgWatchData);
      setEngagement(engagementData);
    } catch (err) {
      setError('Failed to load analytics data. Please try again.');
      console.error(err);
    } finally {
      setLoadingAll(false);
    }
  }, [buildFilters]);

  useEffect(() => {
    if (authChecked) {
      loadData();
    }
  }, [authChecked, loadData]);

  const handleResetFilters = () => {
    setStartDate(sixMonthsAgo);
    setEndDate(today);
    setSelectedGroup('');
    setSelectedVideo('');
  };

  // ---------------------------------------------------------------------------
  // Auth loading / redirect states
  // ---------------------------------------------------------------------------
  if (!authChecked || !currentUser) {
    return (
      <div className="auth-container">
        <p style={{ color: 'var(--text-muted)' }}>Verifying access…</p>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <AppLayout title="Report Viewer Dashboard">
      <style>{`
        @keyframes skeletonPulse {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      <div style={{ width: '100%' }}>
        {/* ── Page Header ─────────────────────────────────────────────────── */}
        <div className="admin-header-row" style={{ marginBottom: '1.25rem' }}>
          <div className="admin-title-area">
            <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span>📊</span> Analytics Reports
            </h1>
            <p>
              Group engagement, video performance & completion metrics
              &nbsp;·&nbsp;
              <span
                style={{
                  color: '#B45309',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  background: '#FFF7ED',
                  border: '1px solid #FDE68A',
                  borderRadius: 4,
                  padding: '1px 6px',
                }}
              >
                ⚠️ Mock Data — real APIs not yet connected
              </span>
            </p>
          </div>
          <button
            onClick={loadData}
            disabled={loadingAll}
            className="btn-sm"
            style={{
              background: 'var(--card-bg)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-main)',
              opacity: loadingAll ? 0.6 : 1,
            }}
          >
            {loadingAll ? '⟳ Loading…' : '↻ Refresh'}
          </button>
        </div>

        {/* ── Filter Bar ──────────────────────────────────────────────────── */}
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid #E5E7EB',
            borderRadius: 10,
            padding: '0.875rem 1rem',
            marginBottom: '1.25rem',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.75rem',
            alignItems: 'flex-end',
          }}
        >
          {/* Date Range */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 120 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              From
            </label>
            <input
              id="filter-start-date"
              type="date"
              value={startDate}
              max={endDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{
                height: 36,
                padding: '0 10px',
                border: '1px solid #D1D5DB',
                borderRadius: 6,
                fontSize: 13,
                outline: 'none',
                color: '#374151',
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 120 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              To
            </label>
            <input
              id="filter-end-date"
              type="date"
              value={endDate}
              min={startDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{
                height: 36,
                padding: '0 10px',
                border: '1px solid #D1D5DB',
                borderRadius: 6,
                fontSize: 13,
                outline: 'none',
                color: '#374151',
              }}
            />
          </div>

          {/* Group Filter */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 140 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Group
            </label>
            <select
              id="filter-group"
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              style={{
                height: 36,
                padding: '0 10px',
                border: '1px solid #D1D5DB',
                borderRadius: 6,
                fontSize: 13,
                outline: 'none',
                color: '#374151',
                background: '#FFFFFF',
              }}
            >
              <option value="">All Groups</option>
              {availableGroups.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          {/* Video Filter */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 180 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Video
            </label>
            <select
              id="filter-video"
              value={selectedVideo}
              onChange={(e) => setSelectedVideo(e.target.value)}
              style={{
                height: 36,
                padding: '0 10px',
                border: '1px solid #D1D5DB',
                borderRadius: 6,
                fontSize: 13,
                outline: 'none',
                color: '#374151',
                background: '#FFFFFF',
              }}
            >
              <option value="">All Videos</option>
              {availableVideos.map((v) => (
                <option key={v.id} value={v.id}>{v.title}</option>
              ))}
            </select>
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <button
              id="apply-filters-btn"
              onClick={loadData}
              disabled={loadingAll}
              style={{
                height: 36,
                padding: '0 16px',
                background: '#2563EB',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                opacity: loadingAll ? 0.6 : 1,
              }}
            >
              Apply
            </button>
            <button
              id="reset-filters-btn"
              onClick={handleResetFilters}
              style={{
                height: 36,
                padding: '0 14px',
                background: '#F3F4F6',
                color: '#374151',
                border: '1px solid #E5E7EB',
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Reset
            </button>
          </div>
        </div>

        {/* ── Global Error ─────────────────────────────────────────────────── */}
        {error && (
          <div
            style={{
              background: '#FEF2F2',
              border: '1px solid #FECACA',
              borderRadius: 8,
              padding: '0.875rem 1rem',
              color: '#DC2626',
              fontSize: 13,
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <span>⚠️ {error}</span>
            <button
              onClick={loadData}
              style={{
                padding: '0.3rem 0.75rem',
                background: '#DC2626',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 5,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Retry
            </button>
          </div>
        )}

        {/* ── Summary Stat Cards ───────────────────────────────────────────── */}
        {loadingAll ? (
          <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
            {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} height={88} />)}
          </div>
        ) : summary ? (
          <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
            <StatCard
              label="Total Watch Events"
              value={summary.totalWatches.toLocaleString()}
              icon="▶️"
              iconBg="#EFF6FF"
            />
            <StatCard
              label="Avg Completion Rate"
              value={`${summary.avgCompletionRate}%`}
              icon="✓"
              iconBg="#ECFDF5"
            />
            <StatCard
              label="Groups Tracked"
              value={summary.totalGroups}
              icon="👥"
              iconBg="#F5F3FF"
            />
            <StatCard
              label="Unique Videos Watched"
              value={summary.totalVideosWatched}
              icon="🎬"
              iconBg="#FFFBEB"
            />
          </div>
        ) : null}

        {/* ── Charts Grid ──────────────────────────────────────────────────── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 440px), 1fr))',
            gap: '1.25rem',
            marginBottom: '1.25rem',
          }}
        >
          {/* Section 1: Group Watch Count */}
          <SectionCard
            title="Group Watch Count"
            subtitle="Total video watch events per group"
            badge="⚠️ Mock Data"
          >
            {loadingAll ? (
              <SkeletonCard height={220} />
            ) : error ? (
              <ErrorState message="Could not load watch counts." onRetry={loadData} />
            ) : watchCounts.length === 0 ? (
              <EmptyState message="No watch data for the selected filters." />
            ) : (
              <BarChart
                data={watchCounts.map((d) => ({
                  group: d.group,
                  watchCount: d.watchCount,
                }))}
                labelKey="group"
                valueKey="watchCount"
                height={190}
              />
            )}
          </SectionCard>

          {/* Section 2: Group Completion Percentage */}
          <SectionCard
            title="Group Completion Rate"
            subtitle="% of watches with ≥80% video completion"
            badge="⚠️ Mock Data"
          >
            {loadingAll ? (
              <SkeletonCard height={220} />
            ) : error ? (
              <ErrorState message="Could not load completion data." onRetry={loadData} />
            ) : completion.length === 0 ? (
              <EmptyState message="No completion data for the selected filters." />
            ) : (
              <div>
                {completion.map((g, i) => (
                  <HorizontalProgressBar
                    key={g.group}
                    label={g.group}
                    value={g.completionRate}
                    max={100}
                    color={GROUP_COLORS[i % GROUP_COLORS.length]}
                    unit="%"
                  />
                ))}
                <div
                  style={{
                    marginTop: 12,
                    fontSize: 11,
                    color: '#9CA3AF',
                    borderTop: '1px solid #F3F4F6',
                    paddingTop: 8,
                  }}
                >
                  Completed = watched ≥80% of video duration
                </div>
              </div>
            )}
          </SectionCard>
        </div>

        {/* Section 3: Most Watched Videos — full-width table */}
        <div style={{ marginBottom: '1.25rem' }}>
          <SectionCard
            title="Most Watched Videos"
            subtitle="Ranked by total watch count across all groups"
            badge="⚠️ Mock Data"
          >
            {loadingAll ? (
              <SkeletonCard height={220} />
            ) : error ? (
              <ErrorState message="Could not load video rankings." onRetry={loadData} />
            ) : topVideos.length === 0 ? (
              <EmptyState message="No video data for the selected filters." />
            ) : (
              <div className="table-responsive">
                <table className="admin-table" id="most-watched-videos-table">
                  <thead>
                    <tr>
                      <th style={{ width: 40 }}>#</th>
                      <th>Video Title</th>
                      <th>Category</th>
                      <th>Groups</th>
                      <th style={{ textAlign: 'right' }}>Watch Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topVideos.map((v) => (
                      <tr key={v.videoId}>
                        <td>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: 24,
                              height: 24,
                              borderRadius: '50%',
                              background: v.rank <= 3 ? '#EFF6FF' : '#F9FAFB',
                              color: v.rank <= 3 ? '#2563EB' : '#9CA3AF',
                              fontWeight: 800,
                              fontSize: 12,
                            }}
                          >
                            {v.rank}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontWeight: 600, color: '#111827', fontSize: 13 }}>
                            {v.title}
                          </span>
                        </td>
                        <td>
                          {v.category ? (
                            <span className="badge badge-role" style={{ fontSize: 11 }}>
                              {v.category}
                            </span>
                          ) : (
                            <span style={{ color: '#D1D5DB', fontSize: 12 }}>—</span>
                          )}
                        </td>
                        <td>
                          <span style={{ color: '#6B7280', fontSize: 12 }}>{v.group}</span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <span style={{ fontWeight: 700, color: '#111827', fontSize: 14 }}>
                            {v.watchCount}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>
        </div>

        {/* Sections 4 & 5 grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 440px), 1fr))',
            gap: '1.25rem',
          }}
        >
          {/* Section 4: Average Watch Time by Group */}
          <SectionCard
            title="Average Watch Time by Group"
            subtitle="Mean watch duration per group in seconds"
            badge="⚠️ Mock Data"
          >
            {loadingAll ? (
              <SkeletonCard height={220} />
            ) : error ? (
              <ErrorState message="Could not load watch time data." onRetry={loadData} />
            ) : avgWatchTime.length === 0 ? (
              <EmptyState message="No watch time data for the selected filters." />
            ) : (
              <>
                <BarChart
                  data={avgWatchTime.map((d) => ({
                    group: d.group,
                    avgSec: d.avgSeconds,
                  }))}
                  labelKey="group"
                  valueKey="avgSec"
                  unit="s"
                  height={190}
                />
                <div
                  style={{
                    marginTop: 8,
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 8,
                    fontSize: 11,
                    color: '#9CA3AF',
                  }}
                >
                  {avgWatchTime.map((d, i) => (
                    <span key={d.group} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: GROUP_COLORS[i % GROUP_COLORS.length],
                          display: 'inline-block',
                        }}
                      />
                      {d.group}: {formatDuration(d.avgSeconds)}
                    </span>
                  ))}
                </div>
              </>
            )}
          </SectionCard>

          {/* Section 5: Engagement Comparison Between Groups */}
          <SectionCard
            title="Engagement Comparison"
            subtitle="Watch count · Completion % · Avg watch time per group"
            badge="⚠️ Mock Data"
          >
            {loadingAll ? (
              <SkeletonCard height={220} />
            ) : error ? (
              <ErrorState message="Could not load engagement data." onRetry={loadData} />
            ) : engagement.length === 0 ? (
              <EmptyState message="No engagement data for the selected filters." />
            ) : (
              <>
                <div
                  style={{
                    display: 'flex',
                    gap: 12,
                    marginBottom: 12,
                    flexWrap: 'wrap',
                  }}
                >
                  <LegendDot color="#2563EB" label="Watch Count" />
                  <LegendDot color="#059669" label="Completion %" />
                  <LegendDot color="#D97706" label="Avg Time (s)" />
                </div>

                {/* Mini comparison table */}
                <div className="table-responsive">
                  <table
                    className="admin-table"
                    id="engagement-comparison-table"
                    style={{ fontSize: 12 }}
                  >
                    <thead>
                      <tr>
                        <th>Group</th>
                        <th style={{ textAlign: 'right' }}>Watches</th>
                        <th style={{ textAlign: 'right' }}>Completion</th>
                        <th style={{ textAlign: 'right' }}>Avg Watch</th>
                      </tr>
                    </thead>
                    <tbody>
                      {engagement.map((g, i) => (
                        <tr key={g.group}>
                          <td>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span
                                style={{
                                  width: 9,
                                  height: 9,
                                  borderRadius: '50%',
                                  background: GROUP_COLORS[i % GROUP_COLORS.length],
                                  flexShrink: 0,
                                  display: 'inline-block',
                                }}
                              />
                              <strong>{g.group}</strong>
                            </span>
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 700 }}>
                            {g.watchCount}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <span
                              style={{
                                color:
                                  g.completionRate >= 75
                                    ? '#059669'
                                    : g.completionRate >= 50
                                    ? '#D97706'
                                    : '#DC2626',
                                fontWeight: 700,
                              }}
                            >
                              {g.completionRate}%
                            </span>
                          </td>
                          <td style={{ textAlign: 'right', color: '#6B7280' }}>
                            {formatDuration(g.avgWatchSeconds)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Visual bar comparison for completion rates */}
                <div style={{ marginTop: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Completion Rate by Group
                  </div>
                  {engagement.map((g, i) => (
                    <HorizontalProgressBar
                      key={g.group}
                      label={g.group}
                      value={g.completionRate}
                      max={100}
                      color={GROUP_COLORS[i % GROUP_COLORS.length]}
                      unit="%"
                    />
                  ))}
                </div>
              </>
            )}
          </SectionCard>
        </div>
      </div>
    </AppLayout>
  );
}
