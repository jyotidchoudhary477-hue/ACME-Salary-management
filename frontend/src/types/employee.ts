export type CompensationSummary = {
  gross: number;
  net: number;
  ctc: number;
  annualSalary?: number;
  annualCtc?: number;
  annualNet?: number;
  employeeDeductionsTotal: number;
  currency: string;
};

export type EmployeeListItem = {
  id: number;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  country: string;
  department: string;
  jobTitle: string;
  status: string;
  hireDate: string;
  currency: string;
  annualSalary?: number | null;
  compensation: CompensationSummary | null;
};

export type DeductionLine = {
  code: string;
  label: string;
  amount: number;
  borneBy: 'employee' | 'employer';
};

export type FullCompensation = {
  currency: string;
  country: string;
  earnings: Record<string, number>;
  gross: number;
  deductions: DeductionLine[];
  employeeDeductionsTotal: number;
  employerContributionsTotal: number;
  net: number;
  ctc: number;
  annualSalary?: number;
  annualCtc?: number;
  annualNet?: number;
  usd: { gross: number; net: number; ctc: number; fxToUsd: number };
};

export type SalaryHistoryEntry = {
  id: number;
  employeeId: number;
  previousAnnualGross: number | null;
  newAnnualGross: number;
  effectiveFrom: string;
  reason: string | null;
  changedBy: string | null;
  createdAt: string;
};

export type EmployeeDetail = EmployeeListItem & {
  salary: {
    basic: number;
    hra: number;
    specialAllowance: number;
    conveyance: number;
    medical: number;
    otherAllowances: number;
    employeePfPercent: number;
    retirementContributionPercent: number;
    otherDeductions: number;
    annualSalary?: number;
    effectiveFrom: string;
  } | null;
  compensation: FullCompensation | null;
  revisions: Array<{
    id: number;
    effectiveFrom: string;
    reason: string;
    createdAt: string;
    snapshot: FullCompensation;
  }>;
  salaryHistory: SalaryHistoryEntry[];
};

export type AnalyticsSummary = {
  headcountActive: number;
  averageAnnualSalaryUsd: number;
  averageMonthlyCtcUsd: number;
  monthlyPayrollUsd: {
    gross: number;
    net: number;
    ctc: number;
    employeeDeductions: number;
    employerContributions: number;
    retirementAndPfEmployeeUsd: number;
  };
  annualPayrollUsd: { gross: number; net: number; ctc: number };
  byCountry: Array<{
    country: string;
    headcount: number;
    avgCtcUsd: number;
    avgNetUsd: number;
    ctcUsd: number;
  }>;
  byDepartment: Array<{
    department: string;
    headcount: number;
    avgCtcUsd: number;
    avgNetUsd: number;
    ctcUsd: number;
  }>;
  byCurrency: Array<{
    currency: string;
    headcount: number;
    monthlyGross: number;
    monthlyNet: number;
    monthlyCtc: number;
    annualGross: number;
    annualCtc: number;
    avgAnnualSalary: number;
  }>;
  salaryDistribution: Array<{ bucket: string; count: number }>;
  topEarners: Array<{
    id: number;
    employeeCode: string;
    name: string;
    country: string;
    department: string;
    ctcUsd: number;
    netUsd: number;
    annualGrossUsd: number;
    annualGrossLocal: number;
    currency: string;
  }>;
  recentRevisions: Array<{
    id: number;
    effectiveFrom: string;
    reason: string;
    createdAt: string;
    employeeId: number;
    employeeCode: string;
    firstName: string;
    lastName: string;
    department: string;
    country: string;
  }>;
  note: string;
};

export type Meta = {
  branding?: {
    appName: string;
    orgName: string;
    noteAuthor: string;
  };
  ui?: {
    defaultPageSize: number;
    maxPageSize: number;
    pageSizeOptions: number[];
    employeeCodePrefix: string;
    defaultSalaryReason: string;
  };
  countries: Array<{ code: string; name: string; currency: string }>;
  departments: string[];
  jobTitles: string[];
};
