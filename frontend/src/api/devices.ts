import api from './axios';
import type { Device, Paginated } from '@/types';

export async function getDevices(search?: string): Promise<Device[]> {
  const { data } = await api.get<Paginated<Device>>('/devices/', {
    params: search ? { search } : undefined,
  });
  return data.results;
}

export async function getDevice(id: number): Promise<Device> {
  const { data } = await api.get<Device>(`/devices/${id}/`);
  return data;
}

export type DevicePayload = Partial<Omit<Device, 'id' | 'direction_display' | 'status_display'>>;

export async function createDevice(payload: DevicePayload): Promise<Device> {
  const { data } = await api.post<Device>('/devices/', payload);
  return data;
}

export async function updateDevice(id: number, payload: DevicePayload): Promise<Device> {
  const { data } = await api.put<Device>(`/devices/${id}/`, payload);
  return data;
}

export async function deleteDevice(id: number): Promise<void> {
  await api.delete(`/devices/${id}/`);
}
