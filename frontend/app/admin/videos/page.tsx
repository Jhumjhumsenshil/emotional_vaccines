'use client';

import { useState, useEffect, useRef } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import { Button, Input, Select, Badge } from '../../components/ui/FormComponents';
import Modal from '../../components/ui/Modal';
import ProtectedRoute from "../../components/ProtectedRoute";
import api from "@/utils/api";

const AVAILABLE_LANGUAGES = [
  'English',  
  'Spanish',  
];

export interface VideoStream {
  id: number;
  language: string;
  stream_url: string;
  thumbnail_url?: string;
  title?: string;
}

export interface Video {
  id: string;
  title: string;
  description: string;
  category_id?: string; // Keep optional for backwards compatibility if needed
  category_ids: string[]; // <-- Add this for multiple categories
  videoUrl: string;
  videoUrls?: string[];
  thumbnail: string;
  language: string;
  languages?: string[];
  duration: number;
  isPublished: boolean;
  isDefault?: boolean;
  isFeatured: boolean;
  tags: string;
  displayOrder: number;
  views: number;
  createdAt: string;
  streams: VideoStream[];
}

export interface Category {
  id: string;
  name: string;
  description: string;
  videoCount: number;
}

export default function VideosPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const [formData, setFormData] = useState<Partial<Video>>({});
  
  // Fixed state structure: managing streams with language and URL together
  const [videoStreams, setVideoStreams] = useState<Array<{ language: string; stream_url: string }>>([
    { language: 'English', stream_url: '' }
  ]);
  
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['English']);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [langSearch, setLangSearch] = useState('');
  const langDropdownRef = useRef<HTMLDivElement>(null);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api';

  const loadCategories = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/categories`);
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Failed to fetch categories', error);
    }
  };

  const loadVideos = async () => {
    try {
      const res = await api.get(`${API_BASE_URL}/videos/list`);
     // if (res.ok) {
        const data = res.data;
        const formattedVideos = data.map((v: any) => ({
          id: v.id,
          category_ids: v.categories ? v.categories.map((c: any) => String(c.id)) : (v.category_ids ? v.category_ids.map(String) : []),
          title: v.default_title,
          description: v.default_description,
          thumbnail: v.default_thumbnail_url,
          isPublished: v.is_published,
          isDefault: Boolean(v.is_default),
          duration: v.duration_seconds,
          views: v.views || 0,
          tags: v.tags || [],
          streams: v.streams || []
        }));
        setVideos(formattedVideos);
      //}
    } catch (error) {
      console.error('Failed to load videos', error);
    }
  };

  useEffect(() => {
    loadVideos();
    loadCategories();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target as Node)) {
        setIsLangDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleLanguage = (lang: string) => {
    if (selectedLanguages.includes(lang)) {
      if (selectedLanguages.length > 1) {
        setSelectedLanguages(selectedLanguages.filter(l => l !== lang));
      }
    } else {
      setSelectedLanguages([...selectedLanguages, lang]);
    }
  };

  const handleAddStream = () => {
    setVideoStreams([...videoStreams, { language: 'English', stream_url: '' }]);
  };

  const handleRemoveStream = (index: number) => {
    if (videoStreams.length > 1) {
      setVideoStreams(videoStreams.filter((_, i) => i !== index));
    }
  };

  const handleStreamUrlChange = (index: number, value: string) => {
    const updated = [...videoStreams];
    updated[index].stream_url = value;
    setVideoStreams(updated);
  };

  const handleStreamLanguageChange = (index: number, value: string) => {
    const updated = [...videoStreams];
    updated[index].language = value;
    setVideoStreams(updated);
  };

  const filteredLanguages = AVAILABLE_LANGUAGES.filter(lang =>
    lang.toLowerCase().includes(langSearch.toLowerCase())
  );

  const handleSave = async () => {
    const cleanStreams = videoStreams
      .map(s => ({ language: s.language, stream_url: s.stream_url.trim() }))
      .filter(s => s.stream_url !== '');

    if (!formData.title || !formData.category_ids || cleanStreams.length === 0) return;

    const tagList = typeof formData.tags === 'string'
      ? (formData.tags as string).split(',').map(t => t.trim()).filter(Boolean)
      : Array.isArray(formData.tags) ? formData.tags : [];

    const streamsPayload = cleanStreams.map(s => ({
      language: s.language,
      stream_url: s.stream_url,
      title: formData.title,
      thumbnail_url: formData.thumbnail || null
    }));

    const categoryIdsList = Array.isArray(formData.category_ids) 
  ? formData.category_ids.map(id => parseInt(id as string)).filter(Boolean) 
  : [];

    const payload = {
      category_ids: categoryIdsList,
      default_title: formData.title,
      default_description: formData.description || null,
      duration_seconds: formData.duration || 0,
      default_thumbnail_url: formData.thumbnail || null,
      is_published: !!formData.isPublished,
      is_default: !!formData.isDefault,
      streams: streamsPayload,
      tags: tagList
    };

    try {
      if (editingVideo) {
        const res = await api.put(`${API_BASE_URL}/videos/${editingVideo.id}`, payload);
        //if (!res.ok) throw new Error('Failed to update video');
      } else {
        const res = await api.post(`${API_BASE_URL}/videos`, payload);
       // if (!res.ok) throw new Error('Failed to create video');
      }

      loadVideos();
      closeModal();
    } catch (error) {
      console.error('Error saving video:', error);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this video?')) {
      const updated = videos.filter(v => v.id !== id);
      setVideos(updated);
    }
  };

  // const togglePublish = (id: string) => {
  //   const updated = videos.map(v => v.id === id ? { ...v, isPublished: !v.isPublished } : v);
  //   setVideos(updated);
  // };


  const togglePublish = async (id: string) => {
  const targetVideo = videos.find((v) => String(v.id) === String(id));
  if (!targetVideo) return;

  const newPublishStatus = !targetVideo.isPublished;

  // 1. Optimistically update the UI immediately
  setVideos((prev) =>
    prev.map((v) =>
      String(v.id) === String(id) ? { ...v, isPublished: newPublishStatus } : v
    )
  );

  // 2. Persist the change in PostgreSQL
  try {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

    const response = await fetch(`${API_BASE_URL}/videos/${id}/publish`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        is_published: newPublishStatus,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to update publish status');
    }
  } catch (error) {
    console.error('Error updating publish status:', error);
    // 3. Roll back UI state if the backend update fails
    setVideos((prev) =>
      prev.map((v) =>
        String(v.id) === String(id) ? { ...v, isPublished: targetVideo.isPublished } : v
      )
    );
  }
};

  const toggleDefault = (id: string) => {
    const updated = videos.map(v => v.id === id ? { ...v, isDefault: !v.isDefault } : v);
    setVideos(updated);
  };

  const openModal = (video?: Video) => {
    console.log("Opening modal with video data:", video);
    if (video) {
      setEditingVideo(video);    
      
      const rawCategories = (video as any).categories;
      const rawCategoryIds = video.category_ids || (video as any).category_ids;
      
      let loadedCategoryIds: string[] = [];
      if (Array.isArray(rawCategories) && rawCategories.length > 0) {
        loadedCategoryIds = rawCategories.map((c: any) => String(c.id || c));
      } else if (Array.isArray(rawCategoryIds) && rawCategoryIds.length > 0) {
        loadedCategoryIds = rawCategoryIds.map((id: any) => String(id));
      } else if (video.category_id || (video as any).category_id) {
        loadedCategoryIds = [String(video.category_id || (video as any).category_id)];
      }


      setFormData({
        title: video.title || '',
        description: video.description || '',
        category_ids: loadedCategoryIds,
        thumbnail: video.thumbnail || '',
        duration: video.duration || 0,
        displayOrder: video.displayOrder || 0,
        isPublished: video.isPublished || false,
        isFeatured: video.isFeatured || false,
        isDefault: video.isDefault ?? (video as any).is_default ?? false,
        tags: Array.isArray(video.tags) 
          ? video.tags.map((t: any) => typeof t === 'string' ? t : t.name).join(', ') 
          : (typeof video.tags === 'string' ? video.tags : '')
      });

      const loadedStreams = video.streams && video.streams.length > 0 
        ? video.streams.map(s => ({ language: s.language || 'English', stream_url: s.stream_url || '' }))
        : [{ language: 'English', stream_url: '' }];
      
      setVideoStreams(loadedStreams);

      const langs = video.streams ? video.streams.map(s => s.language) : [];
      setSelectedLanguages(langs.length > 0 ? Array.from(new Set(langs)) : ['English']);

    } else {
      setEditingVideo(null);
      setFormData({ 
        title: '', description: '', category_id: '', thumbnail: '',
        duration: 0, isPublished: false, isFeatured: false, isDefault: false,
        tags: '' as any, displayOrder: videos.length + 1,
        category_ids: []
      });
      setVideoStreams([{ language: 'English', stream_url: '' }]);
      setSelectedLanguages(['English']);
    }
    setIsLangDropdownOpen(false);
    setLangSearch('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingVideo(null);
    setIsLangDropdownOpen(false);
    setLangSearch('');
  };

const filtered = videos.filter(v => {
  // Fallbacks to handle both frontend and backend property names
  const title = v.title ;
  const description = v.description ;
  const isPublished = v.isPublished !== undefined ? v.isPublished : v.isPublished;

  const matchSearch = title.toLowerCase().includes(search.toLowerCase()) || 
                      description.toLowerCase().includes(search.toLowerCase());
  
  // Check against both single category_id and category_ids array
  const targetCat = String(filterCategory);
  const matchCat = filterCategory ? (
    String(v.category_id) === targetCat || 
    (Array.isArray(v.category_ids) && v.category_ids.some(id => String(id) === targetCat))
  ) : true;

  const matchStatus = filterStatus === 'published' ? isPublished : 
                      filterStatus === 'unpublished' ? !isPublished : true;

  return matchSearch && matchCat && matchStatus;
});

  const extractThumbnailFromUrl = async (url: string): Promise<string> => {
  if (!url) return '';

  // 1. Robust YouTube ID extraction (handles watch, youtu.be, shorts, embeds)
  const ytRegExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|shorts\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const ytMatch = url.match(ytRegExp);
  const videoId = (ytMatch && ytMatch[2].length === 11) ? ytMatch[2] : null;

  if (videoId) {
    return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  }

  // 2. Vimeo Thumbnail Extraction via oEmbed with HD Upgrade
  if (url.includes('vimeo.com/')) {
    try {
      const response = await fetch(`https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url)}`);
      if (response.ok) {
        const data = await response.json();
        const baseThumb = data.thumbnail_url || '';
        // Automatically upgrade Vimeo thumbnail resolution to HD (1280x720) if possible
        return baseThumb ? baseThumb.replace(/_\d+x\d+/, '_1280x720') : '';
      }
    } catch (error) {
      console.error('Failed to fetch Vimeo thumbnail:', error);
    }
  }

  return '';
};

  const handleUrlBlur = async (url: string) => {
    const autoThumb = await extractThumbnailFromUrl(url);
    if (autoThumb) {
      setFormData(prev => ({ ...prev, thumbnail: autoThumb }));
    }
  };

 const getCategoryDisplay = (video: any, globalCategories: any[]) => {
  // Case A: Video has an array of category IDs (e.g. [2, 3])
  if (Array.isArray(video.category_ids) && video.category_ids.length > 0) {
    const matchedNames = video.category_ids
      .map((catId: number) => {
        const found = globalCategories.find((c) => Number(c.id) === Number(catId));
        return found?.name;
      })
      .filter(Boolean); // removes undefined if an ID doesn't match

    if (matchedNames.length > 0) {
      return matchedNames.join(', ');
    }
  }

  // Case B: Fallback if it uses a single category_id field
  if (video.category_id != null) {
    const matchedCat = globalCategories.find(
      (c) => Number(c.id) === Number(video.category_id)
    );
    if (matchedCat?.name) return matchedCat.name;
  }

  // Case C: Fallback if categories are already embedded objects
  if (Array.isArray(video.categories) && video.categories.length > 0) {
    return video.categories.map((c: any) => c.name).join(', ');
  }

  return 'Uncategorized';
};

const filteredVideos = videos.filter((video) => {
  // If no category is selected ("" or empty), show all videos
  if (!filterCategory || filterCategory === "") return true;

  const selectedCatId = String(filterCategory);

  // Check if the selected ID matches video.category_id
  const matchesSingleId = String(video.category_id) === selectedCatId;

  // Check if the selected ID exists inside video.category_ids array
  const matchesArrayIds = 
    Array.isArray(video.category_ids) && 
    video.category_ids.some((id: String) => String(id) === selectedCatId);

  return matchesSingleId || matchesArrayIds;
});

  return (
    <ProtectedRoute>
    <AppLayout title="Video Management">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto flex-1">
          <Input 
            placeholder="Search videos..." 
            value={search} 
            onChange={e => setSearch(e.target.value)}
            className="mb-0 w-full md:w-64"
          />
          <Select 
            value={filterCategory} 
            onChange={e => setFilterCategory(e.target.value)}
            className="mb-0 w-full md:w-48"
          >
            <option value="">All Categories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
          <Select 
            value={filterStatus} 
            onChange={e => setFilterStatus(e.target.value)}
            className="mb-0 w-full md:w-40"
          >
            <option value="">All Status</option>
            <option value="published">Published</option>
            <option value="unpublished">Unpublished</option>
          </Select>
        </div>
        <Button onClick={() => openModal()}>Add Video</Button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Video</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stats</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">No videos found.</td>
              </tr>
            ) : filtered.map(video => {
              //const cat = categories.find(c => Number(c.id) === Number(video.category_id));
              return (
                <tr key={video.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="relative w-20 h-12 flex-shrink-0 bg-gray-200 rounded overflow-hidden mr-3">
                        {video.thumbnail ? (
                          <img 
                            src={video.thumbnail} 
                            alt={video.title} 
                            className="absolute inset-0 w-full h-full object-cover" 
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-gray-400">🎬</div>
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{video.title}</div>
                        <div className="text-xs text-gray-500 truncate max-w-xs">{video.description}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {getCategoryDisplay(video, categories)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col gap-1 items-start">
                      <Badge variant={video.isPublished ? 'green' : 'gray'}>
                        {video.isPublished ? 'Published' : 'Draft'}
                      </Badge>
                      {video.isFeatured && <Badge variant="yellow">⭐ Featured</Badge>}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>{video.views} views</div>
                    <div className="text-xs">{Math.floor(video.duration / 60)}:{String(video.duration % 60).padStart(2, '0')} min</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                      onClick={() => togglePublish(video.id)} 
                      className={`${video.isPublished ? 'text-amber-600 hover:text-amber-900' : 'text-green-600 hover:text-green-900'} mr-4`}
                    >
                      {video.isPublished ? 'Unpublish' : 'Publish'}
                    </button>
                    <button onClick={() => openModal(video)} className="text-[#2563EB] hover:text-[#1D4ED8] mr-4">Edit</button>
                    <button onClick={() => handleDelete(video.id)} className="text-red-600 hover:text-red-900">Delete</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={closeModal} 
        title={editingVideo ? "Edit Video" : "Add Video"}
        footer={
          <>
            <Button variant="secondary" onClick={closeModal}>Cancel</Button>
            <Button onClick={handleSave}>Save</Button>
          </>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="col-span-2">
            <Input 
              label="Title" 
              value={formData.title || ''} 
              onChange={e => setFormData({...formData, title: e.target.value})} 
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea 
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm shadow-sm mb-4 focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
              rows={3}
              value={formData.description || ''}
              onChange={e => setFormData({...formData, description: e.target.value})}
            />
          </div>
          <div className="col-span-2 mb-2">
  <label className="block text-sm font-medium text-gray-700 mb-1">
    Categories <span className="text-xs text-gray-400 font-normal">({(formData.category_ids || []).length} selected)</span>
  </label>
  <div className="p-2 bg-white border border-gray-300 rounded-md shadow-sm min-h-[42px] flex flex-wrap gap-1.5 items-center">
    {(formData.category_ids || []).map((catId: any) => {
      const cat = categories.find(c => String(c.id) === String(catId));
      return (
        <span
          key={catId}
          className="inline-flex items-center gap-1 bg-blue-50 text-[#2563EB] border border-blue-200 text-xs font-medium px-2 py-0.5 rounded"
        >
          {cat?.name || `Category ${catId}`}
          <span
            role="button"
            onClick={() => {
              const current = formData.category_ids || [];
              setFormData({
                ...formData,
                category_ids: current.filter((id: any) => String(id) !== String(catId))
              });
            }}
            className="text-blue-400 hover:text-blue-700 font-bold leading-none cursor-pointer"
            title="Remove"
          >
            ×
          </span>
        </span>
      );
    })}
    <select
      value=""
      onChange={e => {
        if (!e.target.value) return;
        const current = formData.category_ids || [];
        if (!current.map(String).includes(String(e.target.value))) {
          setFormData({ ...formData, category_ids: [...current, String(e.target.value)] });
        }
      }}
      className="flex-1 bg-transparent border-none text-sm focus:outline-none min-w-[140px] text-gray-500 cursor-pointer py-1"
    >
      <option value="">Select categories...</option>
      {categories
        .filter(c => !(formData.category_ids || []).map(String).includes(String(c.id)))
        .map(c => (
          <option key={c.id} value={String(c.id)}>
            {c.name}
          </option>
        ))}
    </select>
  </div>
</div>

          {/* <div className="w-full mb-4 relative" ref={langDropdownRef}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Language <span className="text-xs text-gray-400 font-normal">({selectedLanguages.length} selected)</span>
            </label>
            <button
              type="button"
              onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
              className="w-full min-h-[38px] px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm shadow-sm flex items-center justify-between text-left focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
            >
              <div className="flex flex-wrap gap-1 items-center flex-1 pr-2">
                {selectedLanguages.length === 0 ? (
                  <span className="text-gray-400">Select language...</span>
                ) : (
                  selectedLanguages.map(lang => (
                    <span
                      key={lang}
                      className="inline-flex items-center gap-1 bg-blue-50 text-[#2563EB] border border-blue-200 text-xs font-medium px-2 py-0.5 rounded"
                    >
                      {lang}
                      <span
                        role="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleLanguage(lang);
                        }}
                        className="text-blue-400 hover:text-blue-700 font-bold leading-none cursor-pointer"
                        title="Remove"
                      >
                        ×
                      </span>
                    </span>
                  ))
                )}
              </div>
              <svg 
                className={`w-4 h-4 text-gray-400 shrink-0 ml-1 transition-transform ${isLangDropdownOpen ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isLangDropdownOpen && (
              <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 flex flex-col">
                <div className="p-2 border-b border-gray-100">
                  <input
                    type="text"
                    placeholder="Search languages..."
                    value={langSearch}
                    onChange={e => setLangSearch(e.target.value)}
                    className="w-full px-2.5 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:border-[#2563EB]"
                    onClick={e => e.stopPropagation()}
                  />
                </div>
                <div className="overflow-y-auto max-h-44 p-1">
                  {filteredLanguages.length === 0 ? (
                    <div className="px-3 py-2 text-xs text-gray-400 text-center">No language found</div>
                  ) : (
                    filteredLanguages.map(lang => {
                      const isSelected = selectedLanguages.includes(lang);
                      return (
                        <div
                          key={lang}
                          onClick={() => toggleLanguage(lang)}
                          className={`flex items-center justify-between px-3 py-1.5 text-xs rounded cursor-pointer transition-colors ${
                            isSelected ? 'bg-blue-50 text-[#2563EB] font-medium' : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="rounded border-gray-300 text-[#2563EB] focus:ring-[#2563EB] cursor-pointer"
                            />
                            <span>{lang}</span>
                          </div>
                          {isSelected && <span className="text-[#2563EB] text-xs font-bold">✓</span>}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div> */}

          <div className="col-span-2 mb-2">
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">
                Video URLs / Stream URLs
              </label>
              <button
                type="button"
                onClick={handleAddStream}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#2563EB] hover:text-[#1D4ED8]"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add URL
              </button>
            </div>
            <div className="space-y-3">
              {videoStreams.map((stream, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 border border-gray-200 rounded-md">
                  <select
                    value={stream.language}
                    onChange={e => handleStreamLanguageChange(index, e.target.value)}
                    className="w-1/3 px-2.5 py-2 bg-white border border-gray-300 rounded-md text-sm focus:outline-none focus:border-[#2563EB]"
                  >
                    <option value="">Select Language...</option>
                    {AVAILABLE_LANGUAGES.map(lang => (
                      <option key={lang} value={lang}>{lang}</option>
                    ))}
                  </select>

                  <input
                    type="text"
                    value={stream.stream_url}
                    placeholder={index === 0 ? "e.g. https://example.com/video.mp4" : `Stream URL ${index + 1}`}
                    onChange={e => handleStreamUrlChange(index, e.target.value)}
                    onBlur={e => handleUrlBlur(e.target.value)}
                    className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-md text-sm shadow-sm placeholder-gray-400 focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                  />

                  {videoStreams.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveStream(index)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      title="Remove Stream"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="col-span-2">
            <Input 
              label="Thumbnail URL" 
              value={formData.thumbnail || ''} 
              onChange={e => setFormData({...formData, thumbnail: e.target.value})} 
            />
          </div>
          <Input 
            label="Duration (seconds)" 
            type="number"
            value={formData.duration || 0} 
            onChange={e => setFormData({...formData, duration: parseInt(e.target.value) || 0})} 
          />
          <Input 
            label="Display Order" 
            type="number"
            value={formData.displayOrder || 0} 
            onChange={e => setFormData({...formData, displayOrder: parseInt(e.target.value) || 0})} 
          />
          <div className="col-span-2">
            <Input 
              label="Tags (comma separated)" 
              value={(formData.tags as any) || ''} 
              onChange={e => setFormData({...formData, tags: e.target.value as any})} 
            />
          </div>
          <div className="col-span-2 flex gap-6 mt-2">
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input 
                type="checkbox" 
                checked={!!formData.isPublished}
                onChange={e => setFormData({...formData, isPublished: e.target.checked})}
                className="rounded border-gray-300 text-[#2563EB] focus:ring-[#2563EB]"
              />
              Published
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input 
                type="checkbox" 
                checked={!!formData.isFeatured}
                onChange={e => setFormData({...formData, isFeatured: e.target.checked})}
                className="rounded border-gray-300 text-[#2563EB] focus:ring-[#2563EB]"
              />
              Featured
            </label>
           <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input 
                type="checkbox" 
                checked={!!formData.isDefault}
                onChange={e => setFormData({...formData, isDefault: e.target.checked})}
                className="rounded border-gray-300 text-[#2563EB] focus:ring-[#2563EB]"
              />
              Default
            </label>
          </div>
        </div>
      </Modal>
    </AppLayout>
    </ProtectedRoute>
  );
}