'use client';

import React from 'react';
import VideoRow from './VideoCard';

interface VideoItem {
  id: string;
  title: string;
  [key: string]: any;
}

interface VideoGridProps {
  videos?: VideoItem[];
  loading?: boolean;
  addedIds?: string[];
  onAddToQueue?: (video: VideoItem) => void;
}

function SkeletonRow() {
  return (
    <div className="video-row">
      <div className="skeleton" style={{ width: 110, height: 68, borderRadius: 6 }} />
      <div className="video-details">
        <div className="skeleton" style={{ width: 80, height: 10, marginBottom: 8 }} />
        <div className="skeleton" style={{ width: '70%', height: 14, marginBottom: 6 }} />
        <div className="skeleton" style={{ width: '90%', height: 10 }} />
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <div className="skeleton" style={{ width: 28, height: 22, borderRadius: 4 }} />
        <div className="skeleton" style={{ width: 28, height: 22, borderRadius: 4 }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <div className="skeleton" style={{ width: 100, height: 34, borderRadius: 6 }} />
      </div>
    </div>
  );
}

export default function VideoGrid({ videos = [], loading = false, addedIds = [], onAddToQueue }: VideoGridProps) {
  if (loading) {
    return (
      <div className="video-table-wrap">
        <div className="video-table-header">
          <span>Video Preview</span>
          <span>Details</span>
          <span>Language</span>
          <span style={{ textAlign: 'right' }}>Action</span>
        </div>
        {[1, 2, 3, 4].map(n => <SkeletonRow key={n} />)}
      </div>
    );
  }

  if (!videos || videos.length === 0) {
    return (
      <div className="video-table-wrap">
        <div className="empty-state">
          <div className="empty-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
              <rect x="2" y="3" width="20" height="14" rx="2"/>
              <path d="m8 21 4-4 4 4"/>
            </svg>
          </div>
          <h3>No videos found</h3>
          <p>Try adjusting your filters or search term.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="video-table-wrap">
      <div className="video-table-header">
        <span>Video Preview</span>
        <span>Details</span>
        <span>Language</span>
        <span style={{ textAlign: 'right' }}>Action</span>
      </div>
      {videos.map(video => (
        <VideoRow
          key={video.id}
          video={video}
          isAdded={addedIds.includes(video.id)}
          onAddToQueue={onAddToQueue}
        />
      ))}
    </div>
  );
}