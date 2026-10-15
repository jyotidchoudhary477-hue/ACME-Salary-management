import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, formatMoney } from '../api/client';
import { LoadingState } from '../components/shared/LoadingState';
import { useToast } from '../components/shared/Toast';
import { Button, Card, CountryBadge, Input, Label, Select } from '../components/ui';

type RaisePreview = {
  percent: number;
  department: string | null;
  country: string | null;
  previewOnly: boolean;
  employeeCount: number;
  totalsByCurrency: Array<{
    currency: string;
    employeeCount: number;
    currentTotalAnnual: number;
    newTotalAnnual: number;
    extraCost: number;
  }>;
  preview: Array<{
    id: number;
    name: string;
    department: string;
    country: string;
    currency: string;
    currentAnnual: number;
    newAnnual: number;
    raiseAmount: number;
    raisePercent: number;
  }>;
  totalInScope: number;
};

const PRESET_PERCENTS = [5, 10] as const;

export function RaiseSimulatorPage() {
  const { push } = useToast();
  const [metaLoading, setMetaLoading] = useState(true);
  const [departments, setDepartments] = useState<string[]>([]);
  const [countries, setCountries] = useState<Array<{ code: string; name: string }>>([]);
  const [percentMode, setPercentMode] = useState<'5' | '10' | 'custom'>('5');
  const [customPercent, setCustomPercent] = useState('7.5');
  const [department, setDepartment] = useState('');
  const [country, setCountry] = useState('');
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [result, setResult] = useState<RaisePreview | null>(null);

  useEffect(() => {
    api
      .meta()
      .then((m) => {
        setDepartments(m.departments);
        setCountries(m.countries);
      })
      .catch((e) => push(e instanceof Error ? e.message : 'Failed to load filters', 'error'))
      .finally(() => setMetaLoading(false));
  }, [push]);

  const resolvedPercent = (): number | null => {
    if (percentMode === 'custom') {
      const n = Number(customPercent);
      return Number.isFinite(n) ? n : null;
    }
    return Number(percentMode);
  };

  const runPreview = async () => {
    const pct = resolvedPercent();
    if (pct == null || pct === 0) {
      push('Enter a non-zero percent', 'error');
      return;
    }
    setLoading(true);
    try {
      const data = await api.simulateRaise({
        percent: pct,
        department: department || undefined,
        country: country || undefined,
      });
      setResult(data);
    } catch (e) {
      push(e instanceof Error ? e.message : 'Preview failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const runApply = async () => {
    const pct = resolvedPercent();
    if (pct == null || pct === 0) {
      push('Enter a non-zero percent', 'error');
      return;
    }
    if (
      !window.confirm(
        `Apply a ${pct > 0 ? '+' : ''}${pct}% raise to ${result?.employeeCount ?? 'selected'} employees? This updates salaries and salary history.`
      )
    ) {
      return;
    }
    setApplying(true);
    try {
      const applied = await api.applySimulatedRaise({
        percent: pct,
        department: department || undefined,
        country: country || undefined,
      });
      push(`Applied raise to ${applied.updatedCount} employees`);
      setResult(null);
    } catch (e) {
      push(e instanceof Error ? e.message : 'Apply failed', 'error');
    } finally {
      setApplying(false);
    }
  };

  if (metaLoading) return <LoadingState label="Loading raise simulator…" />;

  const primaryCurrency = result?.totalsByCurrency[0]?.currency ?? 'USD';

  return (
    <div className="animate-rise">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Raise Simulator</h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-500">
          Model a percentage increase and see payroll impact before committing changes.{' '}
          <span className="font-medium text-slate-700">Preview only — nothing is saved until you Apply.</span>
        </p>
      </div>

      <Card className="mb-4 p-5">
        <h2 className="mb-4 text-base font-bold text-slate-900">Scenario</h2>
        <div className="flex flex-wrap gap-2">
          {PRESET_PERCENTS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPercentMode(String(p) as '5' | '10')}
              className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                percentMode === String(p)
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {p}%
            </button>
          ))}
          <button
            type="button"
            onClick={() => setPercentMode('custom')}
            className={`rounded-full px-4 py-2 text-sm font-bold transition ${
              percentMode === 'custom'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Custom
          </button>
        </div>

        {percentMode === 'custom' && (
          <div className="mt-3 max-w-xs">
            <Label>Custom percent</Label>
            <Input
              type="number"
              step="0.5"
              min={-50}
              max={100}
              value={customPercent}
              onChange={(e) => setCustomPercent(e.target.value)}
              placeholder="e.g. 7.5"
            />
          </div>
        )}

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <Label>Department (optional)</Label>
            <Select value={department} onChange={(e) => setDepartment(e.target.value)}>
              <option value="">All departments</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Country (optional)</Label>
            <Select value={country} onChange={(e) => setCountry(e.target.value)}>
              <option value="">All countries</option>
              {countries.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <Button disabled={loading} onClick={runPreview}>
            {loading ? 'Calculating…' : 'Preview impact'}
          </Button>
          {result && (
            <Button variant="secondary" disabled={applying} onClick={runApply}>
              {applying ? 'Applying…' : 'Apply raise'}
            </Button>
          )}
        </div>
      </Card>

      {result && (
        <>
          <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Card className="p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Employees in scope</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">{result.employeeCount}</p>
            </Card>
            {result.totalsByCurrency.map((t) => (
              <Card key={t.currency} className="p-4 sm:col-span-2 xl:col-span-1">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Extra annual cost ({t.currency})
                </p>
                <p className="mt-1 text-2xl font-bold tabular-nums text-teal-700">
                  {formatMoney(t.extraCost, t.currency)}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {formatMoney(t.currentTotalAnnual, t.currency)} → {formatMoney(t.newTotalAnnual, t.currency)}
                </p>
              </Card>
            ))}
          </div>

          {result.totalsByCurrency.length > 1 && (
            <Card className="mb-4 overflow-x-auto p-5">
              <h2 className="mb-3 text-base font-bold text-slate-900">Payroll by currency</h2>
              <table className="w-full min-w-120 table-fixed text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-[11px] uppercase tracking-[0.08em] text-slate-500">
                    <th className="pb-2 pr-3 font-bold">Currency</th>
                    <th className="pb-2 pr-3 text-right font-bold tabular-nums">Employees</th>
                    <th className="pb-2 pr-3 text-right font-bold tabular-nums">Current payroll</th>
                    <th className="pb-2 pr-3 text-right font-bold tabular-nums">After raise</th>
                    <th className="pb-2 text-right font-bold tabular-nums">Extra cost</th>
                  </tr>
                </thead>
                <tbody>
                  {result.totalsByCurrency.map((t) => (
                    <tr key={t.currency} className="border-b border-slate-100 last:border-0">
                      <td className="py-2.5 pr-3 font-medium">{t.currency}</td>
                      <td className="py-2.5 pr-3 text-right tabular-nums">{t.employeeCount}</td>
                      <td className="py-2.5 pr-3 text-right tabular-nums">
                        {formatMoney(t.currentTotalAnnual, t.currency)}
                      </td>
                      <td className="py-2.5 pr-3 text-right tabular-nums">
                        {formatMoney(t.newTotalAnnual, t.currency)}
                      </td>
                      <td className="py-2.5 text-right font-semibold tabular-nums text-teal-700">
                        {formatMoney(t.extraCost, t.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}

          <Card className="p-5">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
              <div>
                <h2 className="text-base font-bold text-slate-900">Sample preview</h2>
                <p className="text-sm text-slate-500">
                  Top {result.preview.length} by annual salary ({result.totalInScope} in scope, +{result.percent}%).
                </p>
              </div>
              <Link to="/employees" className="text-sm font-semibold text-sky-600 hover:text-sky-800">
                View all employees →
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-168 table-fixed text-sm">
                <colgroup>
                  <col />
                  <col className="w-28" />
                  <col className="w-20" />
                  <col className="w-28" />
                  <col className="w-28" />
                  <col className="w-24" />
                  <col className="w-20" />
                </colgroup>
                <thead>
                  <tr className="border-b border-slate-200 text-left text-[11px] uppercase tracking-[0.08em] text-slate-500">
                    <th className="pb-2 pr-3 font-bold">Employee</th>
                    <th className="pb-2 pr-3 font-bold">Department</th>
                    <th className="pb-2 pr-3 font-bold">Country</th>
                    <th className="pb-2 pr-3 text-right font-bold tabular-nums">Current</th>
                    <th className="pb-2 pr-3 text-right font-bold tabular-nums">After raise</th>
                    <th className="pb-2 pr-3 text-right font-bold tabular-nums">Increase</th>
                    <th className="pb-2 text-right font-bold tabular-nums">%</th>
                  </tr>
                </thead>
                <tbody>
                  {result.preview.map((row) => (
                    <tr key={row.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/80">
                      <td className="py-3 pr-3">
                        <Link to={`/employees/${row.id}?tab=history`} className="font-medium text-sky-700 hover:underline">
                          {row.name}
                        </Link>
                      </td>
                      <td className="py-3 pr-3 text-slate-600">{row.department}</td>
                      <td className="py-3 pr-3">
                        <CountryBadge code={row.country} />
                      </td>
                      <td className="py-3 pr-3 text-right tabular-nums whitespace-nowrap text-slate-600">
                        {formatMoney(row.currentAnnual, row.currency)}
                      </td>
                      <td className="py-3 pr-3 text-right font-bold tabular-nums whitespace-nowrap">
                        {formatMoney(row.newAnnual, row.currency)}
                      </td>
                      <td className="py-3 pr-3 text-right tabular-nums whitespace-nowrap text-teal-700">
                        {formatMoney(row.raiseAmount, row.currency)}
                      </td>
                      <td className="py-3 text-right tabular-nums text-slate-500">{row.raisePercent}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {result.totalsByCurrency.length === 1 && (
              <p className="mt-3 text-xs text-slate-500">
                Totals use {primaryCurrency} annual gross (monthly × 12) for active employees in scope.
              </p>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
