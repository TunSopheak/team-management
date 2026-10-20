import type { RequestHandler, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { getDb } from '../db';
import { toUser, USER_COLUMNS } from '../services/mappers';
import type { User } from '../../shared/types';
import { unauthorized } from './errors';

export const AUTH_COOKIE = 'leadersync_token';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

// A frontend on another domain (CORS_ORIGINS) needs SameSite=None, which browsers only accept with Secure.
const crossSite = config.corsOrigins.length > 0;
const cookieOptions = {
  httpOnly: true,
  sameSite: crossSite ? ('none' as const) : ('lax' as const),
  secure: crossSite || config.cookieSecure,
  path: '/',
};

export function setAuthCookie(res: Response, userId: string) {
  const token = jwt.sign({ sub: userId }, config.jwtSecret, {
    expiresIn: `${config.jwtExpiresInDays}d`,
  });
  res.cookie(AUTH_COOKIE, token, {
    ...cookieOptions,
    maxAge: config.jwtExpiresInDays * 24 * 60 * 60 * 1000,
  });
}

export function clearAuthCookie(res: Response) {
  res.clearCookie(AUTH_COOKIE, cookieOptions);
}

/** Loads the signed-in user (fresh from the DB so role changes apply immediately) or responds 401. */
export const requireAuth: RequestHandler = async (req, _res, next) => {
  const header = req.headers.authorization;
  const token =
    req.cookies?.[AUTH_COOKIE] || (header?.startsWith('Bearer ') ? header.slice(7) : undefined);
  if (!token) return next(unauthorized());

  let userId: string;
  try {
    const payload = jwt.verify(token, config.jwtSecret) as jwt.JwtPayload;
    userId = String(payload.sub);
  } catch {
    return next(unauthorized('Your session has expired. Please sign in again.'));
  }

  const db = await getDb();
  const { rows } = await db.query(`SELECT ${USER_COLUMNS} FROM users WHERE id = $1`, [userId]);
  if (!rows[0]) return next(unauthorized());
  req.user = toUser(rows[0]);
  next();
};
