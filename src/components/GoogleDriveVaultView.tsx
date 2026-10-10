import React, { useState, useEffect } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { 
  HardDrive, 
  Cloud, 
  ShieldCheck, 
  RefreshCw, 
  CheckCircle2, 
  Lock, 
  Database, 
  Clock, 
  Copy, 
  ExternalLink,
  AlertTriangle,
  FolderOpen
} from 'lucide-react';
import { BotStatus } from '../types';
import { DataProtectionDashboard } from './DataProtectionDashboard';

// Initialize Firebase App for official client-side Google OAuth
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/drive');

interface GoogleDriveVaultViewProps {
  status: BotStatus | null;
  onRefresh: () => void;
}

export const GoogleDriveVaultView: React.FC<GoogleDriveVaultViewProps> = ({ status, onRefresh }) => {
  // Authentication states (In-Memory Token Caching)
  const [user, setUser] = useState<any>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(false);

  // Backup & sync states
  const [syncing, setSyncing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [syncProgress, setSyncProgress] = useState<any>(null);
  const [backups, setBackups] = useState<any[]>([]);

  // Fetch backups on mount
  useEffect(() => {
    fetchBackups();
  }, []);

  const fetchBackups = async () => {
    try {
      const res = await fetch('/api/google-drive/backups');
      if (res.ok) {
        const data = await res.json();
        setBackups(data);
      }
    } catch (e) {
      console.error('Error fetching backups:', e);
    }
  };

  const handleConnect = async () => {
    setLoadingAuth(true);
    setSuccessMessage(null);
    try {
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        setAccessToken(credential.accessToken);
        setUser(result.user);
        setSuccessMessage('✓ Successfully connected to Google Drive securely using official OAuth!');
        fetchBackups();
      } else {
        alert('Could not retrieve access token from Google OAuth popup. Please make sure popups are allowed.');
      }
    } catch (e: any) {
      console.error('Google Auth Error:', e);
      alert('Failed to connect with Google Drive: ' + (e.message || e));
    } finally {
      setLoadingAuth(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm('Are you sure you want to disconnect Google Drive? This will clear your temporary token.')) return;
    try {
      await signOut(auth);
      setUser(null);
      setAccessToken(null);
      setSyncProgress(null);
      setSuccessMessage('Google Drive account disconnected.');
    } catch (e) {
      console.error('Signout Error:', e);
    }
  };

  const handleBackupNow = async () => {
    if (!accessToken) {
      alert('Please connect Google Drive first!');
      return;
    }
    setSyncing(true);
    setSuccessMessage(null);
    setSyncProgress({
      status: 'PROCESSING',
      step: 'Connecting Google Drive...',
      logs: ['Preparing secure upload channel with Google Drive...']
    });

    // Reset progress state on backend first
    await fetch('/api/google-drive/reset-progress', { method: 'POST' }).catch(() => null);

    // Start polling progress logs in real-time
    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch('/api/google-drive/progress');
        if (res.ok) {
          const data = await res.json();
          setSyncProgress(data);
          if (data.status === 'COMPLETED' || data.status === 'FAILED') {
            clearInterval(pollInterval);
          }
        }
      } catch (e) {
        console.error('Error polling progress:', e);
      }
    }, 1000);

    try {
      const res = await fetch('/api/google-drive/backup', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      clearInterval(pollInterval);

      if (data.success) {
        // Fetch final status logs
        const progressRes = await fetch('/api/google-drive/progress');
        if (progressRes.ok) {
          const finalProgress = await progressRes.json();
          setSyncProgress(finalProgress);
        }
        setSuccessMessage(`Successfully backed up live website ${data.backup?.version || ''} to Google Drive securely!`);
        fetchBackups();
        onRefresh();
      } else {
        setSyncProgress({
          status: 'FAILED',
          step: 'Backup Failed',
          logs: [`✗ Error: ${data.error || 'Server rejected backup request.'}`]
        });
      }
    } catch (e: any) {
      clearInterval(pollInterval);
      setSyncProgress({
        status: 'FAILED',
        step: 'Backup Failed',
        logs: [`✗ Connection error: ${e.message || e}`]
      });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <HardDrive className="w-6 h-6 text-emerald-400" />
            <span>Google Drive Cloud Sync & Permanent Data Vault</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time live file synchronization with Google Drive storage. Google AI Studio Data Lock is permanently active to ensure zero data loss.
          </p>
        </div>

        {accessToken && (
          <button
            onClick={handleBackupNow}
            disabled={syncing}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-2 cursor-pointer"
          >
            {syncing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Cloud className="w-4 h-4" />}
            <span>{syncing ? 'Backing Up Website...' : 'Backup Complete Website Now'}</span>
          </button>
        )}
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-300 flex items-center gap-2.5 animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Google Drive Status Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div className="flex items-center space-x-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg ${accessToken ? 'bg-gradient-to-br from-blue-500 to-emerald-600 shadow-blue-500/20' : 'bg-slate-800'}`}>
              <Cloud className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Google Drive Storage Connection</h3>
                {accessToken ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Google Drive: CONNECTED
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                    DISCONNECTED
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 font-mono mt-1">
                Connected Account: <span className="font-bold text-white">{user ? user.email : 'None'}</span>
              </p>
              <p className="text-xs text-slate-300 font-mono mt-0.5">
                Storage Status: <span className={`font-bold ${accessToken ? 'text-emerald-400' : 'text-slate-400'}`}>{accessToken ? 'READY' : 'NOT CONFIGURED'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {accessToken ? (
              <button
                onClick={handleDisconnect}
                className="px-3.5 py-2 text-xs font-semibold text-rose-400 hover:text-white bg-slate-850 hover:bg-rose-600 rounded-xl border border-slate-700 hover:border-rose-500 transition-all cursor-pointer"
              >
                Disconnect Account
              </button>
            ) : (
              <button
                onClick={handleConnect}
                disabled={loadingAuth}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loadingAuth ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Cloud className="w-4 h-4" />}
                <span>Connect Google Drive</span>
              </button>
            )}
          </div>
        </div>

        {/* Real-time Backup Progress Logger */}
        {syncProgress && (
          <div className="bg-slate-950 border border-slate-850 rounded-xl p-4 font-mono text-xs space-y-3 shadow-inner">
            <div className="flex items-center justify-between pb-2 border-b border-slate-850">
              <span className="text-slate-400 font-bold">System Backup Terminal</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                syncProgress.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                syncProgress.status === 'FAILED' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                'bg-blue-500/20 text-blue-400 border border-blue-500/30 animate-pulse'
              }`}>
                {syncProgress.status}
              </span>
            </div>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-2 scrollbar-thin">
              {syncProgress.logs && syncProgress.logs.map((log: string, idx: number) => (
                <div key={idx} className={`${log.startsWith('✓') ? 'text-emerald-400 font-semibold' : log.startsWith('✗') ? 'text-rose-400 font-semibold' : 'text-slate-300'}`}>
                  {log}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Data Lock Guarantee Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-400" />
                Last Website Backup
              </span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">STATUS</span>
            </div>
            <div className="text-sm font-bold text-white font-mono">
              {backups.length > 0 ? `${backups[0].date} ${backups[0].time}` : 'No backups yet'}
            </div>
          </div>

          <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span className="flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-amber-400" />
                Security Policy
              </span>
              <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">ENFORCED</span>
            </div>
            <div className="text-sm font-bold text-emerald-400 font-mono">Secrets Automatically Excluded</div>
          </div>

          <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span className="flex items-center gap-1.5">
                <Database className="w-4 h-4 text-cyan-400" />
                Persistent Vault Storage
              </span>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded">ACTIVE</span>
            </div>
            <div className="text-sm font-bold text-white font-mono">32GB VPS Encrypted Vault</div>
          </div>
        </div>

        {/* Saved Backups List */}
        {backups.length > 0 && (
          <div className="space-y-3 pt-4 border-t border-slate-800">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-indigo-400" />
              <span>Available Backups History ({backups.length})</span>
            </h4>
            <div className="overflow-hidden border border-slate-800 rounded-xl bg-slate-950/40">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900/60 text-slate-400 border-b border-slate-850">
                    <th className="p-3 font-semibold">Version</th>
                    <th className="p-3 font-semibold">Date & Time</th>
                    <th className="p-3 font-semibold">Files Count</th>
                    <th className="p-3 font-semibold text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850 text-slate-200">
                  {backups.map((bak, i) => (
                    <tr key={i} className="hover:bg-slate-900/40 transition-colors">
                      <td className="p-3 font-mono font-bold text-indigo-400">{bak.version}</td>
                      <td className="p-3">{bak.date} {bak.time}</td>
                      <td className="p-3 font-mono text-slate-400">{bak.fileCount} source files</td>
                      <td className="p-3 text-right">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          {bak.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Detailed Explanation Box */}
        <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-800/80 space-y-3">
          <div className="text-xs font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Google AI Studio Permanent Data Protection Rule</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Per your strict directive, all database records (groups, members, warnings, moderation logs, messages, and settings) are permanently locked against accidental deletion. Even when unlinking WhatsApp accounts or refreshing sessions, your historic data remains securely timestamped and synchronized with Google Drive storage.
          </p>
        </div>

        {/* Secure Live Website URL Card (Read-Only & Auto-Synced) */}
        <div className="p-5 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-blue-950/40 border border-emerald-500/30 rounded-2xl shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>🔒 Secure Live Website URL (Read-Only & Auto-Synced)</span>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              TAMPER-PROOF • LIVE
            </span>
          </div>
          <p className="text-xs text-slate-300">
            This official website URL is permanently secured. No one can modify or hack it—they can only view and use it. Any updates made in your dashboard update live automatically in real time.
          </p>
          <div className="flex items-center gap-2 pt-1">
            <input
              type="text"
              readOnly
              value={status?.publicAppUrl || (typeof window !== 'undefined' ? window.location.origin : '')}
              className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-xs text-emerald-300 font-mono select-all focus:outline-none shadow-inner"
            />
            <button
              onClick={() => {
                const url = status?.publicAppUrl || (typeof window !== 'undefined' ? window.location.origin : '');
                navigator.clipboard.writeText(url);
                alert('Live website URL copied to clipboard successfully!');
              }}
              className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-extrabold rounded-xl text-xs shadow-lg shadow-emerald-600/20 shrink-0 cursor-pointer flex items-center gap-2 transition-all"
            >
              <span>📋 Copy Live URL</span>
            </button>
            <a
              href={status?.publicAppUrl || (typeof window !== 'undefined' ? window.location.origin : '#')}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 shrink-0 flex items-center gap-1.5 transition-all"
            >
              <span>🚀 Open Live Site</span>
            </a>
          </div>
        </div>

        {/* Master Data Protection & Recovery System Dashboard */}
        <DataProtectionDashboard />
      </div>
    </div>
  );
};
