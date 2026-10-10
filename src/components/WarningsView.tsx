import React, { useState } from 'react';
import {
  AlertTriangle,
  UserX,
  ShieldAlert,
  Search
} from 'lucide-react';
import { WarningRecord, KickRecord } from '../types';

interface WarningsViewProps {
  warnings: WarningRecord[];
  kicks: KickRecord[];
}

export const WarningsView: React.FC<WarningsViewProps> = ({
  warnings,
  kicks
}) => {
  const [tab, setTab] = useState<'warnings' | 'kicks'>('warnings');
  const [search, setSearch] = useState('');

  const filteredWarnings = warnings.filter(w =>
    w.member_name.toLowerCase().includes(search.toLowerCase()) ||
    w.phone.includes(search) ||
    w.reason.toLowerCase().includes(search.toLowerCase())
  );

  const filteredKicks = kicks.filter(k =>
    k.member_name.toLowerCase().includes(search.toLowerCase()) ||
    k.phone.includes(search) ||
    k.reason.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Warnings & Automatic Kicks Log</h2>
          <p className="text-xs text-slate-400 mt-1">
            Audit trail of rule infractions, strike notices, and automated expulsion events.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setTab('warnings')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                tab === 'warnings' ? 'bg-amber-500/20 text-amber-400 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Warnings ({warnings.length})</span>
            </button>
            <button
              onClick={() => setTab('kicks')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                tab === 'kicks' ? 'bg-rose-500/20 text-rose-400 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserX className="w-3.5 h-3.5" />
              <span>Kicks ({kicks.length})</span>
            </button>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-md overflow-hidden">
        {tab === 'warnings' ? (
          filteredWarnings.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-xs">
              No warning events recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400">
                    <th className="py-3 px-4 font-semibold uppercase text-[10px]">Member</th>
                    <th className="py-3 px-4 font-semibold uppercase text-[10px]">Group</th>
                    <th className="py-3 px-4 font-semibold uppercase text-[10px]">Strike</th>
                    <th className="py-3 px-4 font-semibold uppercase text-[10px]">Violation Reason</th>
                    <th className="py-3 px-4 font-semibold uppercase text-[10px] text-right">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredWarnings.map(w => (
                    <tr key={w.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white">{w.member_name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">+{w.phone}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-300">{w.group_name}</td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded text-[11px] font-bold tabular-nums">
                          {w.warning_number}/3
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-300 font-medium">{w.reason}</td>
                      <td className="py-3 px-4 text-right text-slate-400 font-mono text-[11px] tabular-nums">
                        {new Date(w.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          filteredKicks.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-xs">
              No expulsion kicks executed yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400">
                    <th className="py-3 px-4 font-semibold uppercase text-[10px]">Member</th>
                    <th className="py-3 px-4 font-semibold uppercase text-[10px]">Group</th>
                    <th className="py-3 px-4 font-semibold uppercase text-[10px]">Expulsion Reason</th>
                    <th className="py-3 px-4 font-semibold uppercase text-[10px]">Rule Trigger</th>
                    <th className="py-3 px-4 font-semibold uppercase text-[10px] text-right">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredKicks.map(k => (
                    <tr key={k.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-rose-400">{k.member_name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">+{k.phone}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-300">{k.group_name}</td>
                      <td className="py-3 px-4 text-slate-200 font-medium">{k.reason}</td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                          {k.rule_trigger}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-slate-400 font-mono text-[11px] tabular-nums">
                        {new Date(k.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
