import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, getDaysInMonth, parseISO } from 'date-fns';
import { getSessions } from '@/api/events';
import { getEmployees } from '@/api/employees';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Table, THead, Th, Td } from '@/components/ui/Table';
import { Spinner, EmptyState } from '@/components/ui/Spinner';
import { cn } from '@/lib/utils';
import { toast } from '@/store/toastStore';
import type { WorkSession, Employee } from '@/types';

const MONTHLY_NORM = 176; // soat

export default function Reports() {
  const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'));

  const employees = useQuery({ queryKey: ['employees', ''], queryFn: () => getEmployees() });
  const sessions = useQuery({
    queryKey: ['sessions', 'month', month],
    queryFn: () => getSessions({ month }),
  });

  const daysInMonth = getDaysInMonth(parseISO(`${month}-01`));
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // employee_id -> day -> session
  const sessionMap = useMemo(() => {
    const map = new Map<number, Map<number, WorkSession>>();
    sessions.data?.forEach((s) => {
      const day = parseISO(s.date).getDate();
      if (!map.has(s.employee)) map.set(s.employee, new Map());
      map.get(s.employee)!.set(day, s);
    });
    return map;
  }, [sessions.data]);

  function totalHours(emp: Employee): number {
    const m = sessionMap.get(emp.id);
    if (!m) return 0;
    let total = 0;
    m.forEach((s) => (total += s.duration_minutes ?? 0));
    return total / 60;
  }

  function isWeekend(day: number): boolean {
    const d = new Date(`${month}-${String(day).padStart(2, '0')}`).getDay();
    return d === 0 || d === 6;
  }

  function cellMark(emp: Employee, day: number): { mark: string; cls: string } {
    const s = sessionMap.get(emp.id)?.get(day);
    if (s && s.entry_time) return { mark: '✅', cls: 'text-entry' };
    if (isWeekend(day)) return { mark: '➖', cls: 'text-gray-300' };
    return { mark: '❌', cls: 'text-denied' };
  }

  function exportCsv() {
    if (!employees.data?.length) {
      toast.error("Eksport uchun ma'lumot yo'q");
      return;
    }
    const header = ['Xodim', ...days.map(String), 'Jami soat'];
    const lines = employees.data.map((emp) => [
      emp.full_name,
      ...days.map((d) => cellMark(emp, d).mark),
      totalHours(emp).toFixed(1),
    ]);
    const csv = [header, ...lines]
      .map((r) => r.map((c) => `"${c}"`).join(','))
      .join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `davomat_${month}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const loading = employees.isLoading || sessions.isLoading;

  return (
    <div className="space-y-6">
      <Card>
        <CardBody className="flex flex-wrap items-center gap-3">
          <label className="text-sm font-medium text-gray-700">Oy:</label>
          <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="w-auto" />
          <Button variant="secondary" className="ml-auto" onClick={exportCsv}>
            ⬇ Export (CSV)
          </Button>
        </CardBody>
      </Card>

      {/* Davomat hisoboti */}
      <Card>
        <CardHeader>
          <CardTitle>Davomat hisoboti ✅ kelgan · ❌ kelmagan · ➖ dam olish</CardTitle>
        </CardHeader>
        <CardBody className="p-0">
          {loading ? (
            <div className="flex justify-center py-16">
              <Spinner className="h-8 w-8" />
            </div>
          ) : !employees.data?.length ? (
            <EmptyState message="Xodimlar yo'q" />
          ) : (
            <Table>
              <THead>
                <tr>
                  <Th className="sticky left-0 bg-gray-50">Xodim</Th>
                  {days.map((d) => (
                    <Th key={d} className="px-1.5 text-center">
                      {d}
                    </Th>
                  ))}
                  <Th className="text-center">Jami</Th>
                </tr>
              </THead>
              <tbody className="divide-y divide-gray-100">
                {employees.data.map((emp) => (
                  <tr key={emp.id}>
                    <Td className="sticky left-0 bg-white font-medium">{emp.full_name}</Td>
                    {days.map((d) => {
                      const { mark, cls } = cellMark(emp, d);
                      return (
                        <td key={d} className={cn('px-1.5 py-2 text-center text-xs', cls)}>
                          {mark}
                        </td>
                      );
                    })}
                    <Td className="text-center font-semibold">{totalHours(emp).toFixed(1)}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </CardBody>
      </Card>

      {/* Soat hisoboti */}
      <Card>
        <CardHeader>
          <CardTitle>Soat hisoboti (norma: {MONTHLY_NORM} soat)</CardTitle>
        </CardHeader>
        <CardBody className="p-0">
          {loading ? (
            <div className="flex justify-center py-10">
              <Spinner className="h-6 w-6" />
            </div>
          ) : !employees.data?.length ? (
            <EmptyState message="Xodimlar yo'q" />
          ) : (
            <Table>
              <THead>
                <tr>
                  <Th>Xodim</Th>
                  <Th>Bo'lim</Th>
                  <Th className="text-right">Ishlagan soat</Th>
                  <Th className="text-right">Norma</Th>
                  <Th className="text-right">Farq</Th>
                </tr>
              </THead>
              <tbody className="divide-y divide-gray-100">
                {employees.data.map((emp) => {
                  const hours = totalHours(emp);
                  const diff = hours - MONTHLY_NORM;
                  return (
                    <tr key={emp.id}>
                      <Td className="font-medium">{emp.full_name}</Td>
                      <Td>{emp.department_name ?? '—'}</Td>
                      <Td className={cn('text-right font-semibold', hours >= MONTHLY_NORM ? 'text-entry' : 'text-denied')}>
                        {hours.toFixed(1)}
                      </Td>
                      <Td className="text-right text-gray-500">{MONTHLY_NORM}</Td>
                      <Td className={cn('text-right', diff >= 0 ? 'text-entry' : 'text-denied')}>
                        {diff >= 0 ? '+' : ''}
                        {diff.toFixed(1)}
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
