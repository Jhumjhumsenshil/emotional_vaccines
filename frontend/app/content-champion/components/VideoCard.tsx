'use client';

import React from 'react';

interface VideoItem {
  id: string;
  title: string;
  category?: string;
  description?: string;
  summary?: string;
  thumbnail?: string;
  duration?: string;
  languages?: string[];
  [key: string]: any;
}

interface VideoRowProps {
  video: VideoItem;
  isAdded?: boolean;
  onAddToQueue?: (video: VideoItem) => void;
}

function getCategoryClass(category?: string): string {
  if (!category) return '';
  const c = category.toLowerCase();
  if (c.includes('families')) return 'cat-families-thrive';
  if (c.includes('self'))     return 'cat-self-care';
  if (c.includes('community'))return 'cat-community';
  if (c.includes('crisis'))   return 'cat-crisis';
  return 'cat-youth';
}

export default function VideoRow({ video, isAdded, onAddToQueue }: VideoRowProps) {
  return (
    <div className="video-row fade-up">
      {/* Thumbnail */}
      <div className="video-thumb">
        <img src={video.thumbnail} alt={video.title} loading="lazy" />
        <span className="duration-badge">{video.duration}</span>
      </div>

      {/* Details */}
      <div className="video-details">
        <div className={`video-category-badge ${getCategoryClass(video.category)}`}>
          {video.category}
        </div>
        <div className="video-title">{video.title}</div>
        <div className="video-desc">{video.description || video.summary}</div>
      </div>

      {/* Language badges */}
      <div className="lang-badges">
        {(video.languages || ['EN']).map(lang => (
          <span
            key={lang}
            className={`lang-badge ${lang.toLowerCase() === 'en' ? 'en' : lang.toLowerCase() === 'sp' ? 'sp' : 'fr'}`}
          >
            {lang}
          </span>
        ))}
      </div>

      {/* Action */}
      <div className="action-col">
        {isAdded ? (
          <button className="btn-added" disabled>Added to Recipients ✓</button>
        ) : (
          <button className="btn-add-queue" onClick={() => onAddToQueue && onAddToQueue(video)}>
            Add to My Recipients
          </button>
        )}
      </div>
    </div>
  );
}