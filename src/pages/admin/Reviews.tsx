import { useState, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Star, Trash2, Check, MessageSquare, X } from 'lucide-react';
import type { AdminContext } from './types';
import { supabase } from '../../lib/supabaseClient';

interface Testimonial {
  id?: string;
  name: string;
  quote: string;
  rating: number;
  location?: string;
  verified?: boolean;
  approved?: boolean; // Optional flag for moderation
  email?: string;
  status?: string;
  created_at?: string;
}

export default function Reviews() {
  const { reviews, setReviews, showToast } = useOutletContext<AdminContext>();

  // State
  const [filter, setFilter] = useState<'all' | 'approved' | 'pending'>('all');
  const [newReviewName, setNewReviewName] = useState('');
  const [newReviewLocation, setNewReviewLocation] = useState('');
  const [newReviewEmail, setNewReviewEmail] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewQuote, setNewReviewQuote] = useState('');
  const [newReviewVerified, setNewReviewVerified] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Cast reviews from context safely
  const testimonials = useMemo<Testimonial[]>(() => {
    return (reviews || []).map(r => ({
      ...r,
      approved: r.status === 'approved'
    }));
  }, [reviews]);

  // Filtered reviews
  const filteredReviews = useMemo(() => {
    if (filter === 'approved') return testimonials.filter(t => t.approved);
    if (filter === 'pending') return testimonials.filter(t => t.status === 'pending');
    return testimonials;
  }, [testimonials, filter]);

  // Counts
  const counts = useMemo(() => {
    return {
      all: testimonials.length,
      approved: testimonials.filter(t => t.approved).length,
      pending: testimonials.filter(t => t.status === 'pending').length
    };
  }, [testimonials]);

  // Add review handler
  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewName.trim() || !newReviewQuote.trim()) {
      return showToast('Name and quote are required fields', 'error');
    }

    setSubmitting(true);

    try {
      const newTestimonial = {
        product_id: 'general', // Default identifier
        customer_name: newReviewName.trim(),
        customer_email: newReviewEmail.trim() || null,
        review_text: newReviewQuote.trim(),
        rating: newReviewRating,
        status: 'approved'
      };

      const { data, error } = await supabase
        .from('reviews')
        .insert(newTestimonial)
        .select()
        .single();
      console.log('Review CRUD result (create):', data, error);
      
      if (error) throw error;

      if (data) {
        setReviews([
          {
            id: data.id,
            product_id: data.product_id,
            name: data.customer_name,
            email: data.customer_email || '',
            quote: data.review_text,
            rating: data.rating,
            approved: true,
            status: 'approved',
            created_at: data.created_at
          },
          ...reviews
        ]);
      }

      setNewReviewName('');
      setNewReviewLocation('');
      setNewReviewEmail('');
      setNewReviewRating(5);
      setNewReviewQuote('');
      setNewReviewVerified(false);
      showToast('Saved successfully!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to add testimonial', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Single Approve
  const handleApprove = async (indexInFiltered: number) => {
    const target = filteredReviews[indexInFiltered];
    try {
      const { data, error } = await supabase
        .from('reviews')
        .update({ status: 'approved' })
        .eq('id', target.id)
        .select();
      console.log('Review CRUD result (approve):', data, error);
      if (error) throw error;

      setReviews(reviews.map(r => r.id === target.id ? { ...r, approved: true, status: 'approved' } : r));
      showToast('Saved successfully!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to approve review', 'error');
    }
  };

  // Single Reject
  const handleReject = async (indexInFiltered: number) => {
    const target = filteredReviews[indexInFiltered];
    try {
      const { data, error } = await supabase
        .from('reviews')
        .update({ status: 'rejected' })
        .eq('id', target.id)
        .select();
      console.log('Review CRUD result (reject):', data, error);
      if (error) throw error;

      setReviews(reviews.map(r => r.id === target.id ? { ...r, approved: false, status: 'rejected' } : r));
      showToast('Saved successfully!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to reject review', 'error');
    }
  };

  // Single Delete / Remove
  const handleDelete = async (indexInFiltered: number) => {
    const target = filteredReviews[indexInFiltered];
    if (!confirm('Are you sure you want to remove this review?')) return;
    try {
      const { data, error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', target.id)
        .select();
      console.log('Review CRUD result (delete):', data, error);
      if (error) throw error;

      setReviews(reviews.filter(r => r.id !== target.id));
      showToast('Saved successfully!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to remove review', 'error');
    }
  };

  // Bulk Approve
  const handleApproveAllPending = async () => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .update({ status: 'approved' })
        .eq('status', 'pending')
        .select();
      console.log('Review CRUD result (approve-all):', data, error);
      if (error) throw error;

      setReviews(reviews.map(r => r.status === 'pending' ? { ...r, approved: true, status: 'approved' } : r));
      showToast('Saved successfully!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to approve pending reviews', 'error');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl animate-fade-in-up">
      
      {/* Tab filter and bulk actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 select-none">
        <div className="flex gap-2 text-[10px] font-bold uppercase tracking-widest font-sans">
          {(['all', 'approved', 'pending'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 h-8 rounded-full border transition-all cursor-pointer flex items-center gap-1.5 ${
                filter === tab 
                  ? 'bg-brand-heading text-white border-brand-heading shadow-xs' 
                  : 'bg-white border-brand-border/60 hover:bg-brand-cream text-brand-body/70'
              }`}
            >
              <span>{tab === 'all' ? 'All Reviews' : tab === 'approved' ? 'Approved' : 'Pending Moderation'}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[8px] font-mono ${
                filter === tab ? 'bg-white/20 text-white' : 'bg-brand-cream text-brand-body/70'
              }`}>{counts[tab]}</span>
            </button>
          ))}
        </div>

        {counts.pending > 0 && (
          <button
            onClick={handleApproveAllPending}
            className="px-4 h-8 bg-green-600 hover:bg-green-700 text-white text-[10px] font-bold uppercase tracking-widest rounded-full transition cursor-pointer flex items-center gap-1 shadow-sm active:scale-95 shrink-0"
          >
            <Check size={12} />
            <span>Approve All Pending</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Review Moderation List (7 Columns) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex justify-between items-center select-none pl-1">
            <h3 className="font-serif text-lg font-bold text-brand-heading">Customer Reviews</h3>
            <span className="text-xs text-brand-body/60 font-sans font-semibold">
              Showing {filteredReviews.length} entries
            </span>
          </div>

          {filteredReviews.length === 0 ? (
            <div className="bg-white/60 border border-brand-border/40 rounded-2xl p-8 text-center space-y-3 shadow-xs">
              <div className="w-10 h-10 rounded-full bg-brand-cream text-brand-body/40 flex items-center justify-center mx-auto">
                <MessageSquare size={18} />
              </div>
              <p className="text-xs text-brand-body/60 italic">No testimonials found matching this filter.</p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {filteredReviews.map((r, idx) => (
                <div 
                  key={idx} 
                  className={`bg-white border rounded-2xl p-4 shadow-xs flex gap-4 justify-between items-start transition hover:border-brand-accent/25 ${
                    !r.approved ? 'border-amber-250 bg-amber-50/20' : 'border-brand-border/40'
                  }`}
                >
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex text-[#C9A84C]">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} size={11} fill={i < r.rating ? 'currentColor' : 'none'} />
                        ))}
                      </div>
                      {r.verified && (
                        <span className="text-[7px] bg-green-50 text-green-700 px-1.5 py-0.2 rounded-full font-bold uppercase tracking-wider border border-green-100 shrink-0">
                          Verified Purchase
                        </span>
                      )}
                      {r.status === 'pending' && (
                        <span className="text-[7px] bg-amber-50 text-amber-700 px-1.5 py-0.2 rounded-full font-bold uppercase tracking-wider border border-amber-100 shrink-0">
                          Pending Approval
                        </span>
                      )}
                      {r.status === 'rejected' && (
                        <span className="text-[7px] bg-red-50 text-red-700 px-1.5 py-0.2 rounded-full font-bold uppercase tracking-wider border border-red-100 shrink-0">
                          Rejected
                        </span>
                      )}
                    </div>

                    <p className="text-xs font-serif italic text-brand-heading/90 leading-relaxed font-medium">"{r.quote}"</p>
                    <p className="text-[10px] font-semibold text-brand-body/60 font-sans">
                      — {r.name}{r.location ? `, ${r.location}` : ''}
                    </p>
                  </div>

                  <div className="flex gap-1.5 shrink-0 select-none pt-0.5">
                    {r.status !== 'approved' && (
                      <button 
                        type="button"
                        onClick={() => handleApprove(idx)}
                        className="w-7 h-7 bg-green-50 hover:bg-green-100 text-green-600 border border-green-200 rounded-full flex items-center justify-center transition active:scale-90 cursor-pointer"
                        title="Approve Review"
                      >
                        <Check size={13} />
                      </button>
                    )}
                    {r.status !== 'rejected' && (
                      <button 
                        type="button"
                        onClick={() => handleReject(idx)}
                        className="w-7 h-7 bg-amber-50 hover:bg-amber-100 text-amber-600 border border-amber-200 rounded-full flex items-center justify-center transition active:scale-90 cursor-pointer"
                        title="Reject Review"
                      >
                        <X size={13} />
                      </button>
                    )}
                    <button 
                      type="button"
                      onClick={() => handleDelete(idx)}
                      className="w-7 h-7 bg-red-50 hover:bg-red-100 text-red-650 border border-red-200 rounded-full flex items-center justify-center transition active:scale-90 cursor-pointer"
                      title="Delete Review"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Manual Creator Form (5 Columns) */}
        <div className="lg:col-span-5 bg-white/60 border border-brand-border/40 rounded-2xl p-6 shadow-xs backdrop-blur-xs space-y-4 sticky top-6">
          <h3 className="font-serif text-lg font-bold text-brand-heading border-b border-brand-border/25 pb-2">
            Create Testimonial
          </h3>

          <form onSubmit={handleAddReview} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-brand-heading">Author Name *</label>
                <input 
                  type="text" 
                  required
                  value={newReviewName}
                  onChange={e => setNewReviewName(e.target.value)}
                  placeholder="e.g. Priya Sharma"
                  className="w-full h-10 px-3 bg-white border border-brand-border/60 rounded-xl text-xs font-sans focus:outline-none" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-brand-heading">Location</label>
                <input 
                  type="text" 
                  value={newReviewLocation}
                  onChange={e => setNewReviewLocation(e.target.value)}
                  placeholder="e.g. Lucknow, UP"
                  className="w-full h-10 px-3 bg-white border border-brand-border/60 rounded-xl text-xs font-sans focus:outline-none" 
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-brand-heading">Author Email</label>
              <input 
                type="email" 
                value={newReviewEmail}
                onChange={e => setNewReviewEmail(e.target.value)}
                placeholder="e.g. priya@example.com"
                className="w-full h-10 px-3 bg-white border border-brand-border/60 rounded-xl text-xs font-sans focus:outline-none" 
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-brand-heading">Star Rating</label>
              <div className="flex gap-1 items-center">
                {[1, 2, 3, 4, 5].map(r => (
                  <button 
                    key={r} 
                    onClick={() => setNewReviewRating(r)} 
                    type="button"
                    className={`text-2xl cursor-pointer transition ${r <= newReviewRating ? 'text-[#C9A84C]' : 'text-brand-border'}`}
                  >
                    ★
                  </button>
                ))}
                <span className="text-xs text-brand-body/60 ml-2 font-mono font-bold">{newReviewRating}/5</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-brand-heading">Review Quote *</label>
              <textarea 
                required
                value={newReviewQuote}
                onChange={e => setNewReviewQuote(e.target.value)}
                placeholder="Write customer review content..." 
                rows={4}
                className="w-full p-3 bg-white border border-brand-border/60 rounded-xl text-xs font-sans focus:outline-none resize-none"
              />
            </div>

            <div className="flex items-center gap-2.5 bg-brand-cream/15 p-3 rounded-xl border border-brand-border/10 select-none">
              <input 
                type="checkbox" 
                id="reviewVerified" 
                checked={newReviewVerified}
                onChange={e => setNewReviewVerified(e.target.checked)}
                className="accent-brand-accent cursor-pointer w-4 h-4" 
              />
              <label htmlFor="reviewVerified" className="text-[10px] font-bold uppercase tracking-wider text-brand-heading cursor-pointer">
                Mark as Verified Purchase
              </label>
            </div>

            <button 
              type="submit"
              disabled={submitting}
              className="w-full h-10 bg-[#DCA29A] hover:bg-[#D4938A] text-white rounded-full text-xs font-semibold uppercase tracking-wider cursor-pointer transition disabled:opacity-60 flex items-center justify-center shadow-xs active:scale-95"
            >
              {submitting ? 'Adding...' : '+ Add Testimonial'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
