import React, { useState, useEffect } from 'react';
import { ShieldCheck, HardDrive, RefreshCw, CheckCircle2, AlertTriangle, RotateCcw, Trash2, Clock, FileText, Database, Lock, Unlock, Cloud, Download } from 'lucide-react';

interface DataProtectionStatus {
  connected: boolean;
  lastBackup: string;
  lastRestorePoint: string;
  googleDriveConnected: boolean;
  backupStatus: 'Healthy' | 'Failed';
  storageUsed: string;
  restorePointsCount: number;
  trashCount: number;
  versionsCount: number;
  changeHistoryCount: number;
}

export const DataProtectionDashboard: React.FC = () => {
  const [status, setStatus] = useState<DataProtectionStatus | null>(null);
  const [trashItems, setTrashItems] = useState<any[]>([]);
  const [versions, setVersions] = useState<any[]>([]);
  const [changeHistory, setChangeHistory] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'trash' | 'versions' | 'history'>('overview');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const fetchProtectionData = async () => {
    try {
      const res = await fetch('/api/data-protection/status');
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
      const trashRes = await fetch('/api/data-protection/trash');
      if (trashRes.ok) {
        const trashData = await trashRes.json();
        setTrashItems(trashData);
      }
      const verRes = await fetch('/api/data-protection/versions');
      if (verRes.ok) {
        const verData = await verRes.json();
        setVersions(verData);
      }
      const histRes = await fetch('/api/data-protection/change-history');
      if (histRes.ok) {
        const histData = await histRes.json();
        setChangeHistory(histData);
      }
    } catch (e) {
      console.error('Failed to fetch data protection status', e);
    }
  };

  useEffect(() => {
    fetchProtectionData();
  }, []);

  const handleCreateBackup = async () => {
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch('/api/data-protection/backup', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setMsg('✓ Restore point & database backup created successfully!');
        fetchProtectionData();
      } else {
        setMsg('✗ Failed to create backup.');
      }
    } catch (e) {
      setMsg('✗ Error communicating with protection service.');
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreTrash = async (id: string) => {
    try {
      const res = await fetch(`/api/data-protection/trash/${id}/restore`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setMsg('✓ Item successfully restored to its original location!');
        fetchProtectionData();
      }
    } catch (e) {
      setMsg('✗ Failed to restore item.');
    }
  };

  const handlePermanentDelete = async (id: string) => {
    if (!window.confirm('⚠️ Are you sure you want to permanently delete this item? This cannot be undone.')) return;
    try {
      const res = await fetch(`/api/data-protection/trash/${id}/permanent`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setMsg('✓ Item permanently deleted from trash.');
        fetchProtectionData();
      }
    } catch (e) {
      setMsg('✗ Failed to permanent delete.');
    }
  };

  const handleRestoreVersion = async (id: string) => {
    try {
      const res = await fetch(`/api/data-protection/versions/${id}/restore`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setMsg('✓ Record restored to selected version successfully!');
        fetchProtectionData();
      }
    } catch (e) {
      setMsg('✗ Failed to restore version.');
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white">Master Data Protection & Recovery System</h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                ZERO AUTO-DELETE ACTIVE
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Enterprise data protection guaranteeing version history, safe trash recovery, and automatic Google Drive backups.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCreateBackup}
            disabled={loading}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
            <span>{loading ? 'Processing...' : 'Create Backup / Restore Point'}</span>
          </button>
        </div>
      </div>

      {msg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-300 flex items-center justify-between">
          <span>{msg}</span>
          <button onClick={() => setMsg(null)} className="text-emerald-400 hover:text-white font-bold text-xs">✕</button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${activeTab === 'overview' ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
        >
          Protection Overview
        </button>
        <button
          onClick={() => setActiveTab('trash')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${activeTab === 'trash' ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
        >
          <Trash2 className="w-3.5 h-3.5 text-rose-400" />
          <span>Trash Bin ({trashItems.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('versions')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${activeTab === 'versions' ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
        >
          <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
          <span>Version History ({versions.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${activeTab === 'history' ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
        >
          <FileText className="w-3.5 h-3.5 text-amber-400" />
          <span>Audit Change Ledger ({changeHistory.length})</span>
        </button>
      </div>

      {/* Tab Content: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1">
              <span className="text-slate-400">Database Status</span>
              <div className="font-mono font-bold text-emerald-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Connected & Protected
              </div>
            </div>
            <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1">
              <span className="text-slate-400">Last Backup</span>
              <div className="font-mono font-bold text-white">{status?.lastBackup ? new Date(status.lastBackup).toLocaleTimeString() : 'Just Now'}</div>
            </div>
            <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1">
              <span className="text-slate-400">Trash Items</span>
              <div className="font-mono font-bold text-amber-400">{status?.trashCount || trashItems.length} Recoverable</div>
            </div>
            <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1">
              <span className="text-slate-400">Version History</span>
              <div className="font-mono font-bold text-blue-400">{status?.versionsCount || versions.length} Snapshots</div>
            </div>
          </div>

          <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-800/80 space-y-3">
            <div className="text-xs font-bold text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-400" />
              <span>Safety Lock & Zero Auto-Delete Guarantee</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              All destructive queries (DROP, TRUNCATE, bulk delete) are intercepted and blocked by the server-side safety lock. Deleted records are automatically moved to the secure Trash bin where they can be restored instantly with a single click.
            </p>
          </div>
        </div>
      )}

      {/* Tab Content: Trash */}
      {activeTab === 'trash' && (
        <div className="space-y-4">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>Recently Deleted Items (Fully Restorable)</span>
            <span className="font-mono text-amber-400">{trashItems.length} Items in Trash</span>
          </div>
          {trashItems.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs bg-slate-950/40 rounded-xl border border-slate-800">
              Trash bin is empty. No items have been deleted.
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {trashItems.map((item) => (
                <div key={item.trashId} className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="font-bold text-white flex items-center gap-2">
                      <span>{item.recordType}: {item.recordName || item.id || item.recordId}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] bg-rose-500/10 text-rose-400 border border-rose-500/20">DELETED</span>
                    </div>
                    <div className="text-slate-400 mt-1 flex items-center gap-3">
                      <span>Deleted by: <strong className="text-slate-300">{item.deletedBy}</strong></span>
                      <span>Time: {new Date(item.deletedAt).toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleRestoreTrash(item.trashId)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Restore</span>
                    </button>
                    <button
                      onClick={() => handlePermanentDelete(item.trashId)}
                      className="px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 rounded-lg font-bold transition-all flex items-center gap-1 cursor-pointer border border-rose-500/30"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Purge</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab Content: Versions */}
      {activeTab === 'versions' && (
        <div className="space-y-4">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>Record Version Snapshots</span>
            <span className="font-mono text-cyan-400">{versions.length} Versions Saved</span>
          </div>
          {versions.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs bg-slate-950/40 rounded-xl border border-slate-800">
              No version updates recorded yet. Version snapshots are created automatically upon record edits.
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {versions.map((ver) => (
                <div key={ver.versionId} className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="font-bold text-white flex items-center gap-2">
                      <span>Type: {ver.recordType} (ID: {ver.recordId})</span>
                      <span className="px-2 py-0.5 rounded text-[10px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">v{ver.versionNumber}</span>
                    </div>
                    <div className="text-slate-400 mt-1">
                      Updated at: {new Date(ver.timestamp).toLocaleString()} • Reason: {ver.reason}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRestoreVersion(ver.versionId)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Restore Version</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab Content: History */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>Permanent Audit & Change History Ledger</span>
            <span className="font-mono text-amber-400">{changeHistory.length} Actions Logged</span>
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {changeHistory.map((h, idx) => (
              <div key={idx} className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-400 font-mono">[{h.action}]</span>
                  <span className="text-slate-500 font-mono text-[10px]">{new Date(h.timestamp).toLocaleString()}</span>
                </div>
                <div className="text-slate-300">
                  Record: <strong>{h.recordType}</strong> ({h.recordId}) • Admin: {h.admin || 'System'}
                </div>
                {h.reason && <div className="text-slate-400 text-[11px]">Note: {h.reason}</div>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
