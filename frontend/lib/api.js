const TOKEN_KEY = "wisewallet_token";
const REFRESH_KEY = "wisewallet_refresh";
export const AUTH_CHANGED_EVENT = "wisewallet-auth-changed";

let refreshPromise = null;

function getCookieToken() {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|; )auth_token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export function getToken() {
  if (typeof window === "undefined") return null;

  let token = localStorage.getItem(TOKEN_KEY);
  if (!token) {
    token = getCookieToken();
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    }
  }
  return token;
}

export function getRefreshToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_KEY);
}

export function setAuthTokens({ token, refreshToken }) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
    document.cookie = `auth_token=${token}; path=/; max-age=${3600}; SameSite=Lax`;
  }
  if (refreshToken) {
    localStorage.setItem(REFRESH_KEY, refreshToken);
  }
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
}

export function setToken(token) {
  setAuthTokens({ token });
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  document.cookie = "auth_token=; path=/; max-age=0";
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
}

async function refreshAccessToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  if (!refreshPromise) {
    refreshPromise = fetch("/api/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    })
      .then(async (res) => {
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          clearToken();
          return null;
        }
        setAuthTokens({ token: data.token, refreshToken: data.refreshToken });
        return data.token;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

async function apiFetch(path, options = {}, retry = true) {
  const token = getToken();
  const refreshToken = getRefreshToken();
  const headers = {
    ...options.headers,
  };

  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  if (refreshToken) {
    headers["X-Refresh-Token"] = refreshToken;
  }

  const res = await fetch(`/api${path}`, {
    ...options,
    headers,
  });

  if (res.status === 401 && retry) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      return apiFetch(path, options, false);
    }
    clearToken();
    if (typeof window !== "undefined") {
      window.location.href = "/sign-in";
    }
    throw new Error("Unauthorized");
  }

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.error || "Request failed");
  }

  return data;
}

async function publicApiFetch(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };
  const res = await fetch(`/api${path}`, { ...options, headers });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.error || data?.message || "Request failed");
  }
  return data;
}

function isSplitGroup(item) {
  return (
    item &&
    typeof item.id === "string" &&
    typeof item.title === "string" &&
    item.title.trim().length > 0 &&
    typeof item.inviteToken === "string" &&
    item.inviteToken.length > 0
  );
}

export const api = {
  auth: {
    getMe: () => apiFetch("/auth/me"),
    updateProfile: (data) =>
      apiFetch("/auth/me", {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    createSession: () =>
      apiFetch("/auth/session", { method: "POST" }),
    refresh: () => refreshAccessToken(),
    listSessions: () => apiFetch("/auth/sessions"),
    revokeSession: (id) =>
      apiFetch(`/auth/sessions/${id}`, { method: "DELETE" }),
    logoutAll: () =>
      apiFetch("/auth/logout-all", {
        method: "POST",
        body: JSON.stringify({ refreshToken: getRefreshToken() }),
      }),
    forgotPassword: (email) =>
      publicApiFetch("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      }),
    resetPassword: (token, password) =>
      publicApiFetch("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, password }),
      }),
    login: (email, password) =>
      publicApiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }),
    register: (email, password, name) =>
      publicApiFetch("/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, password, name }),
      }),
    loginUrl: () => "/api/auth/google",
    logout: async () => {
      const refreshToken = getRefreshToken();
      try {
        if (refreshToken) {
          await publicApiFetch("/auth/logout", {
            method: "POST",
            body: JSON.stringify({ refreshToken }),
          });
        }
      } catch {
        // ignore
      }
      clearToken();
      window.location.href = "/";
    },
  },
  accounts: {
    list: () => apiFetch("/accounts"),
    get: (id) => apiFetch(`/accounts/${id}`),
    create: (data) =>
      apiFetch("/accounts", { method: "POST", body: JSON.stringify(data) }),
    update: (id, data) =>
      apiFetch(`/accounts/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    delete: (id, { migrateToAccountId } = {}) =>
      apiFetch(`/accounts/${id}`, {
        method: "DELETE",
        body: JSON.stringify(migrateToAccountId ? { migrateToAccountId } : {}),
      }),
    setDefault: (id) =>
      apiFetch(`/accounts/${id}/default`, { method: "PATCH" }),
  },
  transactions: {
    list: (params = {}) => {
      const qs = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v != null && v !== "") qs.set(k, v);
      });
      const query = qs.toString();
      return apiFetch(query ? `/transactions?${query}` : "/transactions");
    },
    get: (id) => apiFetch(`/transactions/${id}`),
    create: (data) =>
      apiFetch("/transactions", { method: "POST", body: JSON.stringify(data) }),
    update: (id, data) =>
      apiFetch(`/transactions/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    bulkDelete: (transactionIds) =>
      apiFetch("/transactions/bulk", {
        method: "DELETE",
        body: JSON.stringify({ transactionIds }),
      }),
    delete: (id) =>
      apiFetch(`/transactions/${id}`, { method: "DELETE" }),
    scanReceipt: (file) => {
      const formData = new FormData();
      formData.append("file", file);
      return apiFetch("/transactions/scan-receipt", {
        method: "POST",
        body: formData,
      });
    },
    previewCsv: (file, { format = "auto", accountId } = {}) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("format", format);
      if (accountId) formData.append("accountId", accountId);
      return apiFetch("/transactions/import/csv/preview", {
        method: "POST",
        body: formData,
      });
    },
    importCsv: (file, { accountId, format = "auto", skipDuplicates = true, applyRules = true }) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("accountId", accountId);
      formData.append("format", format);
      formData.append("skipDuplicates", String(skipDuplicates));
      formData.append("applyRules", String(applyRules));
      return apiFetch("/transactions/import/csv", {
        method: "POST",
        body: formData,
      });
    },
  },
  recurring: {
    list: () => apiFetch("/transactions/recurring"),
    create: (data) =>
      apiFetch("/transactions/recurring", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id, data) =>
      apiFetch(`/transactions/recurring/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    remove: (id) =>
      apiFetch(`/transactions/recurring/${id}`, { method: "DELETE" }),
  },
  budgets: {
    get: (accountId) => {
      if (!accountId) {
        return Promise.reject(new Error("No account selected"));
      }
      return apiFetch(`/budgets?accountId=${accountId}`);
    },
    update: (amount) =>
      apiFetch("/budgets", {
        method: "PUT",
        body: JSON.stringify({ amount }),
      }),
    listCategories: () => apiFetch("/budgets/categories"),
    upsertCategory: (category, amount) =>
      apiFetch("/budgets/categories", {
        method: "PUT",
        body: JSON.stringify({ category, amount }),
      }),
    deleteCategory: (category) =>
      apiFetch(`/budgets/categories/${encodeURIComponent(category)}`, {
        method: "DELETE",
      }),
    listGoals: () => apiFetch("/budgets/goals"),
    createGoal: (data) =>
      apiFetch("/budgets/goals", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    updateGoal: (id, data) =>
      apiFetch(`/budgets/goals/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    deleteGoal: (id) =>
      apiFetch(`/budgets/goals/${id}`, { method: "DELETE" }),
  },
  notifications: {
    list: () => apiFetch("/notifications/emails"),
  },
  analytics: {
    monthly: (months = 6) =>
      apiFetch(`/transactions/analytics/monthly?months=${months}`),
    overview: () => apiFetch("/transactions/analytics/overview"),
    healthScore: () => apiFetch("/transactions/analytics/health-score"),
    categoryBreakdown: () => apiFetch("/transactions/analytics/categories"),
    monthlyInsights: () => apiFetch("/transactions/insights/monthly"),
    subscriptions: () => apiFetch("/transactions/subscriptions"),
    ask: (question) =>
      apiFetch("/transactions/insights/ask", {
        method: "POST",
        body: JSON.stringify({ question }),
      }),
    exportCsv: async () => {
      const token = getToken();
      const res = await fetch("/api/transactions/export/csv", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "wisewallet-transactions.csv";
      a.click();
      URL.revokeObjectURL(url);
    },
    exportPdf: async () => {
      const token = getToken();
      const res = await fetch("/api/transactions/export/pdf", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("PDF export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `wisewallet-report-${new Date().toISOString().slice(0, 7)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    },
    netWorthTimeline: (months = 6) =>
      apiFetch(`/transactions/analytics/net-worth-timeline?months=${months}`),
  },
  rules: {
    list: () => apiFetch("/transactions/rules/categories"),
    create: (pattern, category) =>
      apiFetch("/transactions/rules/categories", {
        method: "POST",
        body: JSON.stringify({ pattern, category }),
      }),
    delete: (id) =>
      apiFetch(`/transactions/rules/categories/${id}`, { method: "DELETE" }),
  },
  splits: {
    list: () =>
      apiFetch("/splits").then((data) => {
        const groups = data?.groups;
        if (!Array.isArray(groups)) return [];
        return groups.filter(isSplitGroup);
      }),
    get: (id) => apiFetch(`/splits/${id}`),
    create: (data) =>
      apiFetch("/splits", { method: "POST", body: JSON.stringify(data) }).then(
        (res) => {
          const group = res?.group ?? res;
          return isSplitGroup(group) ? group : null;
        }
      ),
    join: (token, data = {}) =>
      apiFetch(`/splits/join/${token}`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    delete: (id) => apiFetch(`/splits/${id}`, { method: "DELETE" }),
    addMember: (groupId, name) =>
      apiFetch(`/splits/${groupId}/members`, {
        method: "POST",
        body: JSON.stringify({ name }),
      }),
    addExpense: (groupId, data) =>
      apiFetch(`/splits/${groupId}/expenses`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    deleteExpense: (groupId, expenseId) =>
      apiFetch(`/splits/${groupId}/expenses/${expenseId}`, {
        method: "DELETE",
      }),
    recordSettlement: (groupId, data) =>
      apiFetch(`/splits/${groupId}/settlements`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    deleteSettlement: (groupId, settlementId) =>
      apiFetch(`/splits/${groupId}/settlements/${settlementId}`, {
        method: "DELETE",
      }),
    inviteUrl: (inviteToken) =>
      typeof window !== "undefined"
        ? `${window.location.origin}/split/${inviteToken}`
        : `/split/${inviteToken}`,
  },
};
