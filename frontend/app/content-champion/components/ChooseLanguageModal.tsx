'use client';

import React, { useEffect } from 'react';

export interface VideoStream {
  id?: number;
  video_id?: number;
  language: string;
  url?: string;
  video_url?: string;
  stream_url?: string;
  thumbnail_url?: string;
  title?: string;
}

export interface LanguageModalVideo {
  id: string | number;
  title?: string;
  default_title?: string;
  thumbnail?: string;
  default_thumbnail_url?: string;
  streams?: VideoStream[];
  enUrl?: string;
  spUrl?: string;
  video_url?: string;
  [key: string]: any;
}

export function getLanguageUrl(
  video: LanguageModalVideo,
  lang: 'EN' | 'SP'
): string | undefined {
  const targetCodes = lang === 'EN' ? ['EN', 'ENGLISH'] : ['SP', 'ES', 'SPANISH'];

  if (Array.isArray(video.streams)) {
    const matchedStream = video.streams.find((s) =>
      targetCodes.includes(String(s.language || '').trim().toUpperCase())
    );
    const streamUrl =
      matchedStream?.stream_url || matchedStream?.url || matchedStream?.video_url;
    if (streamUrl) return streamUrl;
  }

  if (lang === 'EN') {
    return video.enUrl || video.en_url || video.english_url || video.video_url;
  }
  return video.spUrl || video.sp_url || video.spanish_url;
}

interface ChooseLanguageModalProps {
  video: LanguageModalVideo | null;
  onClose: () => void;
  onSelectLanguage: (
    video: LanguageModalVideo,
    lang: 'EN' | 'SP',
    url: string
  ) => void;
}

export default function ChooseLanguageModal({
  video,
  onClose,
  onSelectLanguage,
}: ChooseLanguageModalProps) {
  useEffect(() => {
    if (!video) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [video, onClose]);

  if (!video) return null;

  const displayTitle = video.title || video.default_title || 'Untitled Video';
  const displayThumb =
    video.thumbnail || video.default_thumbnail_url || video.streams?.[0]?.thumbnail_url;
  const enUrl = getLanguageUrl(video, 'EN');
  const spUrl = getLanguageUrl(video, 'SP');

  return (
    <div
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="choose-language-title"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.58)',
        backdropFilter: 'blur(2px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        zIndex: 1000,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 460,
          backgroundColor: '#ffffff',
          borderRadius: 10,
          boxShadow:
            '0 24px 48px -12px rgba(15, 23, 42, 0.35), 0 0 0 1px rgba(15, 23, 42, 0.08)',
          overflow: 'hidden',
        }}
      >
        {/* Top Header */}
        <div
          style={{
            background: 'linear-gradient(180deg, #4b5563 0%, #374151 100%)',
            color: '#f9fafb',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#60a5fa"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            <span
              id="choose-language-title"
              style={{ fontWeight: 600, fontSize: 14, letterSpacing: '0.01em' }}
            >
              Choose Language
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            style={{
              width: 26,
              height: 26,
              borderRadius: 6,
              border: '1px solid rgba(255, 255, 255, 0.16)',
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              color: '#e5e7eb',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 22px 22px' }}>
          <p
            style={{
              margin: '0 0 14px 0',
              fontSize: 14,
              lineHeight: 1.5,
              color: '#1f2937',
              fontWeight: 500,
            }}
          >
            Please choose the English or Spanish version of the video.
          </p>

          {/* Video Context Card */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 12px',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 8,
              marginBottom: 20,
            }}
          >
            {displayThumb && (
              <img
                src={displayThumb}
                alt={displayTitle}
                style={{
                  width: 68,
                  height: 40,
                  objectFit: 'cover',
                  borderRadius: 5,
                  flexShrink: 0,
                  border: '1px solid #e5e7eb',
                }}
              />
            )}
            <div style={{ minWidth: 0, flex: 1 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#0f172a',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {displayTitle}
              </div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                Available:{' '}
                {[enUrl ? 'English' : null, spUrl ? 'Spanish' : null]
                  .filter(Boolean)
                  .join(' · ') || 'No stream link'}
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 15px',
                fontSize: 13,
                fontWeight: 500,
                borderRadius: 6,
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                color: '#334155',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={!spUrl}
              onClick={() => spUrl && onSelectLanguage(video, 'SP', spUrl)}
              style={{
                padding: '8px 16px',
                fontSize: 13,
                fontWeight: 600,
                borderRadius: 6,
                border: spUrl ? '1px solid #cbd5e1' : '1px solid #e2e8f0',
                backgroundColor: spUrl ? '#f1f5f9' : '#f8fafc',
                color: spUrl ? '#0f172a' : '#94a3b8',
                cursor: spUrl ? 'pointer' : 'not-allowed',
              }}
            >
              Spanish
            </button>

            <button
              type="button"
              disabled={!enUrl}
              onClick={() => enUrl && onSelectLanguage(video, 'EN', enUrl)}
              style={{
                padding: '8px 18px',
                fontSize: 13,
                fontWeight: 600,
                borderRadius: 6,
                border: enUrl ? '1px solid #1d4ed8' : '1px solid #93c5fd',
                backgroundColor: enUrl ? '#2563eb' : '#93c5fd',
                color: '#ffffff',
                boxShadow: enUrl ? '0 1px 2px rgba(37, 99, 235, 0.3)' : 'none',
                cursor: enUrl ? 'pointer' : 'not-allowed',
              }}
            >
              English
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}