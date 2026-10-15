import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import * as authService from '../services/authService.js';
import { config } from '../config.js';

const router = Router();

const signupSchema = z.object({
  body: z.object({
    fullName: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6),
  }),
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1),
  }),
});

router.get('/demo', (_req, res) => {
  res.json({
    email: config.demoUser.email,
    password: config.demoUser.password,
    fullName: config.demoUser.fullName,
  });
});

router.post('/signup', validate(signupSchema), (req, res) => {
  const result = authService.signup(req.db, req.validated.body);
  res.status(201).json(result);
});

router.post('/login', validate(loginSchema), (req, res) => {
  const result = authService.login(req.db, req.validated.body);
  res.json(result);
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

export default router;
