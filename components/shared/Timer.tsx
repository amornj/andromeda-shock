'use client';

import { useState, useEffect } from 'react';

interface TimerProps {
  protocolStart: Date | null;
  lastReassessTime?: Date | null;
}

function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatElapsed(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
}

export default function Timer({ protocolStart, lastReassessTime }: TimerProps) {
  const [now, setNow] = useState<Date>(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!protocolStart) {
    return (
      <div className="bg-slate-900 border border-slate-700/60 rounded-2xl p-4">
        <p className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-2">
          Protocol Timer
        </p>
        <p className="text-slate-600 text-sm">Not started</p>
      </div>
    );
  }

  const protocolMs = now.getTime() - protocolStart.getTime();
  const sixHoursMs = 6 * 60 * 60 * 1000;
  const remainingMs = Math.max(0, sixHoursMs - protocolMs);
  const protocolPct = Math.min(100, (protocolMs / sixHoursMs) * 100);
  const isExpiring = remainingMs < 30 * 60 * 1000; // < 30 min
  const isExpired = remainingMs === 0;

  const sinceLast = lastReassessTime
    ? now.getTime() - lastReassessTime.getTime()
    : null;
  const reassessOverdue = sinceLast ? sinceLast > 60 * 60 * 1000 : false;

  return (
    <div className="bg-slate-900 border border-slate-700/60 rounded-2xl p-4 space-y-4">
      <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">
        Protocol Timer
      </p>

      {/* 6-hour countdown */}
      <div>
        <div className="flex justify-between items-baseline mb-1.5">
          <span className="text-xs text-slate-400">6-Hour Protocol</span>
          <span
            className={[
              'text-lg font-mono font-bold tabular-nums',
              isExpired
                ? 'text-red-400'
                : isExpiring
                ? 'text-yellow-400'
                : 'text-green-400',
            ].join(' ')}
          >
            {isExpired ? 'EXPIRED' : formatDuration(remainingMs)}
          </span>
        </div>
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
          <div
            className={[
              'h-full rounded-full transition-all',
              isExpired
                ? 'bg-red-500'
                : isExpiring
                ? 'bg-yellow-500'
                : 'bg-green-500',
            ].join(' ')}
            style={{ width: `${protocolPct}%` }}
          />
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Elapsed: {formatDuration(protocolMs)}
        </p>
      </div>

      {/* Reassessment timer */}
      {sinceLast !== null && (
        <div
          className={[
            'rounded-xl p-3 border',
            reassessOverdue
              ? 'bg-red-950/40 border-red-800/50'
              : 'bg-slate-800/60 border-slate-700/40',
          ].join(' ')}
        >
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-400">Since last CRT</span>
            <span
              className={[
                'text-sm font-mono font-semibold',
                reassessOverdue ? 'text-red-400' : 'text-slate-300',
              ].join(' ')}
            >
              {formatElapsed(sinceLast)}
            </span>
          </div>
          {reassessOverdue && (
            <p className="text-xs text-red-400 mt-1 font-medium">
              ⚠ CRT reassessment overdue!
            </p>
          )}
          {!reassessOverdue && (
            <p className="text-xs text-slate-500 mt-1">
              Reassess every hour
            </p>
          )}
        </div>
      )}

      {/* Started at */}
      <p className="text-xs text-slate-600">
        Started:{' '}
        {protocolStart.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })}
      </p>
    </div>
  );
}
