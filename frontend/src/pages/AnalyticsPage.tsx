import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { api, formatMoney, type AnalyticsSummary } from '../api/client';
import { LoadingState } from '../components/shared/LoadingState';
import { useToast } from '../components/shared/Toast';
import { Button, Card, CountryBadge } from '../components/ui';

export function AnalyticsPage() {
  const { push } = useToast();
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    api
      .analytics()
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);

  if (error) {
    return <Card className="border-orange-200 bg-orange-50 p-5 text-orange-900">{error}</Card>;
  }
  if (!data) return <LoadingState label="Loading salary analytics…" />;

  return (
    <div className="animate-rise">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Salary Analytics</h1>
          <p className="mt-1 text-sm text-slate-500">
            Averages, headcount, salary ranges, and payroll by currency — live from the database.
          </p>
        </div>
        <Button
          variant="secondary"
          disabled={exporting}
          onClick={async () => {
            setExporting(true);
            try {
              await api.exportEmployeesCsv({ status: 'active' });
              push('CSV download started');
            } catch (e) {
              push(e instanceof Error ? e.message : 'Export failed', 'error');
            } finally {
              setExporting(false);
            }
          }}
        >
          {exporting ? 'Exporting…' : 'Export CSV'}
        </Button>
      </div>

      <Card className="mb-4 p-5">
        <h2 className="mb-4 text-base font-bold text-slate-900">Average salary by department</h2>
        <div className="h-70">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.byDepartment} barCategoryGap="18%">
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis
                dataKey="department"
                tick={{ fill: '#64748b', fontSize: 10 }}
                interval={0}
                angle={-20}
                textAnchor="end"
                height={70}
                axisLine={false}
                tickLine={false}
              />
              <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v: number) => formatMoney(v, 'USD')} />
              <Bar dataKey="avgCtcUsd" name="Avg monthly CTC (USD)" fill="#0284c7" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="mb-4 grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-4 text-base font-bold text-slate-900">Employee count by country</h2>
          <div className="h-65">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.byCountry}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="country" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="headcount" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="mb-4 text-base font-bold text-slate-900">Salary ranges (monthly CTC, USD)</h2>
          <div className="h-65">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.salaryDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="bucket"
                  tick={{ fill: '#64748b', fontSize: 9 }}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                  height={60}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#334155" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card className="mb-4 p-5">
        <h2 className="mb-4 text-base font-bold text-slate-900">Payroll totals by currency</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500">
                <th className="pb-2 pr-3 font-bold">Currency</th>
                <th className="pb-2 pr-3 text-right font-bold">Employees</th>
                <th className="pb-2 pr-3 text-right font-bold">Avg annual</th>
                <th className="pb-2 pr-3 text-right font-bold">Annual gross</th>
                <th className="pb-2 text-right font-bold">Annual CTC</th>
              </tr>
            </thead>
            <tbody>
              {(data.byCurrency || []).map((c) => (
                <tr key={c.currency} className="border-b border-slate-100 last:border-0">
                  <td className="py-3 pr-3 font-bold text-sky-800">{c.currency}</td>
                  <td className="py-3 pr-3 text-right">{c.headcount.toLocaleString()}</td>
                  <td className="py-3 pr-3 text-right font-semibold">
                    {formatMoney(c.avgAnnualSalary, c.currency)}
                  </td>
                  <td className="py-3 pr-3 text-right">{formatMoney(c.annualGross, c.currency)}</td>
                  <td className="py-3 text-right font-bold">{formatMoney(c.annualCtc, c.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-4 text-base font-bold text-slate-900">Payroll by country (USD)</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500">
                  <th className="pb-2 pr-3 font-bold">Country</th>
                  <th className="pb-2 pr-3 text-right font-bold">Count</th>
                  <th className="pb-2 text-right font-bold">Total CTC / mo</th>
                </tr>
              </thead>
              <tbody>
                {data.byCountry.map((c) => (
                  <tr key={c.country} className="border-b border-slate-100 last:border-0">
                    <td className="py-2.5 pr-3">
                      <CountryBadge code={c.country} />
                    </td>
                    <td className="py-2.5 pr-3 text-right">{c.headcount.toLocaleString()}</td>
                    <td className="py-2.5 text-right font-bold">{formatMoney(c.ctcUsd, 'USD')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Top earners</h2>
            <Link to="/compare" className="text-sm font-semibold text-sky-700 hover:underline">
              Compare →
            </Link>
          </div>
          <ul className="space-y-2">
            {(data.topEarners || []).slice(0, 8).map((e, i) => (
              <li key={e.id} className="flex justify-between gap-2 text-sm">
                <Link to={`/employees/${e.id}`} className="font-semibold text-slate-800 hover:text-sky-700">
                  {i + 1}. {e.name}
                </Link>
                <span className="font-bold text-slate-700">{formatMoney(e.ctcUsd, 'USD')}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-slate-500">{data.note}</p>
        </Card>
      </div>
    </div>
  );
}
