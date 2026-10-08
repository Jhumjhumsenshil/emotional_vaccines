'use client';

import { useState, useEffect } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import { Button, Input, Badge } from '../../components/ui/FormComponents';
import Modal from '../../components/ui/Modal';

// Update interface to support numeric ID from FastAPI / PostgreSQL
export interface Category {
  id: number | string;
  name: string;
  description?: string;
  slug: string;
  status: number; // 1 = Active, 0 = Inactive
  videoCount?: number;
}

const API_BASE_URL = 'http://localhost:8000/api';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '', slug: '', status: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 1. Fetch categories from Backend API
  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch(`${API_BASE_URL}/categories`);
      if (!res.ok) throw new Error('Failed to fetch categories');
      const data = await res.json();
      setCategories(data);
    } catch (err: any) {
      setError(err.message || 'Error connecting to server');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);


  // Inline status toggle directly from the table
  const handleToggleStatus = async (category: Category) => {
    const newStatus = category.status === 1 ? 0 : 1;

    // Optimistic UI update
    setCategories(prev =>
      prev.map(c => (c.id === category.id ? { ...c, status: newStatus } : c))
    );

    try {
      const res = await fetch(`${API_BASE_URL}/categories/${category.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        throw new Error('Failed to update status');
      }
    } catch (err: any) {
      alert(err.message);
      // Revert if API fails
      fetchCategories();
    }
  };

  // 2. Handle Add / Edit Category API Call
  const handleSave = async () => {
    if (!formData.name.trim()) return;

    try {
      if (editingCategory) {
        // PUT / PATCH request to update category
        const res = await fetch(`${API_BASE_URL}/categories/${editingCategory.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.detail || 'Failed to update category');
        }
      } else {
        // POST request to add new category
        const res = await fetch(`${API_BASE_URL}/categories`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.detail || 'Failed to create category');
        }
      }

      // Re-fetch category list and close modal
      await fetchCategories();
      closeModal();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // 3. Handle Delete Category API Call
  const handleDelete = async (id: number | string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;

    try {
      const res = await fetch(`${API_BASE_URL}/categories/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Failed to delete category');
      }

      // Re-fetch category list after deletion
      await fetchCategories();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const openModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setFormData({ name: category.name, description: category.description || '', slug: category.slug, status: category.status ?? 1 });
    } else {
      setEditingCategory(null);
      setFormData({ name: '', description: '' , slug: '', status: 1});
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
  };

  const filtered = categories.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.description && c.description.toLowerCase().includes(search.toLowerCase()))
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

      {error && (
        <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Videos</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">Loading categories...</td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">No categories found.</td>
              </tr>
            ) : filtered.map(category => (
              <tr key={category.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{category.name}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{category.description || '-'}</td>
                {/* Clickable Status Badge */}
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button
                    onClick={() => handleToggleStatus(category)}
                    className={`px-3 py-1 text-xs font-medium rounded-full border transition-all duration-150 focus:outline-none cursor-pointer ${
                      category.status === 1
                        ? 'bg-green-50 text-green-700 border-green-300 hover:bg-green-100'
                        : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
                    }`}
                    title="Click to toggle status"
                  >
                    {category.status === 1 ? '● Active' : '○ Inactive'}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Badge variant="blue">{category.videoCount ?? 0} videos</Badge>
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
          <Input 
            label="Slug" 
            value={formData.slug} 
            onChange={e => setFormData({...formData, slug: e.target.value})} 
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