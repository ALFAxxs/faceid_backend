import { cn } from '@/lib/utils';

export function Table({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">{children}</table>
    </div>
  );
}

export function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <th className={cn('whitespace-nowrap px-4 py-3 text-left font-medium text-gray-500', className)}>
      {children}
    </th>
  );
}

export function Td({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <td className={cn('whitespace-nowrap px-4 py-3 text-gray-800', className)}>{children}</td>;
}

export function THead({ children }: { children: React.ReactNode }) {
  return <thead className="border-b border-gray-200 bg-gray-50">{children}</thead>;
}
