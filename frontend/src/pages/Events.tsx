import { useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { getEvents, type EventFilters } from '@/api/events';
import { getDevices } from '@/api/devices';
import { Card, CardBody } from '@/components/ui/Card';
import { Input, Select, Field } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Table, THead, Th, Td } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Spinner, EmptyState } from '@/components/ui/Spinner';
import { formatDateTime, todayStr } from '@/lib/utils';
import { toast } from '@/store/toastStore';
import type { AccessEvent } from '@/types';

const PAGE_SIZE = 50;

export default function Events() {
  const [filters, setFilters] = useState<EventFilters>({ date: todayStr(), event_type: '', search: '' });
  const [deviceId, setDeviceId] = useState('');
  const [page, setPage] = useState(1);

  const devices = useQuery({ queryKey: ['devices'], queryFn: () => getDevices() });

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['events', filters, page],
    queryFn: () => getEvents({ ...filters, page }),
    placeholderData: keepPreviousData,
  });

  // Qurilma filtri klient tarafida (backend qurilma bo'yicha filtrlamaydi)
  const rows = (data?.results ?? []).filter(
    (e) => !deviceId || String(e.device) === deviceId
  );

  const totalPages = Math.ceil((data?.count ?? 0) / PAGE_SIZE);

  function update(patch: Partial<EventFilters>) {
    setPage(1);
    setFilters((f) => ({ ...f, ...patch }));
  }

  function exportCsv() {
    if (rows.length === 0) {
      toast.error("Eksport uchun ma'lumot yo'q");
      return;
    }
    const header = ['Xodim', 'Qurilma', "Yo'nalish", 'Vaqt', 'Ruxsat', 'Harorat'];
    const lines = rows.map((e) => [
      e.employee_name || "Noma'lum",
      e.device_name || '—',
      e.event_type_display,
      formatDateTime(e.timestamp),
      e.is_authorized ? 'Ha' : "Yo'q",
      e.temperature ?? '',
    ]);
    const csv = [header, ...lines]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `eventlar_${filters.date || 'all'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function rowClass(e: AccessEvent) {
    if (!e.is_authorized) return 'bg-red-50';
    return e.event_type === 'entry' ? 'bg-green-50/50' : 'bg-amber-50/50';
  }

  return (
    <div className="space-y-4">
      {/* Filter paneli */}
      <Card>
        <CardBody className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Field label="Sana">
            <Input type="date" value={filters.date} onChange={(e) => update({ date: e.target.value })} />
          </Field>
          <Field label="Event turi">
            <Select
              value={filters.event_type}
              onChange={(e) => update({ event_type: e.target.value as EventFilters['event_type'] })}
            >
              <option value="">Hammasi</option>
              <option value="entry">Kirish</option>
              <option value="exit">Chiqish</option>
            </Select>
          </Field>
          <Field label="Xodim qidirish">
            <Input
              placeholder="Ism yoki familiya"
              value={filters.search}
              onChange={(e) => update({ search: e.target.value })}
            />
          </Field>
          <Field label="Qurilma">
            <Select value={deviceId} onChange={(e) => setDeviceId(e.target.value)}>
              <option value="">Hammasi</option>
              {devices.data?.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>
          </Field>
          <div className="flex items-end">
            <Button variant="secondary" className="w-full" onClick={exportCsv}>
              ⬇ Export CSV
            </Button>
          </div>
        </CardBody>
      </Card>

      <Card>
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner className="h-8 w-8" />
          </div>
        ) : rows.length === 0 ? (
          <EmptyState message="Bu filtr bo'yicha eventlar topilmadi" />
        ) : (
          <>
            <Table>
              <THead>
                <tr>
                  <Th>Xodim</Th>
                  <Th>Qurilma</Th>
                  <Th>Yo'nalish</Th>
                  <Th>Vaqt</Th>
                  <Th>Ruxsat</Th>
                  <Th>Harorat</Th>
                </tr>
              </THead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((e) => (
                  <tr key={e.id} className={rowClass(e)}>
                    <Td className="font-medium">{e.employee_name || "Noma'lum"}</Td>
                    <Td>{e.device_name || '—'}</Td>
                    <Td>
                      <Badge tone={e.event_type === 'entry' ? 'green' : 'yellow'}>
                        {e.event_type_display}
                      </Badge>
                    </Td>
                    <Td>{formatDateTime(e.timestamp)}</Td>
                    <Td>
                      {e.is_authorized ? (
                        <Badge tone="green">Ruxsat</Badge>
                      ) : (
                        <Badge tone="red">Ruxsatsiz</Badge>
                      )}
                    </Td>
                    <Td>{e.temperature != null ? `${e.temperature}°C` : '—'}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>

            {/* Paginatsiya */}
            <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3 text-sm">
              <span className="text-gray-500">
                Jami: {data?.count ?? 0} ta {isFetching && '...'}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  ← Oldingi
                </Button>
                <span className="text-gray-600">
                  {page} / {totalPages || 1}
                </span>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Keyingi →
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
