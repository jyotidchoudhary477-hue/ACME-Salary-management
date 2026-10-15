import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import { applyBulkRaise, exportEmployeesCsv } from '../services/payrollService.js';
import { applySimulatedRaise } from '../services/raiseSimulatorService.js';
import { importEmployeesCsv } from '../services/importService.js';

const router = Router();

const bulkRaiseSchema = z.object({
  body: z.object({
    percent: z.number().min(-50).max(100),
    department: z.string().optional(),
    country: z.string().optional(),
    reason: z.string().optional(),
  }),
});

router.post('/bulk-raise', validate(bulkRaiseSchema), (req, res) => {
  const result = applyBulkRaise(req.db, req.validated.body);
  res.json(result);
});

router.post('/simulate-raise/apply', validate(bulkRaiseSchema), (req, res) => {
  const result = applySimulatedRaise(req.db, req.validated.body);
  res.json(result);
});

router.get('/export', (req, res) => {
  const { csv, rowCount } = exportEmployeesCsv(req.db, {
    q: req.query.q,
    country: req.query.country,
    department: req.query.department,
    jobTitle: req.query.jobTitle,
    status: req.query.status,
  });

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="acme-employees-${new Date().toISOString().slice(0, 10)}.csv"`
  );
  res.setHeader('X-Row-Count', String(rowCount));
  res.send(csv);
});

const importSchema = z.object({
  body: z.object({
    csv: z.string().min(1),
    dryRun: z.boolean().optional(),
  }),
});

router.post('/import', validate(importSchema), (req, res) => {
  const result = importEmployeesCsv(req.db, req.validated.body.csv, {
    dryRun: Boolean(req.validated.body.dryRun),
  });
  res.json(result);
});

export default router;
