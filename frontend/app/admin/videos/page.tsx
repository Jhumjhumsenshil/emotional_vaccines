'use client';

import { useState, useEffect, useRef } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import { Video, Category, getMockVideos, saveMockVideos, getMockCategories } from '../../../services/mockData';
import { Button, Input, Select, Badge } from '../../components/ui/FormComponents';
import Modal from '../../components/ui/Modal';

const AVAILABLE_LANGUAGES = [
  'English',
  'Hindi',
  'Spanish',
  'French',
  'German',
  'Mandarin',
  'Arabic',
  'Bengali',
  'Portuguese',
  'Russian',
  'Japanese',
  'Italian',
  'Korean',
  'Telugu',
  'Tamil',
  'Marathi',
  'Gujarati',
  'Urdu',
  'Kannada',
  'Malayalam',
  'Punjabi',
];

export default function VideosPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState(''); // 'all', 'published', 'unpublished'
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const [formData, setFormData] = useState<Partial<Video>>({});
  const [videoUrls, setVideoUrls] = useState<string[]>(['']);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['English']);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [langSearch, setLangSearch] = useState('');
  const langDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setVideos(getMockVideos());
    setCategories(getMockCategories());
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

  const handleAddUrl = () => {
    setVideoUrls([...videoUrls, '']);
  };

  const handleRemoveUrl = (index: number) => {
    if (videoUrls.length > 1) {
      setVideoUrls(videoUrls.filter((_, i) => i !== index));
    }
  };

  const handleUrlChange = (index: number, value: string) => {
    const updated = [...videoUrls];
    updated[index] = value;
    setVideoUrls(updated);
  };

  const filteredLanguages = AVAILABLE_LANGUAGES.filter(lang =>
    lang.toLowerCase().includes(langSearch.toLowerCase())
  );

  const handleSave = () => {
    const cleanUrls = videoUrls.map(u => u.trim()).filter(Boolean);
    if (!formData.title || !formData.categoryId || cleanUrls.length === 0) return;
    
    const primaryUrl = cleanUrls[0];
    const langs = selectedLanguages.length > 0 ? selectedLanguages : ['English'];
    const languageString = langs.join(', ');

    const payload: Partial<Video> = {
      ...formData,
      videoUrl: primaryUrl,
      videoUrls: cleanUrls,
      language: languageString,
      languages: langs,
    };
    
    let updated;
    if (editingVideo) {
      updated = videos.map(v => v.id === editingVideo.id ? { ...v, ...payload } as Video : v);
    } else {
      updated = [...videos, { 
        ...payload,
        id: `v_${Date.now()}`,
        views: 0,
        createdAt: new Date().toISOString(),
        tags: typeof formData.tags === 'string' ? (formData.tags as string).split(',').map(t => t.trim()) : formData.tags || [],
      } as Video];
    }
    
    // Sort by display order
    updated.sort((a, b) => a.displayOrder - b.displayOrder);
    
    setVideos(updated);
    saveMockVideos(updated);
    closeModal();
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this video?')) {
      const updated = videos.filter(v => v.id !== id);
      setVideos(updated);
      saveMockVideos(updated);
    }
  };

  const togglePublish = (id: string) => {
    const updated = videos.map(v => v.id === id ? { ...v, isPublished: !v.isPublished } : v);
    setVideos(updated);
    saveMockVideos(updated);
  };

  const openModal = (video?: Video) => {
    if (video) {
      setEditingVideo(video);
      setFormData({ ...video, tags: video.tags.join(', ') as any });
      const urls = video.videoUrls && video.videoUrls.length > 0 
        ? video.videoUrls 
        : (video.videoUrl ? [video.videoUrl] : ['']);
      setVideoUrls(urls);
      
      const langs = video.languages && video.languages.length > 0
        ? video.languages
        : (video.language ? video.language.split(',').map(s => s.trim()).filter(Boolean) : ['English']);
      setSelectedLanguages(langs.length > 0 ? langs : ['English']);
    } else {
      setEditingVideo(null);
      setFormData({ 
        title: '', description: '', categoryId: '', thumbnail: '',
        duration: 0, isPublished: false, isFeatured: false,
        tags: [] as any, displayOrder: videos.length + 1
      });
      setVideoUrls(['']);
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
    const matchSearch = v.title.toLowerCase().includes(search.toLowerCase()) || 
                        v.description.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCategory ? v.categoryId === filterCategory : true;
    const matchStatus = filterStatus === 'published' ? v.isPublished : 
                        filterStatus === 'unpublished' ? !v.isPublished : true;
    return matchSearch && matchCat && matchStatus;
  });

  return (
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
              const cat = categories.find(c => c.id === video.categoryId);
              return (
                <tr key={video.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="h-10 w-16 flex-shrink-0 bg-gray-200 rounded overflow-hidden mr-3">
                        {video.thumbnail ? (
                          <img src={video.thumbnail} alt="" className="h-full w-full object-cover" />
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
                    {cat?.name || 'Unknown'}
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
          <Select 
            label="Category" 
            value={formData.categoryId || ''} 
            onChange={e => setFormData({...formData, categoryId: e.target.value})}
          >
            <option value="">Select Category...</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
          <div className="w-full mb-4 relative" ref={langDropdownRef}>
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
          </div>
          <div className="col-span-2 mb-2">
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">
                Video URLs / Stream URLs
              </label>
              <button
                type="button"
                onClick={handleAddUrl}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#2563EB] hover:text-[#1D4ED8]"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add URL
              </button>
            </div>
            <div className="space-y-2">
              {videoUrls.map((url, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={url}
                    placeholder={index === 0 ? "e.g. https://example.com/video.mp4 (Primary URL)" : `URL ${index + 1}`}
                    onChange={e => handleUrlChange(index, e.target.value)}
                    className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-md text-sm shadow-sm placeholder-gray-400 focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                  />
                  {videoUrls.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveUrl(index)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      title="Remove URL"
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
          </div>
        </div>
      </Modal>
    </AppLayout>
  );
}
