import { Request, Response, NextFunction } from 'express';
import { eq, count } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import { adminAuth } from '../../../src/lib/firebase-admin.ts';
import { db } from '../../../src/db/index.ts';
import { auditLogs, users } from '../../../src/db/schema.ts';

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'RECEPTIONIST' | 'CUSTOMER';

interface AuthenticatedUser {
  id: number;
  uid: string;
  email: string;
  fullName: string;
  role: UserRole;
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

const JWT_SECRET = process.env.JWT_SECRET || 'salon-dev-jwt-secret-change-in-prod';
const JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || 'salon-dev-refresh-secret-change-in-prod';

export function signAccessToken(user: AuthenticatedUser): string {
  return jwt.sign(
    { id: user.id, uid: user.uid, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '2h' }
  );
}

export function signRefreshToken(user: AuthenticatedUser): string {
  return jwt.sign({ uid: user.uid }, JWT_REFRESH_SECRET, { expiresIn: '7d' });
}

export function verifyRefreshToken(token: string): { uid: string } | null {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET) as { uid: string };
  } catch {
    return null;
  }
}

export async function getOrCreateUser(
  uid: string,
  email: string,
  fullName?: string
): Promise<AuthenticatedUser & { isActive: boolean }> {
  try {
    const normalizedEmail = email.trim().toLowerCase();

    const existingByUid = await db.select().from(users).where(eq(users.uid, uid)).limit(1);
    if (existingByUid.length > 0) {
      const row = existingByUid[0];
      return {
        id: row.id,
        uid: row.uid,
        email: row.email,
        fullName: row.fullName,
        role: row.role as UserRole,
        isActive: row.isActive,
      };
    }

    // Check if an administrator pre-invited this staff email and bind their real Firebase UID
    const existingByEmail = await db
      .select()
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);
    if (existingByEmail.length > 0) {
      const [bound] = await db
        .update(users)
        .set({
          uid,
          fullName: existingByEmail[0].fullName || fullName || normalizedEmail.split('@')[0],
          updatedAt: new Date(),
        })
        .where(eq(users.id, existingByEmail[0].id))
        .returning();
      return {
        id: bound.id,
        uid: bound.uid,
        email: bound.email,
        fullName: bound.fullName,
        role: bound.role as UserRole,
        isActive: bound.isActive,
      };
    }

    const totalUsers = await db.select({ value: count() }).from(users);
    const isFirstOrOwner =
      (totalUsers[0]?.value ?? 0) === 0 || normalizedEmail === 'imayubalam@gmail.com';
    const assignedRole: UserRole = isFirstOrOwner ? 'SUPER_ADMIN' : 'ADMIN';

    const inserted = await db
      .insert(users)
      .values({
        uid,
        email: normalizedEmail,
        fullName: fullName || normalizedEmail.split('@')[0] || 'Salon Administrator',
        role: assignedRole,
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: { email: normalizedEmail, updatedAt: new Date() },
      })
      .returning();

    const row = inserted[0];
    return {
      id: row.id,
      uid: row.uid,
      email: row.email,
      fullName: row.fullName,
      role: row.role as UserRole,
      isActive: row.isActive,
    };
  } catch (error) {
    console.error('Database user synchronization failed:', error);
    throw new Error('Authentication profile lookup failed.', { cause: error });
  }
}

export const requireAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing bearer token' });
  }

  const token = authHeader.slice(7).trim();
  try {
    // 1. Verify Firebase ID Token (primary production path)
    const decoded = await adminAuth.verifyIdToken(token);
    const dbUser = await getOrCreateUser(
      decoded.uid,
      decoded.email || 'user@salon.np',
      decoded.name
    );
    if (!dbUser.isActive) {
      return res.status(403).json({ error: 'Account suspended. Contact a Super Admin.' });
    }
    req.user = {
      id: dbUser.id,
      uid: dbUser.uid,
      email: dbUser.email,
      fullName: dbUser.fullName,
      role: dbUser.role,
    };
    return next();
  } catch {
    // 2. Fallback to server-issued short-lived JWT access token
    try {
      const payload = jwt.verify(token, JWT_SECRET) as { uid: string };
      const rows = await db.select().from(users).where(eq(users.uid, payload.uid)).limit(1);
      if (rows.length === 0 || !rows[0].isActive) {
        return res.status(401).json({ error: 'Unauthorized: Account inactive or not found' });
      }
      req.user = {
        id: rows[0].id,
        uid: rows[0].uid,
        email: rows[0].email,
        fullName: rows[0].fullName,
        role: rows[0].role as UserRole,
      };
      return next();
    } catch {
      return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
    }
  }
};

export const requireRole = (...allowedRoles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Forbidden: Requires one of [${allowedRoles.join(', ')}]`,
      });
    }
    return next();
  };
};

export async function writeAuditLog(
  req: AuthRequest,
  action: string,
  entityType: string,
  entityId: string | number,
  details: Record<string, unknown> = {}
) {
  if (!req.user) return;
  try {
    await db.insert(auditLogs).values({
      actorUid: req.user.uid,
      actorEmail: req.user.email,
      actorRole: req.user.role,
      action,
      entityType,
      entityId: String(entityId),
      details,
    });
  } catch (err) {
    console.error('Audit log write failed:', err);
  }
}
