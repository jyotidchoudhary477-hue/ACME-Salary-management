import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import authRouter from './routes/auth.js';
import employeesRouter from './routes/employees.js';
import analyticsRouter from './routes/analytics.js';
import payrollRouter from './routes/payroll.js';
import { requireAuth } from './middleware/auth.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

export function createApp(db) {
  const app = express();

  app.use(
    cors({
      origin: config.corsOrigin.length === 1 ? config.corsOrigin[0] : config.corsOrigin,
    })
  );
  app.use(express.json({ limit: '1mb' }));

  app.use((req, _res, next) => {
    req.db = db;
    next();
  });

  app.get('/api/health', (_req, res) => {
    const count = db.prepare('SELECT COUNT(*) AS c FROM employees').get().c;
    res.json({
      ok: true,
      service: config.appName,
      org: config.orgName,
      env: config.env,
      employees: count,
      auth: true,
    });
  });
  app.use('/api/auth', authRouter);
  // Protected app routes
  app.use('/api/employees', requireAuth, employeesRouter);
  app.use('/api/analytics', requireAuth, analyticsRouter);
  app.use('/api/payroll', requireAuth, payrollRouter);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
