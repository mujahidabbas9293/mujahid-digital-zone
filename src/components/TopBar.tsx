import React from 'react';
import {
  Activity,
  HardDriveDownload,
  FlaskConical,
  Server,
  RotateCcw,
  LogOut,
  ShieldCheck,
  Radio,
  Key,
  Shield,
  MessageCircle,
  Send,
  Menu
} from 'lucide-react';
import { BotStatus, ResellerState } from '../types';

interface TopBarProps {
  status: BotStatus | null;
  onOpenMessageStatus?: () => void;
  onOpenSimulator: () => void;
  onOpenWhatsAppCenter?: () => void;
  onTriggerBackup: () => void;
  onOpenDeploy: () => void;
  onRefresh: () => void;
  onUnlink: () => void;
  isBackingUp: boolean;
  resellerStatus?: ResellerState | null;
  onLogoutLicense?: () => void;
  onToggleMobileMenu?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  status,
  onOpenMessageStatus,
  onOpenSimulator,
  onOpenWhatsAppCenter,
  onTriggerBackup,
  onOpenDeploy,
  onRefresh,
  onUnlink,
  isBackingUp,
  resellerStatus,
  onLogoutLicense,
  onToggleMobileMenu
}) => {
  const connection = status?.status || 'DISCONNECTED';
  const workerState = status?.workerStatus || 'STOPPED';
  const isConnected = connection === 'CONNECTED';
  const isRecovering = connection === 'CONNECTING' || workerState === 'RECOVERING';
  const uptimeSeconds = status?.uptimeSeconds || 0;
  const days = Math.floor(uptimeSeconds / (3600 * 24));
  const hours = Math.floor((uptimeSeconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((uptimeSeconds % 3600) / 60);
  const profile = status?.profile;
  const isMasterAdmin = !resellerStatus || resellerStatus.is_master_admin;
  const isLicenseActive = resellerStatus && resellerStatus.is_active_license;
  const showWhatsAppCenter = isMasterAdmin || Boolean(resellerStatus?.has_whatsapp_center);

  const [showServerModal, setShowServerModal] = React.useState(false);
  const [customServerUrl, setCustomServerUrl] = React.useState<string>(() => {
    return localStorage.getItem('mdz_custom_backend_url') || import.meta.env.VITE_API_URL || '';
  });

  const handleSaveServerUrl = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUrl = customServerUrl.trim().replace(/\/$/, '');
    if (cleanUrl) {
      localStorage.setItem('mdz_custom_backend_url', cleanUrl);
    } else {
      localStorage.removeItem('mdz_custom_backend_url');
    }
    setShowServerModal(false);
    window.location.reload();
  };

  return (
    <header className="h-16 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Left: Mobile Toggle & Connection Status Pill & Real Profile */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="lg:hidden p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
            title="Open Navigation Menu"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}

        {/* Status Pill */}
        <div
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
            isConnected
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              : isRecovering
              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
          }`}
        >
          <span className="relative flex h-2 w-2">
            {isConnected && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            )}
            {isRecovering && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            )}
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                isConnected
                  ? 'bg-emerald-500'
                  : isRecovering
                  ? 'bg-amber-500'
                  : 'bg-rose-500'
              }`}
            ></span>
          </span>

          <span className="tracking-wide">
            {isConnected
              ? 'CONNECTED / RUNNING'
              : isRecovering
              ? 'RECOVERING'
              : 'DISCONNECTED'}
          </span>
        </div>

        {/* Cloud Server URL Switcher Button */}
        <button
          onClick={() => setShowServerModal(true)}
          className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 transition-all"
          title="Configure Cloud Backend Server URL for Vercel"
        >
          <Server className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Server URL</span>
        </button>

        {/* Real Profile Display */}
        {(isConnected || isRecovering) && (profile || status?.botPhone) && (
          <div className="hidden lg:flex items-center space-x-2 bg-slate-800/60 px-2.5 py-1 rounded-lg border border-slate-700/60 text-xs">
            {profile?.pictureUrl ? (
              <img
                src={profile.pictureUrl}
                alt="WhatsApp Profile"
                className="w-5 h-5 rounded-full object-cover"
              />
            ) : (
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px]">
                {(profile?.name || status?.botPhone || 'WA').slice(0, 2).toUpperCase()}
              </div>
            )}
            <span className="font-semibold text-white max-w-[120px] truncate">{profile?.name || `+${status?.botPhone}`}</span>
            <span className="text-slate-400 font-mono text-[11px]">+ {profile?.phone || status?.botPhone}</span>
          </div>
        )}

        {/* Uptime Display */}
        <div className="hidden xl:flex items-center space-x-1.5 text-xs text-slate-400 font-mono bg-slate-800/40 px-2.5 py-1 rounded-lg border border-slate-800 tabular-nums">
          <Activity className="w-3.5 h-3.5 text-emerald-400" />
          <span>
            {days > 0 ? `${days}d ` : ''}
            {hours}h {minutes}m uptime
          </span>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center space-x-2.5">
        {/* License Pill & Switch Button */}
        {resellerStatus && !isMasterAdmin && (
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border flex items-center gap-1.5 ${
              isLicenseActive
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
            }`}>
              <Key className="w-3.5 h-3.5 text-amber-400" />
              <span>
                {isLicenseActive
                  ? `ACTIVE (${resellerStatus.remaining_days}d left)`
                  : 'EXPIRED'}
              </span>
            </span>

            {onLogoutLicense && (
              <button
                onClick={onLogoutLicense}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg border border-slate-700 transition-colors"
                title="Disconnect this license and return to key activation screen"
              >
                Switch Key
              </button>
            )}
          </div>
        )}

        <button
          onClick={onRefresh}
          title="Refresh Data"
          className="p-2 text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 rounded-lg border border-slate-700/60 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          onClick={onTriggerBackup}
          disabled={isBackingUp}
          className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700/80 transition-colors disabled:opacity-50"
        >
          <HardDriveDownload className={`w-3.5 h-3.5 ${isBackingUp ? 'animate-bounce text-emerald-400' : 'text-slate-400'}`} />
          <span>{isBackingUp ? 'Backing up...' : 'Backup State'}</span>
        </button>

        {onOpenWhatsAppCenter && showWhatsAppCenter && (
          <button
            onClick={onOpenWhatsAppCenter}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-[#25D366] bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 rounded-lg transition-colors cursor-pointer shadow-sm"
            title="Open WhatsApp Auto Sender & Cloud Post"
          >
            <Send className="w-3.5 h-3.5 text-[#25D366]" />
            <span>WhatsApp Auto Sender</span>
          </button>
        )}

        {onOpenMessageStatus && (
          <button
            onClick={onOpenMessageStatus}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-lg transition-colors group"
            title="Inspect 24/7 Message Automation Status & Execution Engines"
          >
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse group-hover:scale-110 transition-transform" />
            <span className="hidden sm:inline">Message Status</span>
          </button>
        )}

        <button
          onClick={onOpenSimulator}
          className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-lg transition-colors"
        >
          <FlaskConical className="w-3.5 h-3.5" />
          <span>Testing Studio</span>
        </button>

        {(isConnected || isRecovering) && (
          <button
            onClick={() => {
              if (window.confirm('Unlink this WhatsApp account? All session credentials, groups, and automation state will be securely purged.')) {
                onUnlink();
              }
            }}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-rose-400 bg-rose-500/10 hover:bg-rose-600 hover:text-white border border-rose-500/30 rounded-lg transition-all"
            title="Unlink WhatsApp session and reset to clean state"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Unlink Session</span>
          </button>
        )}
      </div>

      {/* Cloud Server URL Modal */}
      {showServerModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Server className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Backend Cloud Server URL</h3>
              </div>
              <button onClick={() => setShowServerModal(false)} className="text-slate-400 hover:text-white font-bold">✕</button>
            </div>
            
            <p className="text-xs text-slate-300 leading-relaxed">
              Enter your backend server URL (e.g., Render, Railway, or Cloud VPS IP). Vercel website will connect directly to this server for live QR, Pairing Code, and Auto-Sender.
            </p>

            <form onSubmit={handleSaveServerUrl} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Server API URL</label>
                <input
                  type="url"
                  value={customServerUrl}
                  onChange={e => setCustomServerUrl(e.target.value)}
                  placeholder="https://mujahid-digital-zone.onrender.com"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Example: <span className="text-emerald-400 font-mono">https://mujahid-digital-zone.onrender.com</span> or <span className="text-indigo-400 font-mono">http://YOUR-VPS-IP:3000</span>
                </p>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    localStorage.removeItem('mdz_custom_backend_url');
                    setCustomServerUrl('');
                    setShowServerModal(false);
                    window.location.reload();
                  }}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl transition-colors"
                >
                  Reset Default
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all shadow-md"
                >
                  Save & Connect Server
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};
