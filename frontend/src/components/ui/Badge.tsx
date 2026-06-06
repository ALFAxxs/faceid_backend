import { cn } from '@/lib/utils';

type Tone = 'green' | 'yellow' | 'red' | 'gray' | 'blue';

const tones: Record<Tone, string> = {
  green: 'bg-green-100 text-green-700',
  yellow: 'bg-amber-100 text-amber-700',
  red: 'bg-red-100 text-red-700',
  gray: 'bg-gray-100 text-gray-600',
  blue: 'bg-blue-100 text-blue-700',
};

export function Badge({ tone = 'gray', children }: { tone?: Tone; children: React.ReactNode }) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', tones[tone])}>
      {children}
    </span>
  );
}

export function StatusDot({ online }: { online: boolean }) {
  return (
    <span
      className={cn('inline-block h-2.5 w-2.5 rounded-full', online ? 'bg-entry' : 'bg-denied')}
      title={online ? 'Online' : 'Offline'}
    />
  );
}
