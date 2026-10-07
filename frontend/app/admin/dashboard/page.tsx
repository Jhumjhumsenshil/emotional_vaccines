'use client';

import { useEffect, useState } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import { getDashboardStats, getMockVideos, getMockCategories, Video } from '../../../services/mockData';

function formatDuration(seconds: number): string {
  if (!seconds) return '6:30';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function getCategoryTagStyle(categoryName: string): string {
  const name = categoryName.toUpperCase();
  if (name.includes('SELF CARE')) return 'text-[#0D6E5B]';
  if (name.includes('FAMILIES')) return 'text-[#7C3AED]';
  if (name.includes('CRISIS')) return 'text-[#DC2626]';
  if (name.includes('COMMUNITY')) return 'text-[#EA580C]';
  return 'text-[#0D6E5B]';
}

function VideoPreviewThumbnail({ src, title, duration }: { src?: string; title: string; duration: number }) {
  const [imgError, setImgError] = useState(false);

  return (
    <div className="relative w-32 h-20 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 shrink-0">
      {src && !imgError ? (
        <img
          src={src}
          alt={title}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-100">
          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>
      )}
      <div className="absolute bottom-1.5 right-1.5 bg-black/85 text-white text-[10px] font-bold px-1.5 py-0.5 rounded tracking-tight">
        {formatDuration(duration)}
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [categoriesMap, setCategoriesMap] = useState<Record<string, string>>({});
  const [searchFilter, setSearchFilter] = useState('');

  useEffect(() => {
    setStats(getDashboardStats());
    const allVideos = getMockVideos();
    setVideos(allVideos);

    const cats = getMockCategories();
    const map: Record<string, string> = {};
    cats.forEach(c => { map[c.id] = c.name; });
    setCategoriesMap(map);
  }, []);

  if (!stats) return <AppLayout title="Dashboard"><div className="p-8 text-gray-500">Loading dashboard data...</div></AppLayout>;

  const filteredVideos = videos.filter(v =>
    v.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
    v.description.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const statCards = [
    {
      title: 'TOTAL VIDEO VIEWS',
      value: stats.totalViews >= 1000 ? `${(stats.totalViews / 1000).toFixed(1)}K` : stats.totalViews.toLocaleString(),
      change: '+18.6%',
      isPositive: true,
      period: 'vs last period',
    },
    {
      title: 'TOTAL ENGAGEMENTS',
      value: `${(stats.totalVideos * 1.3).toFixed(1)}K`,
      change: '+12.3%',
      isPositive: true,
      period: 'vs last period',
    },
    {
      title: 'ACTIVE RECIPIENTS',
      value: stats.activeCustomers.toString(),
      change: '+9.5%',
      isPositive: true,
      period: 'vs last period',
    },
    {
      title: 'CAMPAIGN CONVERSION',
      value: '6.4%',
      change: '+2.1%',
      isPositive: true,
      period: 'vs last period',
    },
  ];

  return (
    <AppLayout title="Analytics & Insights">
      <div className="w-full">
        {/* Header Row (Title + Filter Controls) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight shrink-0">Analytics & Insights</h1>
          
          {/* Right Side Filter Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Keyword Search Input with pl-9 to prevent icon overlap */}
            <div className="relative flex items-center">
              <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Filter by keyword..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="pl-9 pr-3 h-9 bg-white border border-gray-200 rounded-lg text-xs sm:text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-[#0D6E5B] w-44 sm:w-56 shadow-2xs"
              />
            </div>

            {/* Date Range Inputs with "–" divider */}
            <div className="flex items-center h-9 bg-white border border-gray-200 rounded-lg px-3 text-xs sm:text-sm text-gray-700 shadow-2xs gap-2">
              <span>01-01-2026</span>
              <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-gray-400 font-semibold">–</span>
              <span>14-09-2026</span>
              <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>

            {/* Filter Button */}
            <button className="h-9 px-3.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 font-medium text-xs sm:text-sm rounded-lg transition-colors shadow-2xs flex items-center justify-center">
              Filter
            </button>
          </div>
        </div>

        {/* Compact Stat Cards Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-8">
          {statCards.map((card, idx) => (
            <div
              key={idx}
              className="bg-white px-5 py-4 rounded-xl border border-gray-200 shadow-xs flex flex-col justify-between hover:border-gray-300 transition-colors"
            >
              <div>
                <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  {card.title}
                </div>
                <div className="text-2xl sm:text-[26px] font-bold text-gray-900 leading-tight mb-1">
                  {card.value}
                </div>
              </div>
              <div className="flex items-center text-xs font-medium mt-1">
                <span className={card.isPositive ? 'text-emerald-600 font-semibold mr-1.5' : 'text-rose-600 font-semibold mr-1.5'}>
                  {card.change}
                </span>
                <span className="text-gray-400 font-normal">{card.period}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Discovery Library Section */}
        <div className="mt-8 pb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">Discovery Library</h2>
            
            <div className="relative">
              <select className="appearance-none h-9 bg-white border border-gray-200 text-xs sm:text-sm font-medium text-gray-700 px-3.5 pr-8 rounded-lg focus:outline-none focus:border-[#0D6E5B] cursor-pointer shadow-2xs">
                <option>Sort: Most Recent</option>
                <option>Sort: Most Popular</option>
                <option>Sort: Title A-Z</option>
              </select>
              <svg className="w-4 h-4 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Video Table Container */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs">
            {/* Table Column Headers */}
            <div className="hidden sm:grid grid-cols-12 gap-4 px-6 py-3 border-b border-gray-200 bg-gray-50/50 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
              <div className="col-span-3">VIDEO PREVIEW</div>
              <div className="col-span-5">DETAILS</div>
              <div className="col-span-2 text-center">LANGUAGE</div>
              <div className="col-span-2 text-right">ACTION</div>
            </div>

            {/* Video Rows */}
            <div className="divide-y divide-gray-100">
              {filteredVideos.map((video) => {
                const categoryName = categoriesMap[video.categoryId] || 'Self Care';
                const categoryTagStyle = getCategoryTagStyle(categoryName);
                
                return (
                  <div
                    key={video.id}
                    className="p-4 sm:px-6 sm:py-4 hover:bg-gray-50/70 transition-colors grid grid-cols-1 sm:grid-cols-12 gap-4 items-center"
                  >
                    {/* VIDEO PREVIEW */}
                    <div className="sm:col-span-3 flex items-center">
                      <VideoPreviewThumbnail src={video.thumbnail} title={video.title} duration={video.duration} />
                    </div>

                    {/* DETAILS */}
                    <div className="sm:col-span-5 flex flex-col justify-center">
                      <span className={`text-[11px] font-bold uppercase tracking-wider ${categoryTagStyle}`}>
                        {categoryName}
                      </span>
                      <h3 className="text-base font-bold text-gray-900 mt-0.5 leading-snug hover:text-[#0D6E5B] transition-colors cursor-pointer">
                        {video.title}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                        {video.description}
                      </p>
                    </div>

                    {/* LANGUAGE */}
                    <div className="sm:col-span-2 flex items-center sm:justify-center gap-1.5">
                      <span className="bg-gray-900 text-white text-[11px] font-bold px-2 py-0.5 rounded">EN</span>
                      <span className="border border-gray-300 text-gray-500 text-[11px] font-medium px-2 py-0.5 rounded">SP</span>
                    </div>

                    {/* ACTION */}
                    <div className="sm:col-span-2 flex items-center justify-start sm:justify-end">
                      <button className="bg-[#0D6E5B] hover:bg-[#0B5B4B] text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors shadow-2xs whitespace-nowrap h-9">
                        Add to My Recipients
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
