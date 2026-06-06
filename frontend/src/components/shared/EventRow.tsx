import { formatTime } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { LiveEvent } from '@/types';

export function EventRow({ event }: { event: LiveEvent }) {
  const isEntry = event.event_type === 'entry';
  return (
    <div
      className={cn(
        'flex items-center justify-between rounded-lg border-l-4 px-3 py-2',
        !event.is_authorized
          ? 'border-denied bg-red-50'
          : isEntry
          ? 'border-entry bg-green-50'
          : 'border-exit bg-amber-50'
      )}
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-gray-900">
          {event.employee || "Noma'lum"}
        </p>
        <p className="truncate text-xs text-gray-500">{event.device_id}</p>
      </div>
      <div className="ml-2 text-right">
        <span
          className={cn(
            'text-xs font-semibold',
            isEntry ? 'text-entry' : 'text-exit'
          )}
        >
          {isEntry ? '↓ Kirish' : '↑ Chiqish'}
        </span>
        <p className="text-xs text-gray-500">{formatTime(event.timestamp)}</p>
      </div>
    </div>
  );
}
