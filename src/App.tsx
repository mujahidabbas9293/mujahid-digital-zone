import React, { useState, useEffect, useCallback } from 'react';
import { HardDrive, RefreshCw, ExternalLink } from 'lucide-react';
import { Analytics } from '@vercel/analytics/react';
import { Sidebar, NavTab } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { DashboardView } from './components/DashboardView';
import { ConnectionView } from './components/ConnectionView';
import { GroupsView } from './components/GroupsView';
import { StatusManagerView } from './components/StatusManagerView';
import { BroadcastView } from './components/BroadcastView';
import { MembersView } from './components/MembersView';
import { AdminIssuesView } from './components/AdminIssuesView';
import { WarningsView } from './components/WarningsView';
import { BlacklistView } from './components/BlacklistView';
import { ConsoleView } from './components/ConsoleView';
import { TrustReviewsView } from './components/TrustReviewsView';
import { SimulatorView } from './components/SimulatorView';
import { MessageStatusView } from './components/MessageStatusView';
import { LogsView } from './components/LogsView';
import { DeployView } from './components/DeployView';
import { SettingsView } from './components/SettingsView';
import { WhatsAppCenterView } from './components/WhatsAppCenterView';
import { AutoSenderView } from './components/AutoSenderView';
import { GoogleDriveVaultView } from './components/GoogleDriveVaultView';
import { SamePostProtectionView } from './components/SamePostProtectionView';
import { ResellerPanelView } from './components/ResellerPanelView';
import { ResellerPortalAuthView } from './components/ResellerPortalAuthView';
import { LoginPortalView } from './components/LoginPortalView';
import { CustomerApprovalsView } from './components/CustomerApprovalsView';
import {
  BotStatus,
  Group,
  Member,
  WarningRecord,
  KickRecord,
  BlacklistRecord,
  TrustReview,
  AdminIssue,
  StatusTask,
  ActivityLog,
  ConsoleLog,
  ResellerState
} from './types';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class TabErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[TabErrorBoundary] Caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 bg-slate-900 border border-rose-500/30 rounded-3xl max-w-xl mx-auto my-12 text-center space-y-4 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto text-2xl font-bold">
            ⚠️
          </div>
          <h2 className="text-lg font-black text-white">Something went wrong</h2>
          <p className="text-xs text-rose-300 font-mono bg-slate-950/80 p-3.5 rounded-xl border border-rose-500/20 text-left overflow-x-auto">
            {this.state.error?.message || 'An unexpected rendering error occurred.'}
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
            }}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer"
          >
            Retry View
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '/admin';
  const isLoginRoute = pathname === '/login';
  const isAdminRoute = pathname.startsWith('/admin') || pathname === '/' || pathname === '';

  const hasCustomerSession = typeof window !== 'undefined' && Boolean(localStorage.getItem('customer_active_license_key'));
  const hasResellerSession = typeof window !== 'undefined' && Boolean(localStorage.getItem('mdz_reseller_session'));

  if (isAdminRoute && hasCustomerSession) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full bg-slate-900 border border-rose-500/30 rounded-3xl p-8 shadow-2xl text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto text-2xl font-bold">
            403
          </div>
          <h1 className="text-xl font-black text-white">403 Unauthorized</h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            Access denied. Customer sessions cannot access the Owner/Admin Panel (`/admin`).
          </p>
          <a
            href="/customer"
            className="inline-block px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition"
          >
            Go to Customer Dashboard
          </a>
        </div>
      </div>
    );
  }

  if (isAdminRoute && hasResellerSession && !localStorage.getItem('mdz_owner_session')) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full bg-slate-900 border border-rose-500/30 rounded-3xl p-8 shadow-2xl text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto text-2xl font-bold">
            403
          </div>
          <h1 className="text-xl font-black text-white">403 Unauthorized</h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            Access denied. Reseller accounts cannot access the Owner/Admin Panel (`/admin`).
          </p>
          <a
            href="/reseller"
            className="inline-block px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition"
          >
            Go to Reseller Dashboard
          </a>
        </div>
      </div>
    );
  }

  if (isLoginRoute) {
    return (
      <LoginPortalView
        onLoginSuccess={(role, data) => {
          if (role === 'OWNER') {
            localStorage.setItem('mdz_owner_session', 'active');
            window.location.href = '/admin';
          } else if (role === 'RESELLER') {
            localStorage.setItem('mdz_reseller_session', 'active');
            window.location.href = '/reseller';
          } else if (role === 'CUSTOMER') {
            const key = data.license_key || 'MDZ-LIC-VIP-8899-7700';
            localStorage.setItem('customer_active_license_key', key);
            window.location.href = `/customer/${key}`;
          }
        }}
      />
    );
  }

  const isAdminLoggedIn = typeof window !== 'undefined' && Boolean(localStorage.getItem('mdz_active_license_key'));
  const isCustomerMode = typeof window !== 'undefined' && window.location.pathname.startsWith('/customer');

  const [previewingCustomerKey, setPreviewingCustomerKey] = useState<string | null>(null);

  const [custToken, setCustToken] = useState<string | null>(() => {
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/customer')) {
      const pathParts = window.location.pathname.split('/').filter(Boolean);
      if (pathParts.length >= 2 && pathParts[1] !== 'portal') {
        return pathParts[1].trim().toUpperCase();
      }
    }
    return null;
  });

  const [deviceUuid] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      let uuid = localStorage.getItem('customer_device_uuid');
      if (!uuid) {
        uuid = 'dev_' + Math.random().toString(36).substring(2, 15).toUpperCase();
        localStorage.setItem('customer_device_uuid', uuid);
      }
      return uuid;
    }
    return '';
  });

  const [custLicStatus, setCustLicStatus] = useState<any>(null);
  const [custLicError, setCustLicError] = useState<string | null>(null);
  const [activationInput, setActivationInput] = useState<string>('');
  const [isActivatingCust, setIsActivatingCust] = useState<boolean>(false);
  const [isAppInitializing, setIsAppInitializing] = useState<boolean>(true);

  const custId = custToken ? 'lic_' + custToken.toLowerCase().replace(/[^a-zA-Z0-9_-]/g, '_') : 'default_customer';

  useEffect(() => {
    if (!isCustomerMode || !custToken) {
      if (isCustomerMode && !custToken) {
        setIsAppInitializing(false);
      }
      return;
    }

    const verifyCustLicense = async () => {
      try {
        const res = await fetch(`/api/reseller/status?license_key=${encodeURIComponent(custToken)}&device_uuid=${encodeURIComponent(deviceUuid)}`, {
          headers: { 'X-License-Key': custToken }
        });
        const data = await res.json();
        if (data && data.is_active_license) {
          setCustLicStatus(data);
          setCustLicError(null);
        } else {
          setCustLicStatus(null);
          const errMsg = data.status_label === 'EXPIRED'
            ? 'This License Key has EXPIRED.'
            : data.status_label === 'DEVICE_LIMIT_REACHED'
            ? 'Device limit reached. This license key is already active on maximum allowed devices.'
            : data.status_label === 'REVOKED'
            ? 'This License Key has been revoked by Admin.'
            : 'Invalid or deactivated license key.';
          setCustLicError(errMsg);
        }
      } catch (err) {
        setCustLicStatus(null);
        setCustLicError('Connection error verifying license key.');
      } finally {
        setIsAppInitializing(false);
      }
    };

    verifyCustLicense();
    const interval = setInterval(verifyCustLicense, 10000);
    return () => clearInterval(interval);
  }, [isCustomerMode, custToken, deviceUuid]);

  const handleActivateCustKey = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanKey = activationInput.trim().toUpperCase();
    if (!cleanKey) return;

    setIsActivatingCust(true);
    setCustLicError(null);

    try {
      const res = await fetch('/api/reseller/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: cleanKey, device_uuid: deviceUuid })
      });
      const data = await res.json();
      if (data.success && data.license) {
        if (typeof window !== 'undefined') {
          window.history.pushState(null, '', `/customer/${cleanKey}`);
        }
        setCustToken(cleanKey);
        setCustLicStatus(data);
        setActivationInput('');
      } else {
        setCustLicError(data.error || 'Activation failed. Invalid or expired key.');
      }
    } catch (err) {
      setCustLicError('Network error during activation.');
    } finally {
      setIsActivatingCust(false);
    }
  };

  const handleLogoutCust = () => {
    localStorage.removeItem('customer_active_license_key');
    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', '/customer');
    }
    setCustToken(null);
    setCustLicStatus(null);
    setCustLicError(null);
  };

  const isPortalUrl = typeof window !== 'undefined' && (
    window.location.pathname.startsWith('/reseller') ||
    window.location.pathname.startsWith('/portal') ||
    window.location.search.includes('reseller=portal') ||
    window.location.search.includes('reseller=true') ||
    window.location.search.includes('portal=true')
  );

  const [activeLicenseKey, setActiveLicenseKey] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('mdz_active_license_key') || null;
    }
    return null;
  });

  const [portalUnlocked, setPortalUnlocked] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('mdz_active_license_key');
      const isPortal = window.location.pathname.startsWith('/reseller') ||
                       window.location.pathname.startsWith('/portal') ||
                       window.location.search.includes('reseller=portal') ||
                       window.location.search.includes('reseller=true');
      if (isPortal) {
        return Boolean(stored);
      }
      return true;
    }
    return true;
  });

  const [status, setStatus] = useState<BotStatus | null>(null);
  const [resellerStatus, setResellerStatus] = useState<ResellerState | null>(null);

  const getInitialTab = (): NavTab => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      if (p.has('reseller') || p.get('tab') === 'reseller-panel') {
        return 'reseller-panel';
      }
      if (p.has('customer') || p.has('customerId') || p.has('c') || p.get('tab') === 'whatsapp-center') {
        return 'whatsapp-center';
      }
      const requested = p.get('tab') as NavTab;
      if (requested) return requested;
    }
    return 'dashboard';
  };

  const [currentTab, setCurrentTab] = useState<NavTab>(getInitialTab);
  const [groups, setGroups] = useState<Group[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [warnings, setWarnings] = useState<WarningRecord[]>([]);
  const [kicks, setKicks] = useState<KickRecord[]>([]);
  const [blacklist, setBlacklist] = useState<BlacklistRecord[]>([]);
  const [trustReviews, setTrustReviews] = useState<TrustReview[]>([]);
  const [adminIssues, setAdminIssues] = useState<AdminIssue[]>([]);
  const [statusTasks, setStatusTasks] = useState<StatusTask[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [consoleLogs, setConsoleLogs] = useState<ConsoleLog[]>([]);

  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isPairingLoading, setIsPairingLoading] = useState(false);
  const [isUnlinking, setIsUnlinking] = useState(false);
  const [driveLastSync, setDriveLastSync] = useState<string>(new Date().toLocaleTimeString());
  const [isDriveSyncing, setIsDriveSyncing] = useState<boolean>(false);
  const [driveSyncMsg, setDriveSyncMsg] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  const handleSyncToGoogleDrive = async () => {
    setIsDriveSyncing(true);
    setDriveSyncMsg(null);
    try {
      const res = await fetch('/api/google-drive/sync', {
        method: 'POST',
        headers: activeLicenseKey ? { 'X-License-Key': activeLicenseKey } : {}
      });
      const data = await res.json();
      if (data.success) {
        setDriveLastSync(new Date().toLocaleTimeString());
        setDriveSyncMsg('Synced to Google Drive Vault');
        setTimeout(() => setDriveSyncMsg(null), 4000);
      }
    } catch (e) {
      setDriveSyncMsg('Sync error');
    } finally {
      setIsDriveSyncing(false);
    }
  };

  const handleLogoutLicense = () => {
    try {
      localStorage.removeItem('mdz_active_license_key');
    } catch (_) {}
    setActiveLicenseKey(null);
    setResellerStatus(null);
    if (isPortalUrl) {
      setPortalUnlocked(false);
    } else {
      fetch('/api/reseller/switch-mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'MASTER' })
      }).then(() => fetchData());
    }
  };

  // Fetch all live state
  const fetchData = useCallback(async () => {
    if (isCustomerMode) return;
    try {
      const headers: Record<string, string> = {};
      if (activeLicenseKey) {
        headers['X-License-Key'] = activeLicenseKey;
      }

      const [
        resStatus,
        resGroups,
        resMembers,
        resWarnings,
        resKicks,
        resBlacklist,
        resReviews,
        resIssues,
        resTasks,
        resLogs,
        resConsole,
        resReseller
      ] = await Promise.all([
        fetch('/api/status', { headers }).then(r => r.json()).catch(() => null),
        fetch('/api/groups', { headers }).then(r => r.json()).catch(() => []),
        fetch('/api/members', { headers }).then(r => r.json()).catch(() => []),
        fetch('/api/warnings', { headers }).then(r => r.json()).catch(() => []),
        fetch('/api/kicks', { headers }).then(r => r.json()).catch(() => []),
        fetch('/api/blacklist', { headers }).then(r => r.json()).catch(() => []),
        fetch('/api/trust-reviews', { headers }).then(r => r.json()).catch(() => []),
        fetch('/api/admin-issues', { headers }).then(r => r.json()).catch(() => []),
        fetch('/api/status-manager/tasks', { headers }).then(r => r.json()).catch(() => []),
        fetch('/api/logs', { headers }).then(r => r.json()).catch(() => []),
        fetch('/api/console/logs', { headers }).then(r => r.json()).catch(() => []),
        fetch(`/api/reseller/status${activeLicenseKey ? `?license_key=${encodeURIComponent(activeLicenseKey)}` : ''}`, { headers }).then(r => r.json()).catch(() => null)
      ]);

      if (resReseller) {
        setResellerStatus(resReseller);
      }

      if (resStatus) {
        setStatus(resStatus);
        if (resStatus.status === 'UNLINKED' || !resStatus.profile) {
          setGroups([]);
          setMembers([]);
          setWarnings([]);
          setKicks([]);
          setBlacklist([]);
          setTrustReviews([]);
          setAdminIssues([]);
          setStatusTasks([]);
          setActivityLogs([]);
          setConsoleLogs([]);
        } else {
          if (Array.isArray(resGroups)) setGroups(resGroups);
          if (Array.isArray(resMembers)) setMembers(resMembers);
          if (Array.isArray(resWarnings)) setWarnings(resWarnings);
          if (Array.isArray(resKicks)) setKicks(resKicks);
          if (Array.isArray(resBlacklist)) setBlacklist(resBlacklist);
          if (Array.isArray(resReviews)) setTrustReviews(resReviews);
          if (Array.isArray(resIssues)) setAdminIssues(resIssues);
          if (Array.isArray(resTasks)) setStatusTasks(resTasks);
          if (Array.isArray(resLogs)) setActivityLogs(resLogs);
          if (Array.isArray(resConsole)) setConsoleLogs(resConsole);
        }
      }
    } catch (e) {
      console.error('Polling error:', e);
    } finally {
      setIsAppInitializing(false);
    }
  }, [activeLicenseKey]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 4000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Ensure current tab is allowed according to license permissions
  useEffect(() => {
    if (resellerStatus && !resellerStatus.is_master_admin) {
      const allowed = resellerStatus.allowed_features || [];
      const hasWA = resellerStatus.has_whatsapp_center;

      const isCurrentTabAllowed =
        currentTab === 'dashboard' ||
        currentTab === 'auto-sender' ||
        (currentTab === 'whatsapp-center' && hasWA) ||
        (currentTab === 'message-status' && allowed.includes('message-status')) ||
        (currentTab === 'groups' && (allowed.includes('groups') || allowed.includes('group-manager') || allowed.includes('group'))) ||
        (currentTab === 'broadcast' && allowed.includes('broadcast')) ||
        (currentTab === 'members' && allowed.includes('members')) ||
        (currentTab === 'warnings' && (allowed.includes('warnings') || allowed.includes('warning') || allowed.includes('kicks') || allowed.includes('kick'))) ||
        (currentTab === 'blacklist' && allowed.includes('blacklist')) ||
        (currentTab === 'console' && (allowed.includes('terminals') || allowed.includes('console'))) ||
        (currentTab === 'trust' && (allowed.includes('pons') || allowed.includes('trust'))) ||
        (currentTab === 'simulator' && (allowed.includes('simulator') || allowed.includes('tester'))) ||
        (currentTab === 'google-drive' && (allowed.includes('region-control') || allowed.includes('google-drive'))) ||
        (currentTab === 'status-manager' && (allowed.includes('advertisement') || allowed.includes('status-manager')));

      if (!isCurrentTabAllowed) {
        setCurrentTab('dashboard');
      }
    }
  }, [resellerStatus, currentTab]);

  // Actions
  const handleRefreshQr = async () => {
    const headers: Record<string, string> = {};
    if (activeLicenseKey) {
      headers['X-License-Key'] = activeLicenseKey;
    }
    await fetch('/api/connector/connect', { method: 'POST', headers });
    await fetchData();
  };

  const handleRequestPairingCode = async (phone: string) => {
    setIsPairingLoading(true);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (activeLicenseKey) {
        headers['X-License-Key'] = activeLicenseKey;
      }
      const res = await fetch('/api/connector/pairing-code', {
        method: 'POST',
        headers,
        body: JSON.stringify({ phoneNumber: phone, phone })
      });
      const data = await res.json().catch(() => null);
      if (data?.pairingCode) {
        setStatus(prev => prev ? { ...prev, pairingCode: data.pairingCode } : prev);
      }
      await fetchData();
    } catch (err) {
      console.error('Failed to request pairing code:', err);
    } finally {
      setIsPairingLoading(false);
    }
  };

  const handleUnlink = async () => {
    setIsUnlinking(true);
    setStatus(null);
    setGroups([]);
    setMembers([]);
    setWarnings([]);
    setKicks([]);
    setBlacklist([]);
    setTrustReviews([]);
    setAdminIssues([]);
    setStatusTasks([]);
    setActivityLogs([]);
    setConsoleLogs([]);

    const headers: Record<string, string> = {};
    if (activeLicenseKey) {
      headers['X-License-Key'] = activeLicenseKey;
    }

    try {
      const activeKey = localStorage.getItem('mdz_active_license_key');
      const customerId = localStorage.getItem('mdz_whatsapp_center_customer_id');
      const activeResUser = localStorage.getItem('mdz_active_reseller_user');

      localStorage.clear();
      sessionStorage.clear();

      if (activeKey) localStorage.setItem('mdz_active_license_key', activeKey);
      if (customerId) localStorage.setItem('mdz_whatsapp_center_customer_id', customerId);
      if (activeResUser) localStorage.setItem('mdz_active_reseller_user', activeResUser);
    } catch (_) {}

    try {
      await Promise.all([
        fetch('/api/connector/unlink', { method: 'POST', headers }),
        fetch('/api/connector/reset-session-cache', { method: 'POST', headers })
      ]);
    } catch (_) {}

    setCurrentTab('connection');
    await fetchData();
    setIsUnlinking(false);
  };

  const handleToggleActive = async (jid: string, active: boolean) => {
    await fetch(`/api/groups/${jid}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: active })
    });
    await fetchData();
  };

  const handleToggleLock = async (jid: string, locked: boolean) => {
    const ep = locked ? `/api/groups/${jid}/lock` : `/api/groups/${jid}/unlock`;
    await fetch(ep, { method: 'POST' });
    await fetchData();
  };

  const handleUpdateGroup = async (jid: string, updates: Partial<Group>) => {
    await fetch(`/api/groups/${jid}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    await fetchData();
  };

  const handleJoinLink = async (inviteLink: string, name?: string) => {
    await fetch('/api/groups/join-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inviteLink, name })
    });
    await fetchData();
  };

  const handleRemoveGroup = async (jid: string) => {
    await fetch(`/api/groups/${jid}`, { method: 'DELETE' });
    await fetchData();
  };

  const handleCreateStatusTask = async (taskData: any) => {
    await fetch('/api/status-manager/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(taskData)
    });
    await fetchData();
  };

  const handleSendBroadcast = async (message: string) => {
    const res = await fetch('/api/broadcast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message })
    });
    const data = await res.json();
    await fetchData();
    return { sent: data.sent, total: data.total };
  };

  const handleUnwarn = async (senderJid: string, groupJid: string) => {
    await fetch('/api/members/unwarn', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sender_jid: senderJid, group_jid: groupJid })
    });
    await fetchData();
  };

  const handleKick = async (senderJid: string, groupJid: string, reason?: string) => {
    await fetch('/api/members/kick', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sender_jid: senderJid, group_jid: groupJid, reason })
    });
    await fetchData();
  };

  const handleWarnMember = async (senderJid: string, groupJid: string, phone: string, name: string, reason: string) => {
    await fetch('/api/members/warn', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sender_jid: senderJid, group_jid: groupJid, phone, name, reason })
    });
    await fetchData();
  };

  const handleSyncMembers = async () => {
    await fetch('/api/members/sync-all', { method: 'POST' });
    await fetchData();
  };

  const handleAddBlacklist = async (phone: string, reason: string) => {
    await fetch('/api/blacklist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, reason })
    });
    await fetchData();
  };

  const handleRemoveBlacklist = async (phone: string) => {
    await fetch(`/api/blacklist/${phone}`, { method: 'DELETE' });
    await fetchData();
  };

  const handleAddReview = async (review: any) => {
    await fetch('/api/trust-reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(review)
    });
    await fetchData();
  };

  const handleUpdateIssue = async (id: string, updates: Partial<AdminIssue>) => {
    await fetch(`/api/admin-issues/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    await fetchData();
  };

  const handleClearConsole = async () => {
    await fetch('/api/console/clear', { method: 'POST' });
    setConsoleLogs([]);
  };

  const handleTriggerBackup = async () => {
    setIsBackingUp(true);
    try {
      await fetch('/api/backup/trigger', { method: 'POST' });
      await fetchData();
    } finally {
      setTimeout(() => setIsBackingUp(false), 800);
    }
  };

  const handleSaveSettings = async (settingsUpdates: any) => {
    await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settingsUpdates)
    });
    await fetchData();
  };

  const isConnected = status?.status === 'CONNECTED';
  const activeWarningsCount = warnings.filter(w => w.is_active).length;
  const activeGroupsCount = groups.filter(g => g.is_active).length;
  const pendingIssuesCount = adminIssues.filter(i => i.status === 'PENDING').length;

  if (isAppInitializing) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 font-sans">
        <style>{`
          @keyframes infinite-loading {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(300%); }
          }
          .animate-infinite-loading {
            animation: infinite-loading 1.4s infinite cubic-bezier(0.4, 0, 0.2, 1);
          }
        `}</style>
        <div className="max-w-md w-full text-center space-y-6 relative">
          <div className="absolute -inset-10 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none animate-pulse"></div>
          
          <div className="space-y-4 relative">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto text-2xl font-bold shadow-lg shadow-emerald-500/10 animate-pulse">
              🛡️
            </div>
            
            <div className="space-y-1">
              <h1 className="text-xl font-black text-white tracking-widest uppercase">
                MUJAHID DIGITAL ZONE
              </h1>
              <h2 className="text-xs font-extrabold text-slate-400 tracking-wider">
                WELCOME
              </h2>
            </div>

            <div className="pt-3 max-w-xs mx-auto space-y-2.5">
              <p className="text-xs text-emerald-400 font-mono font-bold tracking-wide animate-pulse">
                Loading...
              </p>
              
              {/* Horizontal animated loading line/progress indicator */}
              <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden relative">
                <div className="h-full bg-emerald-500 rounded-full w-1/3 animate-infinite-loading"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isCustomerMode && (!custToken || !custLicStatus)) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6 relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-44 h-44 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto text-2xl font-bold shadow-lg shadow-emerald-500/10">
              🔑
            </div>
            <h1 className="text-xl font-black text-white tracking-tight">Mujahid Digital Zone</h1>
            <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
              Welcome to your dedicated Customer Portal. Please enter your Activation Key to retrieve your isolated workspace.
            </p>
          </div>

          <form onSubmit={handleActivateCustKey} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 block">Activation Key</label>
              <input
                type="text"
                placeholder="e.g. MDZ-LIC-XXXX-XXXX-XXXX"
                value={activationInput}
                onChange={e => setActivationInput(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3.5 text-xs sm:text-sm font-mono text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 shadow-inner text-center tracking-wider"
              />
            </div>

            {custLicError && (
              <div className="p-3.5 bg-rose-500/15 border border-rose-500/20 text-rose-300 rounded-xl text-xs font-bold flex items-center gap-2">
                <span>⚠️</span>
                <span>{custLicError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isActivatingCust || !activationInput.trim()}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl transition-all shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isActivatingCust ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <span>ACTIVATE PORTAL</span>
              )}
            </button>
          </form>

          <div className="text-center text-[10px] text-slate-500 pt-2 border-t border-slate-800/80">
            Isolated VPS Instance System • Runs 24/7 in Background
          </div>
        </div>
      </div>
    );
  }

  if (isCustomerMode) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
        {/* Beautiful, Isolated Customer Portal Header */}
        <header className="bg-slate-900 border-b border-slate-800 p-4 sticky top-0 z-30 shadow-md">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-[#25D366]/15 border border-[#25D366]/30 flex items-center justify-center text-[#25D366] shadow">
                <RefreshCw className="w-5 h-5 animate-spin" style={{ animationDuration: '3s' }} />
              </div>
              <div>
                <h1 className="text-base font-black text-white tracking-tight">Mujahid Digital Zone</h1>
                <p className="text-[10px] text-slate-400">Independent Customer Portal & Live WhatsApp Worker</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="text-xs text-emerald-400 font-mono bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg font-bold">
                {custLicStatus?.active_user?.username || 'Active Instance'} ({custLicStatus?.remaining_days}d left)
              </span>
              
              <button
                onClick={handleLogoutCust}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold border border-slate-700 transition-colors"
                title="Log Out or Switch Key Instance"
              >
                Change Key
              </button>
            </div>
          </div>
        </header>

        {/* Clean, Dedicated Customer Workspace */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 overflow-y-auto">
          <WhatsAppCenterView 
            customerIdProp={custId} 
            customerTokenProp={custToken || undefined} 
            isCustomerOnlyMode={true} 
          />
        </main>
      </div>
    );
  }

  if (isPortalUrl && (!portalUnlocked || !activeLicenseKey)) {
    return (
      <ResellerPortalAuthView
        onAuthenticated={(licState, key) => {
          setActiveLicenseKey(key);
          setResellerStatus(licState);
          setPortalUnlocked(true);
          try {
            localStorage.setItem('mdz_active_license_key', key);
          } catch (_) {}
          fetchData();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans">
      {/* Sidebar with Desktop Fixed & Mobile Drawer Support */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        activeWarningsCount={activeWarningsCount}
        activeGroupsCount={activeGroupsCount}
        pendingIssuesCount={pendingIssuesCount}
        isConnected={isConnected}
        resellerStatus={resellerStatus}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area: Responsive 100% on Mobile/Tablet, ml-64 on Desktop */}
      <div className="flex-1 ml-0 lg:ml-64 flex flex-col min-w-0 transition-all duration-300">
        <TopBar
          status={status}
          onOpenWhatsAppCenter={() => setCurrentTab('auto-sender')}
          onOpenMessageStatus={() => setCurrentTab('message-status')}
          onOpenSimulator={() => setCurrentTab('simulator')}
          onTriggerBackup={handleTriggerBackup}
          onOpenDeploy={() => setCurrentTab('deploy')}
          onRefresh={fetchData}
          onUnlink={handleUnlink}
          isBackingUp={isBackingUp}
          resellerStatus={resellerStatus}
          onLogoutLicense={handleLogoutLicense}
          onToggleMobileMenu={() => setIsMobileMenuOpen(prev => !prev)}
        />

        <main className="flex-1 p-3 sm:p-5 lg:p-6 overflow-y-auto">
          <TabErrorBoundary key={currentTab}>
          {currentTab === 'dashboard' && (
            <DashboardView
              status={status}
              activityLogs={activityLogs}
              groups={groups}
              onNavigate={(tab) => setCurrentTab(tab as NavTab)}
              resellerStatus={resellerStatus}
              onRefreshGlobal={fetchData}
            />
          )}

          {currentTab === 'auto-sender' && (
            <AutoSenderView />
          )}

          {currentTab === 'whatsapp-center' && (
            <WhatsAppCenterView />
          )}

          {currentTab === 'google-drive' && (
            <GoogleDriveVaultView
              status={status}
              onRefresh={fetchData}
            />
          )}

          {currentTab === 'message-status' && (
            <MessageStatusView
              onNavigateToSimulator={() => setCurrentTab('simulator')}
            />
          )}

          {currentTab === 'connection' && (
            <ConnectionView
              status={status}
              onRefreshQr={handleRefreshQr}
              onRequestPairingCode={handleRequestPairingCode}
              onUnlink={handleUnlink}
              isPairingLoading={isPairingLoading}
            />
          )}

          {currentTab === 'groups' && (
            <GroupsView
              groups={groups}
              status={status}
              onToggleActive={handleToggleActive}
              onToggleLock={handleToggleLock}
              onUpdateGroup={handleUpdateGroup}
              onJoinLink={handleJoinLink}
              onRemoveGroup={handleRemoveGroup}
            />
          )}

          {currentTab === 'status-manager' && (
            <StatusManagerView
              groups={groups}
              tasks={statusTasks}
              onCreateTask={handleCreateStatusTask}
              status={status}
            />
          )}

          {currentTab === 'broadcast' && (
            <BroadcastView
              groups={groups}
              onSendBroadcast={handleSendBroadcast}
            />
          )}

          {currentTab === 'members' && (
            <MembersView
              members={members}
              groups={groups}
              onUnwarn={handleUnwarn}
              onKick={handleKick}
              onWarnMember={handleWarnMember}
              onBlacklistMember={(phone, reason) => handleAddBlacklist(phone, reason)}
              onSyncMembers={handleSyncMembers}
            />
          )}

          {currentTab === 'admin-issues' && (
            <AdminIssuesView
              issues={adminIssues}
              onUpdateIssue={handleUpdateIssue}
            />
          )}

          {currentTab === 'warnings' && (
            <WarningsView
              warnings={warnings}
              kicks={kicks}
            />
          )}

          {currentTab === 'blacklist' && (
            <BlacklistView
              blacklist={blacklist}
              onAddBlacklist={handleAddBlacklist}
              onRemoveBlacklist={handleRemoveBlacklist}
            />
          )}

          {currentTab === 'console' && (
            <ConsoleView
              logs={consoleLogs}
              onClear={handleClearConsole}
            />
          )}

          {currentTab === 'trust' && (
            <TrustReviewsView
              reviews={trustReviews}
              onAddReview={handleAddReview}
            />
          )}

          {currentTab === 'simulator' && (
            <SimulatorView groups={groups} />
          )}

          {currentTab === 'logs' && (
            <LogsView logs={activityLogs} />
          )}

          {currentTab === 'deploy' && (
            <DeployView />
          )}

          {currentTab === 'same-post-protection' && (
            <SamePostProtectionView
              groups={groups}
              status={status}
            />
          )}

          {currentTab === 'reseller-panel' && (
            <ResellerPanelView
              onSelectTab={(tab) => setCurrentTab(tab as NavTab)}
              onRefreshGlobal={fetchData}
              status={status}
              onPreviewCustomer={(key) => setPreviewingCustomerKey(key)}
            />
          )}

          {currentTab === 'customer-approvals' && (
            <CustomerApprovalsView />
          )}

          {currentTab === 'settings' && (
            <SettingsView
              status={status}
              onSaveSettings={handleSaveSettings}
            />
          )}
          </TabErrorBoundary>
        </main>
      </div>

      {/* Customer Portal Preview Modal (Admin Sandbox) */}
      {previewingCustomerKey && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col font-sans">
          <header className="bg-slate-900 border-b border-slate-800 p-4 flex items-center justify-between shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                🔑
              </div>
              <div>
                <h2 className="text-sm font-black text-white">Customer Portal Preview (Admin Sandbox)</h2>
                <p className="text-[10px] text-slate-400 font-mono">License Key: {previewingCustomerKey}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => window.open(`/customer/${previewingCustomerKey}`, '_blank')}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open in New Tab</span>
              </button>
              <button
                onClick={() => setPreviewingCustomerKey(null)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </header>
          <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 overflow-y-auto">
            <WhatsAppCenterView 
              customerIdProp={'lic_' + previewingCustomerKey.toLowerCase().replace(/[^a-zA-Z0-9_-]/g, '_')} 
              customerTokenProp={previewingCustomerKey} 
              isCustomerOnlyMode={true} 
            />
          </main>
        </div>
      )}

      {/* Persistent Bottom-Right Google Drive Sync Button & Last Sync Timestamp */}
      <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 bg-slate-900/95 border border-slate-700/80 shadow-2xl rounded-2xl p-2.5 backdrop-blur-md">
        <div className="flex flex-col px-2">
          <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
            Google Drive Vault
          </span>
          <span className="text-[11px] font-mono font-bold text-white">
            Last Sync: {driveLastSync}
          </span>
        </div>
        <button
          onClick={handleSyncToGoogleDrive}
          disabled={isDriveSyncing}
          className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-600/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          title="Force-sync all application state (logs, status, settings) to connected Google Drive vault"
        >
          <HardDrive className={`w-3.5 h-3.5 ${isDriveSyncing ? 'animate-spin' : ''}`} />
          <span>{isDriveSyncing ? 'Syncing...' : 'Sync to Google Drive'}</span>
        </button>
        {driveSyncMsg && (
          <span className="absolute -top-8 right-0 bg-emerald-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg animate-in fade-in">
            {driveSyncMsg}
          </span>
        )}
      </div>

      {/* Resetting / Unlinking Overlay */}
      {isUnlinking && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col items-center space-y-4 max-w-sm w-full text-center">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <RefreshCw className="w-6 h-6 animate-spin" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Resetting WhatsApp Session...</h3>
              <p className="text-xs text-slate-400 mt-1">Clearing backend session cache, terminating socket, and purging local cache keys.</p>
            </div>
          </div>
        </div>
      )}
      <Analytics />
    </div>
  );
}
