import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import { getSummary } from '../services/analyticsService.js';
import { simulateRaise } from '../services/raiseSimulatorService.js';

const router = Router();

const raiseSimulatorSchema = z.object({
  body: z.object({
    percent: z.number().min(-50).max(100),
    department: z.string().optional(),
    country: z.string().optional(),
  }),
});

router.get('/summary', (req, res) => {
  const summary = getSummary(req.db);
  res.json(summary);
});

router.post('/raise-simulator', validate(raiseSimulatorSchema), (req, res) => {
  const result = simulateRaise(req.db, req.validated.body);
  res.json(result);
});

export default router;
