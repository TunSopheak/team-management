import { Router } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { config } from '../config';
import { getDb } from '../db';
import { clearAuthCookie, requireAuth, setAuthCookie } from '../middleware/auth';
import { conflict, forbidden, notFound, unauthorized } from '../middleware/errors';
import { toUser, USER_COLUMNS } from '../services/mappers';

export const authRouter = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please wait a few minutes and try again.' },
});

const registerSchema = z.object({
  name: z.string().trim().min(1).max(120),
  nameKm: z.string().trim().max(120).optional(),
  email: z.string().trim().toLowerCase().email().max(200),
  studentId: z.string().trim().min(1).max(60),
  password: z.string().min(8, 'must be at least 8 characters').max(200),
  groupCode: z.string().trim().max(60).optional(),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1).max(200),
});

authRouter.post('/register', authLimiter, async (req, res) => {
  const input = registerSchema.parse(req.body);
  const db = await getDb();
  const passwordHash = await bcrypt.hash(input.password, 12);

  const user = await db.transaction(async tx => {
    const { rows: countRows } = await tx.query<{ n: number }>('SELECT count(*)::int AS n FROM users');
    const isFirstUser = countRows[0].n === 0;

    const { rows: existing } = await tx.query(
      'SELECT id, student_id, password_hash FROM users WHERE lower(email) = $1',
      [input.email]
    );

    if (existing[0]) {
      // An admin may have pre-created this account when adding the person to a group.
      // The invitee claims it by registering with the same email AND student ID.
      const row = existing[0];
      const sameStudentId = row.student_id.toLowerCase() === input.studentId.toLowerCase();
      if (row.password_hash || !sameStudentId) {
        throw conflict('An account with this email already exists. Please sign in instead.');
      }
      const { rows } = await tx.query(
        `UPDATE users SET password_hash = $2, name = $3, name_km = COALESCE($4, name_km)
          WHERE id = $1 RETURNING ${USER_COLUMNS}`,
        [row.id, passwordHash, input.name, input.nameKm || null]
      );
      return rows[0];
    }

    let autoJoinGroup: { id: string; name: string } | null = null;
    if (input.groupCode) {
      const rawCode = input.groupCode.trim();
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawCode);
      const { rows: grpRows } = await tx.query(
        isUuid
          ? 'SELECT id, name, code FROM groups WHERE id = $1'
          : 'SELECT id, name, code FROM groups WHERE upper(code) = upper($1)',
        [rawCode]
      );
      if (grpRows[0]) {
        autoJoinGroup = grpRows[0];
      } else if (!isFirstUser && !config.allowRegistration) {
        throw notFound('Group with that invitation code or ID was not found.');
      }
    }

    if (!isFirstUser && !config.allowRegistration && !autoJoinGroup) {
      throw forbidden('Registration is invite-only. Ask your team admin to add you to a group first, or provide a valid Group Code.');
    }

    const { rows } = await tx.query(
      `INSERT INTO users (name, name_km, email, student_id, password_hash, role, department)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING ${USER_COLUMNS}`,
      [
        input.name,
        input.nameKm || null,
        input.email,
        input.studentId,
        passwordHash,
        // The very first account becomes the Super Admin so a fresh deployment is usable.
        isFirstUser ? 'super_admin' : 'member',
        isFirstUser ? 'Super Admin' : 'Member',
      ]
    );
    const newUser = rows[0];

    if (autoJoinGroup) {
      await tx.query('INSERT INTO group_members (group_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [
        autoJoinGroup.id,
        newUser.id,
      ]);
    }

    return newUser;
  });

  setAuthCookie(res, user.id);
  res.status(201).json({ user: toUser(user) });
});

authRouter.post('/login', authLimiter, async (req, res) => {
  const input = loginSchema.parse(req.body);
  const db = await getDb();
  const { rows } = await db.query(
    `SELECT ${USER_COLUMNS}, password_hash FROM users WHERE lower(email) = $1`,
    [input.email]
  );
  const row = rows[0];
  const ok = row?.password_hash ? await bcrypt.compare(input.password, row.password_hash) : false;
  if (!ok) throw unauthorized('Incorrect email or password.');

  setAuthCookie(res, row.id);
  res.json({ user: toUser(row) });
});

authRouter.post('/logout', (_req, res) => {
  clearAuthCookie(res);
  res.status(204).end();
});

authRouter.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, 'must be at least 8 characters').max(200),
});

authRouter.post('/change-password', requireAuth, authLimiter, async (req, res) => {
  const input = passwordSchema.parse(req.body);
  const db = await getDb();
  const { rows } = await db.query('SELECT password_hash FROM users WHERE id = $1', [req.user!.id]);
  const ok = rows[0]?.password_hash && (await bcrypt.compare(input.currentPassword, rows[0].password_hash));
  if (!ok) throw unauthorized('Current password is incorrect.');
  await db.query('UPDATE users SET password_hash = $2 WHERE id = $1', [
    req.user!.id,
    await bcrypt.hash(input.newPassword, 12),
  ]);
  res.status(204).end();
});
