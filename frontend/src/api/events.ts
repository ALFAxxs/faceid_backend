import api from './axios';
import type { AccessEvent, WorkSession, Paginated } from '@/types';

export interface EventFilters {
  date?: string;
  event_type?: 'entry' | 'exit' | '';
  employee_id?: number | string;
  search?: string;
  page?: number;
}

export async function getEvents(filters: EventFilters = {}): Promise<Paginated<AccessEvent>> {
  const params: Record<string, unknown> = {};
  if (filters.date) params.date = filters.date;
  if (filters.event_type) params.event_type = filters.event_type;
  if (filters.employee_id) params.employee_id = filters.employee_id;
  if (filters.search) params.search = filters.search;
  if (filters.page) params.page = filters.page;
  const { data } = await api.get<Paginated<AccessEvent>>('/events/', { params });
  return data;
}

export interface SessionFilters {
  date?: string;
  employee_id?: number | string;
  month?: string; // 'YYYY-MM'
}

export async function getSessions(filters: SessionFilters = {}): Promise<WorkSession[]> {
  const { data } = await api.get<Paginated<WorkSession>>('/events/sessions/', { params: filters });
  return data.results;
}
