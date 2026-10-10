import React, { useState, useEffect } from 'react';
import {
  Users,
  Key,
  Calendar,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  Copy,
  ExternalLink,
  RefreshCw,
  Trash2,
  Ban,
  Plus,
  Sliders,
  Sparkles,
  Zap,
  Check,
  Search,
  MessageCircle,
  HelpCircle,
  Clock,
  ArrowRight,
  Shield,
  Layers,
  Lock,
  Unlock,
  AlertTriangle
} from 'lucide-react';
import { ResellerLicenseUser, ResellerState } from '../types';

interface ResellerPanelViewProps {
  onSelectTab?: (tab: string) => void;
  onRefreshGlobal?: () => void;
  status?: any;
  onPreviewCustomer?: (key: string) => void;
}

export const GROUP_CONTROL_SUB_FEATURES = [
  { id: 'dashboard', name: 'Dashboard', desc: 'Main control overview, live stats, and bot summary' },
  { id: 'message-status', name: 'Message Status', desc: '24/7 background engine health & status report' },
  { id: 'group-manager', name: 'Group Manager Status', desc: 'Active moderated groups overview and settings' },
  { id: 'broadcast', name: 'Broadcast Message', desc: 'Mass dispatch announcements across groups' },
  { id: 'members', name: 'Member Administration', desc: 'Full member audit, strikes, and identity records' },
  { id: 'advertisement', name: 'Advertisement', desc: 'WhatsApp stories and scheduled promotional tasks' },
  { id: 'warnings', name: 'Warning', desc: 'Warning strikes ledger and manual strikes issuance' },
  { id: 'kicks', name: 'Kick', desc: 'Automatic & manual member expulsion management' },
  { id: 'blacklist', name: 'Blacklist', desc: 'Fraud and scam number permanent ban list' },
  { id: 'region-control', name: 'Region Control', desc: 'Data protection snapshot and region recovery vault' },
  { id: 'terminals', name: 'Terminals', desc: 'Live command terminal and diagnostic logs' },
  { id: 'tester', name: 'Tester', desc: 'Live event testing and rule validator' },
  { id: 'pons', name: 'Pons/Proons', desc: 'Trust, seller reviews, and reputation badges' },
  { id: 'groups', name: 'Group', desc: 'Group chat locking, rules, and participant sync' },
  { id: 'simulator', name: 'Test Studio', desc: 'Interactive group command and message simulator' }
];

export const ResellerPanelView: React.FC<ResellerPanelViewProps> = ({ onSelectTab, onRefreshGlobal, status, onPreviewCustomer }) => {
  const [licenses, setLicenses] = useState<ResellerLicenseUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'PENDING' | 'EXPIRED'>('ALL');
  const [resellerStatus, setResellerStatus] = useState<ResellerState | null>(null);

  // Form State for Add New User
  const [username, setUsername] = useState<string>('');
  const [planMonths, setPlanMonths] = useState<number>(1);
  const [hasWhatsAppCenter, setHasWhatsAppCenter] = useState<boolean>(true);
  const [hasGroupControl, setHasGroupControl] = useState<boolean>(true);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([
    'dashboard',
    'message-status',
    'group-manager',
    'broadcast',
    'members',
    'advertisement',
    'warnings',
    'kicks',
    'blacklist',
    'region-control',
    'terminals',
    'tester',
    'pons',
    'groups',
    'simulator'
  ]);
  const [notes, setNotes] = useState<string>('');
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [isOwnerLink, setIsOwnerLink] = useState<boolean>(false);
  const [createSuccessKey, setCreateSuccessKey] = useState<ResellerLicenseUser | null>(null);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);

  // Key Activation Box State
  const [inputKey, setInputKey] = useState<string>('');
  const [isActivating, setIsActivating] = useState<boolean>(false);
  const [activationFeedback, setActivationFeedback] = useState<{ success: boolean; msg: string } | null>(null);

  const fetchLicensesAndStatus = async () => {
    try {
      setLoading(true);
      const [resLic, resStat] = await Promise.all([
        fetch('/api/reseller/licenses').then(r => r.json()).catch(() => null),
        fetch('/api/reseller/status').then(r => r.json()).catch(() => null)
      ]);

      if (resLic && Array.isArray(resLic.licenses)) {
        setLicenses(resLic.licenses);
      }
      if (resStat) {
        setResellerStatus(resStat);
      }
    } catch (e) {
      console.error('Error fetching reseller data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLicensesAndStatus();
    const interval = setInterval(fetchLicensesAndStatus, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleFeature = (featureId: string) => {
    setSelectedFeatures(prev => {
      if (prev.includes(featureId)) {
        return prev.filter(f => f !== featureId);
      } else {
        return [...prev, featureId];
      }
    });
  };

  const handleSelectAllFeatures = () => {
    setSelectedFeatures(GROUP_CONTROL_SUB_FEATURES.map(f => f.id));
  };

  const handleDeselectAllFeatures = () => {
    setSelectedFeatures([]);
  };

  const handleCreateUserKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      alert('Please enter a User Name.');
      return;
    }

    try {
      setIsCreating(true);
      setCreateSuccessKey(null);

      const payload = {
        username: username.trim(),
        plan_months: planMonths,
        has_whatsapp_center: hasWhatsAppCenter,
        has_group_control: hasGroupControl,
        allowed_features: hasGroupControl ? selectedFeatures : [],
        notes,
        is_owner_link: isOwnerLink
      };

      const res = await fetch('/api/reseller/licenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success && data.license) {
        setCreateSuccessKey(data.license);
        setUsername('');
        setNotes('');
        await fetchLicensesAndStatus();
      } else {
        alert(data.error || 'Failed to generate key.');
      }
    } catch (e: any) {
      alert(`Error creating user key: ${e.message}`);
    } finally {
      setIsCreating(false);
    }
  };

  const handleActivateKey = async () => {
    if (!inputKey.trim()) {
      alert('Please enter a License Key to activate.');
      return;
    }

    try {
      setIsActivating(true);
      setActivationFeedback(null);

      const res = await fetch('/api/reseller/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: inputKey.trim() })
      });
      const data = await res.json();

      if (data.success && data.license) {
        setActivationFeedback({
          success: true,
          msg: `Account Activated Successfully! Status: ACTIVE — ${data.license.remaining_days} Days Remaining.`
        });
        await fetchLicensesAndStatus();
        if (onRefreshGlobal) onRefreshGlobal();
      } else {
        setActivationFeedback({
          success: false,
          msg: data.error || 'Invalid or expired license key.'
        });
      }
    } catch (e: any) {
      setActivationFeedback({
        success: false,
        msg: `Activation error: ${e.message}`
      });
    } finally {
      setIsActivating(false);
    }
  };

  const handleSwitchToMasterAdmin = async () => {
    try {
      await fetch('/api/reseller/switch-mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'MASTER' })
      });
      setInputKey('');
      setActivationFeedback({
        success: true,
        msg: 'Switched to Master Admin Mode (Full Access).'
      });
      await fetchLicensesAndStatus();
      if (onRefreshGlobal) onRefreshGlobal();
    } catch (_) {}
  };

  const handleRevokeKey = async (id: string) => {
    if (!window.confirm('Are you sure you want to revoke this license key? The user will lose access immediately.')) return;
    try {
      await fetch(`/api/reseller/licenses/${id}/revoke`, { method: 'POST' });
      await fetchLicensesAndStatus();
    } catch (e) {
      console.error('Error revoking key:', e);
    }
  };

  const handleDeleteKey = async (id: string) => {
    if (!window.confirm('Permanently delete this user license record?')) return;
    try {
      await fetch(`/api/reseller/licenses/${id}`, { method: 'DELETE' });
      await fetchLicensesAndStatus();
    } catch (e) {
      console.error('Error deleting key:', e);
    }
  };

  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopySuccess(label);
    setTimeout(() => setCopySuccess(null), 2500);
  };

  const getPublicOrigin = () => {
    if (status?.publicAppUrl && status.publicAppUrl.trim()) {
      return status.publicAppUrl.trim().replace(/\/$/, '');
    }
    if (typeof window !== 'undefined' && window.location) {
      const orig = window.location.origin;
      if (orig && orig !== 'null' && orig !== 'about:blank') {
        return orig.replace(/\/$/, '');
      }
    }
    return '';
  };

  const resellerLinkUrl = `${getPublicOrigin()}/reseller`;
  const getCustomerLinkUrl = (key: string) => {
    const origin = getPublicOrigin();
    return origin ? `${origin}/customer/${key}` : `/customer/${key}`;
  };

  const filteredLicenses = licenses.filter(l => {
    const matchesQuery = !searchQuery ||
      l.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.key.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesQuery) return false;
    if (statusFilter === 'ALL') return true;
    return l.status === statusFilter;
  });

  const activeCount = licenses.filter(l => l.status === 'ACTIVE').length;
  const expiredCount = licenses.filter(l => l.status === 'EXPIRED').length;
  const pendingCount = licenses.filter(l => l.status === 'PENDING').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans">
      {/* Top Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/60 to-purple-950/40 p-6 rounded-2xl border border-indigo-500/30 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shadow-lg shadow-indigo-500/20">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-xl font-bold text-white tracking-tight">
                    Reseller Panel Admin & License Management
                  </h1>
                  <span className="text-xs uppercase font-extrabold px-3 py-1 rounded-full border bg-indigo-500/20 text-indigo-300 border-indigo-400/40 shadow-sm flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Master Admin System</span>
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  Generate isolated licenses with custom monthly plans and exact allowed features for Group Control and WhatsApp Center.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={fetchLicensesAndStatus}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 text-xs flex items-center gap-1.5 transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Dedicated Reseller Link (Link #1) Bar */}
        <div className="mt-5 pt-4 border-t border-indigo-500/20 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 px-2.5 py-1 rounded-lg font-mono font-bold shrink-0">
              LINK #1 — RESELLER LINK
            </span>
            <div className={`text-xs truncate font-mono bg-slate-950/70 border px-3 py-1.5 rounded-lg flex-1 sm:w-80 ${getPublicOrigin() ? 'text-slate-300 border-indigo-500/30' : 'text-amber-400 border-amber-500/30'}`}>
              {getPublicOrigin() ? resellerLinkUrl : '⚠️ Configure Public App URL in Bot Settings first!'}
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            <button
              onClick={() => {
                if (!getPublicOrigin()) {
                  alert('Please configure Owner Link / Public App URL in Bot Settings first!');
                  return;
                }
                handleCopyText(resellerLinkUrl, 'reseller_link');
              }}
              className="flex-1 sm:flex-none px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 font-bold text-xs rounded-xl transition-all border border-slate-700 flex items-center justify-center gap-1.5 cursor-pointer"
              title="Copy the public Reseller Link URL"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copySuccess === 'reseller_link' ? 'Link Copied!' : 'Copy Reseller Link'}</span>
            </button>

            <a
              href={getPublicOrigin() ? resellerLinkUrl : '#'}
              onClick={(e) => {
                if (!getPublicOrigin()) {
                  e.preventDefault();
                  alert('Please configure Owner Link / Public App URL in Bot Settings first!');
                }
              }}
              target={getPublicOrigin() ? "_blank" : undefined}
              rel="noopener noreferrer"
              className="flex-1 sm:flex-none px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-1.5 cursor-pointer border border-indigo-400/40"
              title="Open the public Reseller Link with License-First Key Activation Portal"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open Reseller Link</span>
            </a>
          </div>
        </div>
      </div>

      {/* Top Key / License Activation Input Bar */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-bold text-white">Online Key / License Activation Box</h2>
            <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
              Client & Reseller Portal
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Current Session:</span>
            <span className={`font-bold font-mono px-2 py-0.5 rounded text-[11px] ${
              resellerStatus?.is_master_admin
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : resellerStatus?.is_active_license
                ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
            }`}>
              {resellerStatus?.is_master_admin
                ? '👑 MASTER ADMIN (All Unlocked)'
                : resellerStatus?.is_active_license
                ? `ACTIVE — ${resellerStatus.remaining_days} Days Remaining (${resellerStatus.active_user?.username})`
                : 'EXPIRED / NO KEY'}
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Key className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Enter License Key (e.g. MDZ-LIC-XXXX-XXXX-XXXX)..."
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value.toUpperCase())}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm font-mono text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 shadow-inner"
            />
          </div>

          <button
            onClick={handleActivateKey}
            disabled={isActivating || !inputKey.trim()}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            {isActivating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            <span>Activate Key</span>
          </button>

          <a
            href="https://wa.me/923001234567?text=Hello%20Support,%20I%20need%20assistance%20with%20my%20license%20key"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-all border border-slate-700 flex items-center justify-center gap-2 shrink-0"
          >
            <HelpCircle className="w-4 h-4 text-emerald-400" />
            <span>Support</span>
          </a>
        </div>

        {activationFeedback && (
          <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
            activationFeedback.success
              ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
              : 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
          }`}>
            {activationFeedback.success ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />}
            <span>{activationFeedback.msg}</span>
          </div>
        )}
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Total Generated Users</span>
            <div className="text-2xl font-bold text-white font-mono">
              {licenses.length}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Active Accounts</span>
            <div className="text-2xl font-bold text-emerald-400 font-mono">
              {activeCount}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Pending Activation</span>
            <div className="text-2xl font-bold text-amber-400 font-mono">
              {pendingCount}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Expired Licenses</span>
            <div className="text-2xl font-bold text-rose-400 font-mono">
              {expiredCount}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Add New User & Allow Features Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-indigo-400" />
              <span>Add New User & Generate License Key</span>
            </h2>
            <p className="text-xs text-slate-400">
              Configure user details, monthly validity plan, and custom allowed feature permissions.
            </p>
          </div>

          <span className="text-xs font-mono text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full self-start">
            Permission Isolation Active
          </span>
        </div>

        <form onSubmit={handleCreateUserKey} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* User Name Input */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-200 block">
                User Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. VIP Trader Alpha, Client 923001234567..."
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Monthly Plan Selector (1, 2, 3, 6, 12 Months) */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-200 block">
                Monthly Plan Selector <span className="text-rose-400">*</span>
              </label>
              <div className="grid grid-cols-5 gap-2">
                {[
                  { months: 1, label: '1 Month', days: '30 Days' },
                  { months: 2, label: '2 Months', days: '60 Days' },
                  { months: 3, label: '3 Months', days: '90 Days' },
                  { months: 6, label: '6 Months', days: '180 Days' },
                  { months: 12, label: '12 Months', days: '365 Days' }
                ].map((p) => {
                  const isSelected = planMonths === p.months;
                  return (
                    <button
                      key={p.months}
                      type="button"
                      onClick={() => setPlanMonths(p.months)}
                      className={`py-2 px-1 rounded-xl text-center border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/20 font-bold scale-[1.02]'
                          : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border-slate-800 text-xs'
                      }`}
                    >
                      <div className="text-xs font-bold">{p.label}</div>
                      <div className="text-[10px] opacity-75">{p.days}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ALLOW FEATURES SYSTEM */}
          <div className="space-y-4 pt-2 border-t border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>ALLOW FEATURES SYSTEM (Access Control)</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Select which features this user is permitted to access. Unselected features are completely hidden and blocked in backend.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSelectAllFeatures}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] font-medium transition-colors"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={handleDeselectAllFeatures}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] font-medium transition-colors"
                >
                  Deselect All
                </button>
              </div>
            </div>

            {/* Separate Primary Permission: WhatsApp Center */}
            <div className={`p-4 rounded-xl border transition-all ${
              hasWhatsAppCenter
                ? 'bg-[#25D366]/10 border-[#25D366]/30 text-white'
                : 'bg-slate-950 border-slate-800 text-slate-400'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                    hasWhatsAppCenter ? 'bg-[#25D366]/20 text-[#25D366]' : 'bg-slate-800 text-slate-500'
                  }`}>
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-2">
                      <span>WhatsApp Center (Auto Sender & Multi-Account Engine)</span>
                      {hasWhatsAppCenter && (
                        <span className="text-[10px] bg-[#25D366]/20 text-[#25D366] px-2 py-0.5 rounded font-bold">
                          ALLOWED
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Enables full WhatsApp Center button, QR scanner, and auto post mass dispatcher on VPS.
                    </p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasWhatsAppCenter}
                    onChange={(e) => setHasWhatsAppCenter(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#25D366]"></div>
                </label>
              </div>
            </div>

            {/* GROUP CONTROL SECTION */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                <div className="flex items-center gap-2.5">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-bold text-white">GROUP CONTROL SUB-FEATURES</span>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasGroupControl}
                    onChange={(e) => setHasGroupControl(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              {hasGroupControl ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
                  {GROUP_CONTROL_SUB_FEATURES.map((feat) => {
                    const isChecked = selectedFeatures.includes(feat.id);
                    return (
                      <div
                        key={feat.id}
                        onClick={() => handleToggleFeature(feat.id)}
                        className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-start gap-2.5 ${
                          isChecked
                            ? 'bg-indigo-500/10 border-indigo-500/30 text-white shadow-sm'
                            : 'bg-slate-900 border-slate-800/80 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center shrink-0 border ${
                          isChecked ? 'bg-indigo-600 border-indigo-400 text-white' : 'border-slate-700 bg-slate-950'
                        }`}>
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <div className="space-y-0.5 min-w-0">
                          <div className={`font-bold text-xs truncate ${isChecked ? 'text-white' : 'text-slate-300'}`}>
                            {feat.name}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate">
                            {feat.desc}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-4 text-xs text-slate-500">
                  Group Control is disabled for this user. No group moderation features will be accessible.
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-slate-800">
            <div className="text-xs text-slate-400">
              Selected Validity: <strong className="text-white">{planMonths} Month(s) ({planMonths === 1 ? '30' : planMonths === 2 ? '60' : planMonths === 3 ? '90' : planMonths === 6 ? '180' : '365'} Days)</strong> • Allowed Features: <strong className="text-indigo-400">{(hasGroupControl ? selectedFeatures.length : 0) + (hasWhatsAppCenter ? 1 : 0)} Active</strong>
            </div>

            <button
              type="submit"
              disabled={isCreating}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isCreating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
              <span>Generate Working License Key</span>
            </button>
          </div>
        </form>

        {/* Newly Created Key Alert Box */}
        {createSuccessKey && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-3 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Working License Key Generated Successfully!</span>
              </span>
              <span className="text-[10px] font-mono text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded">
                Valid for {createSuccessKey.plan_months} Month(s) ({createSuccessKey.plan_days} Days)
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 bg-slate-950 p-3 rounded-lg border border-slate-800">
              <div className="font-mono text-sm sm:text-base font-extrabold text-white flex-1 tracking-wider text-center sm:text-left">
                {createSuccessKey.key}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopyText(createSuccessKey.key, 'created_key')}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copySuccess === 'created_key' ? 'Copied!' : 'Copy Key'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setInputKey(createSuccessKey.key);
                    handleActivateKey();
                  }}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Test Activate</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Key / License Management Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Key className="w-4 h-4 text-amber-400" />
              <span>Key / License Management Ledger</span>
            </h3>
            <p className="text-xs text-slate-400">
              All generated user licenses with live activation, remaining days, and permission records.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Filter Pills */}
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              {(['ALL', 'ACTIVE', 'PENDING', 'EXPIRED'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setStatusFilter(filter)}
                  className={`px-3 py-1 rounded-lg font-bold transition-all text-[11px] ${
                    statusFilter === filter
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search username or key..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-44 sm:w-56"
              />
            </div>
          </div>
        </div>

        {filteredLicenses.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center mx-auto text-slate-600">
              <Key className="w-6 h-6 text-slate-500" />
            </div>
            <div className="text-sm font-bold text-white">No License Keys Found</div>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Use the Add New User form above to create working keys with custom duration and permissions.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">User Name</th>
                  <th className="py-3 px-4">License Key</th>
                  <th className="py-3 px-4">Plan / Validity</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Expiry Date</th>
                  <th className="py-3 px-4">Allowed Features</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredLicenses.map((lic) => {
                  const isActive = lic.status === 'ACTIVE';
                  const isExpired = lic.status === 'EXPIRED';
                  const isPending = lic.status === 'PENDING';
                  const isRevoked = lic.status === 'REVOKED';

                  return (
                    <tr key={lic.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-white whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs">
                            {lic.username.slice(0, 2).toUpperCase()}
                          </div>
                          <span>{lic.username}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-white whitespace-nowrap">
                        <div className="flex items-center gap-2 bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800/80 w-fit">
                          <span className="tracking-wide text-xs">{lic.key}</span>
                          <button
                            onClick={() => handleCopyText(lic.key, `key-${lic.id}`)}
                            className="text-slate-400 hover:text-emerald-400 transition-colors p-0.5"
                            title="Copy License Key"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-medium text-slate-200">{lic.plan_months} Month(s)</div>
                        <div className="text-[10px] text-slate-400">{lic.plan_days} Days Total</div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border inline-flex items-center gap-1 ${
                          isActive
                            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                            : isPending
                            ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                            : isRevoked
                            ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            isActive ? 'bg-emerald-400 animate-pulse' : isPending ? 'bg-amber-400' : 'bg-rose-400'
                          }`}></span>
                          <span>
                            {isActive
                              ? `ACTIVE (${lic.remaining_days}d left)`
                              : isPending
                              ? 'PENDING'
                              : isRevoked
                              ? 'REVOKED'
                              : 'EXPIRED'}
                          </span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                        {lic.expires_at ? (
                          <>
                            <div>{new Date(lic.expires_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                            <div className="text-[10px] text-slate-500">{new Date(lic.expires_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                          </>
                        ) : (
                          <span className="text-slate-500">Upon First Activation</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap max-w-xs">
                          {lic.has_whatsapp_center && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#25D366]/15 text-[#25D366] border border-[#25D366]/30">
                              WhatsApp Center
                            </span>
                          )}
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                            {lic.allowed_features.length} Features
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setInputKey(lic.key);
                              handleActivateKey();
                            }}
                            className="p-1.5 bg-slate-800 hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-400 rounded-lg border border-slate-700 hover:border-emerald-500/30 transition-colors"
                            title="Activate Key on Dashboard"
                          >
                            <Zap className="w-3.5 h-3.5" />
                          </button>

                          {lic.status !== 'REVOKED' && (
                            <button
                              onClick={() => handleRevokeKey(lic.id)}
                              className="p-1.5 bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 rounded-lg border border-slate-700 hover:border-rose-500/30 transition-colors"
                              title="Revoke License"
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            onClick={() => handleDeleteKey(lic.id)}
                            className="p-1.5 bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 rounded-lg border border-slate-700 hover:border-rose-500/30 transition-colors"
                            title="Delete Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
