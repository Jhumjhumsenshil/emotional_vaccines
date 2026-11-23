'use client';

import React, { useState, useEffect, useCallback, use } from 'react';
import api from '@/utils/api';
import { FALLBACK_RECIPIENT_VIDEOS } from '../../data/recipientVideos';
import elcLogo from '../../assets/elc-logo.png';
import '../../content-champion/styles/globals.css';
import logoImg from '../../assets/logo.png';

import {
  getLanguageUrl,
  LanguageModalVideo,
} from '../../content-champion/components/ChooseLanguageModal';

// ── TypeScript Interfaces ─────────────────────────────────────────────────
interface Champion {
  id: number;
  name: string;
  email: string;
  champion_token: string;
  initials?: string;
}

export interface VideoItem {
  id: string | number;
  title: string;
  category: string;
  rating?: number;
  languages?: string[];
  description?: string;
  thumbnail?: string;
  streams?: Array<{
    language: string;
    stream_url?: string;
    url?: string;
    video_url?: string;
    thumbnail_url?: string;
  }>;
  [key: string]: any;
}

interface ConsumerPageProps {
  params: Promise<{ token: string }>;
}

// ── Star Rating ───────────────────────────────────────────────────────────
interface StarRatingProps {
  value: number;
  onChange?: (val: number) => void;
}

function StarRating({ value, onChange }: StarRatingProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const display = hovered ?? value;
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          width="25"
          height="25"
          viewBox="0 0 24 24"
          fill={star <= display ? '#d1d5db' : 'none'}
          stroke="#d1d5db"
          strokeWidth="1.5"
          style={{ cursor: 'pointer', transition: 'fill 0.1s' }}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(null)}
          onClick={() => onChange && onChange(star)}
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────
export default function ConsumerVideosPage({ params }: ConsumerPageProps) {
  const { token } = use(params);

  const [champion, setChampion] = useState<Champion | null>(null);
  const [videos, setVideos] = useState<VideoItem[]>(FALLBACK_RECIPIENT_VIDEOS);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Selected playback language from header radio buttons ('EN' | 'SP')
  const [selectedLanguage, setSelectedLanguage] = useState<'EN' | 'SP'>('EN');

  const [sortAlpha, setSortAlpha] = useState<boolean>(false);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [langToggles, setLangToggles] = useState<Record<string, boolean>>({});

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

  const getDefaultVideos = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/videos/default_video`, { cache: 'no-store' });
      if (!res.ok) return [];
      const videoList = await res.json();
      if (Array.isArray(videoList)) {
        return videoList
          .filter((v: any) => v.is_default)
          .map((v: any) => ({
            id: String(v.id),
            title: v.default_title,
            description: v.default_description,
            thumbnail: v.default_thumbnail_url,
            isDefault: v.is_default,
            category: v.categories?.[0]?.name || 'General',
            languages: v.streams?.map((s: any) => s.language) || ['EN'],
            streams: v.streams || [],
          }));
      }
      return [];
    } catch (err) {
      console.error('Failed to fetch default videos:', err);
      return [];
    }
  }, [API_BASE_URL]);

  // Fetch Champion details + Saved Videos and merge with default videos
  const loadChampionAndVideos = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);

    try {
      const formattedToken = token.startsWith('CC-') ? token : `CC-${token}`;
      const champRes = await api.get(`${API_BASE_URL}/videos/champions/${formattedToken}`);
      const champData: Champion = champRes.data;
      setChampion(champData);

      const [defaultVideos, videosRes] = await Promise.all([
        getDefaultVideos(),
        api.get(`${API_BASE_URL}/videos/champions/${champData.id}/videos`),
      ]);

      const savedVideos: VideoItem[] = Array.isArray(videosRes.data) ? videosRes.data : [];
      const videoMap = new Map<string, VideoItem>();

      defaultVideos.forEach((video) => {
        videoMap.set(String(video.id), video);
      });

      savedVideos.forEach((video: any) => {
        const key = String(video.id);
        const existing = videoMap.get(key);
        videoMap.set(key, {
          ...existing,
          ...video,
          id: key,
          title: video.title || video.default_title || existing?.title || '',
          description: video.description || video.default_description || existing?.description || '',
          thumbnail: video.thumbnail || video.default_thumbnail_url || existing?.thumbnail || '',
          category: video.category || video.categories?.[0]?.name || existing?.category || 'General',
          streams:
            Array.isArray(video.streams) && video.streams.length > 0
              ? video.streams
              : existing?.streams || [],
        });
      });

      let mergedVideos = Array.from(videoMap.values());

      // Hydrate streams from /videos if any saved video didn't include streams
      const missingStreams = mergedVideos.some(
        (v) => !Array.isArray(v.streams) || v.streams.length === 0
      );
      if (missingStreams) {
        try {
          const catalogRes = await fetch(`${API_BASE_URL}/videos?limit=100&offset=0`);
          if (catalogRes.ok) {
            const catalogJson = await catalogRes.json();
            const catalogList = Array.isArray(catalogJson) ? catalogJson : catalogJson.videos || [];
            const streamsById = new Map<string, any[]>();
            catalogList.forEach((cv: any) => {
              if (Array.isArray(cv.streams) && cv.streams.length > 0) {
                streamsById.set(String(cv.id), cv.streams);
              }
            });

            mergedVideos = mergedVideos.map((v) => {
              const found = streamsById.get(String(v.id));
              return (!v.streams || v.streams.length === 0) && found
                ? { ...v, streams: found }
                : v;
            });
          }
        } catch (catalogErr) {
          console.error('Failed to hydrate video streams:', catalogErr);
        }
      }

      setVideos(mergedVideos);
    } catch (err: any) {
      console.error('Failed to load champion video list:', err);
      setError('Invalid or Expired Content Champion Link');
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL, getDefaultVideos, token]);

  useEffect(() => {
    loadChampionAndVideos();
  }, [loadChampionAndVideos]);

  const setRating = (id: string | number, val: number) => {
    setRatings((r) => ({ ...r, [String(id)]: val }));
  };

  const getLangToggle = (videoId: string | number, lang: string): boolean => {
    const key = `${videoId}-${lang}`;
    if (key in langToggles) return langToggles[key];
    const vid = videos.find((v) => String(v.id) === String(videoId));
    return vid?.languages?.includes(lang) ?? false;
  };

  const toggleLang = (videoId: string | number, lang: string) => {
    const key = `${videoId}-${lang}`;
    setLangToggles((t) => ({ ...t, [key]: !getLangToggle(videoId, lang) }));
  };

  const championName = champion?.name || 'Content Champion';
  const initials =
    champion?.initials ||
    championName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

  const displayed = sortAlpha
    ? [...videos].sort((a, b) => a.title.localeCompare(b.title))
    : videos;

  // Directly open the video link matching the selected header language (with fallback)
  const handleThumbnailClick = (video: LanguageModalVideo) => {
    const preferredUrl = getLanguageUrl(video, selectedLanguage);
    const fallbackLang: 'EN' | 'SP' = selectedLanguage === 'EN' ? 'SP' : 'EN';
    const fallbackUrl = getLanguageUrl(video, fallbackLang);

    const targetUrl = preferredUrl || fallbackUrl;
    const resolvedLang: 'EN' | 'SP' = preferredUrl ? selectedLanguage : fallbackLang;

    if (!targetUrl) return;

    if (champion?.id) {
      api
        .post('/videos/track-click', {
          customer_id: champion.id,
          video_id: String(video.id),
          video_title: video.title || video.default_title || '',
          language: resolvedLang,
          count: 1,
        })
        .catch((err) => console.error('Failed to track video click:', err));
    }

    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', color: '#6b7280' }}>
        Loading videos...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', fontWeight: 500, color: '#374151' }}>
        {error}
      </div>
    );
  }


  const handleRateVideo = async (videoId: string | number, val: number) => {
  const videoIdStr = String(videoId);
  const previousRating = ratings[videoIdStr];

  // 1. Optimistic UI update so the star highlights immediately
  setRatings((prev) => ({ ...prev, [videoIdStr]: val }));

  if (!champion?.id) return;

  try {
    const vid = videos.find((v) => String(v.id) === videoIdStr);
    const selectedLang = getLangToggle(videoIdStr, 'SP') ? 'SP' : 'EN';

    const res = await fetch(
      `${API_BASE_URL}/videos/champions/${champion.id}/videos`,
      {
        method: 'POST', // or PATCH /videos/champions/${championId}/videos/${videoIdStr}
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          video_id: Number(videoId),
          rating: val,
          selected_language: vid?.selected_language || selectedLang,
        }),
      }
    );

    if (!res.ok) {
      throw new Error(`Failed to save rating (${res.status})`);
    }
  } catch (err) {
    console.error('Error saving video rating:', err);
    // Revert optimistic update on failure
    setRatings((prev) => ({
      ...prev,
      [videoIdStr]: previousRating ?? 0,
    }));
  }
};

  return (
    <div>
      {/* Header */}
      <header className="app-header">
        <div className="header-title-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img
              src={(logoImg as any).src || logoImg}
              alt="Emotional Vaccines Logo"
              style={{ width: 38, height: 38, objectFit: 'contain', flexShrink: 0, display: 'block' }}
            />
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#4a4a4a', lineHeight: 1.2, letterSpacing: '-0.01em' }}>
                Emotional<br />
                Vaccines<sup style={{ fontSize: 9, verticalAlign: 'super', fontWeight: 500, color: '#9ca3af' }}>®</sup>
              </div>
              <div style={{ fontSize: 10, fontWeight: 400, color: '#9ca3af', letterSpacing: '0.01em', marginTop: 3 }}>
                Resiliency Education
              </div>
            </div>
          </div>

          <div className="header-title-left" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button
              className="hamburger-btn"
              aria-label="Open sidebar"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>

            <h1 className="header-app-title">My Videos</h1>            
          </div>

          {/* Partner Org Logo & User profile */}
          <div className="header-user-section">
            {/* Language Selector Radio Group */}
            <div
              role="radiogroup"
              aria-label="Select video language"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 14, marginLeft: 25 }}
            >
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 5, cursor: 'pointer', fontSize: 13, fontWeight: 500, color: '#374151' }}>
                <input
                  type="radio"
                  name="consumer-language"
                  value="EN"
                  checked={selectedLanguage === 'EN'}
                  onChange={() => setSelectedLanguage('EN')}
                  style={{ accentColor: '#f97316', cursor: 'pointer' }}
                />
                English
              </label>

              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 5, cursor: 'pointer', fontSize: 13, fontWeight: 500, color: '#374151' }}>
                <input
                  type="radio"
                  name="consumer-language"
                  value="SP"
                  checked={selectedLanguage === 'SP'}
                  onChange={() => setSelectedLanguage('SP')}
                  style={{ accentColor: '#f97316', cursor: 'pointer' }}
                />
                Spanish
              </label>
            </div>
            <div className="header-org-badge" title="Early Learning Coalition of Marine County">
              <img
                src={(elcLogo as any).src || elcLogo}
                alt="Early Learning Coalition of Marine County"
                className="header-org-img"
              />
            </div>

            <div className="header-user-divider" />

            <div className="user-profile">
              <div className="user-info">
                <div className="user-name">Welcome {championName}</div>
                <div className="user-org">{champion?.email || 'Content Champion'}</div>
              </div>
              <div className="user-avatar" title={championName}>
                {initials}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Video Table */}
      <div
        className="recipients-list-wrap"
        style={{
          width: '100%',
          backgroundColor: '#ffffff',
          borderRadius: 8,
          border: '1px solid #e5e7eb',
          overflowX: 'auto',
        }}
      >
        <div style={{ minWidth: 720 }}>
          {/* Header Row */}
          <div
            className="recipients-list-header"
            style={{
              display: 'grid',
              gridTemplateColumns: '200px 250px 200px 60px 60px minmax(200px, 1fr)',
              alignItems: 'center',
              padding: '10px 12px',
              backgroundColor: '#f9fafb',
              borderBottom: '1px solid #e5e7eb',
              fontSize: 12,
              fontWeight: 600,
              color: '#6b7280',
            }}
          >
            <div>View</div>
            <div>Title</div>
            <div>My Star Rating</div>
            <div style={{ textAlign: 'center' }}>EN</div>
            <div style={{ textAlign: 'center' }}>SP</div>
            <div>Description</div>
          </div>

          {/* Video Rows */}
          <div className="recipients-list-body">
            {displayed.map((vid) => (
              <div
                key={vid.id}
                className="recipients-list-row"
                style={{
                  display: 'grid',
                  gridTemplateColumns: '200px 250px 200px 60px 60px minmax(200px, 1fr)',
                  alignItems: 'center',
                  padding: '10px 12px',
                  borderBottom: '1px solid #f3f4f6',
                }}
              >
                {/* Thumbnail */}
                <div style={{ paddingRight: 8 }}>
                  <div
                    className="video-thumb"
                    onClick={() => handleThumbnailClick(vid)}
                    title={`Click to watch in ${selectedLanguage === 'EN' ? 'English' : 'Spanish'}`}
                    style={{
                      width: 110,
                      height: 64,
                      borderRadius: 6,
                      overflow: 'hidden',
                      cursor: 'pointer',
                      position: 'relative',
                      backgroundColor: '#f3f4f6',
                    }}
                  >
                    {vid.thumbnail ? (
                      <img
                        src={vid.thumbnail}
                        alt={vid.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#9ca3af"
                          strokeWidth="1.5"
                        >
                          <polygon points="5 3 19 12 5 21 5 3" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>

                {/* Title + Category */}
                <div style={{ paddingRight: 8 }}>
                  <div
                    style={{
                      fontWeight: 700,
                      color: '#111827',
                      fontSize: 13,
                      lineHeight: 1.3,
                    }}
                  >
                    {vid.title}
                  </div>
                  <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>
                    {vid.category}
                  </div>
                </div>

                {/* Stars */}
                <div style={{ paddingRight: 8 }}>
                  <StarRating
                    value={ratings[String(vid.id)] ?? vid.rating ?? 0}
                    onChange={(val) => handleRateVideo(vid.id, val)}
                  />
                </div>

                {/* EN */}
                <div style={{ textAlign: 'center', padding: '0 4px' }}>
                  <input
                    type="checkbox"
                    checked={getLangToggle(vid.id, 'English') || getLangToggle(vid.id, 'EN')}
                    onChange={() => toggleLang(vid.id, 'EN')}
                    style={{
                      accentColor: '#f97316',
                      width: 15,
                      height: 15,
                      cursor: 'pointer',
                    }}
                  />
                </div>

                {/* SP */}
                <div style={{ textAlign: 'center', padding: '0 4px' }}>
                  <input
                    type="checkbox"
                    checked={getLangToggle(vid.id, 'Spanish') || getLangToggle(vid.id, 'SP')}
                    onChange={() => toggleLang(vid.id, 'SP')}
                    style={{
                      accentColor: '#f97316',
                      width: 15,
                      height: 15,
                      cursor: 'pointer',
                    }}
                  />
                </div>

                {/* Description */}
                <div
                  style={{
                    padding: '0 8px',
                    fontSize: 12,
                    color: '#374151',
                    lineHeight: 1.5,
                  }}
                >
                  {vid.description}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}