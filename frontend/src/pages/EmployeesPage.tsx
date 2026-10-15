import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api, formatMoney, type EmployeeListItem, type Meta } from '../api/client';
import { appConfig } from '../config';
import { PageHeader } from '../components/shared/PageHeader';
import { SearchFilters, type FilterState } from '../components/employees/SearchFilters';
import { EmptyState } from '../components/shared/EmptyState';
import { BulkRaiseModal } from '../components/employees/BulkRaiseModal';
import { ImportCsvModal } from '../components/employees/ImportCsvModal';
import { ConfirmDialog } from '../components/shared/ConfirmDialog';
import { useToast } from '../components/shared/Toast';
import { Avatar, Badge, Button, Card, CountryBadge, Select } from '../components/ui';

function annualOf(e: EmployeeListItem) {
  if (e.annualSalary != null) return e.annualSalary;
  if (e.compensation?.annualSalary != null) return e.compensation.annualSalary;
  if (e.compensation?.gross != null) return e.compensation.gross * 12;
  return 0;
}

function formatJoinDate(value: string) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function EmployeesPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { push } = useToast();
  const [bulkOpen, setBulkOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [selected, setSelected] = useState<number[]>([]);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EmployeeListItem | null>(null);

  const toggleSelect = (id: number) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= appConfig.compareMax) {
        push(`Compare supports max ${appConfig.compareMax} employees`, 'info');
        return prev;
      }
      return [...prev, id];
    });
  };

  const [filters, setFilters] = useState<FilterState>({
    q: searchParams.get('q') || '',
    country: '',
    department: '',
    jobTitle: '',
    status: 'active',
    minSalary: '',
    maxSalary: '',
  });
  const [debouncedQ, setDebouncedQ] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(appConfig.defaultPageSize);
  const [sortBy, setSortBy] = useState('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [items, setItems] = useState<EmployeeListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState<Meta>({ countries: [], departments: [], jobTitles: [] });
  const pageSizeOptions = meta.ui?.pageSizeOptions?.length
    ? meta.ui.pageSizeOptions
    : appConfig.pageSizeOptions;

  useEffect(() => {
    api
      .meta()
      .then((m) => {
        setMeta(m);
        if (m.ui?.defaultPageSize) setPageSize(m.ui.defaultPageSize);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(filters.q), 300);
    return () => clearTimeout(t);
  }, [filters.q]);

  useEffect(() => {
    setPage(1);
  }, [
    debouncedQ,
    filters.country,
    filters.department,
    filters.jobTitle,
    filters.status,
    filters.minSalary,
    filters.maxSalary,
    sortBy,
    sortDir,
    pageSize,
  ]);

  useEffect(() => {
    setLoading(true);
    api
      .listEmployees({
        q: debouncedQ,
        country: filters.country,
        department: filters.department,
        jobTitle: filters.jobTitle,
        status: filters.status,
        minSalary: filters.minSalary || undefined,
        maxSalary: filters.maxSalary || undefined,
        sortBy,
        sortDir,
        page,
        pageSize,
      })
      .then((res) => {
        setItems(res.items);
        setTotal(res.total);
        setTotalPages(res.totalPages);
      })
      .finally(() => setLoading(false));
  }, [debouncedQ, filters, page, pageSize, sortBy, sortDir, reloadKey]);

  const maxSalaryOnPage = useMemo(
    () => Math.max(0, ...items.map((e) => annualOf(e))),
    [items]
  );

  const pageStats = useMemo(() => {
    const salaries = items.map((e) => annualOf(e)).filter((n) => n > 0);
    const avg = salaries.length ? salaries.reduce((a, b) => a + b, 0) / salaries.length : 0;
    const countries = new Set(items.map((e) => e.country)).size;
    return { avg, countries, shown: items.length };
  }, [items]);

  const toggleSort = (field: string) => {
    if (sortBy === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortBy(field);
      setSortDir(field === 'salary' ? 'desc' : 'asc');
    }
  };

  const sortMark = (field: string) => (sortBy === field ? (sortDir === 'asc' ? ' ↑' : ' ↓') : '');

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const e = deleteTarget;
    setDeletingId(e.id);
    try {
      await api.deleteEmployee(e.id);
      push(`Deleted ${e.employeeCode}`);
      setSelected((prev) => prev.filter((id) => id !== e.id));
      setDeleteTarget(null);
      setReloadKey((k) => k + 1);
    } catch (err) {
      push(err instanceof Error ? err.message : 'Delete failed', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Directory"
        title="Employees"
        subtitle={`${total.toLocaleString()} matches across the ${appConfig.orgName} roster — search, filter, sort, and manage with clear CRUD actions.`}
        actions={
          <>
            <Button
              variant="secondary"
              disabled={exporting}
              onClick={async () => {
                setExporting(true);
                try {
                  await api.exportEmployeesCsv({
                    q: debouncedQ,
                    country: filters.country,
                    department: filters.department,
                    jobTitle: filters.jobTitle,
                    status: filters.status,
                  });
                  push('CSV download started');
                } catch (err) {
                  push(err instanceof Error ? err.message : 'Export failed', 'error');
                } finally {
                  setExporting(false);
                }
              }}
            >
              {exporting ? 'Exporting…' : 'Export CSV'}
            </Button>
            <Button variant="secondary" onClick={() => setImportOpen(true)}>
              Import CSV
            </Button>
            <Button variant="secondary" onClick={() => setBulkOpen(true)}>
              Bulk raise
            </Button>
            <Link to="/employees/new">
              <Button>
                <span className="text-lg leading-none">+</span> Add employee
              </Button>
            </Link>
          </>
        }
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-3 animate-rise-delay">
        <Card className="px-4 py-3">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">On this page</div>
          <div className="mt-1 text-xl font-extrabold text-slate-900">{pageStats.shown} people</div>
        </Card>
        <Card className="px-4 py-3">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Page avg annual</div>
          <div className="mt-1 text-xl font-extrabold text-slate-900">
            {pageStats.avg ? formatMoney(pageStats.avg, items[0]?.currency || 'USD') : '—'}
          </div>
        </Card>
        <Card className="px-4 py-3">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Countries shown</div>
          <div className="mt-1 text-xl font-extrabold text-slate-900">{pageStats.countries}</div>
        </Card>
      </div>

      <Card className="mb-4 p-5">
        <SearchFilters
          value={filters}
          onChange={setFilters}
          countries={meta.countries}
          departments={meta.departments}
          jobTitles={meta.jobTitles}
        />
        <div className="mt-4 flex flex-wrap items-end gap-3 border-t border-slate-100 pt-4">
          <div className="w-40">
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
              Sort by
            </label>
            <Select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="name">Name</option>
              <option value="salary">Annual salary</option>
              <option value="department">Department</option>
              <option value="country">Country</option>
              <option value="hireDate">Join date</option>
            </Select>
          </div>
          <div className="w-36">
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
              Direction
            </label>
            <Select value={sortDir} onChange={(e) => setSortDir(e.target.value as 'asc' | 'desc')}>
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </Select>
          </div>
          <div className="w-28">
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
              Page size
            </label>
            <Select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}>
              {pageSizeOptions.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden p-0 animate-rise">
        {loading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="skeleton h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-3 w-1/3" />
                  <div className="skeleton h-3 w-1/2" />
                </div>
                <div className="skeleton h-3 w-24" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="p-6">
            <EmptyState title="No employees found" description="Try clearing filters or add a new employee." />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur">
                  <tr className="border-b border-slate-200 text-[11px] uppercase tracking-[0.08em] text-slate-500">
                    <th className="w-10 px-3 py-3.5 font-bold"> </th>
                    <th className="px-3 py-3.5 font-bold">Employee ID</th>
                    <th className="cursor-pointer px-4 py-3.5 font-bold" onClick={() => toggleSort('name')}>
                      Employee{sortMark('name')}
                    </th>
                    <th className="cursor-pointer px-4 py-3.5 font-bold" onClick={() => toggleSort('department')}>
                      Department{sortMark('department')}
                    </th>
                    <th className="px-4 py-3.5 font-bold">Type</th>
                    <th className="cursor-pointer px-4 py-3.5 font-bold" onClick={() => toggleSort('hireDate')}>
                      Join date{sortMark('hireDate')}
                    </th>
                    <th className="cursor-pointer px-4 py-3.5 font-bold" onClick={() => toggleSort('country')}>
                      Country{sortMark('country')}
                    </th>
                    <th
                      className="cursor-pointer px-4 py-3.5 text-right font-bold"
                      onClick={() => toggleSort('salary')}
                    >
                      Annual salary{sortMark('salary')}
                    </th>
                    <th className="px-4 py-3.5 text-right font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((e) => {
                    const annual = annualOf(e);
                    return (
                      <tr
                        key={e.id}
                        className="table-row-accent border-b border-slate-100 transition hover:bg-teal-50/40"
                      >
                        <td className="px-3 py-3">
                          <input
                            type="checkbox"
                            checked={selected.includes(e.id)}
                            onChange={() => toggleSelect(e.id)}
                            className="h-4 w-4 rounded border-slate-300 text-teal-700 focus:ring-teal-600"
                            aria-label={`Select ${e.firstName}`}
                          />
                        </td>
                        <td className="px-3 py-3">
                          <span className="rounded-lg bg-slate-100 px-2 py-1 font-mono text-xs font-bold text-slate-700">
                            {e.employeeCode}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar name={`${e.firstName} ${e.lastName}`} size="sm" />
                            <div>
                              <div className="font-semibold text-slate-900">
                                {e.firstName} {e.lastName}
                              </div>
                              <div className="text-xs text-slate-500">{e.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-700">{e.department}</td>
                        <td className="px-4 py-3">
                          <Badge tone={e.status === 'active' ? 'green' : 'slate'}>
                            {e.status === 'active' ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 tabular-nums text-slate-600">
                          {formatJoinDate(e.hireDate)}
                        </td>
                        <td className="px-4 py-3">
                          <CountryBadge code={e.country} />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="font-bold text-slate-900">
                            {annual ? formatMoney(annual, e.currency) : '—'}
                          </div>
                          {annual > 0 && (
                            <div className="ml-auto mt-1.5 h-1.5 w-24 overflow-hidden rounded-full bg-slate-100">
                              <div
                                className="h-full rounded-full bg-linear-to-r from-teal-600 to-teal-400"
                                style={{
                                  width: maxSalaryOnPage
                                    ? `${Math.max(8, Math.round((annual / maxSalaryOnPage) * 100))}%`
                                    : '0%',
                                }}
                              />
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="ghost"
                              title="View"
                              onClick={() => navigate(`/employees/${e.id}`)}
                            >
                              View
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              title="Edit"
                              onClick={() => navigate(`/employees/${e.id}?tab=profile`)}
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              title="Delete"
                              disabled={deletingId === e.id}
                              onClick={() => setDeleteTarget(e)}
                            >
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/50 px-4 py-3">
              <p className="text-sm text-slate-500">
                Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of{' '}
                {total.toLocaleString()}
              </p>
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  Previous
                </Button>
                <span className="rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-slate-700 ring-1 ring-slate-200">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>

      {selected.length >= 2 && (
        <div className="fixed bottom-5 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-xl">
          <span className="text-sm font-semibold text-slate-700">{selected.length} selected</span>
          <Button
            size="sm"
            onClick={() => {
              const [x, y, z] = selected;
              const qs = new URLSearchParams({ a: String(x), b: String(y) });
              if (z) qs.set('c', String(z));
              navigate(`/compare?${qs}`);
            }}
          >
            Compare
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelected([])}>
            Clear
          </Button>
        </div>
      )}

      <BulkRaiseModal
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        countries={meta.countries}
        departments={meta.departments}
        onDone={() => setReloadKey((k) => k + 1)}
      />
      <ImportCsvModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onDone={() => setReloadKey((k) => k + 1)}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete employee?"
        message={
          deleteTarget
            ? `Are you sure you want to delete ${deleteTarget.firstName} ${deleteTarget.lastName} (${deleteTarget.employeeCode})? This will permanently remove their salary history and notes.`
            : ''
        }
        confirmLabel="Yes, delete"
        cancelLabel="Cancel"
        busy={deletingId != null}
        onConfirm={confirmDelete}
        onCancel={() => {
          if (deletingId == null) setDeleteTarget(null);
        }}
      />
    </div>
  );
}
