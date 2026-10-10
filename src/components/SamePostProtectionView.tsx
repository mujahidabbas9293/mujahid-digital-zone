import React, { useState, useEffect } from 'react';
import {
  CopyCheck,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Clock,
  Trash2,
  CheckCircle2,
  RefreshCw,
  Sliders,
  Sparkles,
  Users,
  MessageSquare,
  Flame,
  Search,
  ExternalLink,
  Send,
  Zap,
  Info,
  Fingerprint,
  Check,
  XCircle,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { Group, SamePostSettings, SamePostViolation, MessageFingerprint } from '../types';

interface SamePostProtectionViewProps {
  groups: Group[];
  status: any;
}

export const SamePostProtectionView: React.FC<SamePostProtectionViewProps> = ({ groups, status }) => {
  const [settings, setSettings] = useState<SamePostSettings>({
    enabled: true,
    limit: 2,
    window_hours: 24,
    total_violations_count: 0,
    total_tracked_messages: 0
  });
  const [violations, setViolations] = useState<SamePostViolation[]>([]);
  const [fingerprints, setFingerprints] = useState<MessageFingerprint[]>([]);
  const [activeTab, setActiveTab] = useState<'violations' | 'fingerprints'>('violations');
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Simulator test state
  const [simGroupJid, setSimGroupJid] = useState<string>('');
  const [simPhone, setSimPhone] = useState<string>('923001234567');
  const [simText, setSimText] = useState<string>('Special Discount Offer! Contact now.');
  const [simTesting, setSimTesting] = useState<boolean>(false);
  const [simFeedback, setSimFeedback] = useState<string | null>(null);

  const fetchSettingsAndViolations = async () => {
    try {
      setLoading(true);
      const [resSet, resVio, resFp] = await Promise.all([
        fetch('/api/same-post-protection/settings').then(r => r.json()).catch(() => null),
        fetch('/api/same-post-protection/violations').then(r => r.json()).catch(() => []),
        fetch('/api/same-post-protection/fingerprints').then(r => r.json()).catch(() => ({ fingerprints: [] }))
      ]);

      if (resSet && resSet.success) {
        setSettings({
          enabled: Boolean(resSet.enabled),
          limit: Number(resSet.limit) || 2,
          window_hours: Number(resSet.window_hours) || 24,
          custom_warning_template: resSet.custom_warning_template,
          total_violations_count: resSet.total_violations_count || 0,
          total_tracked_messages: resSet.total_tracked_messages || 0
        });
      }
      if (Array.isArray(resVio)) {
        setViolations(resVio);
      }
      if (resFp && Array.isArray(resFp.fingerprints)) {
        setFingerprints(resFp.fingerprints);
      }
    } catch (e) {
      console.error('Error fetching same post protection settings:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettingsAndViolations();
    const interval = setInterval(fetchSettingsAndViolations, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleSaveSettings = async (newLimit?: number, newEnabled?: boolean) => {
    try {
      setSaving(true);
      const payload = {
        enabled: newEnabled !== undefined ? newEnabled : settings.enabled,
        limit: newLimit !== undefined ? newLimit : settings.limit,
        window_hours: 24
      };

      const res = await fetch('/api/same-post-protection/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setSettings(prev => ({
          ...prev,
          enabled: payload.enabled,
          limit: payload.limit
        }));
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (e) {
      console.error('Error saving settings:', e);
    } finally {
      setSaving(false);
    }
  };

  const handleClearViolations = async () => {
    if (!window.confirm('Are you sure you want to clear the duplicate post removal logs?')) return;
    try {
      await fetch('/api/same-post-protection/violations/clear', { method: 'POST' });
      setViolations([]);
    } catch (e) {
      console.error('Error clearing violations:', e);
    }
  };

  const handleRunSimulator = async () => {
    if (!simGroupJid) {
      alert('Please select a group to test the live duplicate warning.');
      return;
    }
    try {
      setSimTesting(true);
      setSimFeedback(null);
      const res = await fetch('/api/same-post-protection/test-trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          group_jid: simGroupJid,
          phone: simPhone,
          message_text: simText,
          attempt_number: settings.limit + 1
        })
      });
      const data = await res.json();
      if (data.success) {
        setSimFeedback(`✅ Live test warning message sent to group successfully!`);
        fetchSettingsAndViolations();
      } else {
        setSimFeedback(`❌ Failed: ${data.error || 'Could not send test warning'}`);
      }
    } catch (e) {
      setSimFeedback(`❌ Error sending test: ${(e as any)?.message}`);
    } finally {
      setSimTesting(false);
    }
  };

  const filteredViolations = violations.filter(v => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      v.sender_phone?.toLowerCase().includes(q) ||
      v.sender_name?.toLowerCase().includes(q) ||
      v.group_name?.toLowerCase().includes(q) ||
      v.message_preview?.toLowerCase().includes(q)
    );
  });

  const filteredFingerprints = fingerprints.filter(f => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      f.sender_phone?.toLowerCase().includes(q) ||
      f.group_name?.toLowerCase().includes(q) ||
      f.post_content?.toLowerCase().includes(q) ||
      f.fingerprint?.toLowerCase().includes(q)
    );
  });

  const activeGroups = groups.filter(g => g.is_active);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
      {/* Master ON/OFF Hero Banner - Vibrant Green for ON, Vibrant Red for OFF */}
      <div className={`p-6 rounded-2xl border shadow-2xl relative overflow-hidden transition-all duration-300 ${
        settings.enabled
          ? 'bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/50 border-emerald-500/40 shadow-emerald-950/30'
          : 'bg-gradient-to-r from-slate-900 via-slate-900 to-rose-950/50 border-rose-500/40 shadow-rose-950/30'
      }`}>
        <div className={`absolute -right-10 -bottom-10 w-56 h-56 rounded-full blur-3xl pointer-events-none ${
          settings.enabled ? 'bg-emerald-500/15' : 'bg-rose-500/15'
        }`}></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center shadow-lg transition-all ${
                settings.enabled
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 shadow-emerald-500/20'
                  : 'bg-rose-500/20 border-rose-500/40 text-rose-400 shadow-rose-500/20'
              }`}>
                <CopyCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-xl font-bold text-white tracking-tight">
                    Same Post / Same Message Limit Protection
                  </h1>
                  {/* Dynamic Green/Red Badge */}
                  <span className={`text-xs uppercase font-extrabold px-3 py-1 rounded-full border shadow-md flex items-center gap-1.5 ${
                    settings.enabled
                      ? 'bg-emerald-500/25 text-emerald-300 border-emerald-400/50 shadow-emerald-500/20'
                      : 'bg-rose-500/25 text-rose-300 border-rose-400/50 shadow-rose-500/20'
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${
                      settings.enabled ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
                    }`}></span>
                    <span>{settings.enabled ? '🟢 LIVE ON (Active)' : '🔴 PROTECTION OFF'}</span>
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  Tracks identity per <strong className="text-white">WhatsAppNumber + GroupJID + PostContent</strong> in 24-hour sliding windows. When duplicates exceed limit, automatically deletes live and dispatches emoji warning.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Live Big Toggle Switch */}
            <button
              onClick={() => handleSaveSettings(settings.limit, !settings.enabled)}
              disabled={saving}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 shadow-xl border cursor-pointer ${
                settings.enabled
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400 shadow-emerald-600/30'
                  : 'bg-rose-600 hover:bg-rose-500 text-white border-rose-400 shadow-rose-600/30'
              }`}
            >
              {settings.enabled ? (
                <>
                  <ToggleRight className="w-5 h-5 text-white" />
                  <span>ENABLED (Turn OFF)</span>
                </>
              ) : (
                <>
                  <ToggleLeft className="w-5 h-5 text-white" />
                  <span>DISABLED (Turn ON)</span>
                </>
              )}
            </button>

            <button
              onClick={fetchSettingsAndViolations}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 text-xs flex items-center gap-1.5 transition-colors"
              title="Refresh Live Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Same Post Limit</span>
            <div className="text-2xl font-bold text-white font-mono flex items-baseline gap-1.5">
              <span className={settings.enabled ? 'text-emerald-400' : 'text-slate-400'}>{settings.limit}</span>
              <span className="text-xs font-sans text-slate-400 font-normal">posts / 24h</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Sliders className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Duplicates Removed</span>
            <div className="text-2xl font-bold text-rose-400 font-mono">
              {violations.length || settings.total_violations_count}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <Trash2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Tracked Fingerprints</span>
            <div className="text-2xl font-bold text-sky-400 font-mono flex items-baseline gap-1.5">
              <span>{fingerprints.length || settings.total_tracked_messages}</span>
              <span className="text-xs font-sans text-slate-400 font-normal">in 24h</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
            <Fingerprint className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Status Indicator</span>
            <div className={`text-base font-bold font-mono flex items-center gap-1.5 ${
              settings.enabled ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              <span>{settings.enabled ? '🟢 ACTIVE & LIVE' : '🔴 DISABLED'}</span>
            </div>
          </div>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            settings.enabled ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
          }`}>
            {settings.enabled ? <ShieldCheck className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
          </div>
        </div>
      </div>

      {/* Configuration & Warning Message Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Limit Settings Controls */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-amber-400" />
              <span>Same Post Limit Configuration</span>
            </h2>
            {saveSuccess && (
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 animate-pulse">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Limit Saved Live!</span>
              </span>
            )}
          </div>

          {/* Quick Preset Limit Selectors */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-300 block">
              Choose Allowed Same Post Limit (within 24 Hours):
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {[1, 2, 3, 4, 5].map((val) => {
                const isSelected = settings.limit === val;
                return (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleSaveSettings(val)}
                    className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all border text-center ${
                      isSelected
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/20 scale-[1.02]'
                        : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-base font-black font-mono">{val}</div>
                    <div className="text-[10px] opacity-80">{val === 1 ? '1 Time' : `${val} Times`}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Limit Input */}
          <div className="space-y-2 pt-2">
            <label className="text-xs font-medium text-slate-400 flex items-center justify-between">
              <span>Or Enter Custom Same Post Limit:</span>
              <span className="text-[11px] text-amber-400 font-mono font-bold">Currently: {settings.limit} times / 24h</span>
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                min="1"
                max="50"
                value={settings.limit}
                onChange={(e) => setSettings(prev => ({ ...prev, limit: Math.max(1, parseInt(e.target.value) || 1) }))}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-amber-500"
              />
              <button
                onClick={() => handleSaveSettings(settings.limit)}
                disabled={saving}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-lg shadow-amber-500/10 flex items-center gap-1.5"
              >
                {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                <span>Apply Limit</span>
              </button>
            </div>
          </div>

          {/* Rules Explanation Box */}
          <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-800/80 space-y-2.5 text-xs text-slate-300">
            <div className="font-bold text-white flex items-center gap-1.5 text-xs">
              <Info className="w-3.5 h-3.5 text-blue-400" />
              <span>Live Detection & Removal Rules:</span>
            </div>
            <ul className="space-y-1.5 text-slate-400 list-disc list-inside">
              <li><strong className="text-slate-200">Same Number</strong>: Distinct WhatsApp sender phone number.</li>
              <li><strong className="text-slate-200">Same Group</strong>: Evaluated per-group; does not mix across groups.</li>
              <li><strong className="text-slate-200">Same Post</strong>: Identical content / text fingerprint.</li>
              <li><strong className="text-slate-200">24h Sliding Window</strong>: Counter tracks exactly 24 hours per fingerprint.</li>
              <li><strong className="text-slate-200">Live Emoji Notice</strong>: When attempt #{settings.limit + 1} arrives, it is deleted instantly from WhatsApp and a formatted warning is sent.</li>
            </ul>
          </div>
        </div>

        {/* Right Column: Live Emoji Warning Preview */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>Live Emoji Warning Message Preview</span>
              </h2>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                Auto Sent to Group
              </span>
            </div>
            <p className="text-xs text-slate-400">
              When a duplicate post exceeds the limit of <strong>{settings.limit} times/24h</strong>, the message is deleted live and this exact emoji warning is sent:
            </p>
          </div>

          {/* WhatsApp Message Preview Bubble */}
          <div className="bg-[#0b141a] p-4 rounded-2xl border border-slate-800/80 shadow-2xl relative">
            <div className="absolute top-3 right-3 text-[10px] font-mono text-slate-500">Live Preview</div>
            <div className="bg-[#202c33] text-slate-100 p-4 rounded-xl border-l-4 border-rose-500 font-sans text-xs whitespace-pre-wrap leading-relaxed shadow-md">
{`🚫⚠️ DUPLICATE POST REMOVED

👤 Number: +923001234567
👥 Group: ${groups[0]?.name || 'Trading & Deals Community'}
📌 Same Post Limit: ${settings.limit} times / 24 hours
🔢 Attempt: ${settings.limit + 1}

❌ This same post/message has exceeded the allowed limit.

🗑️ Duplicate message removed automatically.

⏱️ 24-Hour Limit Protection Active`}
            </div>
          </div>

          {/* Test Simulator in Group */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="text-xs font-bold text-white flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>Live Warning Simulator (Test on WhatsApp Group)</span>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={simGroupJid}
                onChange={(e) => setSimGroupJid(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                <option value="">Select a WhatsApp Group to Test...</option>
                {groups.map(g => (
                  <option key={g.jid} value={g.jid}>
                    {g.name} ({g.is_active ? 'Active' : 'Paused'})
                  </option>
                ))}
              </select>
              <button
                onClick={handleRunSimulator}
                disabled={simTesting || !simGroupJid}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 shrink-0 shadow-lg shadow-amber-500/10"
              >
                {simTesting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>Send Test Warning</span>
              </button>
            </div>
            {simFeedback && (
              <div className={`p-2.5 rounded-lg text-xs font-medium ${
                simFeedback.startsWith('✅') ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
              }`}>
                {simFeedback}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dual Tab: Violations Log & Active Message Fingerprints Ledger */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 sm:p-6 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('violations')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'violations'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 shadow'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Duplicate Posts Removed ({violations.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('fingerprints')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'fingerprints'
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30 shadow'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Fingerprint className="w-3.5 h-3.5" />
              <span>Active 24h Fingerprints ({fingerprints.length})</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search phone, group, text..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 w-48 sm:w-60"
              />
            </div>

            {activeTab === 'violations' && violations.length > 0 && (
              <button
                onClick={handleClearViolations}
                className="px-3 py-1.5 bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 rounded-xl border border-slate-700 hover:border-rose-500/30 text-xs font-medium transition-all"
              >
                Clear Log
              </button>
            )}
          </div>
        </div>

        {activeTab === 'violations' ? (
          filteredViolations.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center mx-auto text-slate-600">
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
              </div>
              <div className="text-sm font-bold text-white">No Duplicate Post Violations Recorded</div>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                When a member sends the exact same message more than {settings.limit} times within 24 hours in a group, it will be automatically deleted and logged here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Time</th>
                    <th className="py-3 px-4">Sender Number</th>
                    <th className="py-3 px-4">Group Name</th>
                    <th className="py-3 px-4 text-center">Attempt / Limit</th>
                    <th className="py-3 px-4">Message Snippet</th>
                    <th className="py-3 px-4 text-right">Action Taken</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredViolations.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                        {new Date(v.removed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        <div className="text-[10px] text-slate-500">
                          {new Date(v.removed_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-mono font-bold text-white">+{v.sender_phone}</div>
                        {v.sender_name && <div className="text-[10px] text-slate-400">{v.sender_name}</div>}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-medium text-slate-200 truncate max-w-[180px]">{v.group_name}</div>
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-rose-500/20 text-rose-400 border border-rose-500/30">
                          Attempt #{v.attempt_number} (Limit: {v.limit})
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-slate-300 font-mono text-[11px] truncate max-w-xs bg-slate-950/60 px-2 py-1 rounded border border-slate-800/60">
                          "{v.message_preview}"
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-300 border border-rose-500/20 inline-flex items-center gap-1">
                          <span>🗑️ Deleted & Warned</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          /* Active Fingerprints Ledger Table */
          filteredFingerprints.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center mx-auto text-slate-600">
                <Fingerprint className="w-6 h-6 text-sky-400" />
              </div>
              <div className="text-sm font-bold text-white">No Active Message Fingerprints in 24h Window</div>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Messages sent in guarded WhatsApp groups are fingerprinted per (Sender + Group + Content) and tracked here for 24 hours.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">WhatsApp Number</th>
                    <th className="py-3 px-4">Group</th>
                    <th className="py-3 px-4 text-center">Attempt</th>
                    <th className="py-3 px-4">Fingerprint Key</th>
                    <th className="py-3 px-4">Post Content</th>
                    <th className="py-3 px-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredFingerprints.map((f) => (
                    <tr key={f.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                        {new Date(f.timestamp || f.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        <div className="text-[10px] text-slate-500">
                          {new Date(f.timestamp || f.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-mono font-bold text-white">+{f.sender_phone}</div>
                        {f.sender_name && <div className="text-[10px] text-slate-400">{f.sender_name}</div>}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-medium text-slate-200 truncate max-w-[160px]">{f.group_name || f.group_jid}</div>
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono border ${
                          f.status === 'EXCEEDED_LIMIT_REMOVED'
                            ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                            : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                        }`}>
                          #{f.attempt_number}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-mono text-[10px] text-sky-400 bg-sky-950/40 px-2 py-0.5 rounded border border-sky-800/40">
                          {f.fingerprint ? f.fingerprint.slice(0, 10) + '...' : 'SHA-256'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-slate-300 font-mono text-[11px] truncate max-w-xs bg-slate-950/60 px-2 py-1 rounded border border-slate-800/60">
                          "{f.post_content || f.normalized_text}"
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border inline-flex items-center gap-1 ${
                          f.status === 'EXCEEDED_LIMIT_REMOVED'
                            ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                            : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                        }`}>
                          {f.status === 'EXCEEDED_LIMIT_REMOVED' ? '🚫 Exceeded / Blocked' : '✅ Allowed'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>
    </div>
  );
};

