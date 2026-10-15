import { useEffect, useState } from 'react';
import { appConfig } from '../../config';
import { Button, Input, Label, Select } from '../ui';

export type EmployeeFormValues = {
  firstName: string;
  lastName: string;
  email: string;
  country: string;
  department: string;
  jobTitle: string;
  hireDate: string;
  status: string;
  annualSalary: number;
  salaryEffectiveFrom: string;
  salaryReason: string;
};

type FormState = Omit<EmployeeFormValues, 'annualSalary'> & {
  annualSalary: string;
  initialAnnualSalary: string;
};

function emptyForm(overrides?: Partial<EmployeeFormValues>): FormState {
  const { annualSalary: overrideSalary, salaryEffectiveFrom, salaryReason, ...rest } =
    overrides || {};
  const annualStr =
    overrideSalary != null && overrideSalary > 0 ? String(overrideSalary) : '';
  return {
    firstName: '',
    lastName: '',
    email: '',
    country: '',
    department: '',
    jobTitle: '',
    hireDate: new Date().toISOString().slice(0, 10),
    status: 'active',
    salaryEffectiveFrom: salaryEffectiveFrom || new Date().toISOString().slice(0, 10),
    salaryReason: salaryReason || appConfig.defaultSalaryReason,
    ...rest,
    annualSalary: annualStr,
    initialAnnualSalary: annualStr,
  };
}

export function EmployeeForm({
  countries,
  departments,
  jobTitles,
  initial,
  submitLabel = 'Save',
  profileOnly = false,
  onSubmit,
  onCancel,
}: {
  countries: Array<{ code: string; name: string }>;
  departments: string[];
  jobTitles: string[];
  initial?: Partial<EmployeeFormValues>;
  submitLabel?: string;
  profileOnly?: boolean;
  onSubmit: (values: EmployeeFormValues) => Promise<void> | void;
  onCancel?: () => void;
}) {
  const [values, setValues] = useState<FormState>(() => emptyForm(initial));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Fill country/department/title from API meta when creating (no hard-coded IN/Engineering)
  useEffect(() => {
    if (initial) return;
    setValues((prev) => ({
      ...prev,
      country: prev.country || countries[0]?.code || '',
      department: prev.department || departments[0] || '',
      jobTitle: prev.jobTitle || jobTitles[0] || '',
    }));
  }, [countries, departments, jobTitles, initial]);

  const set = <K extends keyof FormState>(key: K, v: FormState[K]) =>
    setValues((prev) => ({ ...prev, [key]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const annual = Number(values.annualSalary);
      if (!profileOnly && (!Number.isFinite(annual) || annual <= 0)) {
        throw new Error('Enter a valid annual salary greater than 0');
      }
      const initialAnnual = Number(values.initialAnnualSalary);
      const salaryChanged =
        !profileOnly &&
        Number.isFinite(initialAnnual) &&
        initialAnnual > 0 &&
        Math.round(annual) !== Math.round(initialAnnual);
      if (salaryChanged && !values.salaryReason.trim()) {
        throw new Error('Reason is required when changing salary');
      }
      if (salaryChanged && !values.salaryEffectiveFrom.trim()) {
        throw new Error('Effective date is required when changing salary');
      }
      if (!values.country || !values.department || !values.jobTitle) {
        throw new Error('Country, department, and job title are required');
      }
      await onSubmit({
        ...values,
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        email: values.email.trim(),
        annualSalary: annual || 0,
        salaryEffectiveFrom: values.salaryEffectiveFrom,
        salaryReason: values.salaryReason.trim(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">Profile</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label>First name</Label>
            <Input required value={values.firstName} onChange={(e) => set('firstName', e.target.value)} />
          </div>
          <div>
            <Label>Last name</Label>
            <Input required value={values.lastName} onChange={(e) => set('lastName', e.target.value)} />
          </div>
          <div>
            <Label>Email</Label>
            <Input required type="email" value={values.email} onChange={(e) => set('email', e.target.value)} />
          </div>
          <div>
            <Label>Job title</Label>
            <Input required list="job-titles" value={values.jobTitle} onChange={(e) => set('jobTitle', e.target.value)} />
            <datalist id="job-titles">
              {jobTitles.map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
          </div>
          <div>
            <Label>Country</Label>
            <Select
              value={values.country}
              onChange={(e) => set('country', e.target.value)}
              disabled={profileOnly}
              required
            >
              <option value="" disabled>
                Select country
              </option>
              {countries.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Department</Label>
            <Select value={values.department} onChange={(e) => set('department', e.target.value)} required>
              <option value="" disabled>
                Select department
              </option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Hire date</Label>
            <Input type="date" value={values.hireDate} onChange={(e) => set('hireDate', e.target.value)} />
          </div>
          <div>
            <Label>Status</Label>
            <Select value={values.status} onChange={(e) => set('status', e.target.value)}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Select>
          </div>
        </div>
      </div>

      {!profileOnly && (
        <div>
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">Compensation</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label>Annual salary (gross, local currency)</Label>
              <Input
                type="number"
                min={1}
                step={1000}
                required
                placeholder={`e.g. ${appConfig.salaryPlaceholder}`}
                value={values.annualSalary}
                onChange={(e) => set('annualSalary', e.target.value)}
              />
              <p className="mt-1.5 text-xs text-slate-500">
                Enter yearly gross in local currency. We split it into monthly components for payroll breakdown.
              </p>
            </div>
            <div>
              <Label>Effective date</Label>
              <Input
                type="date"
                required
                value={values.salaryEffectiveFrom}
                onChange={(e) => set('salaryEffectiveFrom', e.target.value)}
              />
            </div>
            <div>
              <Label>Reason for salary</Label>
              <Input
                value={values.salaryReason}
                onChange={(e) => set('salaryReason', e.target.value)}
                placeholder={appConfig.defaultSalaryReason}
              />
            </div>
          </div>
        </div>
      )}

      {error && <p className="text-sm font-medium text-orange-700">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving…' : submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" variant="secondary" disabled={saving} onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
