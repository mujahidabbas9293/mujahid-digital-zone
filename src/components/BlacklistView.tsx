import React, { useState } from 'react';
import {
  Ban,
  Plus,
  Trash2,
  ShieldAlert,
  Search
} from 'lucide-react';
import { BlacklistRecord } from '../types';

interface BlacklistViewProps {
  blacklist: BlacklistRecord[];
  onAddBlacklist: (phone: string, reason: string) => Promise<void>;
  onRemoveBlacklist: (phone: string) => void;
}

export const BlacklistView: React.FC<BlacklistViewProps> = ({
  blacklist,
  onAddBlacklist,
  onRemoveBlacklist
}) => {
  const [phone, setPhone] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [search, setSearch] = useState('');

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return;
    setIsSubmitting(true);
    try {
      await onAddBlacklist(phone.trim(), reason.trim());
      setPhone('');
      setReason('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = blacklist.filter(b =>
    b.phone.includes(search) || b.reason.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">Permanent Blacklist Registry</h2>
        <p className="text-xs text-slate-400 mt-1">
          Numbers added here are immediately and automatically kicked with zero strikes if they ever join or message in any moderated group.
        </p>
      </div>

      {/* Add to Blacklist Form */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-5 shadow-sm">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Ban className="w-4 h-4 text-rose-400" />
          <span>Add Phone to Permanent Blacklist</span>
        </h3>

        <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Phone Number
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 923001234567"
              required
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-rose-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Ban Reason
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Serial scammer / spammer"
              required
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-rose-500"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={isSubmitting || !phone.trim()}
              className="w-full py-2 px-4 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold text-xs rounded-lg shadow-sm transition-all flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>{isSubmitting ? 'Adding...' : 'Blacklist Number'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Blacklist Table */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-md overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-xs">
            No numbers on the permanent blacklist.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400">
                  <th className="py-3 px-4 font-semibold uppercase text-[10px]">Phone Number</th>
                  <th className="py-3 px-4 font-semibold uppercase text-[10px]">Ban Reason</th>
                  <th className="py-3 px-4 font-semibold uppercase text-[10px]">Added By</th>
                  <th className="py-3 px-4 font-semibold uppercase text-[10px] text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filtered.map(b => (
                  <tr key={b.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-rose-400">
                      +{b.phone}
                    </td>
                    <td className="py-3 px-4 text-slate-200">{b.reason}</td>
                    <td className="py-3 px-4 text-slate-400 text-[11px]">{b.added_by}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onRemoveBlacklist(b.phone)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] font-semibold transition-colors inline-flex items-center gap-1"
                        title="Remove from blacklist"
                      >
                        <Trash2 className="w-3 h-3 text-rose-400" />
                        <span>Remove</span>
                      </button>
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
