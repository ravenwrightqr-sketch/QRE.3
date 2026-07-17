const API = import.meta.env.VITE_API_URL;

if (!API) {
  throw new Error("VITE_API_URL missing");
}

function getToken() {
  return localStorage.getItem("token");
}

async function request(path: string, options: RequestInit = {}) {
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",

      ...(getToken()
        ? { Authorization: `Bearer ${getToken()}` }
        : {}),

      ...(options.headers || {}),
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || "Request failed");
  }

  return data;
}

/**
 * =========================
 * AUTH
 * =========================
 */

export const login = (email: string, password: string) =>
  request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

export const register = (email: string, password: string) =>
  request("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

export const getCurrentUser = () => request("/api/auth/me");

export const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

/**
 * =========================
 * SCAN
 * =========================
 */

export const scan = (slug: string) =>
  request(`/api/scan/${slug}`);

/**
 * =========================
 * DASHBOARD
 * =========================
 */

export const getDashboardAsset = (slug: string) =>
  request(`/api/dashboard/asset/${slug}`);

/**
 * =========================
 * USER ASSETS
 * =========================
 */

export const getMyAssets = () =>
  request("/api/user/assets");

/**
 * =========================
 * CHECKOUT
 * =========================
 */

export const createCheckout = (slug: string) =>
  request("/api/checkout", {
    method: "POST",
    body: JSON.stringify({ slug }),
  });

/**
 * =========================
 * FLOW SYSTEM
 * =========================
 */

export const compileFlow = (input: string) =>
  request("/api/flow/compile", {
    method: "POST",
    body: JSON.stringify({ input }),
  });

export const createFlow = (name: string, actions: any[]) =>
  request("/api/flow/create", {
    method: "POST",
    body: JSON.stringify({ name, actions }),
  });

export const assignFlowToAsset = (assetId: string, flowId: string) =>
  request("/api/flow/assign-flow", {
    method: "POST",
    body: JSON.stringify({ assetId, flowId }),
  });

export const compileAndSaveFlow = (
  assetId: string,
  input: string,
  tier: "BASIC" | "PRO" | "BUSINESS"
) =>
  request("/api/flow/compile-and-save", {
    method: "POST",
    body: JSON.stringify({ assetId, input, tier }),
  });

/**
 * =========================
 * ADMIN
 * =========================
 */

export const getAdminStatus = () =>
  request("/api/admin/status");

export const toggleAdmin = (enabled: boolean) =>
  request("/api/admin/toggle", {
    method: "POST",
    body: JSON.stringify({ enabled }),
  });

/**
 * =========================
 * GENERIC
 * =========================
 */

export const apiGet = request;

export const apiPost = (path: string, body?: any) =>
  request(path, {
    method: "POST",
    body: JSON.stringify(body ?? {}),
  });

export const apiPut = (path: string, body?: any) =>
  request(path, {
    method: "PUT",
    body: JSON.stringify(body ?? {}),
  });

export const apiDelete = (path: string) =>
  request(path, { method: "DELETE" });