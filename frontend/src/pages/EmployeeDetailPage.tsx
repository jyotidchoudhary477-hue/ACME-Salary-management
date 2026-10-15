import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { api, formatMoney, type EmployeeDetail, type Meta } from '../api/client';
import { formatDateTime } from '../lib/format';
import { useAuth } from '../auth/AuthContext';
import { appConfig } from '../config';
import { SalaryBreakdown } from '../components/employees/SalaryBreakdown';
import { LoadingState } from '../components/shared/LoadingState';
import { EmployeeForm } from '../components/employees/EmployeeForm';
import { Tabs, TabPanel } from '../components/shared/Tabs';
import { useToast } from '../components/shared/Toast';
import { Avatar, Badge, Button, Card, CountryBadge, Input, Label } from '../components/ui';

type TabId = 'pay' | 'history' | 'notes' | 'profile';
type Note = { id: number; employeeId: number; author: string; body: string; createdAt: string };

const TAB_IDS: TabId[] = ['pay', 'history', 'notes', 'profile'];

export function EmployeeDetailPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const [emp, setEmp] = useState<EmployeeDetail | null>(null);
  const [error, setError] = useState('');
  const initialTab = searchParams.get('tab');
  const [tab, setTab] = useState<TabId>(
    initialTab && TAB_IDS.includes(initialTab as TabId) ? (initialTab as TabId) : 'pay'
  );
  const [salaryOpen, setSalaryOpen] = useState(false);
  const [meta, setMeta] = useState<Meta>({ countries: [], departments: [], jobTitles: [] });
  const [reason, setReason] = useState(appConfig.defaultSalaryReason);
  const [effectiveFrom, setEffectiveFrom] = useState(new Date().toISOString().slice(0, 10));
  const [annualSalary, setAnnualSalary] = useState('');
  const [savedMsg, setSavedMsg] = useState('');
  const [notes, setNotes] = useState<Note[]>([]);
  const [noteBody, setNoteBody] = useState('');
  const [payslipPeriod, setPayslipPeriod] = useState(new Date().toISOString().slice(0, 7));
  const [downloading, setDownloading] = useState(false);
  const { push } = useToast();
  const { user } = useAuth();

  const loadNotes = () => {
    if (!id) return;
    api.listNotes(id).then((res) => setNotes(res.items)).catch(() => setNotes([]));
  };

  const load = () => {
    if (!id) return;
    api
      .getEmployee(id)
      .then((e) => {
        setEmp(e);
        const annual = e.compensation?.annualSalary ?? (e.compensation?.gross ?? 0) * 12;
        setAnnualSalary(annual > 0 ? String(Math.round(annual)) : '');
      })
      .catch((err) => setError(err.message));
    loadNotes();
  };

  useEffect(() => {
    load();
    api.meta().then(setMeta).catch(() => undefined);
  }, [id]);

  useEffect(() => {
    const next = searchParams.get('tab');
    if (next && TAB_IDS.includes(next as TabId)) setTab(next as TabId);
  }, [searchParams]);

  if (error) return <Card className="border-orange-200 bg-orange-50 p-5 text-orange-900">{error}</Card>;
  if (!emp) return <LoadingState />;

  const currency = emp.compensation?.currency || emp.currency;
  const annual = emp.compensation?.annualSalary ?? (emp.compensation?.gross ?? 0) * 12;

  return (
    <div>
      <div className="mb-5 overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_8px_30px_-12px_rgba(15,23,42,0.15)] animate-rise">
        <div className="h-20 bg-linear-to-r from-teal-800 via-teal-700 to-slate-800 sm:h-24" />
        <div className="px-5 pb-5 sm:px-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex gap-4">
              <div className="-mt-8 shrink-0 sm:-mt-10">
                <Avatar name={`${emp.firstName} ${emp.lastName}`} size="lg" />
              </div>
              <div className="min-w-0 pt-2 sm:pt-3">
                <Badge tone="teal">{emp.employeeCode}</Badge>
                <h1 className="mt-2 wrap-break-word font-display text-2xl font-semibold leading-tight text-slate-900 sm:text-3xl">
                  {emp.firstName} {emp.lastName}
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  {emp.jobTitle} · {emp.department}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 sm:pt-3">
              <Link to="/employees">
                <Button variant="secondary" size="sm">
                  Back
                </Button>
              </Link>
              <Link to={`/compare?a=${emp.id}`}>
                <Button variant="secondary" size="sm">
                  Compare
                </Button>
              </Link>
              <Button
                size="sm"
                onClick={() => {
                  setTab('pay');
                  setSalaryOpen(true);
                }}
              >
                Update salary
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={async () => {
                  if (!confirm(`${emp.status === 'active' ? 'Deactivate' : 'Reactivate'} ${emp.firstName}?`)) return;
                  await api.updateEmployee(emp.id, {
                    status: emp.status === 'active' ? 'inactive' : 'active',
                  });
                  load();
                }}
              >
                {emp.status === 'active' ? 'Deactivate' : 'Reactivate'}
              </Button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <CountryBadge code={emp.country} />
            <Badge tone="teal">{emp.currency}</Badge>
            <Badge tone={emp.status === 'active' ? 'green' : 'slate'}>{emp.status}</Badge>
            <Badge>Hired {emp.hireDate}</Badge>
            <Badge tone="blue">{emp.email}</Badge>
          </div>

          {emp.compensation && (
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-linear-to-br from-teal-800 to-slate-900 px-4 py-3 text-white">
                <div className="text-[10px] font-bold uppercase tracking-wider text-white/70">Annual salary</div>
                <div className="mt-1 text-lg font-bold">{formatMoney(annual, currency)}</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Net / month</div>
                <div className="mt-1 text-lg font-bold text-slate-900">
                  {formatMoney(emp.compensation.net, currency)}
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">CTC / month</div>
                <div className="mt-1 text-lg font-bold text-slate-900">
                  {formatMoney(emp.compensation.ctc, currency)}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <Tabs
        active={tab}
        onChange={(id) => setTab(id as TabId)}
        tabs={[
          { id: 'pay', label: 'Compensation' },
          { id: 'history', label: 'Salary history', count: emp.salaryHistory?.length ?? 0 },
          { id: 'notes', label: 'Notes', count: notes.length },
          { id: 'profile', label: 'Profile' },
        ]}
      />

      <TabPanel when="pay" active={tab}>
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-display text-2xl font-semibold text-slate-900">Salary breakdown</h2>
            <p className="mt-1 text-sm text-slate-500">
              Earnings, deductions (PF / tax estimates), net pay, and CTC for this employee.
            </p>
          </div>
          {emp.compensation && (
            <div className="flex flex-wrap items-end gap-2">
              <div>
                <Label>Payslip month</Label>
                <Input
                  type="month"
                  value={payslipPeriod}
                  onChange={(e) => setPayslipPeriod(e.target.value)}
                  className="w-44"
                />
              </div>
              <Button
                disabled={downloading}
                onClick={async () => {
                  setDownloading(true);
                  try {
                    await api.downloadPayslip(emp.id, payslipPeriod);
                    push('Payslip PDF downloaded');
                  } catch (e) {
                    push(e instanceof Error ? e.message : 'Download failed', 'error');
                  } finally {
                    setDownloading(false);
                  }
                }}
              >
                {downloading ? 'Preparing…' : 'Download payslip PDF'}
              </Button>
            </div>
          )}
        </div>
        {emp.compensation ? (
          <SalaryBreakdown compensation={emp.compensation} showSummary={false} />
        ) : (
          <Card className="p-5">No salary structure yet. Use Update salary to add one.</Card>
        )}
      </TabPanel>

      <TabPanel when="history" active={tab}>
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">Salary history</h2>
              <p className="text-sm text-slate-500">
                Salary audit trail — who changed pay, when, old vs new, and why.
              </p>
            </div>
            <Button size="sm" onClick={() => setSalaryOpen(true)}>
              Record change
            </Button>
          </div>
          {!emp.salaryHistory?.length ? (
            <p className="py-8 text-center text-sm text-slate-500">No salary changes recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-168 table-fixed text-sm">
                <colgroup>
                  <col className="w-34" />
                  <col className="w-34" />
                  <col className="w-26" />
                  <col />
                  <col className="w-28" />
                  <col className="w-42" />
                </colgroup>
                <thead>
                  <tr className="border-b border-slate-200 text-left text-[11px] uppercase tracking-[0.08em] text-slate-500">
                    <th className="pb-2 pr-3 text-right font-bold tabular-nums">Previous salary</th>
                    <th className="pb-2 pr-3 text-right font-bold tabular-nums">New salary</th>
                    <th className="pb-2 pr-3 font-bold">Effective date</th>
                    <th className="pb-2 pr-3 font-bold">Reason</th>
                    <th className="pb-2 pr-3 font-bold">Changed by</th>
                    <th className="pb-2 font-bold">Recorded when</th>
                  </tr>
                </thead>
                <tbody>
                  {(emp.salaryHistory ?? []).map((h) => (
                    <tr key={h.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/80">
                      <td className="py-3 pr-3 text-right tabular-nums whitespace-nowrap text-slate-600">
                        {h.previousAnnualGross != null
                          ? formatMoney(h.previousAnnualGross, currency)
                          : '—'}
                      </td>
                      <td className="py-3 pr-3 text-right font-bold tabular-nums whitespace-nowrap">
                        {formatMoney(h.newAnnualGross, currency)}
                      </td>
                      <td className="py-3 pr-3 whitespace-nowrap font-medium">{h.effectiveFrom}</td>
                      <td className="py-3 pr-3 text-slate-600">{h.reason || '—'}</td>
                      <td className="py-3 pr-3 text-sm font-medium text-slate-700">{h.changedBy || '—'}</td>
                      <td className="py-3 text-xs whitespace-nowrap text-slate-500">{formatDateTime(h.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </TabPanel>

      <TabPanel when="notes" active={tab}>
        <Card className="mx-auto max-w-3xl p-5 sm:p-7">
          <h2 className="mb-1 text-base font-bold text-slate-900">HR notes</h2>
          <p className="mb-4 text-sm text-slate-500">
            Private context for compensation reviews, promotions, and retention discussions.
          </p>
          <div className="mb-4 space-y-2">
            <Label>Add note</Label>
            <textarea
              value={noteBody}
              onChange={(e) => setNoteBody(e.target.value)}
              rows={3}
              placeholder="e.g. Strong performer — discuss mid-year adjustment…"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-teal-600 focus:bg-white focus:ring-4 focus:ring-teal-600/15"
            />
            <Button
              size="sm"
              onClick={async () => {
                if (!noteBody.trim()) return;
                await api.createNote(emp.id, noteBody.trim(), user?.fullName || 'HR');
                setNoteBody('');
                loadNotes();
              }}
            >
              Save note
            </Button>
          </div>
          <ul className="space-y-3">
            {notes.length === 0 && (
              <li className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
                No notes yet.
              </li>
            )}
            {notes.map((n) => (
              <li key={n.id} className="rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm text-slate-800">{n.body}</div>
                    <div className="mt-1 text-[11px] font-medium text-slate-400">
                      {n.author} · {n.createdAt}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={async () => {
                      await api.deleteNote(emp.id, n.id);
                      loadNotes();
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </TabPanel>

      <TabPanel when="profile" active={tab}>
        <Card className="mx-auto max-w-3xl p-5 sm:p-7">
          <h2 className="mb-1 text-base font-bold text-slate-900">Edit profile</h2>
          <p className="mb-5 text-sm text-slate-500">Update name, role, department, and employment status.</p>
          {savedMsg && (
            <div className="mb-4 rounded-xl bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">
              {savedMsg}
            </div>
          )}
          <EmployeeForm
            countries={meta.countries}
            departments={meta.departments}
            jobTitles={meta.jobTitles}
            profileOnly
            submitLabel="Save profile"
            initial={{
              firstName: emp.firstName,
              lastName: emp.lastName,
              email: emp.email,
              country: emp.country,
              department: emp.department,
              jobTitle: emp.jobTitle,
              hireDate: emp.hireDate,
              status: emp.status,
              annualSalary: Number(annualSalary) || 0,
            }}
            onSubmit={async (values) => {
              await api.updateEmployee(emp.id, {
                firstName: values.firstName,
                lastName: values.lastName,
                email: values.email,
                department: values.department,
                jobTitle: values.jobTitle,
                status: values.status,
              });
              setSavedMsg('Profile saved');
              setTimeout(() => setSavedMsg(''), 2500);
              load();
            }}
          />
        </Card>
      </TabPanel>

      {salaryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-lg p-6 animate-rise">
            <h2 className="font-display text-2xl font-semibold">Update annual salary</h2>
            <p className="mt-1 text-sm text-slate-500">
              Records previous and new annual salary with an effective date and reason.
            </p>
            <div className="mt-4 space-y-3">
              <div>
                <Label>Effective date</Label>
                <Input
                  type="date"
                  value={effectiveFrom}
                  onChange={(e) => setEffectiveFrom(e.target.value)}
                />
              </div>
              <div>
                <Label>Reason</Label>
                <Input value={reason} onChange={(e) => setReason(e.target.value)} required />
              </div>
              <div>
                <Label>Annual salary (gross)</Label>
                <Input
                  type="number"
                  min={1}
                  step={1000}
                  placeholder={`e.g. ${appConfig.salaryPlaceholder}`}
                  value={annualSalary}
                  onChange={(e) => setAnnualSalary(e.target.value)}
                />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setSalaryOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  const annual = Number(annualSalary);
                  if (!Number.isFinite(annual) || annual <= 0) return;
                  if (!reason.trim()) {
                    push('Reason is required when salary changes', 'error');
                    return;
                  }
                  if (!effectiveFrom.trim()) {
                    push('Effective date is required', 'error');
                    return;
                  }
                  await api.updateSalary(emp.id, {
                    annualSalary: annual,
                    reason: reason.trim(),
                    effectiveFrom,
                  });
                  setSalaryOpen(false);
                  setTab('history');
                  load();
                }}
              >
                Apply revision
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
