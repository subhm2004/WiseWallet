/** Only allow same-origin relative paths (blocks open redirects). */
export function safeRedirect(path, fallback = "/dashboard") {
  if (!path || typeof path !== "string") return fallback;
  const trimmed = path.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return fallback;
  return trimmed;
}

export function storeAuthRedirect(path) {
  if (typeof window === "undefined") return;
  const safe = safeRedirect(path, "");
  if (safe) sessionStorage.setItem("auth_redirect", safe);
}

export function consumeAuthRedirect(fallback = "/dashboard") {
  if (typeof window === "undefined") return fallback;
  const stored = sessionStorage.getItem("auth_redirect");
  sessionStorage.removeItem("auth_redirect");
  return safeRedirect(stored, fallback);
}
