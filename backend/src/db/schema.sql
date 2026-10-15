PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'hr' CHECK (role IN ('hr', 'admin')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

CREATE TABLE IF NOT EXISTS employees (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_code TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  country TEXT NOT NULL,
  department TEXT NOT NULL,
  job_title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  hire_date TEXT NOT NULL,
  currency TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS salary_structures (
  employee_id INTEGER PRIMARY KEY REFERENCES employees(id) ON DELETE CASCADE,
  basic REAL NOT NULL DEFAULT 0,
  hra REAL NOT NULL DEFAULT 0,
  special_allowance REAL NOT NULL DEFAULT 0,
  conveyance REAL NOT NULL DEFAULT 0,
  medical REAL NOT NULL DEFAULT 0,
  other_allowances REAL NOT NULL DEFAULT 0,
  employee_pf_percent REAL NOT NULL DEFAULT 12,
  retirement_contribution_percent REAL NOT NULL DEFAULT 5,
  other_deductions REAL NOT NULL DEFAULT 0,
  effective_from TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS salary_revisions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  effective_from TEXT NOT NULL,
  reason TEXT,
  snapshot_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS salary_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  previous_annual_gross REAL,
  new_annual_gross REAL NOT NULL,
  effective_from TEXT NOT NULL,
  reason TEXT,
  changed_by TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS employee_notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  author TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_employees_country ON employees(country);
CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);
CREATE INDEX IF NOT EXISTS idx_employees_name ON employees(last_name, first_name);
CREATE INDEX IF NOT EXISTS idx_employees_email ON employees(email);
CREATE INDEX IF NOT EXISTS idx_revisions_employee ON salary_revisions(employee_id);
CREATE INDEX IF NOT EXISTS idx_salary_history_employee ON salary_history(employee_id);
CREATE INDEX IF NOT EXISTS idx_notes_employee ON employee_notes(employee_id);
