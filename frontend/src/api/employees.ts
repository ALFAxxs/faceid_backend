import api from './axios';
import type { Employee, Department, Paginated } from '@/types';

export async function getEmployees(search?: string): Promise<Employee[]> {
  const { data } = await api.get<Paginated<Employee>>('/employees/', {
    params: search ? { search } : undefined,
  });
  return data.results;
}

export async function getEmployee(id: number): Promise<Employee> {
  const { data } = await api.get<Employee>(`/employees/${id}/`);
  return data;
}

export async function getDepartments(): Promise<Department[]> {
  const { data } = await api.get<Paginated<Department>>('/employees/departments/');
  return data.results;
}

export type EmployeePayload = Partial<
  Omit<Employee, 'id' | 'full_name' | 'department_name' | 'created_at' | 'updated_at'>
>;

export async function createEmployee(payload: EmployeePayload): Promise<Employee> {
  const { data } = await api.post<Employee>('/employees/', payload);
  return data;
}

export async function updateEmployee(id: number, payload: EmployeePayload): Promise<Employee> {
  const { data } = await api.put<Employee>(`/employees/${id}/`, payload);
  return data;
}

export async function deleteEmployee(id: number): Promise<void> {
  await api.delete(`/employees/${id}/`);
}
