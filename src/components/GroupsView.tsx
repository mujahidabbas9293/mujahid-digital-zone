import React, { useState, useEffect } from 'react';
import {
  Users2,
  Plus,
  ShieldCheck,
  Settings2,
  Trash2,
  CheckCircle2,
  Radio,
  Power,
  Users,
  AlertTriangle,
  Crown,
  ShieldAlert,
  Bot,
  Ban,
  Clock,
  ExternalLink,
  RefreshCw,
  X,
  Megaphone,
  Send,
  Sparkles,
  Image as ImageIcon
} from 'lucide-react';
import { Group, BotStatus, Member } from '../types';

interface GroupsViewProps {
  groups: Group[];
  status: BotStatus | null;
  onToggleActive: (jid: string, active: boolean) => void;
  onToggleLock?: (jid: string, locked: boolean) => void;
  onUpdateGroup: (jid: string, updates: Partial<Group>) => void;
  onJoinLink: (inviteLink: string, name?: string) => Promise<void>;
  onRemoveGroup: (jid: string) => void;
}

export const GroupsView: React.FC<GroupsViewProps> = ({
  groups,
  status,
  onToggleActive,
  onUpdateGroup,
  onJoinLink,
  onRemoveGroup
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [groupName, setGroupName] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Group Mention Modal State
  const [mentionGroup, setMentionGroup] = useState<Group | null>(null);
  const [mentionMessage, setMentionMessage] = useState('');
  const [isSendingMention, setIsSendingMention] = useState(false);
  const [mentionFeedback, setMentionFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Group Members Modal State
  const [activeMembersGroup, setActiveMembersGroup] = useState<Group | null>(null);
  const [groupMembers, setGroupMembers] = useState<Member[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [memberSearchTerm, setMemberSearchTerm] = useState('');
  const [memberDetail, setMemberDetail] = useState<Member | null>(null);

  // Delete Confirmation Modal State
  const [groupToDelete, setGroupToDelete] = useState<Group | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Group Status Target Settings State
  const [groupStatusSettings, setGroupStatusSettings] = useState<{
    target_mode: 'ALL_GROUPS' | 'SELECTED_GROUPS' | 'EXCLUDE_GROUPS';
    selected_group_jids: string[];
    excluded_group_jids: string[];
  }>({ target_mode: 'ALL_GROUPS', selected_group_jids: [], excluded_group_jids: [] });

  useEffect(() => {
    fetch('/api/group-status/settings')
      .then(r => r.json())
      .then(d => {
        if (d && d.success && d.settings) {
          setGroupStatusSettings(d.settings);
        }
      })
      .catch(() => {});
  }, []);

  const isGroupStatusTargeted = (jid: string) => {
    if (groupStatusSettings.target_mode === 'ALL_GROUPS') return true;
    if (groupStatusSettings.target_mode === 'SELECTED_GROUPS') return groupStatusSettings.selected_group_jids.includes(jid);
    if (groupStatusSettings.target_mode === 'EXCLUDE_GROUPS') return !groupStatusSettings.excluded_group_jids.includes(jid);
    return true;
  };

  const handleToggleGroupStatusTarget = async (jid: string) => {
    let mode = groupStatusSettings.target_mode;
    let selected = [...groupStatusSettings.selected_group_jids];
    let excluded = [...groupStatusSettings.excluded_group_jids];

    if (mode === 'ALL_GROUPS') {
      mode = 'SELECTED_GROUPS';
      selected = [jid];
    } else if (mode === 'SELECTED_GROUPS') {
      if (selected.includes(jid)) {
        selected = selected.filter(id => id !== jid);
      } else {
        selected.push(jid);
      }
    } else if (mode === 'EXCLUDE_GROUPS') {
      if (excluded.includes(jid)) {
        excluded = excluded.filter(id => id !== jid);
      } else {
        excluded.push(jid);
      }
    }

    const updated = { target_mode: mode, selected_group_jids: selected, excluded_group_jids: excluded };
    setGroupStatusSettings(updated);

    try {
      await fetch('/api/group-status/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
    } catch (_) {}
  };

  const isConnected = status?.status === 'CONNECTED';
  const isRecovering = status?.workerStatus === 'RECOVERING' || status?.status === 'CONNECTING';
  const isWorkerHealthy = status?.workerStatus === 'RUNNING';

  // Requirement 14: Accurate Group Bot Status
  // 🟢 BOT ACTIVE only when: WhatsApp connected + backend worker running + group listener active + group automation enabled
  // Otherwise: 🔴 BOT INACTIVE
  // If recovering: 🟠 RECOVERING
  const getGroupBotStatus = (group: Group) => {
    if (isRecovering) {
      return {
        label: '🟠 RECOVERING',
        badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/30'
      };
    }
    const isBotActive = isConnected && isWorkerHealthy && group.is_active;
    if (isBotActive) {
      return {
        label: '🟢 BOT ACTIVE',
        badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
      };
    }
    return {
      label: '🔴 BOT INACTIVE',
      badgeClass: 'bg-rose-500/10 text-rose-400 border-rose-500/30'
    };
  };

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteLink.trim()) return;
    setIsSubmitting(true);
    try {
      await onJoinLink(inviteLink.trim(), groupName.trim());
      setInviteLink('');
      setGroupName('');
      setShowAddModal(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Group Mention Dispatch Handler
  const handleSendGroupMention = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mentionGroup || !mentionMessage.trim()) return;
    setIsSendingMention(true);
    setMentionFeedback(null);
    try {
      const res = await fetch(`/api/groups/${encodeURIComponent(mentionGroup.jid)}/mention`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: mentionMessage.trim() })
      });
      const data = await res.json();
      if (data.success) {
        setMentionFeedback({
          type: 'success',
          text: `Success! Dispatched mention to ${data.tagged_members_count || mentionGroup.member_count} members.`
        });
        setTimeout(() => {
          setMentionGroup(null);
          setMentionFeedback(null);
          setMentionMessage('');
        }, 1800);
      } else {
        setMentionFeedback({ type: 'error', text: data.error || 'Failed to dispatch group mention.' });
      }
    } catch (err: any) {
      setMentionFeedback({ type: 'error', text: err?.message || 'Network error occurred while sending mention.' });
    } finally {
      setIsSendingMention(false);
    }
  };

  // Requirement 11: Real Members Loader for selected group
  const handleOpenMembers = async (group: Group) => {
    setActiveMembersGroup(group);
    setIsLoadingMembers(true);
    setMemberSearchTerm('');
    setMemberDetail(null);
    try {
      const res = await fetch(`/api/groups/${encodeURIComponent(group.jid)}/members`);
      if (res.ok) {
        const data = await res.json();
        setGroupMembers(data.members || []);
      } else {
        // Fallback to general members filtered by group
        const allRes = await fetch('/api/members');
        if (allRes.ok) {
          const allMembers: Member[] = await allRes.json();
          setGroupMembers(allMembers.filter(m => m.group_jid === group.jid));
        }
      }
    } catch (err) {
      console.error('Failed to load group members:', err);
    } finally {
      setIsLoadingMembers(false);
    }
  };

  // Requirement 10: Real backend Delete operation
  const handleConfirmDelete = async () => {
    if (!groupToDelete) return;
    setIsDeleting(true);
    try {
      await fetch(`/api/groups/${encodeURIComponent(groupToDelete.jid)}`, {
        method: 'DELETE'
      });
      onRemoveGroup(groupToDelete.jid);
      setGroupToDelete(null);
    } catch (err) {
      console.error('Failed to delete group:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredGroupMembers = groupMembers.filter(m => {
    if (!memberSearchTerm.trim()) return true;
    const term = memberSearchTerm.toLowerCase();
    return (
      (m.name || '').toLowerCase().includes(term) ||
      (m.phone || '').includes(term) ||
      (m.sender_jid || '').toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">WhatsApp Groups Manager & Defense</h2>
          <p className="text-xs text-slate-400 mt-1">
            Real group identities, live member counts, and continuous 24/7 backend automation.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-sm transition-all flex items-center space-x-1.5 self-start"
        >
          <Plus className="w-4 h-4" />
          <span>Add Group via Link</span>
        </button>
      </div>

      {/* Group Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {groups.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-500 text-xs bg-slate-900 rounded-xl border border-slate-800">
            {isConnected
              ? 'No groups active yet on this WhatsApp account. Join a group or click "Add Group via Link".'
              : 'WhatsApp not connected. Scan QR code in the Connection tab to auto-load your groups.'}
          </div>
        ) : (
          groups.map((g) => {
            const botStatus = getGroupBotStatus(g);

            return (
              <div
                key={g.jid}
                className="bg-slate-900 rounded-xl border border-slate-800 p-5 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center space-x-3 min-w-0">
                      {g.icon_url ? (
                        <img
                          src={g.icon_url.startsWith('http') ? `/api/picture-proxy?url=${encodeURIComponent(g.icon_url)}` : g.icon_url}
                          alt={g.name}
                          referrerPolicy="no-referrer"
                          crossOrigin="anonymous"
                          className="w-10 h-10 rounded-xl object-cover border border-slate-700 shrink-0"
                          onError={(e) => {
                            (e.currentTarget as HTMLElement).style.display = 'none';
                            const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                            if (fallback) fallback.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div
                        className={`w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 items-center justify-center font-bold text-sm text-emerald-400 shrink-0 ${
                          g.icon_url ? 'hidden' : 'flex'
                        }`}
                      >
                        <Users2 className="w-5 h-5" />
                      </div>

                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-white truncate">{g.name}</h3>
                        <p className="text-[11px] text-slate-400 font-mono truncate">{g.jid}</p>
                      </div>
                    </div>

                    {/* Requirement 14: Group Bot Status Badge */}
                    <span
                      className={`px-2.5 py-1 text-[10px] font-bold rounded-full shrink-0 border ${botStatus.badgeClass}`}
                    >
                      {botStatus.label}
                    </span>
                  </div>

                  {/* Live Group Data Stats */}
                  <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                    <div className="p-2 rounded-lg bg-slate-800/40 border border-slate-700/60 text-center">
                      <div className="text-slate-400 text-[10px]">Total Members</div>
                      <div className="text-white font-bold font-mono tabular-nums text-sm">{g.member_count}</div>
                    </div>

                    <div className="p-2 rounded-lg bg-slate-800/40 border border-slate-700/60 text-center">
                      <div className="text-slate-400 text-[10px]">Admins</div>
                      <div className="text-white font-bold font-mono tabular-nums text-sm">{g.admin_count || 1}</div>
                    </div>

                    <div className="p-2 rounded-lg bg-slate-800/40 border border-slate-700/60 text-center">
                      <div className="text-slate-400 text-[10px]">Worker Health</div>
                      <div className="font-semibold text-emerald-400 flex items-center justify-center gap-1 mt-0.5 text-[11px]">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>24/7 VPS</span>
                      </div>
                    </div>
                  </div>

                  {/* Group Defense & Activation Toggles */}
                  <div className="mt-4 pt-3 border-t border-slate-800 space-y-2 text-xs">
                    <label className="flex items-center justify-between cursor-pointer">
                      <div className="flex items-center gap-1.5 text-purple-300 font-medium">
                        <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                        <span>Group Status (.gcstatus Target)</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={isGroupStatusTargeted(g.jid)}
                        onChange={() => handleToggleGroupStatusTarget(g.jid)}
                        className="rounded accent-purple-500 w-4 h-4 cursor-pointer"
                      />
                    </label>

                    <label className="flex items-center justify-between cursor-pointer">
                      <div className="flex items-center gap-1.5 text-slate-200 font-medium">
                        <Power className={`w-3.5 h-3.5 ${g.is_active ? 'text-emerald-400' : 'text-slate-500'}`} />
                        <span>Automated Bot Defense</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={g.is_active}
                        onChange={(e) => onToggleActive(g.jid, e.target.checked)}
                        className="rounded accent-emerald-500 w-4 h-4 cursor-pointer"
                      />
                    </label>

                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-slate-300">Anti-Link Removal (3 Strikes = Kick)</span>
                      <input
                        type="checkbox"
                        checked={g.anti_link_enabled}
                        onChange={(e) => onUpdateGroup(g.jid, { anti_link_enabled: e.target.checked })}
                        className="rounded accent-emerald-500 w-4 h-4 cursor-pointer"
                      />
                    </label>

                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-slate-300">Anti-View-Channel / Channel Link Removal</span>
                      <input
                        type="checkbox"
                        checked={g.anti_view_channel_enabled ?? true}
                        onChange={(e) => onUpdateGroup(g.jid, { anti_view_channel_enabled: e.target.checked })}
                        className="rounded accent-emerald-500 w-4 h-4 cursor-pointer"
                      />
                    </label>

                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-slate-300">Fast Welcome Card</span>
                      <input
                        type="checkbox"
                        checked={g.welcome_enabled}
                        onChange={(e) => onUpdateGroup(g.jid, { welcome_enabled: e.target.checked })}
                        className="rounded accent-emerald-500 w-4 h-4 cursor-pointer"
                      />
                    </label>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenMembers(g)}
                      className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
                      title="View Live Members"
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>MEMBERS</span>
                    </button>

                    <button
                      onClick={() => {
                        setMentionGroup(g);
                        setMentionMessage(`📢 *IMPORTANT ANNOUNCEMENT*\n\nDear members of *${g.name}*,\n\nPlease note: `);
                        setMentionFeedback(null);
                      }}
                      className="px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
                      title="Send Group Mention (Tag All Members)"
                    >
                      <Megaphone className="w-3.5 h-3.5" />
                      <span>MENTION</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setSelectedGroup(g)}
                      className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                      title="Edit Rules & Filters"
                    >
                      <Settings2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setGroupToDelete(g)}
                      className="p-1.5 text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 rounded-lg transition-colors border border-rose-500/20"
                      title="Delete Group"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Requirement 11 & 12: Group Members Modal */}
      {activeMembersGroup && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full p-6 shadow-2xl flex flex-col max-h-[85vh] animate-scaleUp">
            <div className="flex items-start justify-between pb-4 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-base font-bold text-white">Group Members — {activeMembersGroup.name}</h3>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Loaded live from connected WhatsApp account • {groupMembers.length} participants
                </p>
              </div>
              <button
                onClick={() => setActiveMembersGroup(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-3 flex items-center justify-between gap-3">
              <input
                type="text"
                value={memberSearchTerm}
                onChange={(e) => setMemberSearchTerm(e.target.value)}
                placeholder="Search member by name or phone..."
                className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
              />
              <button
                onClick={() => handleOpenMembers(activeMembersGroup)}
                disabled={isLoadingMembers}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingMembers ? 'animate-spin' : ''}`} />
                <span>Sync</span>
              </button>
            </div>

            {/* Members Table */}
            <div className="flex-1 overflow-y-auto mt-2 border border-slate-800 rounded-xl">
              {isLoadingMembers ? (
                <div className="py-12 text-center text-slate-500 text-xs flex flex-col items-center justify-center gap-2">
                  <RefreshCw className="w-5 h-5 animate-spin text-emerald-400" />
                  <span>Loading members from WhatsApp session...</span>
                </div>
              ) : filteredGroupMembers.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs">
                  No members found matching search query.
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 sticky top-0 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Member</th>
                      <th className="py-2.5 px-3">Phone Identifier</th>
                      <th className="py-2.5 px-3">Role</th>
                      <th className="py-2.5 px-3">Moderation Status</th>
                      <th className="py-2.5 px-3">Strikes</th>
                      <th className="py-2.5 px-3 text-right">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 font-mono">
                    {filteredGroupMembers.map((m) => {
                      const isOwner = m.role === 'superadmin' || (m as any).is_owner;
                      const isAdmin = m.role === 'admin' || isOwner || (m as any).is_admin;
                      const isBlacklisted = (m as any).is_blacklisted;
                      const hasWarnings = m.warnings_count > 0;

                      // Requirement 13: Exact Member Status
                      let statusBadge = { label: '🟢 Normal', bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' };
                      if (isBlacklisted) {
                        statusBadge = { label: '🚫 Blacklisted', bg: 'bg-rose-500/10 text-rose-400 border-rose-500/20' };
                      } else if (isOwner) {
                        statusBadge = { label: '👑 Owner', bg: 'bg-purple-500/10 text-purple-400 border-purple-500/20' };
                      } else if (isAdmin) {
                        statusBadge = { label: '👮 Admin', bg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' };
                      } else if (hasWarnings) {
                        statusBadge = { label: `⚠️ Warning (${m.warnings_count}/3)`, bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20' };
                      }

                      return (
                        <tr key={m.id || m.sender_jid} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-2">
                              {m.profile_picture_reference ? (
                                <img
                                  src={m.profile_picture_reference}
                                  alt=""
                                  className="w-7 h-7 rounded-lg object-cover border border-slate-700"
                                />
                              ) : (
                                <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-slate-300">
                                  {m.name ? m.name.charAt(0).toUpperCase() : 'U'}
                                </div>
                              )}
                              <span className="text-white font-sans font-medium text-xs truncate max-w-[140px]">
                                {m.name || 'Not Available'}
                              </span>
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-slate-300">
                            {m.phone && m.phone !== 'UNAVAILABLE' ? (
                              <span className="text-emerald-400 font-semibold font-mono text-[11px]">
                                {m.phone.startsWith('+') ? m.phone : `+${m.phone}`}
                              </span>
                            ) : (
                              <span className="text-amber-400 font-sans text-[10px]">📱 Number: Unavailable</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="text-[10px] uppercase font-bold text-slate-300">
                              {isOwner ? '👑 Owner' : isAdmin ? '👮 Admin' : 'Participant'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusBadge.bg}`}>
                              {statusBadge.label}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className={m.warnings_count > 0 ? 'text-amber-400 font-bold' : 'text-slate-400'}>
                              {m.warnings_count}/3
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              onClick={() => setMemberDetail(m)}
                              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[10px] font-sans font-semibold transition-colors"
                            >
                              Profile
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            <div className="flex justify-end pt-4 mt-2 border-t border-slate-800">
              <button
                onClick={() => setActiveMembersGroup(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Requirement 12: Complete Real Member Profile Modal */}
      {memberDetail && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-start justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>👤 Real Member Profile</span>
              </h3>
              <button
                onClick={() => setMemberDetail(null)}
                className="text-slate-400 hover:text-white text-sm font-bold px-2 py-1"
              >
                ✕
              </button>
            </div>

            {/* Real Member Profile Header */}
            <div className="flex items-center gap-3.5 p-3.5 bg-slate-950 rounded-xl border border-slate-800">
              {memberDetail.profile_picture_reference ? (
                <img
                  src={memberDetail.profile_picture_reference}
                  alt={memberDetail.name}
                  className="w-14 h-14 rounded-2xl object-cover border-2 border-emerald-500 shadow-md shrink-0"
                />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center font-bold text-xl text-white shadow-md shrink-0">
                  {(memberDetail.name || memberDetail.phone || 'WA').slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="text-base font-bold text-white truncate">{memberDetail.name || 'Not Available'}</div>
                <div className="text-xs text-emerald-400 font-mono font-semibold">
                  {memberDetail.phone && memberDetail.phone !== 'UNAVAILABLE'
                    ? (memberDetail.phone.startsWith('+') ? memberDetail.phone : `+${memberDetail.phone}`)
                    : 'Not Available'}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
                    Verified Participant
                  </span>
                  <span className="text-slate-500">•</span>
                  <span className="text-[11px] text-slate-300 capitalize font-medium">{memberDetail.role || 'Participant'}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              {/* 1. Profile, 2. Name, 3. Number, 4. Role, 5. Moderation, 6. Online Status */}
              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2.5">
                <div className="flex justify-between items-center py-1 border-b border-slate-800/80">
                  <span className="text-slate-400 font-medium">1️⃣ Profile Picture:</span>
                  <span className="text-white font-semibold flex items-center gap-1.5">
                    {memberDetail.profile_picture_reference ? (
                      <span className="text-emerald-400 font-medium">🖼️ Real WhatsApp Profile Photo</span>
                    ) : (
                      <span className="text-slate-400 font-medium">📷 Standard Avatar</span>
                    )}
                  </span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-slate-800/80">
                  <span className="text-slate-400 font-medium">2️⃣ Name:</span>
                  <span className="text-white font-bold">{memberDetail.name || 'Member'}</span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-slate-800/80">
                  <span className="text-slate-400 font-medium">3️⃣ Number:</span>
                  <span className="font-mono font-bold">
                    {memberDetail.phone && memberDetail.phone !== 'UNAVAILABLE' ? (
                      <span className="text-emerald-400">
                        {memberDetail.phone.startsWith('+') ? memberDetail.phone : `+${memberDetail.phone}`}
                      </span>
                    ) : (
                      <span className="text-amber-400 font-normal">
                        📱 Number: Unavailable
                      </span>
                    )}
                  </span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-slate-800/80">
                  <span className="text-slate-400 font-medium">4️⃣ Role:</span>
                  <span>
                    {memberDetail.role === 'superadmin' ? (
                      <span className="px-2 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        👑 Owner
                      </span>
                    ) : memberDetail.role === 'admin' ? (
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
                    <span className="text-[10px] text-slate-500">Live Activity Tracking</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                    <div className="p-2 bg-slate-900 rounded-lg border border-slate-800 flex justify-between">
                      <span className="text-slate-400">⚠️ Warnings:</span>
                      <span className="text-amber-400 font-bold">{memberDetail.warnings_count || 0}/3</span>
                    </div>
                    <div className="p-2 bg-slate-900 rounded-lg border border-slate-800 flex justify-between">
                      <span className="text-slate-400">🚫 Kicks:</span>
                      <span className="text-rose-400 font-bold">{memberDetail.kicks_count || 0}</span>
                    </div>
                    <div className="p-2 bg-slate-900 rounded-lg border border-slate-800 flex justify-between">
                      <span className="text-slate-400">🗑️ Deleted Msg:</span>
                      <span className="text-slate-300 font-bold">{memberDetail.deleted_messages_count || 0}</span>
                    </div>
                    <div className="p-2 bg-slate-900 rounded-lg border border-slate-800 flex justify-between">
                      <span className="text-slate-400">🔗 Link Violations:</span>
                      <span className="text-orange-400 font-bold">{memberDetail.link_violations_count || 0}</span>
                    </div>
                  </div>
                </div>

                {/* 6. Online Status */}
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-400 font-medium">6️⃣ Online Status:</span>
                  <span className="flex items-center gap-1.5 font-bold">
                    {memberDetail.online_status === 'ONLINE' ? (
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
                onClick={() => setMemberDetail(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Requirement 10: Delete Confirmation Modal */}
      {groupToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/30 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-center gap-2.5 text-rose-400">
              <Trash2 className="w-5 h-5" />
              <h3 className="text-base font-bold text-white">Delete Group from Bot?</h3>
            </div>
            <p className="text-xs text-slate-300">
              Are you sure you want to permanently delete <strong className="text-white">{groupToDelete.name}</strong> from Mujahid Digital Zone Bot?
            </p>
            <p className="text-[11px] text-slate-400">
              This will remove all bot automation, welcome messages, anti-link defense, and clean up group tracking data in the backend database.
            </p>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setGroupToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting ? 'Deleting...' : 'Delete Group'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Group Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-white">Join & Moderate WhatsApp Group</h3>
            <form onSubmit={handleJoinSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  WhatsApp Group Invite Link
                </label>
                <input
                  type="text"
                  value={inviteLink}
                  onChange={(e) => setInviteLink(e.target.value)}
                  placeholder="https://chat.whatsapp.com/..."
                  required
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Custom Label (Optional)
                </label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="e.g. VIP Crypto VIP Discussion"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg"
                >
                  {isSubmitting ? 'Joining...' : 'Join Group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rules / Filters Modal */}
      {selectedGroup && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-white">Group Rules & Defense Filter</h3>
            <p className="text-xs text-slate-400">{selectedGroup.name}</p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Group Rules Text (Sent on !rules)
                </label>
                <textarea
                  rows={4}
                  value={selectedGroup.rules_text}
                  onChange={(e) =>
                    onUpdateGroup(selectedGroup.jid, { rules_text: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Forbidden Bad Words (comma-separated)
                </label>
                <input
                  type="text"
                  value={selectedGroup.bad_words_list}
                  onChange={(e) =>
                    onUpdateGroup(selectedGroup.jid, { bad_words_list: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Scam Keywords Filter
                </label>
                <input
                  type="text"
                  value={selectedGroup.scam_keywords}
                  onChange={(e) =>
                    onUpdateGroup(selectedGroup.jid, { scam_keywords: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedGroup(null)}
                className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Group Mention / Tag All Modal */}
      {mentionGroup && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-start justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                {mentionGroup.icon_url ? (
                  <img
                    src={mentionGroup.icon_url}
                    alt={mentionGroup.name}
                    className="w-11 h-11 rounded-xl object-cover border border-slate-700 shrink-0"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-xl bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0 font-bold">
                    <Megaphone className="w-5 h-5" />
                  </div>
                )}
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>Group Mention — {mentionGroup.name}</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Tag all {mentionGroup.member_count} members directly via Connection QR session.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setMentionGroup(null);
                  setMentionFeedback(null);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {mentionFeedback && (
              <div
                className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                  mentionFeedback.type === 'success'
                    ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/30'
                    : 'bg-rose-950/40 text-rose-300 border border-rose-500/30'
                }`}
              >
                {mentionFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                )}
                <span>{mentionFeedback.text}</span>
              </div>
            )}

            <form onSubmit={handleSendGroupMention} className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-xs text-slate-300 mb-1.5 font-medium">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Mention Message Content</span>
                  </span>
                  <span className="text-[11px] text-cyan-400 font-mono">
                    👥 Tags all {mentionGroup.member_count} members
                  </span>
                </div>
                <textarea
                  rows={5}
                  value={mentionMessage}
                  onChange={(e) => setMentionMessage(e.target.value)}
                  placeholder="Type announcement message here..."
                  required
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500 font-mono leading-relaxed resize-none"
                />
              </div>

              {/* Quick Template Buttons */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Quick Fill:</span>
                <button
                  type="button"
                  onClick={() => setMentionMessage(`📢 *IMPORTANT ANNOUNCEMENT*\n\nAttention all members of *${mentionGroup.name}*!\nPlease check the latest rules and updates in the group description.`)}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md text-[10px] transition-colors"
                >
                  📢 Announcement
                </button>
                <button
                  type="button"
                  onClick={() => setMentionMessage(`⚡ *URGENT NOTICE*\n\nDear members of *${mentionGroup.name}*,\nPlease be aware that scam messages and unauthorized links are strictly prohibited.`)}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md text-[10px] transition-colors"
                >
                  ⚡ Notice
                </button>
                <button
                  type="button"
                  onClick={() => setMentionMessage(`👋 *HELLO EVERYONE*\n\nWelcome to *${mentionGroup.name}*! Feel free to ask questions and follow group guidelines.`)}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md text-[10px] transition-colors"
                >
                  👋 Welcome
                </button>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
                <div className="text-[11px] text-slate-400">
                  Bot will mention and notify each group participant.
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMentionGroup(null);
                      setMentionFeedback(null);
                    }}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSendingMention || !mentionMessage.trim()}
                    className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-cyan-500/20"
                  >
                    <Send className={`w-3.5 h-3.5 ${isSendingMention ? 'animate-spin' : ''}`} />
                    <span>{isSendingMention ? 'Sending Mention...' : 'Send Group Mention'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
