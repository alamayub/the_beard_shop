import { Router } from 'express';
import { eq } from 'drizzle-orm';
import { adminAuth } from '../../../src/lib/firebase-admin.ts';
import { db } from '../../../src/db/index.ts';
import { users } from '../../../src/db/schema.ts';
import {
  AuthRequest,
  getOrCreateUser,
  requireAuth,
  signAccessToken,
  signRefreshToken,
  UserRole,
  verifyRefreshToken,
} from '../middleware/auth.ts';

const router = Router();

router.post('/session', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const idToken =
      (authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null) ||
      (typeof req.body?.idToken === 'string' ? req.body.idToken : null);

    if (!idToken) {
      return res.status(400).json({ error: 'Firebase ID token is required' });
    }

    const decoded = await adminAuth.verifyIdToken(idToken);
    const user = await getOrCreateUser(
      decoded.uid,
      decoded.email || 'admin@salon.np',
      decoded.name
    );

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);

    res.cookie('salon_refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({ user, accessToken });
  } catch (error) {
    console.error('Session creation error:', error);
    return res.status(401).json({ error: 'Failed to authenticate Firebase session.' });
  }
});

router.post('/refresh', async (req, res) => {
  try {
    const token = req.cookies?.salon_refresh_token;
    if (!token) {
      return res.status(401).json({ error: 'No refresh token present' });
    }
    const payload = verifyRefreshToken(token);
    if (!payload) {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }
    const rows = await db.select().from(users).where(eq(users.uid, payload.uid)).limit(1);
    if (rows.length === 0 || !rows[0].isActive) {
      return res.status(401).json({ error: 'User account not active' });
    }
    const user = {
      id: rows[0].id,
      uid: rows[0].uid,
      email: rows[0].email,
      fullName: rows[0].fullName,
      role: rows[0].role as UserRole,
    };
    const accessToken = signAccessToken(user);
    return res.json({ user, accessToken });
  } catch (error) {
    console.error('Token refresh error:', error);
    return res.status(500).json({ error: 'Session refresh failed.' });
  }
});

router.post('/logout', (_req, res) => {
  res.clearCookie('salon_refresh_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });
  return res.json({ ok: true });
});

router.get('/me', requireAuth, (req: AuthRequest, res) => {
  return res.json({ user: req.user });
});

export default router;
