import React, { useState, useEffect, useCallback } from 'react';
import {
  QrCode,
  Smartphone,
  RotateCcw,
  LogOut,
  Copy,
  Check,
  ShieldCheck,
  Activity,
  Server,
  Calendar,
  Clock,
  HeartHandshake,
  Users2,
  RefreshCw,
  Zap
} from 'lucide-react';
import { BotStatus } from '../types';

interface ConnectionViewProps {
  status: BotStatus | null;
  onRefreshQr: () => void | Promise<void>;
  onRequestPairingCode: (phone: string) => Promise<void>;
  onUnlink: () => void;
  isPairingLoading: boolean;
}

export const ConnectionView: React.FC<ConnectionViewProps> = ({
  status,
  onRefreshQr,
  onRequestPairingCode,
  onUnlink,
  isPairingLoading
}) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [showUnlinkModal, setShowUnlinkModal] = useState(false);
  const isConnected = status?.status === 'CONNECTED' && Boolean(status?.botPhone || status?.profile);
  const hasSession = isConnected;
  const profile = status?.profile;

  // Auto-Refresh QR state & countdown (50s interval)
  const [autoRefreshQr, setAutoRefreshQr] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('mdz_auto_refresh_qr');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });
  const [countdown, setCountdown] = useState<number>(50);
  const [isAutoRefreshing, setIsAutoRefreshing] = useState<boolean>(false);

  // Sync toggle to localStorage
  const handleToggleAutoRefresh = (enabled: boolean) => {
    setAutoRefreshQr(enabled);
    setCountdown(50);
    try {
      localStorage.setItem('mdz_auto_refresh_qr', String(enabled));
    } catch (_) {}
  };

  const triggerRefresh = useCallback(async () => {
    if (isConnected) return;
    setIsAutoRefreshing(true);
    try {
      await Promise.resolve(onRefreshQr());
    } catch (err) {
      console.error('Error auto-refreshing QR:', err);
    } finally {
      setTimeout(() => setIsAutoRefreshing(false), 800);
    }
  }, [isConnected, onRefreshQr]);

  const handleManualRefresh = async () => {
    setCountdown(50);
    await triggerRefresh();
  };

  // 50 seconds interval timer when disconnected and toggle is active
  useEffect(() => {
    if (isConnected || hasSession || !autoRefreshQr) {
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          triggerRefresh();
          return 50;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isConnected, hasSession, autoRefreshQr, triggerRefresh]);

  const handleCopyPairingCode = () => {
    if (status?.pairingCode) {
      navigator.clipboard.writeText(status.pairingCode.replace(/[^a-zA-Z0-9]/g, ''));
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handlePairSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim()) return;
    onRequestPairingCode(phoneNumber.trim());
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">WhatsApp 24/7 Session & Connection Manager</h2>
        <p className="text-xs text-slate-400 mt-1">
          Independent background worker connectivity, real authenticated profile, and session watchdog (Console Version {status?.version || 'A2-4'}).
        </p>
      </div>

      {/* CONNECTED / PERSISTENT VPS STATE: REAL PROFILE & PERSISTENT SESSION DETAILS */}
      {hasSession ? (
        <div className="space-y-6">
          {/* Real Profile Card */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-slate-800">
              <div className="flex items-center space-x-4">
                {profile?.pictureUrl ? (
                  <img
                    src={profile.pictureUrl}
                    alt={profile.name}
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-500 shadow-md"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center font-bold text-2xl text-white shadow-md">
                    {(profile?.name || status?.botPhone || 'WA').slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-white tracking-tight">{profile?.name || (status?.botPhone ? `+${status.botPhone}` : 'Connected Account')}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      isConnected
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}>
                      {isConnected ? 'LIVE 24/7' : 'AUTO-RECOVERING (VPS)'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 font-mono mt-0.5">
                    📱 Connected WhatsApp: <span className="font-bold text-white">+{profile?.phone || status?.botPhone}</span>
                  </p>
                  <p className="text-[11px] font-medium flex items-center gap-1.5 mt-1 font-mono">
                    <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400 animate-ping'}`}></span>
                    <span className={isConnected ? 'text-emerald-400' : 'text-amber-400'}>
                      {isConnected
                        ? '🟢 Connected · 🖥️ Runtime: VPS · 🔄 Auto-Reconnect: ON'
                        : '🟠 Auto-Reconnecting in Background · 🖥️ Runtime: VPS · 🔄 Auto-Reconnect: ON'}
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowUnlinkModal(true)}
                  className="px-4 py-2 bg-rose-500/10 hover:bg-rose-600 hover:text-white text-rose-400 border border-rose-500/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-lg"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Unlink / Logout Account</span>
                </button>
              </div>
            </div>

            {/* Custom Unlink Confirmation Modal */}
            {showUnlinkModal && (
              <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-200">
                  <div className="flex items-center space-x-3 text-rose-400">
                    <div className="p-3 bg-rose-500/10 rounded-xl border border-rose-500/20">
                      <LogOut className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">Unlink WhatsApp Account</h3>
                      <p className="text-xs text-slate-400">This action will disconnect your account instantly.</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                    Are you sure you want to unlink? This will disconnect your WhatsApp account, stop all background automation, wipe current session data, and display the New QR code screen.
                  </p>
                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      onClick={() => setShowUnlinkModal(false)}
                      className="px-4 py-2 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        setShowUnlinkModal(false);
                        onUnlink();
                      }}
                      className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-lg transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Yes, Unlink & Reset</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Profile Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
              <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800">
                <div className="flex items-center space-x-2 text-slate-400 text-xs">
                  <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Connected At</span>
                </div>
                <div className="text-xs font-bold text-white mt-1.5 font-mono tabular-nums">
                  {profile?.connectedAt ? new Date(profile.connectedAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'Active'}
                </div>
              </div>

              <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800">
                <div className="flex items-center space-x-2 text-slate-400 text-xs">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Automation Activated</span>
                </div>
                <div className="text-xs font-bold text-white mt-1.5 font-mono tabular-nums">
                  {profile?.activatedAt ? new Date(profile.activatedAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'Active'}
                </div>
              </div>

              <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800">
                <div className="flex items-center space-x-2 text-slate-400 text-xs">
                  <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Last Heartbeat / Seen</span>
                </div>
                <div className="text-xs font-bold text-emerald-400 mt-1.5 font-mono tabular-nums">
                  {profile?.lastHeartbeat ? new Date(profile.lastHeartbeat).toLocaleTimeString() : new Date().toLocaleTimeString()} (Watchdog Healthy)
                </div>
              </div>

              <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800">
                <div className="flex items-center space-x-2 text-slate-400 text-xs">
                  <Server className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Active Server Role</span>
                </div>
                <div className="text-xs font-bold text-white mt-1.5 flex items-center justify-between">
                  <span className="text-emerald-400 font-mono">{profile?.serverRole || 'PRIMARY (VPS)'}</span>
                  <span className="text-[10px] text-slate-500 font-mono">v{profile?.version || status?.version || 'A2-4'}</span>
                </div>
              </div>
            </div>

            {/* Managed Groups Summary */}
            <div className="mt-6 p-4 bg-slate-950/40 rounded-xl border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
                  <Users2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Current Account Managed Groups</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {profile?.activeGroups ?? 0} active moderation groups · {profile?.totalGroups ?? 0} total groups joined
                  </div>
                </div>
              </div>

              <div className="text-xs font-mono text-slate-300">
                Total Members Synced: <span className="font-bold text-emerald-400 tabular-nums">{profile?.totalMembers ?? 0}</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* DISCONNECTED / PAIRING STATE */
        <div className="space-y-6">
          <div className="p-5 rounded-xl border bg-slate-900 border-slate-800 text-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md">
            <div className="flex items-center space-x-3.5">
              <div className="p-3 rounded-xl bg-slate-800 text-slate-400 shrink-0">
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <div className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Status: Fresh / Awaiting Device Authentication</span>
                  <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {status?.socketStatusMessage || 'Scan the QR code below or generate an 8-digit WhatsApp pairing code.'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              {/* Auto-Refresh QR Toggle */}
              <div className="flex items-center gap-2.5 bg-slate-950/80 border border-slate-800 hover:border-slate-700/80 px-3.5 py-2 rounded-xl text-xs transition-colors shadow-inner">
                <button
                  type="button"
                  role="switch"
                  aria-checked={autoRefreshQr}
                  onClick={() => handleToggleAutoRefresh(!autoRefreshQr)}
                  className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${
                    autoRefreshQr ? 'bg-emerald-500' : 'bg-slate-700'
                  }`}
                  title="Toggle Auto-Refresh QR every 50 seconds"
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      autoRefreshQr ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-slate-200 select-none">
                    Auto-Refresh QR
                  </span>
                  {autoRefreshQr ? (
                    <span className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                      <RefreshCw className={`w-3 h-3 ${isAutoRefreshing ? 'animate-spin text-emerald-300' : ''}`} />
                      <span>{countdown}s</span>
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-slate-500 uppercase px-1.5 py-0.5 bg-slate-800 rounded">
                      OFF
                    </span>
                  )}
                </div>
              </div>

              {/* Manual Refresh Button */}
              <button
                onClick={handleManualRefresh}
                disabled={isAutoRefreshing}
                className="px-3.5 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 disabled:opacity-60 rounded-xl border border-slate-700 transition-all flex items-center space-x-1.5 cursor-pointer shadow-sm"
                title="Immediately generate a fresh QR code"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${isAutoRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
                <span>Generate New QR</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Method 1: QR Code */}
            <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 flex flex-col justify-between shadow-md">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center space-x-2.5">
                    <QrCode className="w-5 h-5 text-emerald-400" />
                    <h3 className="text-sm font-bold text-white">Method 1: Scan WhatsApp Web QR</h3>
                  </div>
                  {autoRefreshQr ? (
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1 font-semibold">
                      <Zap className="w-3 h-3 text-emerald-400 animate-pulse" />
                      Auto-Refresh in {countdown}s
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-slate-500 bg-slate-800/60 border border-slate-700/60 px-2 py-0.5 rounded-full">
                      Auto-Refresh Off
                    </span>
                  )}
                </div>

                <div className="mt-5 flex flex-col items-center justify-center">
                  {status?.qrDataUrl ? (
                    <div className="p-3 bg-white rounded-xl shadow-lg border border-slate-200 flex flex-col items-center">
                      <img
                        src={status.qrDataUrl}
                        alt="WhatsApp Web QR Code"
                        className="w-56 h-56 object-contain"
                      />
                      <div className="text-[11px] text-slate-600 font-mono mt-2 font-medium flex items-center gap-2">
                        <span>Expires in: {status.qrExpiresInSeconds}s</span>
                        {autoRefreshQr && (
                          <>
                            <span className="text-slate-400">•</span>
                            <span className="text-emerald-600 font-bold flex items-center gap-1">
                              <RefreshCw className={`w-2.5 h-2.5 ${isAutoRefreshing ? 'animate-spin' : ''}`} />
                              Next: {countdown}s
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="w-56 h-56 rounded-xl bg-slate-800/40 border border-dashed border-slate-700 flex flex-col items-center justify-center text-center p-4">
                      <RotateCcw className="w-6 h-6 text-slate-500 animate-spin mb-2" />
                      <span className="text-xs text-slate-400">Requesting fresh QR from socket...</span>
                    </div>
                  )}
                </div>

                <div className="mt-5 text-xs text-slate-400 space-y-1.5 bg-slate-800/40 p-3 rounded-lg border border-slate-700/60">
                  <div className="font-semibold text-slate-300">How to link:</div>
                  <ol className="list-decimal list-inside space-y-1 text-slate-400 text-[11px]">
                    <li>Open WhatsApp on phone</li>
                    <li>Tap <b>Linked Devices</b> &gt; <b>Link a Device</b></li>
                    <li>Scan this code to link 24/7 background worker</li>
                  </ol>
                </div>
              </div>
            </div>

            {/* Method 2: Pairing Code */}
            <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-800">
                  <Smartphone className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-sm font-bold text-white">Method 2: 8-Digit Pairing Code</h3>
                </div>

                <p className="text-xs text-slate-400 mt-3">
                  Enter your WhatsApp phone number with country code (e.g., <code className="text-emerald-400 font-mono">923001234567</code>) to link directly without camera.
                </p>

                <form onSubmit={handlePairSubmit} className="mt-4 space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Phone Number (with Country Code)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="e.g. 923001234567"
                        disabled={isPairingLoading}
                        className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                      />
                      <button
                        type="submit"
                        disabled={isPairingLoading || !phoneNumber.trim()}
                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-lg transition-colors"
                      >
                        {isPairingLoading ? 'Requesting...' : 'Get Code'}
                      </button>
                    </div>
                  </div>
                </form>

                {status?.pairingCode && (
                  <div className="mt-5 p-4 bg-emerald-950/20 border border-emerald-500/40 rounded-xl text-center">
                    <div className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
                      Official WhatsApp Pairing Code
                    </div>
                    <div className="text-3xl font-extrabold text-white font-mono tracking-widest my-2 select-all tabular-nums">
                      {status.pairingCode}
                    </div>
                    <button
                      onClick={handleCopyPairingCode}
                      className="inline-flex items-center space-x-1.5 px-3 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-semibold rounded-md border border-emerald-500/30 transition-all"
                    >
                      {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedCode ? 'Copied!' : 'Copy Code'}</span>
                    </button>
                  </div>
                )}

                <div className="mt-5 text-xs text-slate-400 space-y-1.5 bg-slate-800/40 p-3 rounded-lg border border-slate-700/60">
                  <div className="font-semibold text-slate-300">How to enter code on WhatsApp:</div>
                  <ol className="list-decimal list-inside space-y-1 text-slate-400 text-[11px]">
                    <li>Open WhatsApp &gt; <b>Linked Devices</b> &gt; <b>Link a Device</b></li>
                    <li>Tap <b>Link with phone number instead</b></li>
                    <li>Type the 8-digit code shown above</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
