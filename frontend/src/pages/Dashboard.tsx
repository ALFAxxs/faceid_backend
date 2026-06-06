import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { getDashboardStats } from '@/api/reports';
import { getEvents } from '@/api/events';
import { getDevices } from '@/api/devices';
import { useWebSocket } from '@/hooks/useWebSocket';
import { StatCard } from '@/components/shared/StatCard';
import { EventRow } from '@/components/shared/EventRow';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { StatusDot } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/Spinner';
import { minutesToHours, todayStr } from '@/lib/utils';
import type { LiveEvent } from '@/types';

export default function Dashboard() {
  const qc = useQueryClient();
  const [live, setLive] = useState<LiveEvent[]>([]);

  const stats = useQuery({ queryKey: ['dashboard'], queryFn: getDashboardStats });
  const devices = useQuery({ queryKey: ['devices'], queryFn: () => getDevices() });
  const todayEvents = useQuery({
    queryKey: ['events', 'today'],
    queryFn: () => getEvents({ date: todayStr() }),
  });

  // Real-time WebSocket
  const { connected } = useWebSocket({
    onEvent: (ev) => {
      setLive((prev) => [ev, ...prev].slice(0, 20));
      // Statistikani va grafikni yangilash
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      qc.invalidateQueries({ queryKey: ['events', 'today'] });
    },
  });

  // Soatlik grafik ma'lumotlari (00:00 - 23:00)
  const chartData = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, h) => ({
      hour: `${String(h).padStart(2, '0')}:00`,
      kirish: 0,
      chiqish: 0,
    }));
    todayEvents.data?.results.forEach((ev) => {
      const h = new Date(ev.timestamp).getHours();
      if (ev.event_type === 'entry') hours[h].kirish++;
      else hours[h].chiqish++;
    });
    return hours;
  }, [todayEvents.data]);

  const onlineCount = devices.data?.filter((d) => d.status === 'online').length ?? 0;
  const totalDevices = devices.data?.length ?? 0;

  return (
    <div className="space-y-6">
      {/* Stat kartalar */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Bugungi kirganlar" value={stats.data?.today_entries ?? 0} icon="↓" accent="green" loading={stats.isLoading} />
        <StatCard label="Bugungi chiqqanlar" value={stats.data?.today_exits ?? 0} icon="↑" accent="yellow" loading={stats.isLoading} />
        <StatCard label="Hozir ichkarida" value={stats.data?.currently_inside ?? 0} icon="👤" accent="green" loading={stats.isLoading} />
        <StatCard
          label="O'rtacha ish soati"
          value={minutesToHours(stats.data?.avg_work_hours)}
          icon="⏱️"
          accent="blue"
          loading={stats.isLoading}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Grafik */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Bugungi kirish/chiqish (soatlar bo'yicha)</CardTitle>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="hour" tick={{ fontSize: 11 }} interval={1} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="kirish" name="Kirish" fill="#10B981" radius={[3, 3, 0, 0]} />
                <Bar dataKey="chiqish" name="Chiqish" fill="#F59E0B" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        {/* Real-time lenta */}
        <Card className="flex flex-col">
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Real-time eventlar</CardTitle>
            <span className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className={`h-2 w-2 rounded-full ${connected ? 'bg-entry' : 'bg-gray-300'}`} />
              {connected ? 'Ulangan' : 'Ulanmoqda...'}
            </span>
          </CardHeader>
          <CardBody className="flex-1 space-y-2 overflow-y-auto" style={{ maxHeight: 360 }}>
            {live.length === 0 ? (
              <EmptyState message="Yangi eventlar kutilmoqda..." />
            ) : (
              live.map((ev) => <EventRow key={`${ev.id}-${ev.timestamp}`} event={ev} />)
            )}
          </CardBody>
        </Card>
      </div>

      {/* Qurilmalar holati */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Qurilmalar holati</CardTitle>
          <span className="text-sm font-medium text-gray-600">
            {onlineCount}/{totalDevices} online
          </span>
        </CardHeader>
        <CardBody>
          {totalDevices === 0 ? (
            <EmptyState message="Qurilmalar yo'q" />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {devices.data?.map((d) => (
                <div key={d.id} className="rounded-lg border border-gray-200 p-3">
                  <div className="flex items-center gap-2">
                    <StatusDot online={d.status === 'online'} />
                    <span className="truncate text-sm font-medium">{d.name}</span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">{d.direction_display}</p>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
