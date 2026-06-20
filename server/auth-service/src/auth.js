import bcrypt from "bcryptjs";
import { ACCESS_TTL } from "./sessions.js";

const SALT_ROUNDS = 12;

export async function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password, hash) {
  if (!hash) return false;
  return bcrypt.compare(password, hash);
}

export function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

export function issueAccessToken(user, signToken, jwtSecret) {
  return signToken(
    { userId: user.id, email: user.email, name: user.name },
    jwtSecret,
    ACCESS_TTL
  );
}

/** @deprecated use issueAccessToken */
export function issueUserToken(user, signToken, jwtSecret) {
  return issueAccessToken(user, signToken, jwtSecret);
}

export function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    imageUrl: user.imageUrl,
    hasGoogle: !!user.googleId,
    hasPassword: !!user.passwordHash,
    dashboardWidgets: user.dashboardWidgets ?? null,
    createdAt: user.createdAt,
  };
}

export async function findOrLinkGoogleUser(db, googleUser) {
  let user = await db.user.findUnique({
    where: { googleId: googleUser.id },
  });

  if (user) {
    return db.user.update({
      where: { id: user.id },
      data: {
        name: googleUser.name || user.name,
        imageUrl: googleUser.picture || user.imageUrl,
      },
    });
  }

  user = await db.user.findUnique({
    where: { email: normalizeEmail(googleUser.email) },
  });

  if (user) {
    return db.user.update({
      where: { id: user.id },
      data: {
        googleId: googleUser.id,
        name: googleUser.name || user.name,
        imageUrl: googleUser.picture || user.imageUrl,
      },
    });
  }

  return db.user.create({
    data: {
      googleId: googleUser.id,
      email: normalizeEmail(googleUser.email),
      name: googleUser.name || null,
      imageUrl: googleUser.picture || null,
    },
  });
}
