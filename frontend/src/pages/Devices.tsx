import { useState, FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getDevices,
  createDevice,
  updateDevice,
  deleteDevice,
  type DevicePayload,
} from '@/api/devices';
import { Card, CardBody } from '@/components/ui/Card';
import { Input, Select, Field } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Badge, StatusDot } from '@/components/ui/Badge';
import { Table, THead, Th, Td } from '@/components/ui/Table';
import { Spinner, EmptyState } from '@/components/ui/Spinner';
import { formatDateTime } from '@/lib/utils';
import { toast } from '@/store/toastStore';
import type { Device } from '@/types';

export default function Devices() {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Device | null>(null);

  const { data: devices, isLoading } = useQuery({ queryKey: ['devices'], queryFn: () => getDevices() });

  const delMutation = useMutation({
    mutationFn: deleteDevice,
    onSuccess: () => {
      toast.success("Qurilma o'chirildi");
      qc.invalidateQueries({ queryKey: ['devices'] });
    },
  });

  function handleDelete(d: Device) {
    if (confirm(`"${d.name}" qurilmasini o'chirishni tasdiqlaysizmi?`)) {
      delMutation.mutate(d.id);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
        >
          + Yangi qurilma
        </Button>
      </div>

      <Card>
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner className="h-8 w-8" />
          </div>
        ) : (devices ?? []).length === 0 ? (
          <EmptyState message="Qurilmalar yo'q" />
        ) : (
          <Table>
            <THead>
              <tr>
                <Th>Nomi</Th>
                <Th>Device ID</Th>
                <Th>IP manzil</Th>
                <Th>Joylashuv</Th>
                <Th>Yo'nalish</Th>
                <Th>Status</Th>
                <Th>Oxirgi ko'rilgan</Th>
                <Th></Th>
              </tr>
            </THead>
            <tbody className="divide-y divide-gray-100">
              {devices!.map((d) => (
                <tr key={d.id}>
                  <Td className="font-medium">{d.name}</Td>
                  <Td className="font-mono text-xs">{d.device_id}</Td>
                  <Td>{d.ip_address || '—'}</Td>
                  <Td>{d.location}</Td>
                  <Td>
                    <Badge tone={d.direction === 'entry' ? 'green' : 'yellow'}>
                      {d.direction_display}
                    </Badge>
                  </Td>
                  <Td>
                    <span className="flex items-center gap-1.5">
                      <StatusDot online={d.status === 'online'} />
                      {d.status_display}
                    </span>
                  </Td>
                  <Td>{formatDateTime(d.last_seen)}</Td>
                  <Td>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditing(d);
                          setModalOpen(true);
                        }}
                      >
                        ✎
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(d)}>
                        🗑
                      </Button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      {modalOpen && (
        <DeviceFormModal
          device={editing}
          onClose={() => setModalOpen(false)}
          onSaved={() => {
            setModalOpen(false);
            qc.invalidateQueries({ queryKey: ['devices'] });
          }}
        />
      )}
    </div>
  );
}

function DeviceFormModal({
  device,
  onClose,
  onSaved,
}: {
  device: Device | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<DevicePayload>({
    name: device?.name ?? '',
    device_id: device?.device_id ?? '',
    ip_address: device?.ip_address ?? '',
    location: device?.location ?? '',
    direction: device?.direction ?? 'entry',
  });

  const mutation = useMutation({
    mutationFn: (payload: DevicePayload) =>
      device ? updateDevice(device.id, payload) : createDevice(payload),
    onSuccess: () => {
      toast.success(device ? 'Qurilma yangilandi' : "Qurilma qo'shildi");
      onSaved();
    },
  });

  function submit(e: FormEvent) {
    e.preventDefault();
    mutation.mutate({ ...form, ip_address: form.ip_address || null });
  }

  function set<K extends keyof DevicePayload>(key: K, value: DevicePayload[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  return (
    <Modal open onClose={onClose} title={device ? 'Qurilmani tahrirlash' : 'Yangi qurilma'}>
      <form onSubmit={submit} className="space-y-3">
        <Field label="Nomi">
          <Input value={form.name} onChange={(e) => set('name', e.target.value)} required />
        </Field>
        <Field label="Device ID">
          <Input value={form.device_id} onChange={(e) => set('device_id', e.target.value)} required />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="IP manzil">
            <Input
              value={form.ip_address ?? ''}
              onChange={(e) => set('ip_address', e.target.value)}
              placeholder="192.168.1.101"
            />
          </Field>
          <Field label="Joylashuv">
            <Input value={form.location} onChange={(e) => set('location', e.target.value)} required />
          </Field>
        </div>
        <Field label="Yo'nalish">
          <div className="flex gap-4 pt-1">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="direction"
                checked={form.direction === 'entry'}
                onChange={() => set('direction', 'entry')}
              />
              Kirish
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="direction"
                checked={form.direction === 'exit'}
                onChange={() => set('direction', 'exit')}
              />
              Chiqish
            </label>
          </div>
        </Field>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Bekor qilish
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Saqlanmoqda...' : 'Saqlash'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
