'use client';

import { useState } from 'react';
import type { LogEntry } from '@/lib/types';

const logColors: Record<LogEntry['logType'], string> = {
  success: 'text-green-400 bg-green-900/30 border-green-800/40',
  warning: 'text-yellow-400 bg-yellow-900/30 border-yellow-800/40',
  danger: 'text-red-400 bg-red-900/30 border-red-800/40',
  info: 'text-blue-400 bg-blue-900/30 border-blue-800/40',
};

const logIcons: Record<LogEntry['logType'], string> = {
  success: '✓',
  warning: '⚠',
  danger: '✕',
  info: '·',
};

interface DecisionLogProps {
  entries: LogEntry[];
}

export default function DecisionLog({ entries }: DecisionLogProps) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="bg-slate-900 border border-slate-700/60 rounded-2xl overflow-hidden">
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-800/40 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 uppercase tracking-wider font-medium">
            Decision Log
          </span>
          {entries.length > 0 && (
            <span className="text-xs bg-slate-700 text-slate-300 rounded-full px-2 py-0.5 font-medium">
              {entries.length}
            </span>
          )}
        </div>
        <span className="text-slate-500 text-sm">{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div className="border-t border-slate-700/60 max-h-80 overflow-y-auto">
          {entries.length === 0 ? (
            <p className="text-slate-600 text-sm p-4">No entries yet</p>
          ) : (
            <ul className="divide-y divide-slate-800/60">
              {[...entries].reverse().map((entry) => (
                <li key={entry.id} className="p-3">
                  <div className="flex items-start gap-2">
                    <span
                      className={[
                        'flex-shrink-0 w-5 h-5 rounded-full border text-xs flex items-center justify-center font-bold mt-0.5',
                        logColors[entry.logType],
                      ].join(' ')}
                    >
                      {logIcons[entry.logType]}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {entry.message}
                      </p>
                      <p className="text-xs text-slate-600 mt-1">
                        {entry.time.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
