import React, { useState } from 'react';
import {
  MessageSquareWarning,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Save
} from 'lucide-react';
import { AdminIssue } from '../types';

interface AdminIssuesViewProps {
  issues: AdminIssue[];
  onUpdateIssue: (id: string, updates: Partial<AdminIssue>) => void;
}

export const AdminIssuesView: React.FC<AdminIssuesViewProps> = ({
  issues,
  onUpdateIssue
}) => {
  const [selectedIssue, setSelectedIssue] = useState<AdminIssue | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'IN_REVIEW' | 'RESOLVED'>('ALL');

  const filtered = issues.filter(i => {
    if (statusFilter === 'ALL') return true;
    return i.status === statusFilter;
  });

  const handleSelect = (issue: AdminIssue) => {
    setSelectedIssue(issue);
    setAdminNotes(issue.admin_notes || '');
  };

  const handleSaveNotes = () => {
    if (!selectedIssue) return;
    onUpdateIssue(selectedIssue.id, { admin_notes: adminNotes });
    setSelectedIssue({ ...selectedIssue, admin_notes: adminNotes });
  };

  const handleStatusChange = (status: 'PENDING' | 'IN_REVIEW' | 'RESOLVED') => {
    if (!selectedIssue) return;
    onUpdateIssue(selectedIssue.id, { status });
    setSelectedIssue({ ...selectedIssue, status });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Admin Inquiries & Dispute Tickets</h2>
          <p className="text-xs text-slate-400 mt-1">
            Complaints and inquiries routed automatically to leadership when members mention admin issues.
          </p>
        </div>

        <div className="flex items-center space-x-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
          {(['ALL', 'PENDING', 'IN_REVIEW', 'RESOLVED'] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === s ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              {s === 'ALL' ? 'All' : s.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Ticket List */}
        <div className="md:col-span-1 bg-slate-900 rounded-xl border border-slate-800 p-4 space-y-2 max-h-[600px] overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              No tickets in this category.
            </div>
          ) : (
            filtered.map(issue => (
              <div
                key={issue.id}
                onClick={() => handleSelect(issue)}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  selectedIssue?.id === issue.id
                    ? 'bg-slate-800 border-emerald-500/50 shadow-sm'
                    : 'bg-slate-950/40 border-slate-800/80 hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-emerald-400 font-bold">#{issue.ticket_id}</span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                    issue.status === 'RESOLVED'
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : issue.status === 'IN_REVIEW'
                      ? 'bg-amber-500/10 text-amber-400'
                      : 'bg-rose-500/10 text-rose-400'
                  }`}>
                    {issue.status}
                  </span>
                </div>
                <div className="text-xs font-semibold text-white mt-1 truncate">{issue.member_name}</div>
                <p className="text-[11px] text-slate-400 truncate mt-0.5">{issue.issue_description}</p>
              </div>
            ))
          )}
        </div>

        {/* Ticket Detail */}
        <div className="md:col-span-2 bg-slate-900 rounded-xl border border-slate-800 p-6 flex flex-col justify-between min-h-[400px]">
          {selectedIssue ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <div className="text-sm font-bold text-white flex items-center gap-2">
                    <span>Ticket #{selectedIssue.ticket_id}</span>
                    <span className="text-xs text-slate-400 font-normal">· {selectedIssue.group_name}</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    From: <b className="text-slate-200">{selectedIssue.member_name}</b> ({selectedIssue.member_phone})
                  </div>
                </div>

                <div className="flex gap-1.5">
                  {(['PENDING', 'IN_REVIEW', 'RESOLVED'] as const).map(st => (
                    <button
                      key={st}
                      onClick={() => handleStatusChange(st)}
                      className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase transition-colors ${
                        selectedIssue.status === st
                          ? 'bg-emerald-500 text-slate-950 shadow-sm'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {st.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Reported Issue Description
                </label>
                <div className="p-3 bg-slate-800/40 rounded-lg border border-slate-700/60 text-xs text-slate-200 leading-relaxed font-mono">
                  "{selectedIssue.issue_description}"
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Admin Investigation Notes
                </label>
                <textarea
                  rows={4}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Record dispute outcome or admin remarks..."
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleSaveNotes}
                  className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Notes</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="m-auto text-center text-slate-500 text-xs">
              Select a ticket on the left to review dispute details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
