import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import * as employeeService from '../services/employeeService.js';
import * as notesService from '../services/notesService.js';
import { buildPayslipPdf } from '../services/payslipService.js';
import { config } from '../config.js';
import { COUNTRY_META, DEPARTMENTS } from '../domain/countryRules.js';
import { badRequest, notFound } from '../lib/errors.js';

const router = Router();

const COUNTRY_CODES = /** @type {[string, ...string[]]} */ (Object.keys(COUNTRY_META));

const listSchema = z.object({
  query: z.object({
    q: z.string().optional(),
    country: z.string().optional(),
    department: z.string().optional(),
    jobTitle: z.string().optional(),
    status: z.enum(['active', 'inactive']).optional(),
    minSalary: z.coerce.number().nonnegative().optional(),
    maxSalary: z.coerce.number().nonnegative().optional(),
    sortBy: z
      .enum(['name', 'country', 'department', 'jobTitle', 'hireDate', 'salary', 'status'])
      .optional(),
    sortDir: z.enum(['asc', 'desc']).optional(),
    page: z.coerce.number().int().positive().optional(),
    pageSize: z.coerce.number().int().positive().max(100).optional(),
  }),
});

const salarySchema = z
  .object({
    annualSalary: z.number().positive().optional(),
    basic: z.number().nonnegative().optional(),
    hra: z.number().nonnegative().optional(),
    specialAllowance: z.number().nonnegative().optional(),
    conveyance: z.number().nonnegative().optional(),
    medical: z.number().nonnegative().optional(),
    otherAllowances: z.number().nonnegative().optional(),
    employeePfPercent: z.number().min(0).max(100).optional(),
    retirementContributionPercent: z.number().min(0).max(100).optional(),
    otherDeductions: z.number().nonnegative().optional(),
    effectiveFrom: z.string().optional(),
    reason: z.string().optional(),
  })
  .refine((data) => data.annualSalary != null || data.basic != null, {
    message: 'Provide annualSalary or basic',
  });

const createSchema = z.object({
  body: z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.string().email(),
    country: z.enum(COUNTRY_CODES),
    department: z.string().min(1),
    jobTitle: z.string().min(1),
    hireDate: z.string().min(4),
    status: z.enum(['active', 'inactive']).optional(),
    salary: salarySchema.optional(),
  }),
});

router.get('/meta', (req, res) => {
  res.json({
    branding: {
      appName: config.appName,
      orgName: config.orgName,
      noteAuthor: config.noteAuthor,
    },
    ui: {
      defaultPageSize: config.defaultPageSize,
      maxPageSize: config.maxPageSize,
      pageSizeOptions: config.pageSizeOptions,
      employeeCodePrefix: config.employeeCodePrefix,
      defaultSalaryReason: config.defaultSalaryReason,
    },
    countries: Object.entries(COUNTRY_META).map(([code, meta]) => ({
      code,
      name: meta.name,
      currency: meta.currency,
    })),
    departments: DEPARTMENTS,
    jobTitles: employeeService.listJobTitles(req.db),
  });
});

router.get('/search', (req, res) => {
  res.json({
    items: employeeService.searchEmployees(req.db, req.query.q, req.query.limit),
  });
});

router.get('/compare', (req, res) => {
  const ids = String(req.query.ids || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  res.json(employeeService.compareEmployees(req.db, ids));
});

router.get('/', validate(listSchema), (req, res) => {
  res.json(employeeService.listEmployees(req.db, req.validated.query));
});

router.get('/:id/salary-history', (req, res) => {
  const history = employeeService.getSalaryHistory(req.db, Number(req.params.id));
  if (!history) throw notFound('Employee not found');
  res.json({ items: history });
});

router.get('/:id/payslip.pdf', async (req, res, next) => {
  try {
    const result = await buildPayslipPdf(req.db, Number(req.params.id), req.query.period);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.setHeader('Content-Length', result.buffer.length);
    res.send(result.buffer);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', (req, res) => {
  const employee = employeeService.requireEmployee(req.db, Number(req.params.id));
  res.json(employee);
});

router.get('/:id/notes', (req, res) => {
  res.json({ items: notesService.listNotes(req.db, Number(req.params.id)) });
});

router.post('/:id/notes', (req, res) => {
  const note = notesService.createNote(req.db, Number(req.params.id), req.body || {});
  res.status(201).json(note);
});

router.delete('/:id/notes/:noteId', (req, res) => {
  res.json(notesService.deleteNote(req.db, Number(req.params.id), Number(req.params.noteId)));
});

router.post('/', validate(createSchema), (req, res) => {
  const created = employeeService.createEmployee(req.db, req.validated.body, {
    changedBy: req.user?.fullName,
  });
  res.status(201).json(created);
});

router.patch('/:id', (req, res) => {
  const updated = employeeService.updateEmployee(req.db, Number(req.params.id), req.body);
  if (!updated) throw notFound('Employee not found');
  res.json(updated);
});

router.delete('/:id', (req, res) => {
  const deleted = employeeService.deleteEmployee(req.db, Number(req.params.id));
  if (!deleted) throw notFound('Employee not found');
  res.json(deleted);
});

router.put('/:id/salary', (req, res) => {
  const parsed = salarySchema.safeParse(req.body);
  if (!parsed.success) {
    throw badRequest('Validation failed', parsed.error.flatten());
  }

  const updated = employeeService.updateSalary(
    req.db,
    Number(req.params.id),
    parsed.data,
    parsed.data.reason || req.body.reason,
    { changedBy: req.user?.fullName }
  );
  if (!updated) throw notFound('Employee not found');
  res.json(updated);
});

export default router;
