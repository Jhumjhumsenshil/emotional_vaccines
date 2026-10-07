'use client';

import { useState, useEffect } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import { Video, Category, getMockVideos, saveMockVideos, getMockCategories } from '../../../services/mockData';
import { Button, Input, Select, Badge } from '../../components/ui/FormComponents';
import Modal from '../../components/ui/Modal';

export default function VideosPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState(''); // 'all', 'published', 'unpublished'
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const [formData, setFormData] = useState<Partial<Video>>({});

  useEffect(() => {
    setVideos(getMockVideos());
    setCategories(getMockCategories());
  }, []);

  const handleSave = () => {
    if (!formData.title || !formData.categoryId || !formData.videoUrl) return;
    
    let updated;
    if (editingVideo) {
      updated = videos.map(v => v.id === editingVideo.id ? { ...v, ...formData } as Video : v);
    } else {
      updated = [...videos, { 
        ...formData,
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
    } else {
      setEditingVideo(null);
      setFormData({ 
        title: '', description: '', categoryId: '', videoUrl: '', thumbnail: '',
        language: 'English', duration: 0, isPublished: false, isFeatured: false,
        tags: [] as any, displayOrder: videos.length + 1
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingVideo(null);
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
          <Input 
            label="Language" 
            value={formData.language || ''} 
            onChange={e => setFormData({...formData, language: e.target.value})} 
          />
          <div className="col-span-2">
            <Input 
              label="Video URL / Stream URL" 
              value={formData.videoUrl || ''} 
              onChange={e => setFormData({...formData, videoUrl: e.target.value})} 
            />
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
