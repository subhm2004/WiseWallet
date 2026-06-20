import crypto from "crypto";

const REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const ACCESS_TTL = "1h";

export function createRefreshToken() {
  return crypto.randomBytes(48).toString("hex");
}

export function sessionExpiry() {
  return new Date(Date.now() + REFRESH_TTL_MS);
}

export { ACCESS_TTL };

export async function createUserSession(db, userId, { userAgent } = {}) {
  const refreshToken = createRefreshToken();
  const session = await db.userSession.create({
    data: {
      userId,
      refreshToken,
      userAgent: userAgent?.slice(0, 512) || null,
      expiresAt: sessionExpiry(),
    },
  });
  return { session, refreshToken };
}

export async function revokeSession(db, refreshToken) {
  if (!refreshToken) return;
  await db.userSession.deleteMany({ where: { refreshToken } });
}

export async function revokeAllSessions(db, userId, exceptRefreshToken = null) {
  const where = { userId };
  if (exceptRefreshToken) {
    where.refreshToken = { not: exceptRefreshToken };
  }
  await db.userSession.deleteMany({ where });
}

export async function rotateSession(db, refreshToken, { userAgent } = {}) {
  const session = await db.userSession.findUnique({
    where: { refreshToken },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date()) {
    if (session) {
      await db.userSession.delete({ where: { id: session.id } });
    }
    return null;
  }

  const newRefreshToken = createRefreshToken();
  const updated = await db.userSession.update({
    where: { id: session.id },
    data: {
      refreshToken: newRefreshToken,
      userAgent: userAgent?.slice(0, 512) || session.userAgent,
      expiresAt: sessionExpiry(),
      lastUsedAt: new Date(),
    },
    include: { user: true },
  });

  return { session: updated, user: updated.user, refreshToken: newRefreshToken };
}

export function parseUserAgent(ua) {
  if (!ua) return "Unknown device";
  if (/iPhone|iPad/i.test(ua)) return "iPhone / iPad";
  if (/Android/i.test(ua)) return "Android";
  if (/Mac OS/i.test(ua)) return "Mac";
  if (/Windows/i.test(ua)) return "Windows";
  if (/Linux/i.test(ua)) return "Linux";
  if (/Chrome/i.test(ua)) return "Chrome browser";
  if (/Safari/i.test(ua)) return "Safari browser";
  return "Web browser";
}
