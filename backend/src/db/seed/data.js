
export const FIRST_NAMES = [
  'Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Ayaan', 'Krishna', 'Ishaan',
  'Emma', 'Olivia', 'Liam', 'Noah', 'Sophia', 'Mason', 'Lucas', 'Mia', 'Amelia', 'Harper',
  'James', 'Oliver', 'Charlotte', 'Evelyn', 'Henry', 'Alexander', 'Ella', 'Scarlett', 'Grace', 'Chloe',
  'Priya', 'Ananya', 'Diya', 'Aisha', 'Meera', 'Kabir', 'Rohan', 'Neha', 'Sneha', 'Rahul',
];

export const LAST_NAMES = [
  'Sharma', 'Patel', 'Singh', 'Kumar', 'Gupta', 'Reddy', 'Iyer', 'Nair', 'Mehta', 'Joshi',
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Wilson', 'Moore',
  'Taylor', 'Anderson', 'Thomas', 'Jackson', 'White', 'Harris', 'Martin', 'Thompson', 'Lee', 'Walker',
];

export const JOB_TITLES = [
  'Software Engineer', 'Senior Engineer', 'Staff Engineer', 'Engineering Manager',
  'Product Manager', 'Designer', 'Account Executive', 'Marketing Manager',
  'Financial Analyst', 'HR Business Partner', 'Ops Manager', 'Support Specialist',
  'Legal Counsel', 'Data Analyst', 'DevOps Engineer',
];

/** Weighted country distribution for a realistic multi-country roster */
export const COUNTRY_WEIGHTS = [
  ['IN', 0.45],
  ['US', 0.25],
  ['GB', 0.1],
  ['DE', 0.08],
  ['SG', 0.07],
  ['AE', 0.05],
];

/** Monthly basic pay bands by country (local currency) */
export const BASIC_BANDS = {
  IN: [25000, 250000],
  US: [4500, 18000],
  GB: [2800, 12000],
  DE: [3200, 11000],
  SG: [3500, 14000],
  AE: [8000, 35000],
  DEFAULT: [3000, 10000],
};
