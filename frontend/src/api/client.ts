import { appConfig } from '../config';
import type {
  AnalyticsSummary,
  EmployeeDetail,
  EmployeeListItem,
  Meta,
} from '../types/employee';

export type {
  AnalyticsSummary,
  EmployeeDetail,
  EmployeeListItem,
  FullCompensation,
  Meta,
} from '../types/employee';

export { formatMoney } from '../lib/format';

export type AuthUser = {
  id: number;
  fullName: string;
  email: string;
  role: string;
  createdAt?: string;
};

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('acme_auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...authHeaders(),
    ...((init?.headers as Record<string, string>) || {}),
  };

  const res = await fetch(`${appConfig.apiBaseUrl}${path}`, {
    ...init,
    headers,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }

  return res.json();
}

async function authFetch(path: string, init?: RequestInit) {
  return fetch(`${appConfig.apiBaseUrl}${path}`, {
    ...init,
    headers: {
      ...authHeaders(),
      ...(init?.headers || {}),
    },
  });
}

function toQuery(params: Record<string, string | number | undefined>) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') qs.set(key, String(value));
  });
  return qs.toString();
}

export const api = {
  signup: (fullName: string, email: string, password: string) =>
    request<{ user: AuthUser; token: string }>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ fullName, email, password }),
    }),

  login: (email: string, password: string) =>
    request<{ user: AuthUser; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  me: () => request<{ user: AuthUser }>('/auth/me'),

  meta: () => request<Meta>('/employees/meta'),

  listEmployees: (params: Record<string, string | number | undefined>) =>
    request<{
      items: EmployeeListItem[];
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
      sortBy?: string;
      sortDir?: string;
    }>(`/employees?${toQuery(params)}`),

  getEmployee: (id: number | string) => request<EmployeeDetail>(`/employees/${id}`),

  listSalaryHistory: (id: number | string) =>
    request<{ items: import('../types/employee').SalaryHistoryEntry[] }>(
      `/employees/${id}/salary-history`
    ),

  createEmployee: (body: unknown) =>
    request<EmployeeDetail>('/employees', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  updateEmployee: (id: number | string, body: unknown) =>
    request<EmployeeDetail>(`/employees/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  deleteEmployee: (id: number | string) =>
    request<{ ok: boolean; id: number; employeeCode: string }>(`/employees/${id}`, {
      method: 'DELETE',
    }),

  updateSalary: (id: number | string, body: unknown) =>
    request<EmployeeDetail>(`/employees/${id}/salary`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  analytics: () => request<AnalyticsSummary>('/analytics/summary'),

  simulateRaise: (body: { percent: number; department?: string; country?: string }) =>
    request<{
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
    }>('/analytics/raise-simulator', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  applySimulatedRaise: (body: { percent: number; department?: string; country?: string }) =>
    request<{
      updatedCount: number;
      percent: number;
      department: string | null;
      country: string | null;
      reason: string;
      effectiveFrom: string;
    }>('/payroll/simulate-raise/apply', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  bulkRaise: (body: {
    percent: number;
    department?: string;
    country?: string;
    reason?: string;
  }) =>
    request<{
      updatedCount: number;
      percent: number;
      department: string | null;
      country: string | null;
      reason: string;
      effectiveFrom: string;
    }>('/payroll/bulk-raise', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  async exportEmployeesCsv(params: Record<string, string | number | undefined>) {
    const res = await authFetch(`/payroll/export?${toQuery(params)}`);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || 'Export failed');
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `acme-employees-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  },

  importEmployeesCsv: (csv: string, dryRun = false) =>
    request<{
      dryRun: boolean;
      totalRows: number;
      createdCount: number;
      skippedCount: number;
      errorCount: number;
      created: Array<{ line: number; email: string; employeeCode: string; id?: number }>;
      skipped: Array<{ line: number; email: string; reason: string }>;
      errors: Array<{ line: number; error: string }>;
    }>('/payroll/import', {
      method: 'POST',
      body: JSON.stringify({ csv, dryRun }),
    }),

  searchEmployees: (q: string, limit = 8) =>
    request<{
      items: Array<{
        id: number;
        employeeCode: string;
        firstName: string;
        lastName: string;
        email: string;
        department: string;
        country: string;
        jobTitle: string;
        status: string;
      }>;
    }>(`/employees/search?${toQuery({ q, limit })}`),

  compareEmployees: (ids: number[]) =>
    request<{
      metrics: Array<{
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
      }>;
    }>(`/employees/compare?ids=${ids.join(',')}`),

  listNotes: (id: number | string) =>
    request<{
      items: Array<{ id: number; employeeId: number; author: string; body: string; createdAt: string }>;
    }>(`/employees/${id}/notes`),

  createNote: (id: number | string, body: string, author?: string) =>
    request<{ id: number; employeeId: number; author: string; body: string; createdAt: string }>(
      `/employees/${id}/notes`,
      {
        method: 'POST',
        body: JSON.stringify({
          body,
          author: author || appConfig.noteAuthorFallback,
        }),
      }
    ),

  deleteNote: (id: number | string, noteId: number) =>
    request<{ ok: boolean }>(`/employees/${id}/notes/${noteId}`, { method: 'DELETE' }),

  async downloadPayslip(id: number | string, period?: string) {
    const qs = period ? `?period=${encodeURIComponent(period)}` : '';
    const res = await authFetch(`/employees/${id}/payslip.pdf${qs}`);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || 'Payslip download failed');
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const disposition = res.headers.get('Content-Disposition') || '';
    const match = disposition.match(/filename="([^"]+)"/);
    a.href = url;
    a.download = match?.[1] || `payslip-${id}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  },
};
