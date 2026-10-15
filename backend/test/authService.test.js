import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import {
  ensureDemoUser,
  login,
  signup,
  verifyToken,
} from '../src/services/authService.js';
import { createTestDb } from './helpers.js';
import { AppError } from '../src/lib/errors.js';

describe('authService', () => {
  /** @type {import('better-sqlite3').Database} */
  let db;

  before(() => {
    db = createTestDb();
  });

  it('signs up HR user and returns JWT', () => {
    const result = signup(db, {
      fullName: 'HR Test',
      email: 'hr.test@acme.test',
      password: 'secret12',
    });
    assert.equal(result.user.email, 'hr.test@acme.test');
    assert.equal(result.user.role, 'hr');
    assert.ok(result.token);
    const payload = verifyToken(result.token);
    assert.equal(payload.email, 'hr.test@acme.test');
  });

  it('rejects duplicate email', () => {
    signup(db, {
      fullName: 'One',
      email: 'dup@acme.test',
      password: 'secret12',
    });
    assert.throws(
      () =>
        signup(db, {
          fullName: 'Two',
          email: 'dup@acme.test',
          password: 'secret12',
        }),
      (err) => err instanceof AppError && err.status === 409
    );
  });

  it('logs in with correct password', () => {
    signup(db, {
      fullName: 'Login Me',
      email: 'login@acme.test',
      password: 'password123',
    });
    const result = login(db, { email: 'login@acme.test', password: 'password123' });
    assert.equal(result.user.fullName, 'Login Me');
    assert.ok(result.token);
  });

  it('rejects bad password', () => {
    signup(db, {
      fullName: 'Bad Pass',
      email: 'badpass@acme.test',
      password: 'password123',
    });
    assert.throws(
      () => login(db, { email: 'badpass@acme.test', password: 'wrong' }),
      (err) => err instanceof AppError && err.status === 401
    );
  });

  it('seeds demo user once', () => {
    ensureDemoUser(db);
    ensureDemoUser(db);
    const count = db.prepare('SELECT COUNT(*) AS c FROM users').get().c;
    assert.ok(count >= 1);
    const demo = login(db, {
      email: process.env.DEMO_USER_EMAIL || 'hr@acme.example',
      password: process.env.DEMO_USER_PASSWORD || 'password123',
    });
    assert.ok(demo.token);
  });
});
