import type { FullCompensation } from '../../api/client';
import { formatMoney } from '../../api/client';
import { Badge, Card } from '../ui';

export function SalaryBreakdown({
  compensation,
  showSummary = true,
}: {
  compensation: FullCompensation;
  showSummary?: boolean;
}) {
  const employeeLines = compensation.deductions.filter((d) => d.borneBy === 'employee');
  const employerLines = compensation.deductions.filter((d) => d.borneBy === 'employer');
  const e = compensation.earnings;
  const annual = compensation.annualSalary ?? compensation.gross * 12;

  return (
    <div className="space-y-4 animate-rise-delay">
      {showSummary && (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="border-0 bg-linear-to-br from-teal-800 via-teal-900 to-slate-900 p-5 text-white shadow-lg shadow-teal-900/20">
            <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/75">Annual salary</div>
            <div className="mt-2 font-display text-3xl font-semibold sm:text-4xl">
              {formatMoney(annual, compensation.currency)}
            </div>
            <div className="mt-3 text-sm text-white/70">
              Monthly gross {formatMoney(compensation.gross, compensation.currency)}
            </div>
          </Card>
          <Card className="p-5">
            <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">Net take-home</div>
            <div className="mt-2 text-3xl font-extrabold text-slate-900">
              {formatMoney(compensation.net, compensation.currency)}
              <span className="ml-1 text-sm font-semibold text-slate-400">/ mo</span>
            </div>
            <div className="mt-3 text-sm text-slate-500">
              Annual net ≈ {formatMoney(compensation.annualNet ?? compensation.net * 12, compensation.currency)}
            </div>
          </Card>
          <Card className="p-5">
            <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">CTC cost to company</div>
            <div className="mt-2 text-3xl font-extrabold text-slate-900">
              {formatMoney(compensation.ctc, compensation.currency)}
              <span className="ml-1 text-sm font-semibold text-slate-400">/ mo</span>
            </div>
            <div className="mt-3 text-sm text-slate-500">
              USD ref {formatMoney(compensation.usd.ctc, 'USD')}/mo · employer costs included
            </div>
          </Card>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="mb-1 text-base font-bold text-slate-900">Earnings</h3>
          <p className="mb-3 text-xs text-slate-500">Monthly components that form gross pay</p>
          <ul className="divide-y divide-slate-100">
            {[
              ['Basic', e.basic],
              ['HRA', e.hra],
              ['Special allowance', e.specialAllowance],
              ['Conveyance', e.conveyance],
              ['Medical', e.medical],
              ['Other allowances', e.otherAllowances],
            ].map(([label, amt]) => (
              <li key={String(label)} className="flex items-center justify-between py-2.5 text-sm">
                <span className="text-slate-600">{label}</span>
                <span className="font-semibold text-slate-900">{formatMoney(Number(amt), compensation.currency)}</span>
              </li>
            ))}
            <li className="flex items-center justify-between py-2.5 text-sm">
              <span className="font-bold text-slate-900">Gross</span>
              <span className="font-bold text-teal-800">{formatMoney(compensation.gross, compensation.currency)}</span>
            </li>
          </ul>
        </Card>

        <Card className="p-5">
          <h3 className="mb-1 text-base font-bold text-slate-900">Deductions</h3>
          <p className="mb-3 text-xs text-slate-500">Illustrative statutory / benefit models</p>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-400">Employee</p>
          <ul className="mb-4 divide-y divide-slate-100">
            {employeeLines.map((d) => (
              <li key={d.code} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <span className="flex flex-wrap items-center gap-2 text-slate-600">
                  {d.label} <Badge tone="teal">{d.code}</Badge>
                </span>
                <span className="shrink-0 font-semibold">{formatMoney(d.amount, compensation.currency)}</span>
              </li>
            ))}
            <li className="flex justify-between py-2.5 text-sm font-bold">
              <span>Total deductions</span>
              <span className="text-orange-700">
                −{formatMoney(compensation.employeeDeductionsTotal, compensation.currency)}
              </span>
            </li>
          </ul>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-400">Employer</p>
          <ul className="divide-y divide-slate-100">
            {employerLines.length === 0 && (
              <li className="py-2 text-sm text-slate-500">None for this country model</li>
            )}
            {employerLines.map((d) => (
              <li key={d.code} className="flex justify-between py-2.5 text-sm">
                <span className="text-slate-600">{d.label}</span>
                <span className="font-semibold">{formatMoney(d.amount, compensation.currency)}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
