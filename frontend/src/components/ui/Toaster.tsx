import { useToastStore } from '@/store/toastStore';
import { cn } from '@/lib/utils';

const tones = {
  success: 'bg-green-600',
  error: 'bg-red-600',
  info: 'bg-gray-800',
};

export function Toaster() {
  const { toasts, remove } = useToastStore();
  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          onClick={() => remove(t.id)}
          className={cn(
            'cursor-pointer rounded-lg px-4 py-3 text-sm text-white shadow-lg animate-[fadeIn_.2s]',
            tones[t.type]
          )}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
