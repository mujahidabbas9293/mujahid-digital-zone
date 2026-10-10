import React, { useState } from 'react';
import {
  History,
  Search,
  Filter,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Info
} from 'lucide-react';
import { ActivityLog } from '../types';

interface LogsViewProps {
  logs: ActivityLog[];
}

export const LogsView: React.FC<LogsViewProps> = ({ logs }) => {
  const [filter, setFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');

  const filtered = logs.filter(l => {
    if (filter !== 'ALL' && l.level !== filter) return false;
    if (!search.trim()) return true;
    return (
      l.details.toLowerCase().includes(search.toLowerCase()) ||
      l.event_type.toLowerCase().includes(search.toLowerCase()) ||
      (l.group_name && l.group_name.toLowerCase().includes(search.toLowerCase()))
    );
  });

  const getBadge = (level: string) => {
    switch (level) {
      case 'ACTION_SUCCESS':
        return { bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: CheckCircle };
      case 'WARNING_ISSUED':
        return { bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20', icon: AlertTriangle };
      case 'KICK_EXECUTED':
        return { bg: 'bg-rose-500/10 text-rose-400 border-rose-500/20', icon: XCircle };
      default:
        return { bg: 'bg-slate-800 text-slate-300 border-slate-700', icon: Info };
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">System & Activity Audit Log</h2>
          <p className="text-xs text-slate-400 mt-1">
            Immutable log of all moderation strikes, kicked members, socket links, and admin actions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search logs..."
              className="pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500 w-44"
            />
          </div>

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
          >
            <option value="ALL">All Levels</option>
            <option value="ACTION_SUCCESS">Success</option>
            <option value="WARNING_ISSUED">Warnings</option>
            <option value="KICK_EXECUTED">Kicks</option>
            <option value="INFO">Info</option>
          </select>
        </div>
      </div>

      <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-md divide-y divide-slate-800">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-xs">
            No activity logs match your filter.
          </div>
        ) : (
          filtered.map(l => {
            const { bg, icon: Icon } = getBadge(l.level);
            return (
              <div key={l.id} className="p-4 flex items-start space-x-3 hover:bg-slate-800/30 transition-colors">
                <div className={`p-2 rounded-lg ${bg} shrink-0 mt-0.5 border`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-white tracking-tight">{l.event_type.replace(/_/g, ' ')}</span>
                    <span className="text-[10px] text-slate-500 font-mono tabular-nums">
                      {new Date(l.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'medium' })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">{l.details}</p>
                  {l.group_name && (
                    <span className="inline-block mt-1 text-[10px] text-emerald-400 font-medium">
                      Group: {l.group_name}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
