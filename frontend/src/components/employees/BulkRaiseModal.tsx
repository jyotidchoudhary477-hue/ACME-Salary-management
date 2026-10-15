import { useState } from 'react';
import { api } from '../../api/client';
import { appConfig } from '../../config';
import { useToast } from '../shared/Toast';
import { Button, Card, Input, Label, Select } from '../ui';

export function BulkRaiseModal({
  open,
  onClose,
  countries,
  departments,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  countries: Array<{ code: string; name: string }>;
  departments: string[];
  onDone?: () => void;
}) {
  const { push } = useToast();
  const [percent, setPercent] = useState('5');
  const [department, setDepartment] = useState('');
  const [country, setCountry] = useState('');
  const [reason, setReason] = useState(appConfig.defaultSalaryReason);
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <Card className="w-full max-w-lg p-6 animate-rise">
        <h2 className="font-display text-2xl font-semibold">Bulk salary raise</h2>
        <p className="mt-1 text-sm text-slate-500">
          Apply a % change to all <strong>active</strong> employees in a department and/or country. Creates a
          revision for each.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label>Percent change</Label>
            <Input
              type="number"
              step="0.5"
              min={-50}
              max={100}
              value={percent}
              onChange={(e) => setPercent(e.target.value)}
              placeholder="e.g. 5"
            />
            <p className="mt-1 text-xs text-slate-500">Use negative for a reduction (e.g. -2).</p>
          </div>
          <div>
            <Label>Department</Label>
            <Select value={department} onChange={(e) => setDepartment(e.target.value)}>
              <option value="">Any</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Country</Label>
            <Select value={country} onChange={(e) => setCountry(e.target.value)}>
              <option value="">Any</option>
              {countries.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="sm:col-span-2">
            <Label>Reason</Label>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={saving}
            onClick={async () => {
              if (!department && !country) {
                push('Pick a department and/or country', 'error');
                return;
              }
              const pct = Number(percent);
              if (!Number.isFinite(pct) || pct === 0) {
                push('Enter a non-zero percent', 'error');
                return;
              }
              setSaving(true);
              try {
                const result = await api.bulkRaise({
                  percent: pct,
                  department: department || undefined,
                  country: country || undefined,
                  reason,
                });
                push(`Updated ${result.updatedCount} employees (${pct > 0 ? '+' : ''}${pct}%)`);
                onClose();
                onDone?.();
              } catch (e) {
                push(e instanceof Error ? e.message : 'Bulk raise failed', 'error');
              } finally {
                setSaving(false);
              }
            }}
          >
            {saving ? 'Applying…' : 'Apply raise'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
