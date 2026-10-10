import React, { useState } from 'react';
import {
  Key,
  ShieldCheck,
  ShieldAlert,
  Zap,
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Layers,
  Sparkles,
  ArrowRight,
  Shield,
  MessageCircle
} from 'lucide-react';
import { ResellerState } from '../types';

interface ResellerPortalAuthViewProps {
  onAuthenticated: (licenseState: ResellerState, key: string) => void;
  initialError?: string | null;
}

export const ResellerPortalAuthView: React.FC<ResellerPortalAuthViewProps> = ({
  onAuthenticated,
  initialError
}) => {
  const [licenseKey, setLicenseKey] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(initialError || null);
  const [successInfo, setSuccessInfo] = useState<any | null>(null);

  const handleConnectAndActivate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanKey = licenseKey.trim().toUpperCase();
    if (!cleanKey) {
      setErrorMsg('Please paste or enter your License Key to connect.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg(null);
      setSuccessInfo(null);

      const res = await fetch('/api/reseller/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: cleanKey })
      });
      const data = await res.json();

      if (data.success && data.license) {
        const license = data.license;
        const remainingDays = license.remaining_days ?? (license.plan_days || 30);
        const resellerState: ResellerState = {
          is_master_admin: false,
          is_active_license: true,
          active_user: license,
          status_label: 'ACTIVE',
          remaining_days: remainingDays,
          activation_date: license.activated_at,
          expiry_date: license.expires_at,
          allowed_features: license.allowed_features || [],
          has_whatsapp_center: Boolean(license.has_whatsapp_center),
          has_group_control: license.has_group_control !== false
        };

        setSuccessInfo({
          username: license.username,
          remaining_days: remainingDays,
          allowed_count: (license.allowed_features || []).length + (license.has_whatsapp_center ? 1 : 0)
        });

        // Store persistently in localStorage
        try {
          localStorage.setItem('mdz_active_license_key', cleanKey);
        } catch (_) {}

        setTimeout(() => {
          onAuthenticated(resellerState, cleanKey);
        }, 800);
      } else {
        const err = data.error || 'Invalid License Key. Please check the key provided by your Admin.';
        setErrorMsg(err);
      }
    } catch (err: any) {
      setErrorMsg(`Connection error: ${err?.message || 'Server communication failed'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between font-sans relative overflow-hidden">
      {/* Background glow accents */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Top Bar with Logo & Support */}
      <header className="h-20 border-b border-slate-800/80 px-6 sm:px-12 flex items-center justify-between sticky top-0 z-20 backdrop-blur-md bg-slate-950/70">
        <div className="flex items-center space-x-3.5">
          <img
            src="/logo.svg"
            alt="Mujahid Digital Zone"
            className="w-11 h-11 rounded-xl object-cover border border-indigo-500/30 shadow-lg shadow-indigo-500/20"
          />
          <div>
            <div className="text-sm sm:text-base font-extrabold text-white tracking-tight">
              Mujahid Digital Zone
            </div>
            <div className="text-[11px] text-indigo-400 font-mono flex items-center gap-1.5 font-medium">
              <Shield className="w-3 h-3 text-indigo-400" />
              <span>Client & Reseller License Portal</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="https://wa.me/923001234567?text=Hello%20Support,%20I%20need%20help%20with%20my%20license%20key"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white font-bold text-xs rounded-xl border border-slate-700/80 transition-all flex items-center gap-2 shadow-sm"
          >
            <HelpCircle className="w-4 h-4 text-emerald-400" />
            <span>Support</span>
          </a>
        </div>
      </header>

      {/* Main License-First Activation Center */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 z-10">
        <div className="w-full max-w-lg bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center mx-auto text-indigo-400 shadow-inner">
              <Key className="w-7 h-7" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Enter License Key
            </h1>
            <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
              Paste your assigned working Key below to authenticate, load your customized allowed feature permissions, and enter your Dashboard.
            </p>
          </div>

          <form onSubmit={handleConnectAndActivate} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                <span>License / Key</span>
                <span className="text-[10px] text-slate-500 font-mono">Format: MDZ-LIC-XXXX-XXXX-XXXX</span>
              </label>

              <div className="relative">
                <Key className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Paste License Key Here..."
                  value={licenseKey}
                  onChange={(e) => {
                    setLicenseKey(e.target.value.toUpperCase());
                    if (errorMsg) setErrorMsg(null);
                  }}
                  autoFocus
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-11 pr-4 py-3.5 text-sm sm:text-base font-mono font-bold text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 shadow-inner tracking-wider"
                />
              </div>
            </div>

            {errorMsg && (
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-2.5 animate-in fade-in">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successInfo && (
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2.5 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  Welcome {successInfo.username}! License ACTIVE — {successInfo.remaining_days} Days Remaining ({successInfo.allowed_count} Features). Opening Dashboard...
                </span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !licenseKey.trim()}
              className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 disabled:opacity-50 text-white font-extrabold text-sm rounded-2xl transition-all shadow-xl shadow-indigo-600/25 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Validating & Connecting...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  <span>CONNECT / ACTIVATE</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </button>
          </form>

          {/* Feature Guarantee & Support Info */}
          <div className="pt-4 border-t border-slate-800/80 grid grid-cols-2 gap-3 text-center">
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/60">
              <ShieldCheck className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
              <div className="text-[11px] font-bold text-white">Permission Isolation</div>
              <div className="text-[10px] text-slate-400">Strict backend-enforced filters</div>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/60">
              <Sparkles className="w-4 h-4 text-indigo-400 mx-auto mb-1" />
              <div className="text-[11px] font-bold text-white">24/7 VPS Engine</div>
              <div className="text-[10px] text-slate-400">Continuous background runner</div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-500 border-t border-slate-900 bg-slate-950/80">
        Mujahid Digital Zone • High-Performance Multi-User VPS Platform • All Rights Reserved
      </footer>
    </div>
  );
};
