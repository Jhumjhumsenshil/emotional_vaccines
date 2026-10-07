'use client';

import { useState, useEffect } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import { Category, getMockCategories, saveMockCategories } from '../../../services/mockData';
import { Button, Input, Badge } from '../../components/ui/FormComponents';
import Modal from '../../components/ui/Modal';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });

  useEffect(() => {
    setCategories(getMockCategories());
  }, []);

  const handleSave = () => {
    if (!formData.name.trim()) return;
    
    let updated;
    if (editingCategory) {
      updated = categories.map(c => c.id === editingCategory.id ? { ...c, ...formData } : c);
    } else {
      updated = [...categories, { 
        id: `c_${Date.now()}`, 
        name: formData.name, 
        description: formData.description, 
        videoCount: 0 
      }];
    }
    setCategories(updated);
    saveMockCategories(updated);
    closeModal();
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this category?')) {
      const updated = categories.filter(c => c.id !== id);
      setCategories(updated);
      saveMockCategories(updated);
    }
  };

  const openModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setFormData({ name: category.name, description: category.description });
    } else {
      setEditingCategory(null);
      setFormData({ name: '', description: '' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
  };

  const filtered = categories.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout title="Categories">
      <div className="flex justify-between items-center mb-6 gap-4">
        <div className="w-full max-w-md">
          <Input 
            placeholder="Search categories..." 
            value={search} 
            onChange={e => setSearch(e.target.value)}
            className="mb-0"
          />
        </div>
        <Button onClick={() => openModal()}>Add Category</Button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Videos</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">No categories found.</td>
              </tr>
            ) : filtered.map(category => (
              <tr key={category.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{category.name}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{category.description}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Badge variant="blue">{category.videoCount} videos</Badge>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={() => openModal(category)} className="text-[#2563EB] hover:text-[#1D4ED8] mr-4">Edit</button>
                  <button onClick={() => handleDelete(category.id)} className="text-red-600 hover:text-red-900">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={closeModal} 
        title={editingCategory ? "Edit Category" : "Add Category"}
        footer={
          <>
            <Button variant="secondary" onClick={closeModal}>Cancel</Button>
            <Button onClick={handleSave}>Save</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input 
            label="Category Name" 
            value={formData.name} 
            onChange={e => setFormData({...formData, name: e.target.value})} 
            autoFocus
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea 
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm shadow-sm focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
              rows={3}
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
            />
          </div>
        </div>
      </Modal>
    </AppLayout>
  );
}
