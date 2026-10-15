import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { badRequest, conflict, unauthorized } from '../lib/errors.js';

const SALT_ROUNDS = 10;

function toPublicUser(row) {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    role: row.role,
    createdAt: row.created_at,
  };
}

function signToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
    },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
}

export function ensureDemoUser(db) {
  const email = config.demoUser.email.toLowerCase();
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) return;

  const passwordHash = bcrypt.hashSync(config.demoUser.password, SALT_ROUNDS);
  try {
    db.prepare(
      `INSERT INTO users (full_name, email, password_hash, role)
       VALUES (?, ?, ?, ?)`
    ).run(config.demoUser.fullName, email, passwordHash, config.demoUser.role);
    console.log(
      `Demo user ready → ${config.demoUser.email} / ${config.demoUser.password}`
    );
  } catch (err) {
    // Another process may have inserted the demo user between SELECT and INSERT.
    if (err?.code !== 'SQLITE_CONSTRAINT_UNIQUE') throw err;
  }
}

export function signup(db, { fullName, email, password }) {
  const name = String(fullName || '').trim();
  const mail = String(email || '').trim().toLowerCase();
  const pass = String(password || '');

  if (!name || name.length < 2) throw badRequest('Full name is required');
  if (!mail || !mail.includes('@')) throw badRequest('Valid email is required');
  if (pass.length < 6) throw badRequest('Password must be at least 6 characters');

  const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(mail);
  if (exists) throw conflict('An account with this email already exists');

  const passwordHash = bcrypt.hashSync(pass, SALT_ROUNDS);
  const result = db
    .prepare(
      `INSERT INTO users (full_name, email, password_hash, role)
       VALUES (?, ?, ?, 'hr')`
    )
    .run(name, mail, passwordHash);

  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
  const user = toPublicUser(row);
  return { user, token: signToken(user) };
}

export function login(db, { email, password }) {
  const mail = String(email || '').trim().toLowerCase();
  const pass = String(password || '');
  if (!mail || !pass) throw badRequest('Email and password are required');

  const row = db.prepare('SELECT * FROM users WHERE email = ?').get(mail);
  if (!row) throw unauthorized('Invalid email or password');

  const ok = bcrypt.compareSync(pass, row.password_hash);
  if (!ok) throw unauthorized('Invalid email or password');

  const user = toPublicUser(row);
  return { user, token: signToken(user) };
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, config.jwtSecret);
  } catch {
    throw unauthorized('Invalid or expired token');
  }
}

export function getUserById(db, id) {
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  return row ? toPublicUser(row) : null;
}
