import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.join(__dirname, '..');

dotenv.config({ path: path.join(backendRoot, '.env') });

function bool(value, fallback = false) {
  if (value == null || value === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
}

function int(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function list(value, fallback) {
  if (value == null || String(value).trim() === '') return fallback;
  return String(value)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

const defaultDbPath = path.join(backendRoot, 'data', 'acme.db');

export const config = Object.freeze({
  env: process.env.NODE_ENV || 'development',
  isProd: process.env.NODE_ENV === 'production',
  port: int(process.env.PORT, 4000),
  host: process.env.HOST || '0.0.0.0',
  dbPath: process.env.DB_PATH?.trim() || defaultDbPath,

  seedCount: int(process.env.SEED_COUNT, 10000),
  seedReset: bool(process.env.SEED_RESET, true),
  seedRngSeed: int(process.env.SEED_RNG_SEED, 42),
  seedEmailDomain: process.env.SEED_EMAIL_DOMAIN || 'acme.example',
  seedActiveRate: Number(process.env.SEED_ACTIVE_RATE || 0.94),
  seedHireYearStart: int(process.env.SEED_HIRE_YEAR_START, 2015),
  seedHireYearSpan: int(process.env.SEED_HIRE_YEAR_SPAN, 10),

  corsOrigin: list(process.env.CORS_ORIGIN, ['http://localhost:5173']),
  defaultPageSize: int(process.env.DEFAULT_PAGE_SIZE, 25),
  maxPageSize: int(process.env.MAX_PAGE_SIZE, 100),
  pageSizeOptions: list(process.env.PAGE_SIZE_OPTIONS, ['10', '25', '50']).map(Number),

  orgName: process.env.ORG_NAME || 'ACME Org',
  appName: process.env.APP_NAME || 'ACME Pay',
  noteAuthor: process.env.NOTE_AUTHOR || 'HR Manager',
  employeeCodePrefix: process.env.EMPLOYEE_CODE_PREFIX || 'ACM',
  employeeCodePad: int(process.env.EMPLOYEE_CODE_PAD, 5),
  initialSalaryReason: process.env.INITIAL_SALARY_REASON || 'Initial structure',
  defaultSalaryReason: process.env.DEFAULT_SALARY_REASON || 'Annual revision',

  jwtSecret: process.env.JWT_SECRET || 'acme-dev-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  demoUser: {
    fullName: process.env.DEMO_USER_NAME || 'Priya Sharma',
    email: process.env.DEMO_USER_EMAIL || 'hr@acme.example',
    password: process.env.DEMO_USER_PASSWORD || 'password123',
    role: process.env.DEMO_USER_ROLE || 'hr',
  },
});

export function formatEmployeeCode(n) {
  return `${config.employeeCodePrefix}${String(n).padStart(config.employeeCodePad, '0')}`;
}
