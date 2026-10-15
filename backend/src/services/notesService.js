import { config } from '../config.js';
import { badRequest, notFound } from '../lib/errors.js';

export function listNotes(db, employeeId) {
  const exists = db.prepare('SELECT id FROM employees WHERE id = ?').get(employeeId);
  if (!exists) throw notFound('Employee not found');

  return db
    .prepare(
      `SELECT id, employee_id AS employeeId, author, body, created_at AS createdAt
       FROM employee_notes
       WHERE employee_id = ?
       ORDER BY created_at DESC`
    )
    .all(employeeId);
}

export function createNote(db, employeeId, { body, author } = {}) {
  const exists = db.prepare('SELECT id FROM employees WHERE id = ?').get(employeeId);
  if (!exists) throw notFound('Employee not found');

  const text = String(body || '').trim();
  if (!text) throw badRequest('Note body is required');
  if (text.length > 2000) throw badRequest('Note must be under 2000 characters');

  const noteAuthor = String(author || config.noteAuthor).trim() || config.noteAuthor;

  const result = db
    .prepare(
      `INSERT INTO employee_notes (employee_id, author, body)
       VALUES (?, ?, ?)`
    )
    .run(employeeId, noteAuthor, text);

  return db
    .prepare(
      `SELECT id, employee_id AS employeeId, author, body, created_at AS createdAt
       FROM employee_notes WHERE id = ?`
    )
    .get(result.lastInsertRowid);
}

export function deleteNote(db, employeeId, noteId) {
  const result = db
    .prepare(`DELETE FROM employee_notes WHERE id = ? AND employee_id = ?`)
    .run(noteId, employeeId);
  if (result.changes === 0) throw notFound('Note not found');
  return { ok: true };
}
