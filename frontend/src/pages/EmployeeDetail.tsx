import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { getEmployee } from '@/api/employees';
import { getSessions, getEvents } from '@/api/events';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Table, THead, Th, Td } from '@/components/ui/Table';
import { Spinner, EmptyState } from '@/components/ui/Spinner';
import { EmployeeAvatar } from '@/components/shared/EmployeeAvatar';
import { formatDateTime, formatTime, formatDate, minutesToHours } from '@/lib/utils';

export default function EmployeeDetail() {
  const { id } = useParams();
  const empId = Number(id);
  const month = format(new Date(), 'yyyy-MM');

  const employee = useQuery({ queryKey: ['employee', empId], queryFn: () => getEmployee(empId) });
  const sessions = useQuery({
    queryKey: ['sessions', empId, month],
    queryFn: () => getSessions({ employee_id: empId, month }),
  });
  const events = useQuery({
    queryKey: ['events', 'emp', empId],
    queryFn: () => getEvents({ employee_id: empId }),
  });

  const totalMinutes = useMemo(
    () => (sessions.data ?? []).reduce((sum, s) => sum + (s.duration_minutes ?? 0), 0),
    [sessions.data]
  );

  if (employee.isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (!employee.data) {
    return (
      <Card>
        <EmptyState message="Xodim topilmadi" />
      </Card>
    );
  }

  const emp = employee.data;

  return (
    <div className="space-y-6">
      <Link to="/employees" className="inline-block text-sm text-accent hover:underline">
        ← Xodimlarga qaytish
      </Link>

      {/* Ma'lumotlar */}
      <Card>
        <CardBody className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <EmployeeAvatar name={emp.full_name} photo={emp.photo} size={80} />
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900">{emp.full_name}</h2>
            <p className="text-gray-500">
              {emp.position} · {emp.department_name ?? '—'}
            </p>
            <div className="mt-2 flex flex-wrap gap-3 text-sm text-gray-600">
              <span>ID: {emp.employee_id}</span>
              {emp.phone && <span>📞 {emp.phone}</span>}
              <Badge tone={emp.status === 'active' ? 'green' : 'gray'}>
                {emp.status === 'active' ? 'Faol' : 'Nofaol'}
              </Badge>
            </div>
          </div>
          <div className="rounded-xl bg-accent/5 px-5 py-3 text-center">
            <p className="text-sm text-gray-500">Oylik jami</p>
            <p className="text-2xl font-bold text-accent">{minutesToHours(totalMinutes)} soat</p>
          </div>
        </CardBody>
      </Card>

      {/* Davomat (oxirgi 30 kun) */}
      <Card>
        <CardHeader>
          <CardTitle>Davomat — {month}</CardTitle>
        </CardHeader>
        <CardBody>
          {sessions.isLoading ? (
            <Spinner className="mx-auto h-6 w-6" />
          ) : (sessions.data ?? []).length === 0 ? (
            <EmptyState message="Bu oy uchun davomat yo'q" />
          ) : (
            <Table>
              <THead>
                <tr>
                  <Th>Sana</Th>
                  <Th>Kelish</Th>
                  <Th>Ketish</Th>
                  <Th>Ishlagan soat</Th>
                </tr>
              </THead>
              <tbody className="divide-y divide-gray-100">
                {sessions.data!.map((s) => (
                  <tr key={s.id}>
                    <Td className="font-medium">{formatDate(s.date)}</Td>
                    <Td>{formatTime(s.entry_time)}</Td>
                    <Td>{formatTime(s.exit_time)}</Td>
                    <Td>{s.duration_hours != null ? `${s.duration_hours} soat` : '—'}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </CardBody>
      </Card>

      {/* So'nggi eventlar */}
      <Card>
        <CardHeader>
          <CardTitle>Kirish/chiqish tarixi</CardTitle>
        </CardHeader>
        <CardBody>
          {events.isLoading ? (
            <Spinner className="mx-auto h-6 w-6" />
          ) : (events.data?.results ?? []).length === 0 ? (
            <EmptyState message="Eventlar yo'q" />
          ) : (
            <Table>
              <THead>
                <tr>
                  <Th>Yo'nalish</Th>
                  <Th>Qurilma</Th>
                  <Th>Vaqt</Th>
                  <Th>Ruxsat</Th>
                </tr>
              </THead>
              <tbody className="divide-y divide-gray-100">
                {events.data!.results.slice(0, 50).map((e) => (
                  <tr key={e.id}>
                    <Td>
                      <Badge tone={e.event_type === 'entry' ? 'green' : 'yellow'}>
                        {e.event_type_display}
                      </Badge>
                    </Td>
                    <Td>{e.device_name || '—'}</Td>
                    <Td>{formatDateTime(e.timestamp)}</Td>
                    <Td>
                      {e.is_authorized ? (
                        <Badge tone="green">Ruxsat</Badge>
                      ) : (
                        <Badge tone="red">Ruxsatsiz</Badge>
                      )}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
