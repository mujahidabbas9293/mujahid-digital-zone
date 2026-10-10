import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Send,
  AlertTriangle,
  Clock,
  Calendar,
  Users2,
  UserCheck,
  UserX,
  Activity,
  ShieldCheck,
  Sparkles,
  ChevronRight,
  Zap,
  Radio,
  Server,
  HeartHandshake,
  Key,
  Shield,
  ShieldAlert,
  CheckCircle2,
  RefreshCw,
  Layers,
  MessageCircle,
  Award,
  Megaphone,
  FileSpreadsheet,
  Trash2,
  CheckSquare
} from 'lucide-react';
import { BotStatus, ActivityLog, Group, ResellerState, CenterGroup, AutoSenderTask, ScamReportTask, TrustedPostTask } from '../types';

interface DashboardViewProps {
  status: BotStatus | null;
  activityLogs: ActivityLog[];
  groups: Group[];
  onNavigate: (tab: string) => void;
  resellerStatus?: ResellerState | null;
  onRefreshGlobal?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  status,
  activityLogs,
  groups,
  onNavigate,
  resellerStatus,
  onRefreshGlobal
}) => {
  const [filterLevel, setFilterLevel] = useState<'ALL' | 'WARNING_ISSUED' | 'KICK_EXECUTED' | 'INFO'>('ALL');
  const [renewKey, setRenewKey] = useState<string>('');
  const [isActivating, setIsActivating] = useState<boolean>(false);
  const [activationMsg, setActivationMsg] = useState<{ success: boolean; text: string } | null>(null);

  // Live Auto Sender & Broadcast Engine Records
  const [autoSenderGroups, setAutoSenderGroups] = useState<CenterGroup[]>([]);
  const [autoSenderTasks, setAutoSenderTasks] = useState<AutoSenderTask[]>([]);
  const [autoSenderScamReports, setAutoSenderScamReports] = useState<ScamReportTask[]>([]);
  const [autoSenderTrustedPosts, setAutoSenderTrustedPosts] = useState<TrustedPostTask[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState<boolean>(true);

  const fetchLiveBackendRecords = async () => {
    try {
      const [groupsRes, tasksRes, scamRes, trustedRes] = await Promise.all([
        fetch('/api/auto-sender/groups').then(r => r.json()).catch(() => []),
        fetch('/api/auto-sender/tasks').then(r => r.json()).catch(() => []),
        fetch('/api/auto-sender/scam-reports').then(r => r.json()).catch(() => []),
        fetch('/api/auto-sender/trusted-posts').then(r => r.json()).catch(() => [])
      ]);

      if (Array.isArray(groupsRes)) setAutoSenderGroups(groupsRes);
      if (Array.isArray(tasksRes)) setAutoSenderTasks(tasksRes);
      if (Array.isArray(scamRes)) setAutoSenderScamReports(scamRes);
      if (Array.isArray(trustedRes)) setAutoSenderTrustedPosts(trustedRes);
    } catch (e) {
      console.error('[DASHBOARD] Error fetching backend records:', e);
    } finally {
      setIsLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchLiveBackendRecords();
    const interval = setInterval(fetchLiveBackendRecords, 5000);
    return () => clearInterval(interval);
  }, []);

  // Compute 5 Real Dashboard Statistics
  const dashboardStats = useMemo(() => {
    const eligibleGroupsCount = autoSenderGroups.length > 0
      ? autoSenderGroups.filter(g => g.can_send !== false).length
      : groups.filter(g => g.is_active).length;

    let totalPostsSent = 0;
    let totalFailedSends = 0;
    let totalPendingSends = 0;
    let totalScheduledPosts = 0;

    autoSenderTasks.forEach(t => {
      totalPostsSent += t.sent_count || 0;
      totalFailedSends += t.failed_count || 0;
      totalPendingSends += t.pending_count || 0;
      if (t.status === 'SCHEDULED' || t.status === 'ACTIVE') {
        totalScheduledPosts++;
      }
    });

    autoSenderScamReports.forEach(r => {
      totalPostsSent += r.sent_count || 0;
      totalFailedSends += r.failed_count || 0;
      totalPendingSends += r.pending_count || 0;
    });

    autoSenderTrustedPosts.forEach(tp => {
      totalPostsSent += tp.sent_count || 0;
      totalFailedSends += tp.failed_count || 0;
      totalPendingSends += tp.pending_count || 0;
      if (tp.status === 'SCHEDULED' || tp.status === 'ACTIVE') {
        totalScheduledPosts++;
      }
    });

    return {
      totalEligibleGroups: eligibleGroupsCount,
      totalPostsSent,
      totalFailedSends,
      totalPendingSends,
      totalScheduledPosts
    };
  }, [autoSenderGroups, groups, autoSenderTasks, autoSenderScamReports, autoSenderTrustedPosts]);

  const handleQuickActivate = async () => {
    if (!renewKey.trim()) return;
    try {
      setIsActivating(true);
      setActivationMsg(null);
      const res = await fetch('/api/reseller/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: renewKey.trim().toUpperCase() })
      });
      const data = await res.json();
      if (data.success) {
        setActivationMsg({ success: true, text: `Key activated! ACTIVE — ${data.license.remaining_days} Days Remaining.` });
        setRenewKey('');
        if (onRefreshGlobal) onRefreshGlobal();
      } else {
        setActivationMsg({ success: false, text: data.error || 'Invalid license key.' });
      }
    } catch (e: any) {
      setActivationMsg({ success: false, text: e.message });
    } finally {
      setIsActivating(false);
    }
  };

  const isMasterAdmin = !resellerStatus || resellerStatus.is_master_admin;
  const isLicenseActive = resellerStatus && resellerStatus.is_active_license;
  const isLicenseExpired = resellerStatus && resellerStatus.status_label === 'EXPIRED';
  const showWhatsAppCenter = isMasterAdmin || Boolean(resellerStatus?.has_whatsapp_center);

  const stats = status?.stats || {
    active_groups: 0,
    total_groups: 0,
    total_members: 0,
    warnings_today: 0,
    kicks_today: 0,
    total_kicks: 0,
    blacklist_count: 0,
    reviews_count: 0
  };

  const isConnected = status?.status === 'CONNECTED';
  const isRecovering = status?.status === 'CONNECTING' || status?.workerStatus === 'RECOVERING';
  const hasSession = Boolean(isConnected || isRecovering || status?.profile || status?.botPhone);
  const profile = status?.profile;

  const filteredLogs = activityLogs.filter(log => {
    if (filterLevel === 'ALL') return true;
    return log.level === filterLevel;
  }).slice(0, 8);

  const getLogBadge = (level: string) => {
    switch (level) {
      case 'WARNING_ISSUED':
        return { bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20', icon: AlertTriangle, label: 'Warning' };
      case 'KICK_EXECUTED':
        return { bg: 'bg-rose-500/10 text-rose-400 border-rose-500/20', icon: UserX, label: 'Kick' };
      case 'ACTION_SUCCESS':
        return { bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: ShieldCheck, label: 'Success' };
      default:
        return { bg: 'bg-slate-800 text-slate-300 border-slate-700', icon: Activity, label: 'Info' };
    }
  };

  return (
    <div className="w-full space-y-8 max-w-[1600px] mx-auto pb-12">
      {/* LICENSE / ACCOUNT STATUS BANNER */}
      {resellerStatus && (
        <div className={`p-5 sm:p-6 rounded-3xl border shadow-xl relative overflow-hidden transition-all ${
          isMasterAdmin
            ? 'bg-gradient-to-r from-indigo-950/70 via-slate-900 to-slate-900 border-indigo-500/30'
            : isLicenseActive
            ? 'bg-gradient-to-r from-emerald-950/70 via-slate-900 to-slate-900 border-emerald-500/40 shadow-emerald-500/5'
            : 'bg-gradient-to-r from-rose-950/80 via-slate-900 to-slate-900 border-rose-500/40 shadow-rose-500/5'
        }`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
                isMasterAdmin
                  ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
                  : isLicenseActive
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
              }`}>
                {isMasterAdmin ? (
                  <Shield className="w-6 h-6" />
                ) : isLicenseActive ? (
                  <ShieldCheck className="w-6 h-6" />
                ) : (
                  <ShieldAlert className="w-6 h-6" />
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Account Status:</span>
                  <span className={`text-xs font-black tracking-wider px-3 py-1 rounded-full border ${
                    isMasterAdmin
                      ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                      : isLicenseActive
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 animate-pulse'
                      : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  }`}>
                    {isMasterAdmin
                      ? '👑 MASTER ADMIN'
                      : isLicenseActive
                      ? `ACTIVE — ${resellerStatus.remaining_days} Days Remaining`
                      : 'EXPIRED'}
                  </span>

                  {!isMasterAdmin && resellerStatus.active_user && (
                    <span className="text-xs font-bold text-white bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
                      👤 {resellerStatus.active_user.username}
                    </span>
                  )}
                </div>

                <div className="text-xs text-slate-300 flex flex-wrap items-center gap-x-4 gap-y-1">
                  {isMasterAdmin ? (
                    <span>All bot moderation features, WhatsApp Auto Sender, Scam Report & Trusted Posts unlocked.</span>
                  ) : isLicenseActive ? (
                    <>
                      <span>📅 <strong>Activation Date:</strong> {resellerStatus.activation_date ? new Date(resellerStatus.activation_date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : 'Today'}</span>
                      <span>•</span>
                      <span>⏳ <strong>Expiry Date:</strong> {resellerStatus.expiry_date ? new Date(resellerStatus.expiry_date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : 'In 30 Days'}</span>
                      <span>•</span>
                      <span>🛡️ <strong>Allowed:</strong> {resellerStatus.allowed_features.length} Features {resellerStatus.has_whatsapp_center ? '+ WhatsApp Auto Sender' : ''}</span>
                    </>
                  ) : (
                    <span className="text-rose-300 font-bold">
                      Your license key has expired. Protected bot features are suspended until renewed.
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Expired / Renewal Quick Action */}
            {isLicenseExpired && (
              <div className="flex flex-col sm:flex-row items-center gap-2 shrink-0">
                <input
                  type="text"
                  placeholder="Enter New License Key..."
                  value={renewKey}
                  onChange={(e) => setRenewKey(e.target.value.toUpperCase())}
                  className="bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-full sm:w-60"
                />
                <button
                  onClick={handleQuickActivate}
                  disabled={isActivating || !renewKey.trim()}
                  className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
                >
                  {isActivating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                  <span>Renew License</span>
                </button>
              </div>
            )}
          </div>

          {activationMsg && (
            <div className={`mt-4 p-3 rounded-xl text-xs font-bold flex items-center gap-2.5 ${
              activationMsg.success
                ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                : 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
            }`}>
              {activationMsg.success ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />}
              <span>{activationMsg.text}</span>
            </div>
          )}
        </div>
      )}

      {/* Banner / Profile Card */}
      {hasSession ? (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800/90 to-slate-900 border border-slate-800 p-6 sm:p-8 shadow-2xl">
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-center space-x-5">
              {profile?.pictureUrl ? (
                <img
                  src={profile.pictureUrl}
                  alt={profile.name}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl object-cover border-2 border-emerald-500 shadow-xl"
                />
              ) : (
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center font-bold text-2xl text-white shadow-xl">
                  {(profile?.name || status?.botPhone || 'WA').slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className="space-y-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">{profile?.name || (status?.botPhone ? `+${status.botPhone}` : 'Connected WhatsApp Account')}</h1>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                    isConnected
                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 shadow-emerald-500/10 shadow'
                      : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                  }`}>
                    {isConnected ? '🟢 CONNECTED & RUNNING 24/7' : '🟠 AUTO-RECONNECTING (VPS)'}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-lg text-xs font-mono text-slate-400 bg-slate-950 border border-slate-800">
                    Console v{status?.version || 'A2-4'}
                  </span>
                </div>
                <div className="text-xs sm:text-sm text-slate-300 font-mono mt-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span>📱 <strong>Connected WhatsApp:</strong> <span className="text-white font-bold">+{profile?.phone || status?.botPhone}</span></span>
                    <span>•</span>
                    <span>🖥️ <strong>Worker Runtime:</strong> 24/7 VPS Background Daemon</span>
                    <span>•</span>
                    <span className="text-emerald-400">🔄 <strong>Watchdog:</strong> ACTIVE</span>
                  </div>
                  <div className="text-slate-400 text-xs flex flex-wrap items-center gap-x-4 gap-y-0.5 pt-0.5">
                    <span>🔄 <strong>Last Sync:</strong> {profile?.connectedAt ? new Date(profile.connectedAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Active'}</span>
                    <span>•</span>
                    <span>📊 <strong>Active Groups:</strong> {dashboardStats.totalEligibleGroups} Verified Groups</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3 shrink-0 flex-wrap gap-y-2">
              <button
                onClick={() => onNavigate('auto-sender')}
                className="px-5 py-3 bg-[#25D366] hover:bg-[#20bd5a] text-slate-950 font-black text-xs sm:text-sm rounded-2xl shadow-lg shadow-[#25D366]/20 transition-all flex items-center space-x-2 cursor-pointer"
                title="Open WhatsApp Auto Sender & Broadcast Dashboard"
              >
                <Send className="w-4 h-4 fill-current" />
                <span>WhatsApp Auto Sender</span>
              </button>
              <button
                onClick={() => onNavigate('simulator')}
                className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs sm:text-sm rounded-2xl border border-slate-700 transition-all flex items-center space-x-2"
              >
                <Zap className="w-4 h-4 text-emerald-400" />
                <span>Testing Studio</span>
              </button>
              <button
                onClick={() => onNavigate('connection')}
                className="px-4 py-3 bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold text-xs sm:text-sm rounded-2xl border border-slate-800 transition-all"
              >
                View Session
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-800 p-8 shadow-2xl">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold uppercase tracking-wider font-mono">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
                <span>🟡 WhatsApp Account Not Linked</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Connect WhatsApp to Activate 24/7 Automation
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
                Scan the QR code or request an 8-digit pairing code to link your WhatsApp account. All auto posts, scam reports, trusted entity dispatches, and real group member management operate in the 24/7 cloud background.
              </p>
            </div>

            <div className="flex items-center space-x-3 shrink-0">
              <button
                onClick={() => onNavigate('connection')}
                className="px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm rounded-2xl shadow-xl shadow-emerald-500/20 transition-all flex items-center space-x-2"
              >
                <Zap className="w-4 h-4 fill-current" />
                <span>Scan QR Code to Connect</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 5 MAIN ENLARGED DASHBOARD STATISTIC CARDS (RESPONSIVE GRID) */}
      {/* ======================================================== */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-400" />
            Live Delivery & Marketing Metrics
          </h2>
          <span className="text-xs text-slate-400 font-mono">
            {isLoadingStats ? 'Syncing...' : 'Real Backend Data'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
          {/* Card 1: Total Eligible Groups */}
          <div
            onClick={() => onNavigate('auto-sender')}
            className="bg-slate-900/90 hover:border-emerald-500/50 cursor-pointer transition-all rounded-3xl p-6 border border-slate-800 shadow-xl group relative overflow-hidden flex flex-col justify-between min-h-[160px]"
          >
            <div className="flex items-start justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Eligible Groups</span>
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 group-hover:scale-110 transition-transform shadow-inner">
                <Users className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-3xl sm:text-4xl font-black text-white tabular-nums tracking-tight">
                {dashboardStats.totalEligibleGroups}
              </div>
              <div className="mt-2 flex items-center text-xs text-emerald-400 font-bold">
                <span>Real verified groups</span>
                <ChevronRight className="w-4 h-4 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          </div>

          {/* Card 2: Total Posts Sent */}
          <div
            onClick={() => onNavigate('auto-sender')}
            className="bg-slate-900/90 hover:border-cyan-500/50 cursor-pointer transition-all rounded-3xl p-6 border border-slate-800 shadow-xl group relative overflow-hidden flex flex-col justify-between min-h-[160px]"
          >
            <div className="flex items-start justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Posts Sent</span>
              <div className="p-3.5 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/25 group-hover:scale-110 transition-transform shadow-inner">
                <Send className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-3xl sm:text-4xl font-black text-white tabular-nums tracking-tight">
                {dashboardStats.totalPostsSent}
              </div>
              <div className="mt-2 flex items-center text-xs text-cyan-400 font-bold">
                <span>Delivered to groups</span>
                <ChevronRight className="w-4 h-4 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          </div>

          {/* Card 3: Total Failed Sends */}
          <div
            onClick={() => onNavigate('auto-sender')}
            className="bg-slate-900/90 hover:border-rose-500/50 cursor-pointer transition-all rounded-3xl p-6 border border-slate-800 shadow-xl group relative overflow-hidden flex flex-col justify-between min-h-[160px]"
          >
            <div className="flex items-start justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Failed Sends</span>
              <div className="p-3.5 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/25 group-hover:scale-110 transition-transform shadow-inner">
                <AlertTriangle className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-3xl sm:text-4xl font-black text-rose-400 tabular-nums tracking-tight">
                {dashboardStats.totalFailedSends}
              </div>
              <div className="mt-2 flex items-center text-xs text-rose-400 font-bold">
                <span>Failed / Ready to retry</span>
                <ChevronRight className="w-4 h-4 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          </div>

          {/* Card 4: Total Pending Sends */}
          <div
            onClick={() => onNavigate('auto-sender')}
            className="bg-slate-900/90 hover:border-amber-500/50 cursor-pointer transition-all rounded-3xl p-6 border border-slate-800 shadow-xl group relative overflow-hidden flex flex-col justify-between min-h-[160px]"
          >
            <div className="flex items-start justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Pending Sends</span>
              <div className="p-3.5 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/25 group-hover:scale-110 transition-transform shadow-inner">
                <Clock className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-3xl sm:text-4xl font-black text-amber-400 tabular-nums tracking-tight">
                {dashboardStats.totalPendingSends}
              </div>
              <div className="mt-2 flex items-center text-xs text-amber-400 font-bold">
                <span>Queued in background buffer</span>
                <ChevronRight className="w-4 h-4 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          </div>

          {/* Card 5: Total Scheduled Posts */}
          <div
            onClick={() => onNavigate('auto-sender')}
            className="bg-slate-900/90 hover:border-purple-500/50 cursor-pointer transition-all rounded-3xl p-6 border border-slate-800 shadow-xl group relative overflow-hidden flex flex-col justify-between min-h-[160px]"
          >
            <div className="flex items-start justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Scheduled Posts</span>
              <div className="p-3.5 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/25 group-hover:scale-110 transition-transform shadow-inner">
                <Calendar className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-3xl sm:text-4xl font-black text-purple-300 tabular-nums tracking-tight">
                {dashboardStats.totalScheduledPosts}
              </div>
              <div className="mt-2 flex items-center text-xs text-purple-400 font-bold">
                <span>Active 24/7 cloud schedules</span>
                <ChevronRight className="w-4 h-4 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* QUICK LAUNCH & MODULE SHORTCUTS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div
          onClick={() => onNavigate('auto-sender')}
          className="bg-gradient-to-br from-slate-900 to-slate-950 p-6 rounded-3xl border border-slate-800 hover:border-emerald-500/40 transition-all cursor-pointer shadow-lg group space-y-3"
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Send className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors">Auto Post Sender</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Multi-time automated recurring post schedules with strict group targeting and live interval calculation.
          </p>
        </div>

        <div
          onClick={() => onNavigate('auto-sender')}
          className="bg-gradient-to-br from-slate-900 to-slate-950 p-6 rounded-3xl border border-slate-800 hover:border-rose-500/40 transition-all cursor-pointer shadow-lg group space-y-3"
        >
          <div className="w-12 h-12 rounded-2xl bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Megaphone className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white group-hover:text-rose-300 transition-colors">Scam Report Alerts</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Broadcast fraud warnings with evidence files and revoke/delete sent messages across groups when resolved.
          </p>
        </div>

        <div
          onClick={() => onNavigate('auto-sender')}
          className="bg-gradient-to-br from-slate-900 to-slate-950 p-6 rounded-3xl border border-slate-800 hover:border-indigo-500/40 transition-all cursor-pointer shadow-lg group space-y-3"
        >
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Award className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors">Trusted Entity Posts</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Official recommendations and verified business announcements with authenticity badge and audio notes.
          </p>
        </div>

        <div
          onClick={() => onNavigate('auto-sender')}
          className="bg-gradient-to-br from-slate-900 to-slate-950 p-6 rounded-3xl border border-slate-800 hover:border-cyan-500/40 transition-all cursor-pointer shadow-lg group space-y-3"
        >
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">Group Excel Export</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            1-click export of verified real group member numbers and profile names directly to formatted .xlsx files.
          </p>
        </div>
      </div>

      {/* Main Grid: Groups & Live Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Moderated Groups with Real Status */}
        <div className="space-y-6 lg:col-span-1">
          <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-2.5">
                <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                <h3 className="text-sm font-bold text-white">Active WhatsApp Groups</h3>
              </div>
              <button
                onClick={() => onNavigate('groups')}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-bold"
              >
                Manage All
              </button>
            </div>

            <div className="mt-4 space-y-2.5">
              {groups.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-xs">
                  {isConnected ? 'No groups found. Join a group or add via invite link.' : 'Connect WhatsApp to automatically load your groups.'}
                </div>
              ) : (
                groups.slice(0, 6).map((g) => {
                  const isGroupActive = g.is_active && isConnected;
                  const isGroupRecovering = g.is_active && (status?.workerStatus === 'RECOVERING' || status?.status === 'CONNECTING');

                  return (
                    <div
                      key={g.jid}
                      onClick={() => onNavigate('groups')}
                      className="p-3 bg-slate-950/60 hover:bg-slate-800 rounded-2xl border border-slate-800 flex items-center justify-between cursor-pointer transition-colors"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="text-xs font-bold text-white truncate">{g.name}</div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5 font-mono">
                          <span className="tabular-nums">{g.member_count} members</span>
                          <span>•</span>
                          <span className="text-emerald-400">Anti-link Protected</span>
                        </div>
                      </div>
                      <span
                        className={`px-2.5 py-1 text-[10px] font-bold rounded-full border shrink-0 ${
                          isGroupActive
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : isGroupRecovering
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        {isGroupActive ? '🟢 ACTIVE' : isGroupRecovering ? '🟠 RECOVERING' : '🔴 INACTIVE'}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Live Activity Feed */}
        <div className="lg:col-span-2 bg-slate-900 rounded-3xl border border-slate-800 p-6 shadow-xl flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Live Activity Stream
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time log of deliveries, infractions, kicks, and 24/7 background worker events.
              </p>
            </div>

            {/* Filter */}
            <div className="flex items-center space-x-1 bg-slate-950 p-1.5 rounded-xl border border-slate-800 text-xs">
              {(['ALL', 'WARNING_ISSUED', 'KICK_EXECUTED', 'INFO'] as const).map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setFilterLevel(lvl)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    filterLevel === lvl
                      ? 'bg-emerald-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {lvl === 'ALL' ? 'All' : lvl === 'WARNING_ISSUED' ? 'Warnings' : lvl === 'KICK_EXECUTED' ? 'Kicks' : 'Events'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/80 mt-3 min-h-[320px]">
            {filteredLogs.length === 0 ? (
              <div className="py-16 text-center text-slate-500 text-xs">
                No activity logs recorded yet. Events stream in as the bot processes group dispatches.
              </div>
            ) : (
              filteredLogs.map((log) => {
                const badge = getLogBadge(log.level);
                const BadgeIcon = badge.icon;
                const timeString = new Date(log.created_at).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit'
                });

                return (
                  <div key={log.id} className="py-3.5 flex items-start space-x-3.5 hover:bg-slate-800/40 px-3 rounded-xl transition-colors">
                    <div className={`p-2.5 rounded-xl ${badge.bg} shrink-0 mt-0.5 border`}>
                      <BadgeIcon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-white tracking-tight">
                          {log.event_type.replace(/_/g, ' ')}
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono tabular-nums">{timeString}</span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">{log.details}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
