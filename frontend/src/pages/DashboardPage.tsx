import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { api, formatMoney, type AnalyticsSummary, type EmployeeListItem } from '../api/client';
import { EmptyState } from '../components/shared/EmptyState';
import { LoadingState } from '../components/shared/LoadingState';
import { PageHeader } from '../components/shared/PageHeader';
import { Avatar, Badge, Button, Card, CountryBadge, Input } from '../components/ui';

function shortDept(name: string) {
  const map: Record<string, string> = {
    Engineering: 'Eng.',
    Sales: 'Sales',
    HR: 'HR',
    Operations: 'Ops',
    Finance: 'Fin.',
    Product: 'Prod.',
    Marketing: 'Mkt.',
    Design: 'Des.',
    Legal: 'Legal',
    'Customer Success': 'CS',
  };
  return map[name] || name.slice(0, 4);
}

function annualOf(e: EmployeeListItem) {
  if (e.annualSalary != null) return e.annualSalary;
  if (e.compensation?.annualSalary != null) return e.compensation.annualSalary;
  if (e.compensation?.gross != null) return e.compensation.gross * 12;
  return 0;
}

export function DashboardPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [preview, setPreview] = useState<EmployeeListItem[]>([]);
  const [previewLoading, setPreviewLoading] = useState(true);
  const [q, setQ] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .analytics()
      .then(setData)
      .catch((e) => setError(e.message));
    setPreviewLoading(true);
    api
      .listEmployees({ status: 'active', page: 1, pageSize: 8, sortBy: 'name', sortDir: 'asc' })
      .then((res) => setPreview(res.items))
      .catch(() => undefined)
      .finally(() => setPreviewLoading(false));
  }, []);

  const deptChart = useMemo(() => {
    if (!data) return [];
    return data.byDepartment.slice(0, 6).map((d) => ({
      ...d,
      label: shortDept(d.department),
      payroll: Math.round(d.ctcUsd),
    }));
  }, [data]);

  const filteredPreview = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return preview;
    return preview.filter(
      (e) =>
        `${e.firstName} ${e.lastName}`.toLowerCase().includes(term) ||
        e.employeeCode.toLowerCase().includes(term) ||
        e.department.toLowerCase().includes(term)
    );
  }, [preview, q]);

  const maxSalaryPreview = useMemo(
    () => Math.max(0, ...filteredPreview.map((e) => annualOf(e))),
    [filteredPreview]
  );

  if (error) {
    return (
      <Card className="border-orange-200 bg-orange-50 p-5 text-orange-900">
        {error}. Start the API and ensure data is seeded.
      </Card>
    );
  }
  if (!data) return <LoadingState label="Loading dashboard…" />;

  return (
    <div className="animate-rise space-y-6 sm:space-y-7">
      <PageHeader
        eyebrow="Overview"
        title="Dashboard"
        subtitle="Active headcount, payroll mix, and a quick look at employees — all live from the database."
        actions={
          <Button variant="secondary" onClick={() => navigate('/analytics')}>
            Open analytics
          </Button>
        }
      />

      <section aria-label="Summary metrics">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">Active employees</p>
                <p className="mt-2 text-3xl font-extrabold tabular-nums tracking-tight text-slate-900">
                  {data.headcountActive.toLocaleString()}
                </p>
              </div>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600 ring-1 ring-sky-100">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">Average salary</p>
                <p className="mt-2 text-2xl font-extrabold tabular-nums tracking-tight text-slate-900">
                  {formatMoney(data.averageAnnualSalaryUsd, 'USD')}
                </p>
                <p className="mt-1.5 text-xs text-slate-500">USD reference · see Analytics for by-currency</p>
              </div>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700 ring-1 ring-teal-100">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
          </Card>

          <Card className="p-5 sm:col-span-2 xl:col-span-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
              Payroll by currency (annual gross)
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {(data.byCurrency || []).slice(0, 4).map((c) => (
                <div
                  key={c.currency}
                  className="rounded-xl bg-slate-50/80 px-3 py-2.5 ring-1 ring-slate-100"
                >
                  <div className="text-xs font-bold text-sky-800">{c.currency}</div>
                  <div className="mt-0.5 text-sm font-extrabold tabular-nums text-slate-900">
                    {formatMoney(c.annualGross, c.currency)}
                  </div>
                  <div className="mt-0.5 text-[11px] tabular-nums text-slate-500">
                    {c.headcount.toLocaleString()} people
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>

      <section aria-label="Payroll by department">
        <Card className="overflow-hidden p-0">
          <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
            <h2 className="text-base font-bold text-slate-900">Payroll by department</h2>
            <p className="mt-0.5 text-sm text-slate-500">Monthly CTC (USD) — top six departments</p>
          </div>
          <div className="px-3 pb-5 pt-2 sm:px-5">
            <div className="h-70">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptChart} barCategoryGap="28%" margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))}
                  />
                  <Tooltip
                    formatter={(v: number) => formatMoney(v, 'USD')}
                    labelFormatter={(_, payload) => payload?.[0]?.payload?.department || ''}
                    contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgb(15 23 42 / 0.08)' }}
                  />
                  <Bar dataKey="payroll" fill="#0284c7" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>
      </section>

      <section aria-label="Employee directory preview">
        <Card className="overflow-hidden p-0">
          <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <h2 className="text-base font-bold text-slate-900">Employee directory</h2>
              <p className="mt-0.5 text-sm text-slate-500">First eight active employees — search or open the full roster</p>
            </div>
            <Link
              to="/employees"
              className="text-sm font-semibold text-sky-700 hover:text-sky-800 hover:underline"
            >
              Full directory →
            </Link>
          </div>

          <div className="border-b border-slate-100 bg-slate-50/50 px-5 py-3 sm:px-6">
            <div className="relative max-w-md">
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Filter preview by name, ID, or department…"
                className="border-slate-200 bg-white pl-10"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && q.trim()) navigate(`/employees?q=${encodeURIComponent(q.trim())}`);
                }}
              />
              <svg
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 100-15 7.5 7.5 0 000 15z"
                />
              </svg>
            </div>
          </div>

          {previewLoading ? (
            <div className="space-y-3 p-5 sm:p-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="skeleton h-9 w-9 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton h-3 w-1/3" />
                    <div className="skeleton h-3 w-1/2" />
                  </div>
                  <div className="skeleton h-3 w-24" />
                </div>
              ))}
            </div>
          ) : filteredPreview.length === 0 ? (
            <div className="p-6 sm:p-8">
              <EmptyState
                title="No matches in preview"
                description="Try a different search term or open the full employee directory."
              />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-160 table-fixed text-sm">
                  <colgroup>
                    <col className="w-26" />
                    <col />
                    <col className="w-34" />
                    <col className="w-22" />
                    <col className="w-22" />
                    <col className="w-38" />
                  </colgroup>
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/95 text-left text-[11px] uppercase tracking-[0.08em] text-slate-500">
                      <th className="px-4 py-3 font-bold sm:px-6">ID</th>
                      <th className="px-4 py-3 font-bold">Employee</th>
                      <th className="px-4 py-3 font-bold">Department</th>
                      <th className="px-4 py-3 font-bold">Status</th>
                      <th className="px-4 py-3 font-bold">Country</th>
                      <th className="px-4 py-3 text-right font-bold">Annual salary</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPreview.map((e) => {
                      const annual = annualOf(e);
                      return (
                        <tr
                          key={e.id}
                          className="table-row-accent group border-b border-slate-100 transition last:border-0 hover:bg-teal-50/40"
                        >
                          <td className="px-4 py-3 sm:px-6">
                            <Link
                              to={`/employees/${e.id}`}
                              className="inline-block rounded-lg bg-slate-100 px-2 py-1 font-mono text-xs font-bold text-slate-700 transition group-hover:bg-white group-hover:ring-1 group-hover:ring-slate-200"
                            >
                              {e.employeeCode}
                            </Link>
                          </td>
                          <td className="px-4 py-3">
                            <Link to={`/employees/${e.id}`} className="flex min-w-0 items-center gap-3">
                              <Avatar name={`${e.firstName} ${e.lastName}`} size="sm" />
                              <div className="min-w-0">
                                <div className="truncate font-semibold text-slate-900 group-hover:text-teal-900">
                                  {e.firstName} {e.lastName}
                                </div>
                                <div className="truncate text-xs text-slate-500">{e.email}</div>
                              </div>
                            </Link>
                          </td>
                          <td className="truncate px-4 py-3 font-medium text-slate-700">{e.department}</td>
                          <td className="px-4 py-3">
                            <Badge tone={e.status === 'active' ? 'green' : 'slate'}>
                              {e.status === 'active' ? 'Active' : 'Inactive'}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <CountryBadge code={e.country} />
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="font-bold tabular-nums text-slate-900">
                              {annual ? formatMoney(annual, e.currency) : '—'}
                            </div>
                            {annual > 0 && (
                              <div className="ml-auto mt-1.5 h-1.5 w-full max-w-26 overflow-hidden rounded-full bg-slate-100">
                                <div
                                  className="h-full rounded-full bg-linear-to-r from-teal-600 to-teal-400"
                                  style={{
                                    width: maxSalaryPreview
                                      ? `${Math.max(8, Math.round((annual / maxSalaryPreview) * 100))}%`
                                      : '0%',
                                  }}
                                />
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/50 px-4 py-3 sm:px-6">
                <p className="text-sm text-slate-500">
                  Showing {filteredPreview.length} of {preview.length} in preview
                  {q.trim() ? ' (filtered)' : ''}
                </p>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() =>
                    q.trim()
                      ? navigate(`/employees?q=${encodeURIComponent(q.trim())}`)
                      : navigate('/employees')
                  }
                >
                  {q.trim() ? 'Search in directory' : 'View all employees'}
                </Button>
              </div>
            </>
          )}
        </Card>
      </section>
    </div>
  );
}
