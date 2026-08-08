'use client';

import type { OpeningHours } from '@chirudeli/shared-types';

const DAYS: Array<{ key: keyof OpeningHours; label: string }> = [
  { key: 'mon', label: 'Monday' },
  { key: 'tue', label: 'Tuesday' },
  { key: 'wed', label: 'Wednesday' },
  { key: 'thu', label: 'Thursday' },
  { key: 'fri', label: 'Friday' },
  { key: 'sat', label: 'Saturday' },
  { key: 'sun', label: 'Sunday' },
];

export const DEFAULT_OPENING_HOURS: OpeningHours = DAYS.reduce((acc, d) => {
  acc[d.key] = { open: '08:00', close: '18:00', closed: false };
  return acc;
}, {} as OpeningHours);

export function OpeningHoursEditor({ value, onChange }: { value: OpeningHours; onChange: (next: OpeningHours) => void }) {
  const set = (key: keyof OpeningHours, patch: Partial<OpeningHours[keyof OpeningHours]>) => {
    onChange({ ...value, [key]: { ...value[key], ...patch } });
  };

  return (
    <div className="space-y-2">
      {DAYS.map(({ key, label }) => {
        const day = value[key] ?? { open: '08:00', close: '18:00', closed: false };
        return (
          <div key={key} className="flex items-center gap-3 text-sm">
            <span className="w-24 text-neutral-600">{label}</span>
            <label className="flex items-center gap-1.5 text-xs text-neutral-500">
              <input
                type="checkbox"
                checked={!day.closed}
                onChange={(e) => set(key, { closed: !e.target.checked })}
                className="h-4 w-4 rounded"
              />
              Open
            </label>
            <input
              type="time"
              value={day.open}
              disabled={day.closed}
              onChange={(e) => set(key, { open: e.target.value })}
              className="h-9 rounded-lg border border-neutral-200 px-2 text-sm outline-none focus:border-primary-500 disabled:opacity-40"
            />
            <span className="text-neutral-400">to</span>
            <input
              type="time"
              value={day.close}
              disabled={day.closed}
              onChange={(e) => set(key, { close: e.target.value })}
              className="h-9 rounded-lg border border-neutral-200 px-2 text-sm outline-none focus:border-primary-500 disabled:opacity-40"
            />
          </div>
        );
      })}
    </div>
  );
}
