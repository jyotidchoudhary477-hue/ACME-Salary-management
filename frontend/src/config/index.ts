function env(key: keyof ImportMetaEnv, fallback = '') {
  const value = import.meta.env[key];
  return typeof value === 'string' && value.length > 0 ? value : fallback;
}

function envInt(key: keyof ImportMetaEnv, fallback: number) {
  const n = Number(env(key, String(fallback)));
  return Number.isFinite(n) ? n : fallback;
}

function envList(key: keyof ImportMetaEnv, fallback: string[]) {
  const raw = env(key, '');
  if (!raw) return fallback;
  return raw.split(',').map((s) => s.trim()).filter(Boolean);
}

export const appConfig = {
  appName: env('VITE_APP_NAME', 'ACME HR'),
  orgName: env('VITE_ORG_NAME', 'ACME Org'),
  appTagline: env('VITE_APP_TAGLINE', 'Salary Management'),
  apiBaseUrl: env('VITE_API_BASE_URL', '/api'),
  salaryPlaceholder: env('VITE_SALARY_PLACEHOLDER', '1200000'),
  defaultPageSize: envInt('VITE_DEFAULT_PAGE_SIZE', 25),
  pageSizeOptions: envList('VITE_PAGE_SIZE_OPTIONS', ['10', '25', '50']).map(Number),
  compareMax: envInt('VITE_COMPARE_MAX', 3),
  defaultSalaryReason: env('VITE_DEFAULT_SALARY_REASON', 'Annual revision'),
  noteAuthorFallback: env('VITE_NOTE_AUTHOR', 'HR Manager'),
} as const;

export const navItems = [
  { to: '/', label: env('VITE_NAV_DASHBOARD', 'Dashboard'), end: true as const, icon: 'dashboard' },
  { to: '/employees', label: env('VITE_NAV_EMPLOYEES', 'Employees'), icon: 'employees' },
  {
    to: '/analytics',
    label: env('VITE_NAV_ANALYTICS', 'Salary Analytics'),
    icon: 'analytics',
  },
  {
    to: '/raise-simulator',
    label: env('VITE_NAV_RAISE_SIMULATOR', 'Raise Simulator'),
    icon: 'simulator',
  },
  { to: '/settings', label: env('VITE_NAV_SETTINGS', 'Settings'), icon: 'settings' },
] as const;
