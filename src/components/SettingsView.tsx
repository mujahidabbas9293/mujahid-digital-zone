import React, { useState } from 'react';
import {
  Settings,
  Save,
  CheckCircle2,
  ShieldCheck,
  Phone,
  Bot,
  Globe,
  Copy,
  ExternalLink,
  Share2,
  Check,
  Crown,
  Smartphone,
  Laptop,
  Tablet,
  Download,
  FolderArchive,
  Package,
  Loader2,
  AlertCircle,
  FileCode,
  Server,
  KeyRound
} from 'lucide-react';
import { BotStatus } from '../types';

interface SettingsViewProps {
  status: BotStatus | null;
  onSaveSettings: (settings: {
    bot_name?: string;
    admin_phone?: string;
    support_number?: string;
    warning_limit?: number;
    member_profile_photo?: boolean;
    auto_reconnect?: boolean;
    public_app_url?: string;
  }) => Promise<void>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  status,
  onSaveSettings
}) => {
  const [botName, setBotName] = useState(status?.botName || 'Mujahid Digital Zone Bot');
  const [adminPhone, setAdminPhone] = useState(status?.adminPhone || '+923001234567');
  const [supportNumber, setSupportNumber] = useState(status?.supportNumber || '+923001234567');
  const [warningLimit, setWarningLimit] = useState(status?.warningLimit || 3);
  const [memberProfilePhoto, setMemberProfilePhoto] = useState(status?.memberProfilePhoto || false);
  const [autoReconnect, setAutoReconnect] = useState(true);
  const [publicAppUrlInput, setPublicAppUrlInput] = useState(status?.publicAppUrl || '');
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [isExportingZip, setIsExportingZip] = useState(false);
  const [exportStatusText, setExportStatusText] = useState<string | null>(null);
  const [exportSuccessText, setExportSuccessText] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  const handleDownloadWebsiteZip = async () => {
    setIsExportingZip(true);
    setExportStatusText('Preparing complete website ZIP...');
    setExportSuccessText(null);
    setExportError(null);

    try {
      const response = await fetch('/api/admin/export-website', {
        method: 'POST',
        headers: {
          'Accept': 'application/zip',
          'x-admin-role': 'owner'
        }
      });

      if (!response.ok) {
        let errMsg = 'Failed to generate website ZIP';
        try {
          const errData = await response.json();
          errMsg = errData.error || errMsg;
        } catch (_) {}
        throw new Error(errMsg);
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = 'mujahid-digital-zone-complete-website.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      setExportStatusText(null);
      setExportSuccessText('Complete website ZIP downloaded successfully.');
      setTimeout(() => {
        setExportSuccessText(null);
      }, 7000);
    } catch (err: any) {
      console.error('Export website error:', err);
      setExportStatusText(null);
      setExportError(err?.message || 'Error occurred while preparing website ZIP archive.');
    } finally {
      setIsExportingZip(false);
    }
  };

  // Sync state if status updates
  React.useEffect(() => {
    if (status?.publicAppUrl) {
      setPublicAppUrlInput(status.publicAppUrl);
    }
  }, [status?.publicAppUrl]);

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

  const publicOrigin = getPublicOrigin();
  const publishLinkUrl = publicOrigin
    ? `${publicOrigin}/owner`
    : (typeof window !== 'undefined' ? `${window.location.origin}/owner` : '/owner');

  const handleCopy = (text: string, key: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedLink(key);
    setTimeout(() => setCopiedLink(null), 2500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSavedSuccess(false);
    try {
      await onSaveSettings({
        bot_name: botName.trim(),
        admin_phone: adminPhone.trim(),
        support_number: supportNumber.trim(),
        warning_limit: Number(warningLimit),
        member_profile_photo: memberProfilePhoto,
        auto_reconnect: autoReconnect,
        public_app_url: publicAppUrlInput.trim()
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">Settings & Owner Panel Link</h2>
        <p className="text-xs text-slate-400 mt-1">
          Customize bot display branding, administrative dispatch phone numbers, and manage the Owner Panel Link for all devices.
        </p>
      </div>

      {/* Independent Owner Panel & Publish Link Section */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-800/80 rounded-2xl border border-emerald-500/30 p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-bold text-white">Owner Panel Link (Standard Web Dashboard)</h3>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-mono font-bold">
                  👑 OWNER ACCESS — ALL DEVICES
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Universal link for Mobile Phone, PC/Laptop, and Tablet. Opens the full administrative bot operations dashboard.
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800 shrink-0">
            <span className="flex items-center gap-1 text-emerald-400 font-semibold"><Smartphone className="w-3.5 h-3.5" /> Mobile</span>
            <span className="text-slate-600">•</span>
            <span className="flex items-center gap-1 text-sky-400 font-semibold"><Laptop className="w-3.5 h-3.5" /> PC</span>
            <span className="text-slate-600">•</span>
            <span className="flex items-center gap-1 text-purple-400 font-semibold"><Tablet className="w-3.5 h-3.5" /> Tablet</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="w-full flex-1 bg-slate-950 border rounded-xl px-4 py-2.5 text-xs sm:text-sm font-mono truncate shadow-inner text-emerald-400 border-emerald-500/30">
            {publishLinkUrl}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            <button
              type="button"
              onClick={() => handleCopy(publishLinkUrl, 'publish')}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {copiedLink === 'publish' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Owner Link</span>
                </>
              )}
            </button>

            <a
              href={publishLinkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-none px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open Owner Panel</span>
            </a>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <span>
            <strong>Multi-Device Guaranteed:</strong> This link opens seamlessly on any device (Android, iPhone, iPad, Windows, Mac, Linux) without Service Unavailable errors. Reseller customer keys use their separate link in the Reseller Panel.
          </span>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-3 bg-emerald-950/20 border border-emerald-500/30 rounded-xl text-xs font-semibold text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Bot configuration saved successfully!</span>
        </div>
      )}

      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Bot Display Name
              </label>
              <input
                type="text"
                value={botName}
                onChange={(e) => setBotName(e.target.value)}
                placeholder="Mujahid Digital Zone Bot"
                required
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Strike Warning Limit (Auto-Kick Threshold)
              </label>
              <select
                value={warningLimit}
                onChange={(e) => setWarningLimit(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value={1}>1 Strike (Instant kick on first violation)</option>
                <option value={2}>2 Strikes</option>
                <option value={3}>3 Strikes (Standard WhatsApp group rule)</option>
                <option value={5}>5 Strikes (Lenient policy)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Admin Forwarding Phone Number
              </label>
              <input
                type="text"
                value={adminPhone}
                onChange={(e) => setAdminPhone(e.target.value)}
                placeholder="+923001234567"
                required
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Member Support / Appeal Number
              </label>
              <input
                type="text"
                value={supportNumber}
                onChange={(e) => setSupportNumber(e.target.value)}
                placeholder="+923001234567"
                required
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <div className="col-span-1 sm:col-span-2">
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Owner Link / Public App URL (PUBLIC_APP_URL)
              </label>
              <input
                type="url"
                value={publicAppUrlInput}
                onChange={(e) => setPublicAppUrlInput(e.target.value)}
                placeholder="https://your-public-app-url.com"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-emerald-400 focus:outline-none focus:border-emerald-500 font-mono"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Enter your deployed production URL. This value is used centrally as the base URL to generate the <strong>Owner Link</strong>, <strong>Reseller Links</strong>, and <strong>Customer Links</strong> so they open correctly in all environments without 404 errors.
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800 space-y-4">
            <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-700/60 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Welcome / New Member Automation</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">Control live WhatsApp join greeting and profile picture delivery</p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${memberProfilePhoto ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-700 text-slate-400'}`}>
                  {memberProfilePhoto ? 'Profile Pic: ON' : 'Profile Pic: OFF'}
                </span>
              </div>

              <label className="flex items-center justify-between cursor-pointer p-3 bg-slate-900/60 rounded-lg border border-slate-700/80 hover:border-slate-600 transition">
                <div className="pr-4">
                  <div className="text-xs font-semibold text-white">Send New Member Profile Picture</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    When active, downloads the member's genuine WhatsApp profile photo and sends it as an image with caption. If the user has no photo or when OFF, sends clean text-only greeting. Zero fake photos.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={memberProfilePhoto}
                  onChange={(e) => setMemberProfilePhoto(e.target.checked)}
                  className="w-4 h-4 rounded accent-emerald-500 cursor-pointer shrink-0"
                />
              </label>
            </div>

            <label className="flex items-center justify-between cursor-pointer p-3 bg-slate-800/40 rounded-lg border border-slate-700/60">
              <div>
                <div className="text-xs font-semibold text-white">Auto-Reconnect on Socket Drop</div>
                <div className="text-[11px] text-slate-400">Automatically re-establish connection if network hiccups occur on VPS</div>
              </div>
              <input
                type="checkbox"
                checked={autoReconnect}
                onChange={(e) => setAutoReconnect(e.target.checked)}
                className="w-4 h-4 rounded accent-emerald-500 cursor-pointer"
              />
            </label>
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all flex items-center space-x-1.5"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save Configuration'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Complete Website ZIP Project Export Section */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-950 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <FolderArchive className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">Download Complete Website ZIP</h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                  Full Project Source
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Export the complete, production-ready website source code archive ready to deploy on any VPS, Docker, or Cloud Run instance.
              </p>
            </div>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
              <FileCode className="w-3.5 h-3.5" />
              <span>Full Source Code</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Includes all React frontend components, TypeScript/Express server, API routes, and Tailwind styling.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
              <Package className="w-3.5 h-3.5" />
              <span>Complete Subsystems</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Contains Owner Panel, Reseller Portal, Customer Dashboard, Key system, and WhatsApp Baileys automation modules.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
              <Server className="w-3.5 h-3.5" />
              <span>Deployment Ready</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Packaged with PM2 configs, VPS setup scripts, package.json, sanitized database state, and 10-step README.
            </p>
          </div>
        </div>

        {/* Status Feedback Banners */}
        {exportStatusText && (
          <div className="p-3.5 bg-blue-950/30 border border-blue-500/30 rounded-xl text-xs font-medium text-blue-300 flex items-center gap-2.5 animate-pulse">
            <Loader2 className="w-4 h-4 text-blue-400 animate-spin shrink-0" />
            <span>{exportStatusText}</span>
          </div>
        )}

        {exportSuccessText && (
          <div className="p-3.5 bg-emerald-950/30 border border-emerald-500/40 rounded-xl text-xs font-semibold text-emerald-300 flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{exportSuccessText}</span>
          </div>
        )}

        {exportError && (
          <div className="p-3.5 bg-rose-950/30 border border-rose-500/40 rounded-xl text-xs font-medium text-rose-300 flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{exportError}</span>
          </div>
        )}

        {/* Security & Action Footer */}
        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              <strong>Security Guaranteed:</strong> Active WhatsApp session tokens, passwords, and private secrets are strictly excluded.
            </span>
          </div>

          <button
            type="button"
            onClick={handleDownloadWebsiteZip}
            disabled={isExportingZip}
            className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-950/50 transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
          >
            {isExportingZip ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Preparing complete website ZIP...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download Complete Website ZIP</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
