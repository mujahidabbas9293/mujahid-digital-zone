import React, { useState } from 'react';
import {
  Megaphone,
  Send,
  CheckCircle2,
  Users2,
  AlertCircle
} from 'lucide-react';
import { Group } from '../types';

interface BroadcastViewProps {
  groups: Group[];
  onSendBroadcast: (message: string) => Promise<{ sent: number; total: number }>;
}

export const BroadcastView: React.FC<BroadcastViewProps> = ({
  groups,
  onSendBroadcast
}) => {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [result, setResult] = useState<{ sent: number; total: number } | null>(null);

  const activeGroups = groups.filter(g => g.is_active);

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsSending(true);
    setResult(null);
    try {
      const res = await onSendBroadcast(message.trim());
      setResult(res);
      setMessage('');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">Broadcast Message to All Groups</h2>
        <p className="text-xs text-slate-400 mt-1">
          Dispatch an urgent announcement, event notification, or administrative memo to all {activeGroups.length} active WhatsApp groups at once.
        </p>
      </div>

      {result && (
        <div className="p-4 bg-emerald-950/20 border border-emerald-500/30 rounded-xl text-xs font-semibold text-emerald-300 flex items-center gap-2.5">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>Broadcast dispatched successfully! Delivered to {result.sent} of {result.total} active groups.</span>
        </div>
      )}

      <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 shadow-md">
        <form onSubmit={handleBroadcast} className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Megaphone className="w-4 h-4 text-emerald-400" />
              <span>Announcement Message</span>
            </span>
            <span className="font-mono tabular-nums">{activeGroups.length} Active Targets</span>
          </div>

          <textarea
            rows={6}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="📢 IMPORTANT ANNOUNCEMENT\n\nDear members, please take note that..."
            required
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 leading-relaxed font-mono"
          />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div className="text-[11px] text-slate-400">
              Bot will send this message sequentially to prevent WhatsApp rate-limit restrictions.
            </div>

            <button
              type="submit"
              disabled={isSending || !message.trim() || activeGroups.length === 0}
              className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 shrink-0"
            >
              <Send className="w-4 h-4" />
              <span>{isSending ? 'Sending to Groups...' : 'Send Broadcast Now'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Target Preview */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-5 shadow-sm">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
          Destination Groups ({activeGroups.length})
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
          {activeGroups.map(g => (
            <div key={g.jid} className="p-2.5 rounded-lg bg-slate-800/40 border border-slate-700/60 text-xs">
              <div className="font-semibold text-white truncate">{g.name}</div>
              <div className="text-[11px] text-slate-400 mt-0.5 tabular-nums">{g.member_count} members</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
