import { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getEmployees,
  getDepartments,
  createEmployee,
  updateEmployee,
  type EmployeePayload,
} from '@/api/employees';
import { Card, CardBody } from '@/components/ui/Card';
import { Input, Select, Field } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Table, THead, Th, Td } from '@/components/ui/Table';
import { Spinner, EmptyState } from '@/components/ui/Spinner';
import { EmployeeAvatar } from '@/components/shared/EmployeeAvatar';
import { toast } from '@/store/toastStore';
import type { Employee } from '@/types';

export default function Employees() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [dept, setDept] = useState('');
  const [status, setStatus] = useState('');
  const [view, setView] = useState<'grid' | 'table'>('grid');
  const [editing, setEditing] = useState<Employee | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const { data: employees, isLoading } = useQuery({
    queryKey: ['employees', search],
    queryFn: () => getEmployees(search || undefined),
  });
  const { data: departments } = useQuery({ queryKey: ['departments'], queryFn: getDepartments });

  const filtered = (employees ?? []).filter(
    (e) =>
      (!dept || String(e.department) === dept) && (!status || e.status === status)
  );

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }
  function openEdit(emp: Employee) {
    setEditing(emp);
    setModalOpen(true);
  }

  return (
    <div className="space-y-4">
      {/* Filtrlar */}
      <Card>
        <CardBody className="flex flex-wrap items-end gap-3">
          <Field label="Qidiruv">
            <Input
              className="min-w-[200px]"
              placeholder="Ism, familiya yoki ID"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </Field>
          <Field label="Bo'lim">
            <Select value={dept} onChange={(e) => setDept(e.target.value)}>
              <option value="">Hammasi</option>
              {departments?.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Status">
            <Select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">Hammasi</option>
              <option value="active">Faol</option>
              <option value="inactive">Nofaol</option>
            </Select>
          </Field>
          <div className="ml-auto flex items-end gap-2">
            <div className="flex overflow-hidden rounded-lg border border-gray-300">
              <button
                onClick={() => setView('grid')}
                className={`px-3 py-2 text-sm ${view === 'grid' ? 'bg-accent text-white' : 'bg-white'}`}
              >
                ▦
              </button>
              <button
                onClick={() => setView('table')}
                className={`px-3 py-2 text-sm ${view === 'table' ? 'bg-accent text-white' : 'bg-white'}`}
              >
                ☰
              </button>
            </div>
            <Button onClick={openCreate}>+ Yangi xodim</Button>
          </div>
        </CardBody>
      </Card>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-8 w-8" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState message="Xodimlar topilmadi" />
        </Card>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((emp) => (
            <Card key={emp.id} className="p-4">
              <div className="flex items-start gap-3">
                <EmployeeAvatar name={emp.full_name} photo={emp.photo} size={48} />
                <div className="min-w-0 flex-1">
                  <Link to={`/employees/${emp.id}`} className="block truncate font-semibold text-gray-900 hover:text-accent">
                    {emp.full_name}
                  </Link>
                  <p className="truncate text-sm text-gray-500">{emp.position}</p>
                  <p className="truncate text-xs text-gray-400">{emp.department_name ?? '—'}</p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <Badge tone={emp.status === 'active' ? 'green' : 'gray'}>
                  {emp.status === 'active' ? 'Faol' : 'Nofaol'}
                </Badge>
                <Button size="sm" variant="ghost" onClick={() => openEdit(emp)}>
                  ✎ Tahrirlash
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <Table>
            <THead>
              <tr>
                <Th>Xodim</Th>
                <Th>ID</Th>
                <Th>Bo'lim</Th>
                <Th>Lavozim</Th>
                <Th>Status</Th>
                <Th></Th>
              </tr>
            </THead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((emp) => (
                <tr key={emp.id}>
                  <Td>
                    <Link to={`/employees/${emp.id}`} className="flex items-center gap-2 font-medium hover:text-accent">
                      <EmployeeAvatar name={emp.full_name} photo={emp.photo} size={32} />
                      {emp.full_name}
                    </Link>
                  </Td>
                  <Td>{emp.employee_id}</Td>
                  <Td>{emp.department_name ?? '—'}</Td>
                  <Td>{emp.position}</Td>
                  <Td>
                    <Badge tone={emp.status === 'active' ? 'green' : 'gray'}>
                      {emp.status === 'active' ? 'Faol' : 'Nofaol'}
                    </Badge>
                  </Td>
                  <Td>
                    <Button size="sm" variant="ghost" onClick={() => openEdit(emp)}>
                      ✎
                    </Button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}

      {modalOpen && (
        <EmployeeFormModal
          employee={editing}
          departments={departments ?? []}
          onClose={() => setModalOpen(false)}
          onSaved={() => {
            setModalOpen(false);
            qc.invalidateQueries({ queryKey: ['employees'] });
          }}
        />
      )}
    </div>
  );
}

function EmployeeFormModal({
  employee,
  departments,
  onClose,
  onSaved,
}: {
  employee: Employee | null;
  departments: { id: number; name: string }[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<EmployeePayload>({
    employee_id: employee?.employee_id ?? '',
    first_name: employee?.first_name ?? '',
    last_name: employee?.last_name ?? '',
    department: employee?.department ?? null,
    position: employee?.position ?? '',
    phone: employee?.phone ?? '',
    status: employee?.status ?? 'active',
  });

  const mutation = useMutation({
    mutationFn: (payload: EmployeePayload) =>
      employee ? updateEmployee(employee.id, payload) : createEmployee(payload),
    onSuccess: () => {
      toast.success(employee ? 'Xodim yangilandi' : 'Yangi xodim qo\'shildi');
      onSaved();
    },
  });

  function submit(e: FormEvent) {
    e.preventDefault();
    mutation.mutate({
      ...form,
      department: form.department ? Number(form.department) : null,
    });
  }

  function set<K extends keyof EmployeePayload>(key: K, value: EmployeePayload[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  return (
    <Modal open onClose={onClose} title={employee ? 'Xodimni tahrirlash' : 'Yangi xodim'}>
      <form onSubmit={submit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Ism">
            <Input value={form.first_name} onChange={(e) => set('first_name', e.target.value)} required />
          </Field>
          <Field label="Familiya">
            <Input value={form.last_name} onChange={(e) => set('last_name', e.target.value)} required />
          </Field>
        </div>
        <Field label="Xodim ID">
          <Input value={form.employee_id} onChange={(e) => set('employee_id', e.target.value)} required />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Bo'lim">
            <Select
              value={form.department ?? ''}
              onChange={(e) => set('department', e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">— tanlang —</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Lavozim">
            <Input value={form.position} onChange={(e) => set('position', e.target.value)} required />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Telefon">
            <Input value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+998..." />
          </Field>
          <Field label="Status">
            <Select value={form.status} onChange={(e) => set('status', e.target.value as 'active' | 'inactive')}>
              <option value="active">Faol</option>
              <option value="inactive">Nofaol</option>
            </Select>
          </Field>
        </div>

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
