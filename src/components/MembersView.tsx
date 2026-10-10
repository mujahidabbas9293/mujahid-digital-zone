import React, { useState } from 'react';
import {
  UserCheck,
  Search,
  AlertTriangle,
  RotateCcw,
  UserX,
  ShieldCheck,
  Filter,
  Users2,
  Crown,
  ShieldAlert,
  Bot,
  Ban,
  Download,
  Eye,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { Member, Group } from '../types';

interface MembersViewProps {
  members: Member[];
  groups?: Group[];
  onUnwarn: (senderJid: string, groupJid: string) => void;
  onKick: (senderJid: string, groupJid: string, reason?: string) => void;
  onWarnMember?: (senderJid: string, groupJid: string, phone: string, name: string, reason: string) => void;
  onBlacklistMember?: (phone: string, reason: string) => void;
  onSyncMembers?: () => Promise<void>;
}

export const MembersView: React.FC<MembersViewProps> = ({
  members,
  groups = [],
  onUnwarn,
  onKick,
  onWarnMember,
  onBlacklistMember,
  onSyncMembers
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState('ALL');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<'ALL' | 'ADMINS' | 'WARNED' | 'BANNED'>('ALL');
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [warnReason, setWarnReason] = useState('');
  const [showWarnModal, setShowWarnModal] = useState<Member | null>(null);

  const getCleanMemberName = (m: Member) => {
    const raw = (m.name || '').trim();
    if (!raw || raw.startsWith('+') || /^[0-9\s\+\-\(\)]+$/.test(raw)) {
      return 'Member';
    }
    return raw;
  };

  const getCleanMemberPhone = (m: Member) => {
    const raw = (m.phone || '').trim();
    if (!raw || raw === 'UNAVAILABLE' || raw.toLowerCase().includes('unavailable')) {
      return '📱 Number: Unavailable';
    }
    const cleanDigits = raw.replace(/[^0-9]/g, '');
    if (cleanDigits.length >= 7) {
      return `+${cleanDigits}`;
    }
    return raw;
  };

  const handleSync = async () => {
    if (!onSyncMembers) return;
    setIsSyncing(true);
    try {
      await onSyncMembers();
    } finally {
      setTimeout(() => setIsSyncing(false), 800);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Name', 'Phone', 'Role', 'Group', 'Strikes', 'Banned', 'Joined At'];
    const rows = filtered.map(m => [
      `"${getCleanMemberName(m)}"`,
      `"${getCleanMemberPhone(m)}"`,
      m.role || 'participant',
      `"${m.group_name || m.group_jid}"`,
      m.warnings_count,
      m.is_banned ? 'YES' : 'NO',
      m.joined_at || ''
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `whatsapp_group_members_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filtered = members.filter(m => {
    // Group filter
    if (selectedGroupFilter !== 'ALL' && m.group_jid !== selectedGroupFilter) return false;

    // Role filter
    if (selectedRoleFilter === 'WARNED' && m.warnings_count === 0) return false;
    if (selectedRoleFilter === 'BANNED' && !m.is_banned) return false;
    if (selectedRoleFilter === 'ADMINS' && m.role !== 'admin' && m.role !== 'superadmin') return false;

    // Search term
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      (m.name || '').toLowerCase().includes(term) ||
      (m.phone || '').includes(term) ||
      (m.sender_jid || '').toLowerCase().includes(term) ||
      (m.group_name || '').toLowerCase().includes(term)
    );
  });

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'superadmin':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
            👑 Owner
          </span>
        );
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
            🛡️ Admin
          </span>
        );
      case 'bot':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30">
            <Bot className="w-3 h-3 text-purple-400" /> Bot Engine
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700/60">
            👤 Member
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-emerald-400" />
            <span>Group Members & Participant Moderation</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real synced WhatsApp group members, administrative permissions, strikes ledger, and instant actions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onSyncMembers && (
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
              title="Synchronize real WhatsApp group members from active socket"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-emerald-400' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync Members'}</span>
            </button>
          )}

          <button
            onClick={handleExportCSV}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
            title="Download members audit as CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between shadow-sm">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search member by name, phone (+92...), or JID..."
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 placeholder:text-slate-500"
            />
          </div>

          {/* Group Filter */}
          {groups.length > 0 && (
            <select
              value={selectedGroupFilter}
              onChange={(e) => setSelectedGroupFilter(e.target.value)}
              className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 max-w-[200px] truncate"
            >
              <option value="ALL">All Moderated Groups ({groups.length})</option>
              {groups.map(g => (
                <option key={g.jid} value={g.jid}>{g.name}</option>
              ))}
            </select>
          )}
        </div>

        {/* Role & Status Filter Pills */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 self-start md:self-auto">
          <button
            onClick={() => setSelectedRoleFilter('ALL')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
              selectedRoleFilter === 'ALL'
                ? 'bg-emerald-500/20 text-emerald-400 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All ({members.length})
          </button>
          <button
            onClick={() => setSelectedRoleFilter('ADMINS')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${
              selectedRoleFilter === 'ADMINS'
                ? 'bg-cyan-500/20 text-cyan-400 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3 h-3" />
            <span>Admins</span>
          </button>
          <button
            onClick={() => setSelectedRoleFilter('WARNED')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${
              selectedRoleFilter === 'WARNED'
                ? 'bg-amber-500/20 text-amber-400 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <AlertTriangle className="w-3 h-3" />
            <span>Warned</span>
          </button>
          <button
            onClick={() => setSelectedRoleFilter('BANNED')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${
              selectedRoleFilter === 'BANNED'
                ? 'bg-rose-500/20 text-rose-400 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Ban className="w-3 h-3" />
            <span>Banned</span>
          </button>
        </div>
      </div>

      {/* Members Directory Table */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-md overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-20 text-center text-slate-500 text-xs">
            <Users2 className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-50" />
            <p>No member records match the selected filter or search query.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400">
                  <th className="py-3 px-4 font-semibold uppercase text-[10px]">Member Profile</th>
                  <th className="py-3 px-4 font-semibold uppercase text-[10px]">Role</th>
                  <th className="py-3 px-4 font-semibold uppercase text-[10px]">Group</th>
                  <th className="py-3 px-4 font-semibold uppercase text-[10px]">Strikes</th>
                  <th className="py-3 px-4 font-semibold uppercase text-[10px]">Standing</th>
                  <th className="py-3 px-4 font-semibold uppercase text-[10px] text-right">Moderation Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filtered.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-3">
                        {m.profile_picture_reference ? (
                          <img
                            src={m.profile_picture_reference}
                            alt={m.name || 'Member'}
                            className="w-8 h-8 rounded-full object-cover border border-emerald-500/40 shrink-0"
                            onError={(e) => {
                              (e.currentTarget as HTMLElement).style.display = 'none';
                              const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                              if (fallback) fallback.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div
                          className={`w-8 h-8 rounded-full bg-slate-800 border border-slate-700 items-center justify-center font-bold text-[10px] text-emerald-400 shrink-0 ${
                            m.profile_picture_reference ? 'hidden' : 'flex'
                          }`}
                        >
                          {getCleanMemberName(m).slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-white truncate max-w-[160px]">{getCleanMemberName(m)}</div>
                          <div className="text-[11px] font-mono text-slate-400">
                            {getCleanMemberPhone(m)}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {getRoleBadge(m.role)}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="text-slate-300 font-medium truncate max-w-[150px]">
                        {m.group_name || 'Active Group'}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono truncate max-w-[150px]">
                        {m.group_jid}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] tabular-nums ${
                          m.warnings_count >= 3
                            ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                            : m.warnings_count > 0
                            ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {m.warnings_count} / 3 Strikes
                      </span>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {m.is_banned ? (
                        <span className="text-rose-400 font-semibold text-[11px] flex items-center gap-1">
                          <Ban className="w-3 h-3" /> Expelled
                        </span>
                      ) : m.warnings_count > 0 ? (
                        <span className="text-amber-400 font-semibold text-[11px] flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Warning Active
                        </span>
                      ) : (
                        <span className="text-emerald-400 font-semibold text-[11px] flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Good Standing
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* View Audit Card */}
                        <button
                          onClick={() => setSelectedMember(m)}
                          className="p-1.5 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-lg transition-colors"
                          title="View /mydata audit record"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Unwarn */}
                        {m.warnings_count > 0 && (
                          <button
                            onClick={() => onUnwarn(m.sender_jid, m.group_jid)}
                            className="px-2 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-[11px] font-semibold transition-colors flex items-center gap-1"
                            title="Reset warnings to 0/3"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Unwarn</span>
                          </button>
                        )}

                        {/* Warn +1 */}
                        {onWarnMember && !m.is_banned && (
                          <button
                            onClick={() => {
                              setShowWarnModal(m);
                              setWarnReason('Admin manual strike issued');
                            }}
                            className="px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg text-[11px] font-semibold transition-colors flex items-center gap-1"
                            title="Issue +1 warning strike"
                          >
                            <AlertTriangle className="w-3 h-3" />
                            <span>Warn</span>
                          </button>
                        )}

                        {/* Kick */}
                        {!m.is_banned && (
                          <button
                            onClick={() => onKick(m.sender_jid, m.group_jid, 'Removed by admin via operations dashboard')}
                            className="px-2 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg text-[11px] font-semibold transition-colors flex items-center gap-1"
                            title="Kick member from group"
                          >
                            <UserX className="w-3 h-3" />
                            <span>Kick</span>
                          </button>
                        )}

                        {/* Add to Blacklist */}
                        {onBlacklistMember && m.phone && (
                          <button
                            onClick={() => {
                              if (window.confirm(`Add +${m.phone} to permanent zero-tolerance blacklist?`)) {
                                onBlacklistMember(m.phone, 'Added via member management audit');
                              }
                            }}
                            className="p-1.5 text-rose-400 hover:text-white bg-rose-500/10 hover:bg-rose-600 rounded-lg border border-rose-500/30 transition-colors"
                            title="Permanently blacklist number"
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Member Audit Record Modal (/mydata viewer) */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-start justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white">Member Identity & Audit Record</h3>
                <p className="text-xs text-slate-400">Complete /mydata record stored in persistent 24/7 database.</p>
              </div>
              <button
                onClick={() => setSelectedMember(null)}
                className="text-slate-400 hover:text-white text-sm font-bold px-2 py-1"
              >
                ✕
              </button>
            </div>

            {/* Real Member Profile Header */}
            <div className="flex items-center gap-3.5 p-3.5 bg-slate-950 rounded-xl border border-slate-800">
              {selectedMember.profile_picture_reference ? (
                <img
                  src={selectedMember.profile_picture_reference}
                  alt={getCleanMemberName(selectedMember)}
                  className="w-14 h-14 rounded-2xl object-cover border-2 border-emerald-500 shadow-md shrink-0"
                />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center font-bold text-xl text-white shadow-md shrink-0">
                  {getCleanMemberName(selectedMember).slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="text-base font-bold text-white truncate">{getCleanMemberName(selectedMember)}</div>
                <div className="text-xs font-mono font-semibold text-emerald-400">
                  {getCleanMemberPhone(selectedMember)}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
                    Verified Participant
                  </span>
                  <span className="text-slate-500">•</span>
                  <span className="text-[11px] text-slate-300 font-medium">
                    {selectedMember.role === 'superadmin' ? '👑 Owner' : selectedMember.role === 'admin' ? '🛡️ Admin' : '👤 Member'}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2.5">
                <div className="flex justify-between items-center py-1 border-b border-slate-800/80">
                  <span className="text-slate-400 font-medium">1️⃣ Profile Picture:</span>
                  <span className="text-white font-semibold">
                    {selectedMember.profile_picture_reference ? (
                      <span className="text-emerald-400">🖼️ Real WhatsApp Profile Photo</span>
                    ) : (
                      <span className="text-slate-400">📷 Standard Avatar</span>
                    )}
                  </span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-slate-800/80">
                  <span className="text-slate-400 font-medium">2️⃣ Name:</span>
                  <span className="text-white font-bold">{getCleanMemberName(selectedMember)}</span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-slate-800/80">
                  <span className="text-slate-400 font-medium">3️⃣ Number:</span>
                  <span className="font-mono font-bold text-emerald-400">
                    {getCleanMemberPhone(selectedMember)}
                  </span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-slate-800/80">
                  <span className="text-slate-400 font-medium">4️⃣ Role:</span>
                  <span>
                    {selectedMember.role === 'superadmin' ? (
                      <span className="px-2 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        👑 Owner
                      </span>
                    ) : selectedMember.role === 'admin' ? (
                      <span className="px-2 py-0.5 rounded-full font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                        🛡️ Admin
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full font-medium bg-slate-800 text-slate-300 border border-slate-700">
                        👤 Member
                      </span>
                    )}
                  </span>
                </div>

                {/* 5. Moderation Record */}
                <div className="py-2 border-b border-slate-800/80 space-y-1.5">
                  <div className="text-slate-400 font-medium flex items-center justify-between">
                    <span>5️⃣ Moderation Record:</span>
                    <span className="text-[10px] text-slate-500 font-mono">Real-time ledger</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 font-mono">
                    <div className="p-2 bg-slate-900 rounded-lg border border-slate-800 flex justify-between">
                      <span className="text-slate-400">⚠️ Warnings:</span>
                      <span className="text-amber-400 font-bold">{selectedMember.warnings_count || 0}/3</span>
                    </div>
                    <div className="p-2 bg-slate-900 rounded-lg border border-slate-800 flex justify-between">
                      <span className="text-slate-400">🚫 Kicks:</span>
                      <span className="text-rose-400 font-bold">{selectedMember.kicks_count || 0}</span>
                    </div>
                    <div className="p-2 bg-slate-900 rounded-lg border border-slate-800 flex justify-between">
                      <span className="text-slate-400">🗑️ Deleted Msg:</span>
                      <span className="text-slate-300 font-bold">{selectedMember.deleted_messages_count || 0}</span>
                    </div>
                    <div className="p-2 bg-slate-900 rounded-lg border border-slate-800 flex justify-between">
                      <span className="text-slate-400">🔗 Link Violations:</span>
                      <span className="text-orange-400 font-bold">{selectedMember.link_violations_count || 0}</span>
                    </div>
                  </div>
                </div>

                {/* 6. Online Status */}
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-400 font-medium">6️⃣ Online Status:</span>
                  <span className="flex items-center gap-1.5 font-bold">
                    {selectedMember.online_status === 'ONLINE' ? (
                      <span className="text-emerald-400 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        🟢 Online
                      </span>
                    ) : (
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-slate-600"></span>
                        ⚫ Offline
                      </span>
                    )}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedMember(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold"
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Strike Modal */}
      {showWarnModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Issue Manual Strike (+1 Warning)</span>
            </h3>
            <p className="text-xs text-slate-300">
              Issuing strike to <strong className="text-white">{showWarnModal.name}</strong> (+{showWarnModal.phone}).
              If warnings reach 3, the bot will automatically expel them from the group.
            </p>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Violation Reason</label>
              <input
                type="text"
                value={warnReason}
                onChange={(e) => setWarnReason(e.target.value)}
                placeholder="e.g. Inappropriate language, spam, or disruptive behavior"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowWarnModal(null)}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (onWarnMember) {
                    onWarnMember(
                      showWarnModal.sender_jid,
                      showWarnModal.group_jid,
                      showWarnModal.phone,
                      showWarnModal.name,
                      warnReason || 'Manual strike issued by admin'
                    );
                  }
                  setShowWarnModal(null);
                }}
                className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl shadow-sm"
              >
                Issue Warning Strike
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
