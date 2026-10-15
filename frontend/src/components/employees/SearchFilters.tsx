import { Input, Label, Select, Button } from '../ui';

export type FilterState = {
  q: string;
  country: string;
  department: string;
  jobTitle: string;
  status: string;
  minSalary: string;
  maxSalary: string;
};

const empty: FilterState = {
  q: '',
  country: '',
  department: '',
  jobTitle: '',
  status: 'active',
  minSalary: '',
  maxSalary: '',
};

export function SearchFilters({
  value,
  onChange,
  countries,
  departments,
  jobTitles,
}: {
  value: FilterState;
  onChange: (next: FilterState) => void;
  countries: Array<{ code: string; name: string }>;
  departments: string[];
  jobTitles: string[];
}) {
  const activeCount = [
    value.q,
    value.country,
    value.department,
    value.jobTitle,
    value.minSalary,
    value.maxSalary,
    value.status !== 'active' ? value.status : '',
  ].filter(Boolean).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-bold text-slate-800">Find people</h2>
          <p className="text-xs text-slate-500">Search, filter by org attributes, or salary band</p>
        </div>
        {activeCount > 0 && (
          <Button size="sm" variant="ghost" onClick={() => onChange({ ...empty })}>
            Clear filters ({activeCount})
          </Button>
        )}
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-12">
        <div className="xl:col-span-4">
          <Label>Search</Label>
          <Input
            placeholder="Name, email, code, or title…"
            value={value.q}
            onChange={(e) => onChange({ ...value, q: e.target.value })}
          />
        </div>
        <div className="xl:col-span-2">
          <Label>Country</Label>
          <Select value={value.country} onChange={(e) => onChange({ ...value, country: e.target.value })}>
            <option value="">All countries</option>
            {countries.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="xl:col-span-2">
          <Label>Department</Label>
          <Select value={value.department} onChange={(e) => onChange({ ...value, department: e.target.value })}>
            <option value="">All departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </Select>
        </div>
        <div className="xl:col-span-2">
          <Label>Job title</Label>
          <Select value={value.jobTitle} onChange={(e) => onChange({ ...value, jobTitle: e.target.value })}>
            <option value="">All titles</option>
            {jobTitles.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </div>
        <div className="xl:col-span-2">
          <Label>Status</Label>
          <Select value={value.status} onChange={(e) => onChange({ ...value, status: e.target.value })}>
            <option value="">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>
        </div>
        <div className="xl:col-span-3">
          <Label>Min annual salary</Label>
          <Input
            type="number"
            min={0}
            placeholder="e.g. 500000"
            value={value.minSalary}
            onChange={(e) => onChange({ ...value, minSalary: e.target.value })}
          />
        </div>
        <div className="xl:col-span-3">
          <Label>Max annual salary</Label>
          <Input
            type="number"
            min={0}
            placeholder="e.g. 2000000"
            value={value.maxSalary}
            onChange={(e) => onChange({ ...value, maxSalary: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
}
