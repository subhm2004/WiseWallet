import "@wisewallet/shared/src/env.js";
import express from "express";
import cors from "cors";
import { db } from "@wisewallet/database";
import {
  SERVICE_PORTS,
  signToken,
  verifyToken,
  createService,
} from "@wisewallet/shared";
import {
  hashPassword,
  verifyPassword,
  normalizeEmail,
  issueAccessToken,
  publicUser,
  findOrLinkGoogleUser,
} from "./auth.js";
import {
  createResetToken,
  sendPasswordResetEmail,
  resetPasswordUrl,
} from "./password-reset.js";
import {
  createUserSession,
  revokeSession,
  revokeAllSessions,
  rotateSession,
  parseUserAgent,
} from "./sessions.js";

const app = express();
const JWT_SECRET = process.env.JWT_SECRET;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_CALLBACK_URL =
  process.env.GOOGLE_CALLBACK_URL ||
  "http://localhost:8080/api/auth/google/callback";
const WEB_URL = process.env.WEB_URL || "http://localhost:3000";

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

async function issueAuthResponse(user, req, res, status = 200) {
  const { refreshToken } = await createUserSession(db, user.id, {
    userAgent: req.headers["user-agent"],
  });
  const token = issueAccessToken(user, signToken, JWT_SECRET);
  return res.status(status).json({ token, refreshToken, user: publicUser(user) });
}

function requireBearer(req, res) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }
  try {
    return verifyToken(authHeader.slice(7), JWT_SECRET);
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
    return null;
  }
}

app.get("/health", (_req, res) => {
  res.json({ service: "auth-service", status: "ok" });
});

app.post("/register", async (req, res) => {
  try {
    const { email, password, name } = req.body || {};
    const normalized = normalizeEmail(email || "");

    if (!normalized || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      return res.status(400).json({ error: "Valid email is required" });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    const existing = await db.user.findUnique({ where: { email: normalized } });
    if (existing) {
      if (existing.passwordHash) {
        return res.status(409).json({ error: "An account with this email already exists" });
      }
      const passwordHash = await hashPassword(password);
      const user = await db.user.update({
        where: { id: existing.id },
        data: {
          passwordHash,
          name: name?.trim() || existing.name,
        },
      });
      return issueAuthResponse(user, req, res, 200);
    }

    const passwordHash = await hashPassword(password);
    const user = await db.user.create({
      data: {
        email: normalized,
        passwordHash,
        name: name?.trim() || null,
      },
    });

    return issueAuthResponse(user, req, res, 201);
  } catch (error) {
    console.error("[auth-service] Register error:", error);
    res.status(500).json({ error: "Registration failed" });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const normalized = normalizeEmail(email || "");

    if (!normalized || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await db.user.findUnique({ where: { email: normalized } });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    if (!user.passwordHash) {
      return res.status(401).json({
        error: "This account uses Google sign-in. Continue with Google instead.",
        useGoogle: true,
      });
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    return issueAuthResponse(user, req, res);
  } catch (error) {
    console.error("[auth-service] Login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
});

app.post("/refresh", async (req, res) => {
  try {
    const { refreshToken } = req.body || {};
    if (!refreshToken) {
      return res.status(400).json({ error: "Refresh token required" });
    }

    const result = await rotateSession(db, refreshToken, {
      userAgent: req.headers["user-agent"],
    });
    if (!result) {
      return res.status(401).json({ error: "Invalid or expired session" });
    }

    const token = issueAccessToken(result.user, signToken, JWT_SECRET);
    res.json({
      token,
      refreshToken: result.refreshToken,
      user: publicUser(result.user),
    });
  } catch (error) {
    console.error("[auth-service] Refresh error:", error);
    res.status(500).json({ error: "Failed to refresh session" });
  }
});

app.post("/session", async (req, res) => {
  try {
    const decoded = requireBearer(req, res);
    if (!decoded) return;

    const user = await db.user.findUnique({ where: { id: decoded.userId } });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const { refreshToken } = await createUserSession(db, user.id, {
      userAgent: req.headers["user-agent"],
    });
    res.json({ refreshToken });
  } catch (error) {
    console.error("[auth-service] Session bootstrap error:", error);
    res.status(500).json({ error: "Failed to create session" });
  }
});

app.post("/logout", async (req, res) => {
  try {
    const { refreshToken } = req.body || {};
    await revokeSession(db, refreshToken);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Logout failed" });
  }
});

app.post("/logout-all", async (req, res) => {
  try {
    const decoded = requireBearer(req, res);
    if (!decoded) return;

    const { refreshToken } = req.body || {};
    await revokeAllSessions(db, decoded.userId, refreshToken || null);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to log out other devices" });
  }
});

app.get("/sessions", async (req, res) => {
  try {
    const decoded = requireBearer(req, res);
    if (!decoded) return;

    const currentRefresh = req.headers["x-refresh-token"] || null;
    const sessions = await db.userSession.findMany({
      where: { userId: decoded.userId, expiresAt: { gt: new Date() } },
      orderBy: { lastUsedAt: "desc" },
    });

    res.json({
      sessions: sessions.map((s) => ({
        id: s.id,
        device: parseUserAgent(s.userAgent),
        createdAt: s.createdAt,
        lastUsedAt: s.lastUsedAt,
        expiresAt: s.expiresAt,
        current: currentRefresh ? s.refreshToken === currentRefresh : false,
      })),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/sessions/:id", async (req, res) => {
  try {
    const decoded = requireBearer(req, res);
    if (!decoded) return;

    const session = await db.userSession.findFirst({
      where: { id: req.params.id, userId: decoded.userId },
    });
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    await db.userSession.delete({ where: { id: session.id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/forgot-password", async (req, res) => {
  try {
    const normalized = normalizeEmail(req.body?.email || "");
    if (!normalized) {
      return res.status(400).json({ error: "Email is required" });
    }

    const user = await db.user.findUnique({ where: { email: normalized } });
    if (user?.email) {
      await db.passwordResetToken.deleteMany({ where: { userId: user.id } });
      const token = createResetToken();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
      await db.passwordResetToken.create({
        data: { userId: user.id, token, expiresAt },
      });
      await sendPasswordResetEmail({
        to: user.email,
        userName: user.name,
        resetUrl: resetPasswordUrl(token),
        userId: user.id,
      });
    }

    res.json({
      message: "If an account exists with that email, a reset link has been sent.",
    });
  } catch (error) {
    console.error("[auth-service] Forgot password error:", error);
    res.status(500).json({ error: "Could not process reset request" });
  }
});

app.post("/reset-password", async (req, res) => {
  try {
    const { token, password } = req.body || {};
    if (!token || !password) {
      return res.status(400).json({ error: "Token and new password are required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    const record = await db.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!record || record.expiresAt < new Date()) {
      return res.status(400).json({ error: "Invalid or expired reset link" });
    }

    const passwordHash = await hashPassword(password);
    await db.$transaction([
      db.user.update({
        where: { id: record.userId },
        data: { passwordHash },
      }),
      db.passwordResetToken.deleteMany({ where: { userId: record.userId } }),
      db.userSession.deleteMany({ where: { userId: record.userId } }),
    ]);

    res.json({ message: "Password updated. You can sign in now." });
  } catch (error) {
    console.error("[auth-service] Reset password error:", error);
    res.status(500).json({ error: "Failed to reset password" });
  }
});

app.get("/google", (_req, res) => {
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: GOOGLE_CALLBACK_URL,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "select_account",
  });
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
});

app.get("/google/callback", async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) {
      return res.redirect(`${WEB_URL}/sign-in?error=no_code`);
    }

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: GOOGLE_CALLBACK_URL,
        grant_type: "authorization_code",
      }),
    });

    const tokens = await tokenRes.json();
    if (!tokens.access_token) {
      return res.redirect(`${WEB_URL}/sign-in?error=token_failed`);
    }

    const userRes = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      { headers: { Authorization: `Bearer ${tokens.access_token}` } }
    );
    const googleUser = await userRes.json();

    if (!googleUser.id || !googleUser.email) {
      return res.redirect(`${WEB_URL}/sign-in?error=user_info_failed`);
    }

    const user = await findOrLinkGoogleUser(db, googleUser);
    const token = issueAccessToken(user, signToken, JWT_SECRET);

    res.redirect(`${WEB_URL}/auth/callback?token=${token}`);
  } catch (error) {
    console.error("[auth-service] OAuth error:", error);
    res.redirect(`${WEB_URL}/sign-in?error=oauth_failed`);
  }
});

app.get("/me", async (req, res) => {
  try {
    const decoded = requireBearer(req, res);
    if (!decoded) return;

    const user = await db.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ user: publicUser(user) });
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
});

app.patch("/me", async (req, res) => {
  try {
    const decoded = requireBearer(req, res);
    if (!decoded) return;

    const user = await db.user.findUnique({ where: { id: decoded.userId } });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const { name, imageUrl, currentPassword, newPassword, dashboardWidgets } =
      req.body || {};
    const data = {};

    if (name !== undefined) {
      const trimmed = name?.trim();
      if (!trimmed) {
        return res.status(400).json({ error: "Name cannot be empty" });
      }
      data.name = trimmed;
    }

    if (imageUrl !== undefined) {
      const trimmed = imageUrl?.trim();
      if (trimmed && !/^https?:\/\/.+/i.test(trimmed)) {
        return res.status(400).json({ error: "Avatar must be a valid URL" });
      }
      data.imageUrl = trimmed || null;
    }

    if (dashboardWidgets !== undefined) {
      if (!Array.isArray(dashboardWidgets)) {
        return res.status(400).json({ error: "dashboardWidgets must be an array" });
      }
      data.dashboardWidgets = dashboardWidgets;
    }

    if (newPassword) {
      if (newPassword.length < 6) {
        return res.status(400).json({ error: "New password must be at least 6 characters" });
      }
      if (!user.passwordHash) {
        return res.status(400).json({
          error: "Set a password first via register flow, or use Google sign-in only",
        });
      }
      if (!currentPassword) {
        return res.status(400).json({ error: "Current password is required" });
      }
      const valid = await verifyPassword(currentPassword, user.passwordHash);
      if (!valid) {
        return res.status(401).json({ error: "Current password is incorrect" });
      }
      data.passwordHash = await hashPassword(newPassword);
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: "No valid fields to update" });
    }

    const updated = await db.user.update({
      where: { id: user.id },
      data,
    });

    const token = issueAccessToken(updated, signToken, JWT_SECRET);
    res.json({ token, user: publicUser(updated) });
  } catch (error) {
    console.error("[auth-service] Profile update error:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

app.post("/verify", (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ error: "Token required" });
    }
    const decoded = verifyToken(token, JWT_SECRET);
    res.json({ valid: true, user: decoded });
  } catch {
    res.status(401).json({ valid: false, error: "Invalid token" });
  }
});

createService("auth-service").start(SERVICE_PORTS.AUTH, app);
