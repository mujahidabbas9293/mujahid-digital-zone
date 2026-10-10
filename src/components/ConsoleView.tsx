import React from 'react';
import {
  Terminal,
  Trash2,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Info
} from 'lucide-react';
import { ConsoleLog } from '../types';

interface ConsoleViewProps {
  logs: ConsoleLog[];
  onClear: () => void;
}

export const ConsoleView: React.FC<ConsoleViewProps> = ({ logs, onClear }) => {
  const getLevelStyle = (level: string) => {
    switch (level) {
      case 'SUCCESS':
        return { text: 'text-emerald-400', icon: CheckCircle };
      case 'WARN':
        return { text: 'text-amber-400', icon: AlertTriangle };
      case 'DANGER':
        return { text: 'text-rose-400', icon: XCircle };
      default:
        return { text: 'text-sky-400', icon: Info };
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Real-Time Engine Console</h2>
          <p className="text-xs text-slate-400 mt-1">
            Raw event stream emitted by @whiskeysockets/baileys socket, anti-link engines, and command listeners.
          </p>
        </div>

        <button
          onClick={onClear}
          className="px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors flex items-center gap-1.5 self-start"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear Console</span>
        </button>
      </div>

      <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 font-mono text-xs shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-[11px] text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block"></span>
            <span className="ml-2 font-bold text-slate-400">baileys-worker-01 (stdout)</span>
          </div>
          <span className="tabular-nums">{logs.length} lines logged</span>
        </div>

        <div className="mt-3 space-y-2 max-h-[550px] overflow-y-auto pr-2">
          {logs.length === 0 ? (
            <div className="py-16 text-center text-slate-600">
              Terminal stream idle. Waiting for incoming socket events...
            </div>
          ) : (
            logs.map(log => {
              const { text, icon: Icon } = getLevelStyle(log.level);
              return (
                <div key={log.id} className="flex items-start gap-2.5 leading-relaxed hover:bg-slate-900/50 p-1 rounded">
                  <span className="text-slate-600 shrink-0 text-[10px] tabular-nums mt-0.5">[{log.timestamp}]</span>
                  <span className={`px-1 py-0.2 rounded text-[9px] font-bold border uppercase shrink-0 ${
                    log.level === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                    log.level === 'WARN' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                    log.level === 'DANGER' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                    'bg-sky-500/10 text-sky-400 border-sky-500/20'
                  }`}>
                    {log.tag}
                  </span>
                  <span className={`flex-1 break-words ${text}`}>
                    {log.message}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
