import React, { useState } from 'react';
import {
  ShieldCheck,
  Star,
  Plus,
  Search,
  CheckCircle2
} from 'lucide-react';
import { TrustReview } from '../types';

interface TrustReviewsViewProps {
  reviews: TrustReview[];
  onAddReview: (review: {
    target_phone: string;
    target_name: string;
    rating: number;
    label: string;
    review_text: string;
  }) => Promise<void>;
}

export const TrustReviewsView: React.FC<TrustReviewsViewProps> = ({
  reviews,
  onAddReview
}) => {
  const [targetPhone, setTargetPhone] = useState('');
  const [targetName, setTargetName] = useState('');
  const [rating, setRating] = useState(5);
  const [label, setLabel] = useState('Verified Seller');
  const [reviewText, setReviewText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [search, setSearch] = useState('');

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetPhone.trim()) return;
    setIsSubmitting(true);
    try {
      await onAddReview({
        target_phone: targetPhone.trim(),
        target_name: targetName.trim(),
        rating,
        label,
        review_text: reviewText.trim()
      });
      setTargetPhone('');
      setTargetName('');
      setReviewText('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = reviews.filter(r =>
    r.target_phone.includes(search) ||
    r.target_name.toLowerCase().includes(search.toLowerCase()) ||
    r.label?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">Trust & Reputation Verification Registry</h2>
        <p className="text-xs text-slate-400 mt-1">
          Issue verified trust badges and rating reviews for traders, service providers, and group members. Sent on <code className="text-emerald-400 font-mono">!trust @user</code>.
        </p>
      </div>

      {/* Add Review Form */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-5 shadow-sm">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Add Verified Reputation Review</span>
        </h3>

        <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Target Phone</label>
            <input
              type="text"
              value={targetPhone}
              onChange={(e) => setTargetPhone(e.target.value)}
              placeholder="e.g. 923001234567"
              required
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Member / Business Name</label>
            <input
              type="text"
              value={targetName}
              onChange={(e) => setTargetName(e.target.value)}
              placeholder="e.g. Digital Mart Express"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Badge Title</label>
            <select
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="Verified Seller">Verified Seller</option>
              <option value="Trusted Trader">Trusted Trader</option>
              <option value="Group VIP">Group VIP</option>
              <option value="Escrow Approved">Escrow Approved</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Rating Stars</label>
            <select
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
            >
              <option value={5}>⭐⭐⭐⭐⭐ 5 Stars</option>
              <option value={4}>⭐⭐⭐⭐ 4 Stars</option>
              <option value={3}>⭐⭐⭐ 3 Stars</option>
              <option value={1}>⭐ 1 Star</option>
            </select>
          </div>

          <div className="sm:col-span-3">
            <label className="block text-xs font-medium text-slate-300 mb-1">Verification Note / Feedback</label>
            <input
              type="text"
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="e.g. Tested deal of 50,000 PKR, verified identity and swift fulfillment."
              required
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={isSubmitting || !targetPhone.trim()}
              className="w-full py-2 px-4 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-lg shadow-sm transition-all flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>{isSubmitting ? 'Posting...' : 'Log Review'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Reviews Table */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-md overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-xs">
            No trust reviews found. Add a verified review above.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400">
                  <th className="py-3 px-4 font-semibold uppercase text-[10px]">Member / Phone</th>
                  <th className="py-3 px-4 font-semibold uppercase text-[10px]">Reputation Badge</th>
                  <th className="py-3 px-4 font-semibold uppercase text-[10px]">Stars</th>
                  <th className="py-3 px-4 font-semibold uppercase text-[10px]">Verification Feedback</th>
                  <th className="py-3 px-4 font-semibold uppercase text-[10px] text-right">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filtered.map(r => (
                  <tr key={r.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-white">{r.target_name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">+{r.target_phone}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-bold">
                        {r.label}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-amber-400">
                      {'★'.repeat(r.rating)}
                    </td>
                    <td className="py-3 px-4 text-slate-300 font-medium">"{r.review_text}"</td>
                    <td className="py-3 px-4 text-right text-slate-400 text-[11px] font-semibold">
                      {r.source_type}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
