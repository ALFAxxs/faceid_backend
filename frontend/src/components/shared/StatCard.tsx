import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Spinner';
import { cn } from '@/lib/utils';

interface Props {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  accent?: 'blue' | 'green' | 'yellow' | 'gray';
  loading?: boolean;
}

const accents = {
  blue: 'text-accent bg-blue-50',
  green: 'text-entry bg-green-50',
  yellow: 'text-exit bg-amber-50',
  gray: 'text-gray-600 bg-gray-100',
};

export function StatCard({ label, value, icon, accent = 'blue', loading }: Props) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          {loading ? (
            <Skeleton className="mt-2 h-8 w-16" />
          ) : (
            <p className="mt-1 text-3xl font-bold text-gray-900">{value}</p>
          )}
        </div>
        {icon && (
          <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl text-2xl', accents[accent])}>
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}
