import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Tag, Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import type { AdminContext } from './types';
import { supabase } from '../../lib/supabaseClient';

export default function Categories() {
  const { categories, setCategories, showToast } = useOutletContext<AdminContext>();
  const [newCategoryName, setNewCategoryName] = useState('');
  
  // Editing state
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState('');

  const saveCategoriesToDB = async (updatedCats: string[]) => {
    try {
      const { error } = await supabase
        .from('settings')
        .upsert({ 
          key: 'store_categories', 
          value: JSON.stringify(updatedCats) 
        }, { onConflict: 'key' });
      
      if (error) throw error;
      setCategories(updatedCats);
      showToast('Categories updated successfully!', 'success');
    } catch (err: any) {
      showToast(`Failed to save categories: ${err.message}`, 'error');
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;
    
    if (categories.includes(trimmed)) {
      return showToast('Category already exists!', 'error');
    }

    const updated = [...categories, trimmed];
    await saveCategoriesToDB(updated);
    setNewCategoryName('');
  };

  const handleStartEdit = (index: number, value: string) => {
    setEditingIndex(index);
    setEditingValue(value);
  };

  const handleSaveEdit = async (index: number) => {
    const trimmed = editingValue.trim();
    if (!trimmed) return;

    if (categories.includes(trimmed) && categories[index] !== trimmed) {
      return showToast('Category already exists!', 'error');
    }

    const updated = [...categories];
    updated[index] = trimmed;
    await saveCategoriesToDB(updated);
    setEditingIndex(null);
  };

  const handleDeleteCategory = async (catToDelete: string) => {
    if (!confirm(`Are you sure you want to delete category "${catToDelete}"?`)) return;
    const updated = categories.filter(c => c !== catToDelete);
    await saveCategoriesToDB(updated);
  };

  return (
    <div className="space-y-6 max-w-3xl animate-fade-in-up">
      <div className="bg-white/60 border border-brand-border/40 rounded-2xl p-6 shadow-xs backdrop-blur-xs space-y-6">
        <h3 className="font-serif text-lg font-bold text-brand-heading flex items-center gap-2 select-none">
          <Tag size={16} className="text-[#C9A84C]" />
          <span>Store Categories</span>
        </h3>
        
        {/* Create Category */}
        <form onSubmit={handleAddCategory} className="flex gap-3">
          <input
            type="text"
            required
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="e.g. Special Occasions"
            className="flex-grow h-11 px-4 bg-white rounded-xl border border-brand-border/70 text-sm font-sans focus:outline-none focus:ring-1 focus:ring-brand-accent transition-all shadow-xs"
          />
          <button
            type="submit"
            className="px-6 h-11 bg-[#DCA29A] hover:bg-[#D4938A] text-white rounded-full uppercase text-xs tracking-widest font-semibold shadow-xs hover:shadow-sm cursor-pointer transition active:scale-95 flex items-center justify-center gap-1.5 shrink-0"
          >
            <Plus size={14} />
            <span>Add Category</span>
          </button>
        </form>

        <hr className="border-brand-border/30" />

        {/* Read & Update & Delete Category list */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-brand-heading/60 select-none pl-1">Current Categories</label>
          
          {categories.length === 0 ? (
            <p className="text-xs text-brand-body/65 italic pl-1">No categories defined yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {categories.map((cat, idx) => (
                <div 
                  key={cat} 
                  className={`flex items-center justify-between bg-white border rounded-xl px-4 py-3 shadow-2xs transition ${
                    editingIndex === idx ? 'border-brand-accent ring-1 ring-brand-accent' : 'border-brand-border/30'
                  }`}
                >
                  {editingIndex === idx ? (
                    <div className="flex items-center gap-2 w-full pr-2">
                      <input 
                        type="text"
                        autoFocus
                        value={editingValue}
                        onChange={e => setEditingValue(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleSaveEdit(idx);
                          if (e.key === 'Escape') setEditingIndex(null);
                        }}
                        className="w-full bg-white border border-brand-border/50 rounded-lg px-2.5 py-1 text-sm font-sans focus:outline-none"
                      />
                      <button 
                        onClick={() => handleSaveEdit(idx)}
                        className="text-green-600 hover:text-green-700 transition shrink-0 p-1"
                      >
                        <Check size={16} />
                      </button>
                      <button 
                        onClick={() => setEditingIndex(null)}
                        className="text-red-500 hover:text-red-650 transition shrink-0 p-1"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="font-sans text-sm text-brand-heading font-medium truncate max-w-[75%]">{cat}</span>
                      <div className="flex gap-1.5 shrink-0 select-none">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(idx, cat)}
                          className="text-brand-body/40 hover:text-brand-accent transition p-1 hover:scale-105 cursor-pointer"
                          title="Rename category"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCategory(cat)}
                          className="text-brand-body/40 hover:text-red-500 transition p-1 hover:scale-105 cursor-pointer"
                          title="Delete category"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
