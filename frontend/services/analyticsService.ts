/**
 * analyticsService.ts
 *
 * Data layer for the Report Viewer Analytics Dashboard.
 *
 * ⚠️  ALL DATA RETURNED BY THIS FILE IS CURRENTLY MOCK DATA.
 *     It is clearly labeled as such and is used only for UI development.
 *     To connect real backend APIs, replace each function body with a real
 *     fetch() call to the corresponding endpoint listed in each function's
 *     JSDoc comment. The return types are stable — no other file needs to change.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GroupWatchCount {
  group: string;
  watchCount: number;
}

export interface GroupCompletion {
  group: string;
  completionRate: number; // 0–100
  completed: number;
  total: number;
}

export interface MostWatchedVideo {
  rank: number;
  videoId: string;
  title: string;
  group: string;
  category: string | null;
  watchCount: number;
}

export interface GroupAvgWatchTime {
  group: string;
  avgSeconds: number; // Average watch time in seconds
}

export interface GroupEngagement {
  group: string;
  watchCount: number;
  completionRate: number; // 0–100
  avgWatchSeconds: number;
}

export interface AnalyticsFilters {
  startDate: string; // ISO date string
  endDate: string;   // ISO date string
  group: string | null;    // null = all groups
  videoId: string | null;  // null = all videos
}

export interface AnalyticsSummary {
  totalWatches: number;
  avgCompletionRate: number;
  totalGroups: number;
  totalVideosWatched: number;
}

// ---------------------------------------------------------------------------
// MOCK DATA  ⚠️  Not real database data – for UI development only
// ---------------------------------------------------------------------------

const MOCK_GROUPS = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon'];

const MOCK_VIDEO_IDS = ['v1', 'v2', 'v3', 'v4', 'v5', 'v6'];
const MOCK_VIDEO_TITLES: Record<string, string> = {
  v1: 'Movement as Medicine: Exercise & Mental Health',
  v2: 'Grief & Growth: Navigating Loss Together',
  v3: 'Crisis Intervention: What to Say When It Matters Most',
  v4: 'Sleep Science: Rest Your Way to Better Mental Health',
  v5: 'The Power of Peer Support',
  v6: 'Raising Resilient Kids in Uncertain Times',
};
const MOCK_VIDEO_CATEGORIES: Record<string, string> = {
  v1: 'Self Care',
  v2: 'Families Thrive',
  v3: 'Crisis Resources',
  v4: 'Self Care',
  v5: 'Community Support',
  v6: 'Families Thrive',
};

/**
 * Raw mock rows simulating what the backend would return.
 * Each row represents a video-watch event record.
 */
const MOCK_WATCH_EVENTS = [
  // group, videoId, completedPct (0–100), watchedSeconds
  { group: 'Alpha',   videoId: 'v1', completedPct: 92, watchedSeconds: 359 },
  { group: 'Alpha',   videoId: 'v1', completedPct: 100, watchedSeconds: 390 },
  { group: 'Alpha',   videoId: 'v2', completedPct: 75, watchedSeconds: 399 },
  { group: 'Alpha',   videoId: 'v3', completedPct: 88, watchedSeconds: 597 },
  { group: 'Alpha',   videoId: 'v4', completedPct: 60, watchedSeconds: 279 },
  { group: 'Alpha',   videoId: 'v5', completedPct: 100, watchedSeconds: 365 },
  { group: 'Alpha',   videoId: 'v1', completedPct: 95, watchedSeconds: 371 },
  { group: 'Alpha',   videoId: 'v2', completedPct: 80, watchedSeconds: 426 },
  { group: 'Beta',    videoId: 'v1', completedPct: 50, watchedSeconds: 195 },
  { group: 'Beta',    videoId: 'v3', completedPct: 100, watchedSeconds: 678 },
  { group: 'Beta',    videoId: 'v4', completedPct: 72, watchedSeconds: 335 },
  { group: 'Beta',    videoId: 'v5', completedPct: 45, watchedSeconds: 164 },
  { group: 'Beta',    videoId: 'v6', completedPct: 90, watchedSeconds: 504 },
  { group: 'Beta',    videoId: 'v2', completedPct: 65, watchedSeconds: 346 },
  { group: 'Gamma',   videoId: 'v1', completedPct: 100, watchedSeconds: 390 },
  { group: 'Gamma',   videoId: 'v1', completedPct: 100, watchedSeconds: 390 },
  { group: 'Gamma',   videoId: 'v2', completedPct: 88, watchedSeconds: 468 },
  { group: 'Gamma',   videoId: 'v3', completedPct: 55, watchedSeconds: 373 },
  { group: 'Gamma',   videoId: 'v6', completedPct: 78, watchedSeconds: 437 },
  { group: 'Gamma',   videoId: 'v4', completedPct: 100, watchedSeconds: 465 },
  { group: 'Delta',   videoId: 'v2', completedPct: 30, watchedSeconds: 160 },
  { group: 'Delta',   videoId: 'v5', completedPct: 68, watchedSeconds: 248 },
  { group: 'Delta',   videoId: 'v6', completedPct: 82, watchedSeconds: 459 },
  { group: 'Delta',   videoId: 'v1', completedPct: 95, watchedSeconds: 371 },
  { group: 'Epsilon', videoId: 'v3', completedPct: 100, watchedSeconds: 678 },
  { group: 'Epsilon', videoId: 'v4', completedPct: 85, watchedSeconds: 395 },
  { group: 'Epsilon', videoId: 'v1', completedPct: 70, watchedSeconds: 273 },
  { group: 'Epsilon', videoId: 'v2', completedPct: 90, watchedSeconds: 479 },
  { group: 'Epsilon', videoId: 'v5', completedPct: 100, watchedSeconds: 365 },
  { group: 'Epsilon', videoId: 'v6', completedPct: 58, watchedSeconds: 325 },
  { group: 'Epsilon', videoId: 'v3', completedPct: 95, watchedSeconds: 644 },
];

// ---------------------------------------------------------------------------
// Helper: apply date & group filters to mock events
// ---------------------------------------------------------------------------
function applyFilters(filters: AnalyticsFilters): typeof MOCK_WATCH_EVENTS {
  let events = [...MOCK_WATCH_EVENTS];
  if (filters.group) {
    events = events.filter((e) => e.group === filters.group);
  }
  if (filters.videoId) {
    events = events.filter((e) => e.videoId === filters.videoId);
  }
  // Date filter has no real effect on static mock data but is applied structurally
  return events;
}

// ---------------------------------------------------------------------------
// Public API functions
// ---------------------------------------------------------------------------

/**
 * Returns the total watch count per group.
 *
 * Real API endpoint (when ready): GET /api/analytics/group-watch-count
 * Query params: start_date, end_date, group (optional)
 *
 * ⚠️  Currently returns MOCK DATA.
 */
export async function fetchGroupWatchCounts(
  filters: AnalyticsFilters,
): Promise<GroupWatchCount[]> {
  await delay(400);
  const events = applyFilters(filters);

  const counts: Record<string, number> = {};
  const groups = filters.group ? [filters.group] : MOCK_GROUPS;
  groups.forEach((g) => (counts[g] = 0));
  events.forEach((e) => {
    counts[e.group] = (counts[e.group] || 0) + 1;
  });

  return groups.map((g) => ({ group: g, watchCount: counts[g] || 0 }));
}

/**
 * Returns completion statistics per group.
 *
 * Real API endpoint (when ready): GET /api/analytics/group-completion
 * Query params: start_date, end_date, group (optional)
 *
 * ⚠️  Currently returns MOCK DATA.
 */
export async function fetchGroupCompletion(
  filters: AnalyticsFilters,
): Promise<GroupCompletion[]> {
  await delay(350);
  const events = applyFilters(filters);

  const groups = filters.group ? [filters.group] : MOCK_GROUPS;
  return groups.map((g) => {
    const groupEvents = events.filter((e) => e.group === g);
    const completed = groupEvents.filter((e) => e.completedPct >= 80).length;
    const total = groupEvents.length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { group: g, completionRate, completed, total };
  });
}

/**
 * Returns the most-watched videos across groups.
 *
 * Real API endpoint (when ready): GET /api/analytics/most-watched-videos
 * Query params: start_date, end_date, group (optional), limit
 *
 * ⚠️  Currently returns MOCK DATA.
 */
export async function fetchMostWatchedVideos(
  filters: AnalyticsFilters,
  limit = 10,
): Promise<MostWatchedVideo[]> {
  await delay(300);
  const events = applyFilters(filters);

  const counts: Record<string, { count: number; groups: Set<string> }> = {};
  events.forEach((e) => {
    if (!counts[e.videoId]) counts[e.videoId] = { count: 0, groups: new Set() };
    counts[e.videoId].count += 1;
    counts[e.videoId].groups.add(e.group);
  });

  return MOCK_VIDEO_IDS
    .filter((id) => counts[id])
    .map((id) => ({
      videoId: id,
      title: MOCK_VIDEO_TITLES[id],
      group: Array.from(counts[id].groups).join(', '),
      category: MOCK_VIDEO_CATEGORIES[id] || null,
      watchCount: counts[id].count,
      rank: 0,
    }))
    .sort((a, b) => b.watchCount - a.watchCount)
    .slice(0, limit)
    .map((v, i) => ({ ...v, rank: i + 1 }));
}

/**
 * Returns the average watch time (in seconds) per group.
 *
 * Real API endpoint (when ready): GET /api/analytics/avg-watch-time
 * Query params: start_date, end_date, group (optional)
 *
 * ⚠️  Currently returns MOCK DATA.
 */
export async function fetchAvgWatchTimeByGroup(
  filters: AnalyticsFilters,
): Promise<GroupAvgWatchTime[]> {
  await delay(320);
  const events = applyFilters(filters);

  const groups = filters.group ? [filters.group] : MOCK_GROUPS;
  return groups.map((g) => {
    const groupEvents = events.filter((e) => e.group === g);
    const avgSeconds =
      groupEvents.length > 0
        ? Math.round(
            groupEvents.reduce((sum, e) => sum + e.watchedSeconds, 0) /
              groupEvents.length,
          )
        : 0;
    return { group: g, avgSeconds };
  });
}

/**
 * Returns combined engagement metrics per group for the comparison chart.
 *
 * Real API endpoint (when ready): GET /api/analytics/engagement-comparison
 * Query params: start_date, end_date
 *
 * ⚠️  Currently returns MOCK DATA.
 */
export async function fetchEngagementComparison(
  filters: AnalyticsFilters,
): Promise<GroupEngagement[]> {
  await delay(380);
  const [watchCounts, completion, avgTime] = await Promise.all([
    fetchGroupWatchCounts(filters),
    fetchGroupCompletion(filters),
    fetchAvgWatchTimeByGroup(filters),
  ]);

  const groups = filters.group ? [filters.group] : MOCK_GROUPS;
  return groups.map((g) => ({
    group: g,
    watchCount: watchCounts.find((w) => w.group === g)?.watchCount ?? 0,
    completionRate: completion.find((c) => c.group === g)?.completionRate ?? 0,
    avgWatchSeconds: avgTime.find((t) => t.group === g)?.avgSeconds ?? 0,
  }));
}

/**
 * Returns high-level summary numbers for the dashboard stat cards.
 *
 * Real API endpoint (when ready): GET /api/analytics/summary
 * Query params: start_date, end_date, group (optional)
 *
 * ⚠️  Currently returns MOCK DATA.
 */
export async function fetchAnalyticsSummary(
  filters: AnalyticsFilters,
): Promise<AnalyticsSummary> {
  await delay(250);
  const events = applyFilters(filters);
  const uniqueGroups = new Set(events.map((e) => e.group));
  const uniqueVideos = new Set(events.map((e) => e.videoId));
  const completed = events.filter((e) => e.completedPct >= 80).length;

  return {
    totalWatches: events.length,
    avgCompletionRate:
      events.length > 0 ? Math.round((completed / events.length) * 100) : 0,
    totalGroups: uniqueGroups.size,
    totalVideosWatched: uniqueVideos.size,
  };
}

/** Helper list of available groups (for the group filter dropdown). */
export function getAvailableGroups(): string[] {
  return [...MOCK_GROUPS];
}

/** Helper list of available videos (for the video filter dropdown). */
export function getAvailableVideos(): { id: string; title: string }[] {
  return MOCK_VIDEO_IDS.map((id) => ({ id, title: MOCK_VIDEO_TITLES[id] }));
}

/** Format seconds as "Xm Ys" */
export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  if (s === 0) return `${m}m`;
  return `${m}m ${s}s`;
}

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
