import { mediaUrl } from '@/api/axios';
import { initials } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface Props {
  name: string;
  photo?: string | null;
  size?: number;
  className?: string;
}

export function EmployeeAvatar({ name, photo, size = 40, className }: Props) {
  const src = mediaUrl(photo ?? null);
  const style = { width: size, height: size, fontSize: size * 0.4 };

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        style={style}
        className={cn('rounded-full object-cover', className)}
      />
    );
  }

  return (
    <div
      style={style}
      className={cn(
        'flex items-center justify-center rounded-full bg-accent/10 font-semibold text-accent',
        className
      )}
    >
      {initials(name) || '?'}
    </div>
  );
}
