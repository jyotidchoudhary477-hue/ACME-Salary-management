import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, type Meta } from '../api/client';
import { PageHeader } from '../components/shared/PageHeader';
import { EmployeeForm } from '../components/employees/EmployeeForm';
import { Card } from '../components/ui';

export function EmployeeCreatePage() {
  const navigate = useNavigate();
  const [meta, setMeta] = useState<Meta>({ countries: [], departments: [], jobTitles: [] });

  useEffect(() => {
    api.meta().then(setMeta).catch(() => undefined);
  }, []);

  return (
    <div>
      <PageHeader
        eyebrow="New hire"
        title="Add employee"
        subtitle="Create a profile with department, country, currency, and annual salary."
      />
      <Card className="p-6 sm:p-8 animate-rise">
        <EmployeeForm
          countries={meta.countries}
          departments={meta.departments}
          jobTitles={meta.jobTitles}
          submitLabel="Save"
          onCancel={() => navigate('/employees')}
          onSubmit={async (values) => {
            const created = await api.createEmployee({
              firstName: values.firstName,
              lastName: values.lastName,
              email: values.email,
              country: values.country,
              department: values.department,
              jobTitle: values.jobTitle,
              hireDate: values.hireDate,
              status: values.status,
              salary: {
                annualSalary: values.annualSalary,
                effectiveFrom: values.salaryEffectiveFrom || values.hireDate,
                reason: values.salaryReason,
              },
            });
            navigate(`/employees/${created.id}`);
          }}
        />
      </Card>
    </div>
  );
}
