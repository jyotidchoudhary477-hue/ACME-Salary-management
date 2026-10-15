import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api, formatMoney } from '../api/client';
import { PageHeader } from '../components/shared/PageHeader';
import { LoadingState } from '../components/shared/LoadingState';
import { useToast } from '../components/shared/Toast';
import { Button, Card, CountryBadge, Input, Label } from '../components/ui';

type Metric = {
  id: number;
  employeeCode: string;
  name: string;
  country: string;
  department: string;
  jobTitle: string;
  currency: string;
  annualSalary: number | null;
  monthlyGross: number | null;
  monthlyNet: number | null;
  monthlyCtc: number | null;
  employeeDeductions: number | null;
  employerCost: number | null;
  usdCtc: number | null;
};

export function ComparePage() {
  const { push } = useToast();
  const [params, setParams] = useSearchParams();
  const [a, setA] = useState(params.get('a') || '');
  const [b, setB] = useState(params.get('b') || '');
  const [c, setC] = useState(params.get('c') || '');
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [loading, setLoading] = useState(false);

  const runCompare = async (ids: number[]) => {
    if (ids.length < 2) {
      push('Select at least 2 employees', 'error');
      return;
    }
    setLoading(true);
    try {
      const res = await api.compareEmployees(ids);
      setMetrics(res.metrics);
    } catch (e) {
      push(e instanceof Error ? e.message : 'Compare failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const ids = [params.get('a'), params.get('b'), params.get('c')]
      .map(Number)
      .filter((n) => Number.isFinite(n) && n > 0);
    if (ids.length >= 2) runCompare(ids);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rows: Array<{ key: keyof Metric; label: string; money?: boolean; usd?: boolean }> = [
    { key: 'annualSalary', label: 'Annual gross (local)', money: true },
    { key: 'monthlyGross', label: 'Monthly gross', money: true },
    { key: 'monthlyNet', label: 'Monthly net', money: true },
    { key: 'monthlyCtc', label: 'Monthly CTC', money: true },
    { key: 'employeeDeductions', label: 'Employee deductions', money: true },
    { key: 'employerCost', label: 'Employer cost', money: true },
    { key: 'usdCtc', label: 'Monthly CTC (USD)', money: true, usd: true },
  ];

  return (
    <div>
      <PageHeader
        eyebrow="Tools"
        title="Compare compensation"
        subtitle="Put 2–3 employees side by side to explain pay differences in reviews."
      />

      <Card className="mb-5 p-5">
        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <Label>Employee A (id)</Label>
            <Input value={a} onChange={(e) => setA(e.target.value)} placeholder="e.g. 12" />
          </div>
          <div>
            <Label>Employee B (id)</Label>
            <Input value={b} onChange={(e) => setB(e.target.value)} placeholder="e.g. 45" />
          </div>
          <div>
            <Label>Employee C (optional id)</Label>
            <Input value={c} onChange={(e) => setC(e.target.value)} placeholder="optional" />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            onClick={() => {
              const ids = [a, b, c].map(Number).filter((n) => Number.isFinite(n) && n > 0);
              const next = new URLSearchParams();
              if (ids[0]) next.set('a', String(ids[0]));
              if (ids[1]) next.set('b', String(ids[1]));
              if (ids[2]) next.set('c', String(ids[2]));
              setParams(next);
              runCompare(ids);
            }}
          >
            Compare
          </Button>
          <Link to="/employees">
            <Button variant="secondary">Browse employees for IDs</Button>
          </Link>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Tip: open an employee page — the ID is in the URL (`/employees/8816`). Or use search in the header.
        </p>
      </Card>

      {loading && <LoadingState label="Comparing…" />}

      {!loading && metrics.length >= 2 && (
        <Card className="overflow-x-auto p-0">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50">
              <tr className="border-b border-slate-200">
                <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Metric
                </th>
                {metrics.map((m) => (
                  <th key={m.id} className="px-4 py-3 text-left">
                    <Link to={`/employees/${m.id}`} className="font-bold text-teal-800 hover:underline">
                      {m.name}
                    </Link>
                    <div className="mt-1 flex flex-wrap gap-1">
                      <CountryBadge code={m.country} />
                      <span className="text-xs text-slate-500">{m.department}</span>
                    </div>
                    <div className="text-xs text-slate-400">{m.jobTitle}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.key} className="border-b border-slate-100">
                  <td className="px-4 py-3 font-medium text-slate-600">{row.label}</td>
                  {metrics.map((m) => {
                    const val = m[row.key];
                    const display =
                      val == null
                        ? '—'
                        : row.money
                          ? formatMoney(Number(val), row.usd ? 'USD' : m.currency)
                          : String(val);
                    return (
                      <td key={m.id} className="px-4 py-3 font-semibold text-slate-900">
                        {display}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
