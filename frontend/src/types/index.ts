// Backend DRF list endpointlari paginatsiyalangan
export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface Device {
  id: number;
  device_id: string;
  name: string;
  ip_address: string | null;
  location: string;
  direction: 'entry' | 'exit';
  direction_display: string;
  status: 'online' | 'offline';
  status_display: string;
  firmware_version?: string;
  serial_number?: string;
  last_seen: string | null;
}

export interface Department {
  id: number;
  name: string;
  created_at: string;
}

export interface Employee {
  id: number;
  employee_id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  department: number | null;
  department_name: string | null;
  position: string;
  phone: string;
  face_id?: string;
  card_number?: string;
  status: 'active' | 'inactive';
  photo: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface AccessEvent {
  id: number;
  device: number | null;
  device_name: string | null;
  employee: number | null;
  employee_name: string | null;
  event_type: 'entry' | 'exit';
  event_type_display: string;
  verify_type: string;
  timestamp: string;
  is_authorized: boolean;
  temperature: number | null;
  mask_detected: boolean | null;
}

export interface WorkSession {
  id: number;
  employee: number;
  employee_name: string;
  date: string;
  entry_time: string | null;
  exit_time: string | null;
  duration_minutes: number | null;
  duration_hours: number | null;
}

export interface DashboardStats {
  today_entries: number;
  today_exits: number;
  currently_inside: number;
  // Diqqat: backend bu maydonni daqiqada qaytaradi (duration_minutes o'rtachasi)
  avg_work_hours: number | null;
}

// WebSocket dan keluvchi real-time event
export interface LiveEvent {
  id: number;
  device_id: string;
  employee: string | null;
  event_type: 'entry' | 'exit';
  timestamp: string;
  is_authorized: boolean;
  temperature: number | null;
}
