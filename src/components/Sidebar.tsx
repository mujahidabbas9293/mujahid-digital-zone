import React from 'react';
import {
  LayoutDashboard,
  Send,
  QrCode,
  Users2,
  UserCheck,
  AlertTriangle,
  Ban,
  Terminal,
  ShieldCheck,
  History,
  Server,
  Settings,
  FlaskConical,
  ShieldAlert,
  Megaphone,
  MessageSquareWarning,
  Sparkles,
  Radio,
  MessageCircle,
  HardDrive,
  CopyCheck,
  Users,
  Shield,
  Key,
  X
} from 'lucide-react';
import { ResellerState } from '../types';

export type NavTab =
  | 'dashboard'
  | 'auto-sender'
  | 'whatsapp-center'
  | 'message-status'
  | 'connection'
  | 'groups'
  | 'status-manager'
  | 'broadcast'
  | 'members'
  | 'admin-issues'
  | 'warnings'
  | 'blacklist'
  | 'console'
  | 'trust'
  | 'simulator'
  | 'logs'
  | 'deploy'
  | 'same-post-protection'
  | 'settings'
  | 'google-drive'
  | 'reseller-panel'
  | 'customer-approvals';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  activeWarningsCount: number;
  activeGroupsCount: number;
  pendingIssuesCount?: number;
  isConnected: boolean;
  samePostEnabled?: boolean;
  resellerStatus?: ResellerState | null;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  activeWarningsCount,
  activeGroupsCount,
  pendingIssuesCount = 0,
  isConnected,
  samePostEnabled: initialSamePostEnabled = true,
  resellerStatus,
  isMobileOpen = false,
  onCloseMobile
}) => {
  const [samePostEnabled, setSamePostEnabled] = React.useState<boolean>(initialSamePostEnabled);
  const [samePostLimit, setSamePostLimit] = React.useState<number>(2);

  React.useEffect(() => {
    const fetchSamePostState = async () => {
      try {
        const res = await fetch('/api/same-post-protection/settings');
        const data = await res.json();
        if (data && data.success) {
          setSamePostEnabled(data.enabled !== false);
          if (data.limit) setSamePostLimit(data.limit);
        }
      } catch (_) {}
    };
    fetchSamePostState();
    const interval = setInterval(fetchSamePostState, 3000);
    return () => clearInterval(interval);
  }, []);

  const isMasterAdmin = !resellerStatus || resellerStatus.is_master_admin;
  const isExpired = resellerStatus && resellerStatus.status_label === 'EXPIRED';
  const allowedFeatures = resellerStatus?.allowed_features || [];
  const hasWhatsAppCenter = true;
  const hasGroupControl = isMasterAdmin || resellerStatus?.has_group_control !== false;

  // Configured with proper recognizable original colors for each service icon
  const allNavItems = [
    {
      id: 'dashboard',
      featureId: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      iconColor: 'text-blue-400',
      activeColor: 'text-blue-400',
      activeBg: 'bg-blue-500/10 border-blue-500/20'
    },
    {
      id: 'auto-sender',
      featureId: 'auto-sender',
      label: 'WhatsApp Auto Sender',
      icon: Send,
      iconColor: 'text-[#25D366]',
      activeColor: 'text-[#25D366]',
      activeBg: 'bg-[#25D366]/15 border-[#25D366]/30',
      badge: '24/7 Cloud Auto Post',
      badgeColor: 'bg-[#25D366]/20 text-[#25D366]'
    },
    {
      id: 'message-status',
      featureId: 'message-status',
      label: 'Message Status',
      icon: Radio,
      iconColor: 'text-cyan-400',
      activeColor: 'text-cyan-400',
      activeBg: 'bg-cyan-500/10 border-cyan-500/20',
      badge: 'Active'
    },
    {
      id: 'connection',
      featureId: 'groups',
      label: 'Connection & QR',
      icon: QrCode,
      iconColor: 'text-teal-400',
      activeColor: 'text-teal-400',
      activeBg: 'bg-teal-500/10 border-teal-500/20',
      badge: isConnected ? 'Live' : 'Pair'
    },
    {
      id: 'groups',
      featureId: 'groups',
      label: 'Groups Moderation',
      icon: Users2,
      iconColor: 'text-indigo-400',
      activeColor: 'text-indigo-400',
      activeBg: 'bg-indigo-500/10 border-indigo-500/20',
      count: activeGroupsCount
    },
    {
      id: 'status-manager',
      featureId: 'advertisement',
      label: 'Status & Stories',
      icon: Sparkles,
      iconColor: 'text-purple-400',
      activeColor: 'text-purple-400',
      activeBg: 'bg-purple-500/10 border-purple-500/20'
    },
    {
      id: 'broadcast',
      featureId: 'broadcast',
      label: 'Broadcast Message',
      icon: Megaphone,
      iconColor: 'text-pink-400',
      activeColor: 'text-pink-400',
      activeBg: 'bg-pink-500/10 border-pink-500/20'
    },
    {
      id: 'members',
      featureId: 'members',
      label: 'Members Audit',
      icon: UserCheck,
      iconColor: 'text-sky-400',
      activeColor: 'text-sky-400',
      activeBg: 'bg-sky-500/10 border-sky-500/20'
    },
    {
      id: 'admin-issues',
      featureId: 'members',
      label: 'Admin Disputes',
      icon: MessageSquareWarning,
      iconColor: 'text-orange-400',
      activeColor: 'text-orange-400',
      activeBg: 'bg-orange-500/10 border-orange-500/20',
      count: pendingIssuesCount,
      isAlert: pendingIssuesCount > 0
    },
    {
      id: 'warnings',
      featureId: 'warnings',
      label: 'Warnings & Kicks',
      icon: AlertTriangle,
      iconColor: 'text-amber-400',
      activeColor: 'text-amber-400',
      activeBg: 'bg-amber-500/10 border-amber-500/20',
      count: activeWarningsCount,
      isAlert: activeWarningsCount > 0
    },
    {
      id: 'blacklist',
      featureId: 'blacklist',
      label: 'Blacklist Registry',
      icon: Ban,
      iconColor: 'text-rose-400',
      activeColor: 'text-rose-400',
      activeBg: 'bg-rose-500/10 border-rose-500/20'
    },
    {
      id: 'console',
      featureId: 'terminals',
      label: 'Commands & Terminal',
      icon: Terminal,
      iconColor: 'text-emerald-400',
      activeColor: 'text-emerald-400',
      activeBg: 'bg-emerald-500/10 border-emerald-500/20'
    },
    {
      id: 'trust',
      featureId: 'pons',
      label: 'Trust & Reputation',
      icon: ShieldCheck,
      iconColor: 'text-teal-400',
      activeColor: 'text-teal-400',
      activeBg: 'bg-teal-500/10 border-teal-500/20'
    },
    {
      id: 'simulator',
      featureId: 'simulator',
      label: 'Group Test Studio',
      icon: FlaskConical,
      iconColor: 'text-violet-400',
      activeColor: 'text-violet-400',
      activeBg: 'bg-violet-500/10 border-violet-500/20'
    },
    {
      id: 'logs',
      featureId: 'dashboard',
      label: 'Activity Audit Log',
      icon: History,
      iconColor: 'text-slate-400',
      activeColor: 'text-slate-300',
      activeBg: 'bg-slate-800 border-slate-700'
    },
    {
      id: 'deploy',
      featureId: 'deploy',
      label: 'VPS PM2 Deploy',
      icon: Server,
      iconColor: 'text-amber-300',
      activeColor: 'text-amber-300',
      activeBg: 'bg-amber-500/10 border-amber-500/20'
    },
    {
      id: 'same-post-protection',
      featureId: 'dashboard',
      label: 'Same Post Protection',
      icon: CopyCheck,
      iconColor: samePostEnabled ? 'text-emerald-400' : 'text-rose-400',
      activeColor: samePostEnabled ? 'text-emerald-300' : 'text-rose-300',
      activeBg: samePostEnabled ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-rose-500/10 border-rose-500/20',
      badge: samePostEnabled ? 'ON' : 'OFF',
      badgeColor: samePostEnabled
        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
        : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
    },
    {
      id: 'google-drive',
      featureId: 'region-control',
      label: 'Google Drive Vault',
      icon: HardDrive,
      iconColor: 'text-blue-400',
      activeColor: 'text-blue-400',
      activeBg: 'bg-blue-500/15 border-blue-500/30',
      badge: 'Synced',
      badgeColor: 'bg-blue-500/20 text-blue-400'
    },
    {
      id: 'customer-approvals',
      featureId: 'reseller-panel',
      label: 'Customer Approvals',
      icon: UserCheck,
      iconColor: 'text-emerald-400',
      activeColor: 'text-emerald-300',
      activeBg: 'bg-emerald-500/20 border-emerald-500/40',
      badge: 'New',
      badgeColor: 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/40'
    },
    {
      id: 'settings',
      featureId: 'settings',
      label: 'Bot Settings',
      icon: Settings,
      iconColor: 'text-zinc-400',
      activeColor: 'text-zinc-300',
      activeBg: 'bg-slate-800 border-slate-700'
    }
  ];

  // Strictly filter navigation tabs according to active license permissions
  const navItems = allNavItems.filter((item) => {
    if (isMasterAdmin) return true;

    // Never show Settings or Reseller Panel to restricted client users
    if (item.id === 'settings' || item.id === 'reseller-panel') return false;

    // Expired license blocks all protected feature views
    if (isExpired && item.id !== 'dashboard') return false;

    // Check WhatsApp Auto Sender & WhatsApp Center permission
    if (item.id === 'auto-sender' || item.id === 'whatsapp-center') {
      return hasWhatsAppCenter;
    }

    // Check Group Control features
    if (!hasGroupControl) {
      return item.id === 'dashboard';
    }

    // Check individual feature permission
    const fid = item.featureId;
    const aliases: Record<string, string[]> = {
      'dashboard': ['dashboard'],
      'message-status': ['message-status'],
      'groups': ['groups', 'group-manager', 'group'],
      'advertisement': ['advertisement', 'status-manager'],
      'broadcast': ['broadcast'],
      'members': ['members'],
      'warnings': ['warnings', 'warning', 'kicks', 'kick'],
      'blacklist': ['blacklist'],
      'terminals': ['terminals', 'console'],
      'pons': ['pons', 'trust'],
      'simulator': ['simulator', 'tester', 'test-studio'],
      'region-control': ['region-control', 'google-drive'],
      'deploy': ['dashboard']
    };

    const validKeys = aliases[fid] || [fid];
    return allowedFeatures.some(f => validKeys.includes(f));
  });

  const handleTabSelect = (tab: NavTab) => {
    onSelectTab(tab);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden transition-opacity"
        />
      )}

      <aside
        className={`w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-screen fixed left-0 top-0 z-50 select-none transition-transform duration-300 ease-in-out ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3 min-w-0">
            <img
              src="/logo.svg"
              alt="Mujahid Digital Zone Logo"
              className="w-10 h-10 rounded-xl object-cover shadow-lg shadow-blue-500/20 border border-blue-500/30 shrink-0"
            />
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold text-white tracking-tight truncate">
                Mujahid Digital Zone
              </span>
              <span className="text-xs text-emerald-400 font-medium flex items-center gap-1.5 mt-0.5">
                <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`}></span>
                Console Version A2-4
              </span>
            </div>
          </div>

          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Close Navigation"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

      {/* Account / License Status Pill in Sidebar */}
      {resellerStatus && (
        <div className="px-3 pt-2.5 pb-1">
          <div className={`p-2 rounded-xl text-[11px] font-mono border flex items-center justify-between ${
            isMasterAdmin
              ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30'
              : resellerStatus.is_active_license
              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
              : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
          }`}>
            <div className="flex items-center gap-1.5 truncate">
              {isMasterAdmin ? (
                <Shield className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              ) : (
                <Key className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              )}
              <span className="font-bold truncate">
                {isMasterAdmin
                  ? '👑 MASTER ADMIN'
                  : resellerStatus.is_active_license
                  ? `ACTIVE (${resellerStatus.remaining_days}d)`
                  : 'EXPIRED'}
              </span>
            </div>
            {!isMasterAdmin && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-950 font-bold">
                {resellerStatus.active_user?.username?.slice(0, 8) || 'User'}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
        <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
          <span>{isMasterAdmin ? 'Management' : 'Allowed Features'}</span>
          <span className="text-[9px] font-mono text-emerald-400 font-semibold bg-emerald-500/10 px-1.5 py-0.5 rounded">32 GB VPS</span>
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => handleTabSelect(item.id as NavTab)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                isActive
                  ? `${item.activeBg || 'bg-emerald-500/10 border-emerald-500/20'} ${item.activeColor || 'text-white'} border shadow-sm`
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center space-x-3 truncate">
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive ? (item.activeColor || 'text-emerald-400') : (item.iconColor || 'text-slate-400')
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>

              {item.count !== undefined && item.count > 0 && (
                <span
                  className={`px-1.5 py-0.5 text-[10px] rounded-full font-bold tabular-nums ${
                    item.isAlert
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {item.count}
                </span>
              )}

              {item.badge && (
                <span
                  className={`px-1.5 py-0.5 text-[10px] rounded font-semibold uppercase ${
                    item.badgeColor
                      ? item.badgeColor
                      : item.badge === 'Live'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer System Status */}
      <div className="p-3 border-t border-slate-800 bg-slate-900/60 space-y-1.5">
        <div className="bg-slate-800/60 rounded-xl p-2.5 border border-slate-700/60 text-[11px] text-slate-400 flex items-center justify-between">
          <div className="flex items-center space-x-2 truncate">
            <Server className="w-3.5 h-3.5 text-amber-300 shrink-0" />
            <span className="truncate font-mono">32GB VPS PM2</span>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 font-semibold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
            ONLINE
          </span>
        </div>
      </div>
    </aside>
    </>
  );
};
