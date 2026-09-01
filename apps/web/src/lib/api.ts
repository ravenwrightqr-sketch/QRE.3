const API_BASE =
  import.meta.env.VITE_API_URL || "http://localhost:3000";

async function request(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_BASE}${path}`, {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    body: options.body,
  });

  let data: any = {};
  try { data = await res.json(); } catch { data = {}; }

  if (res.status === 401) throw new Error(data.error || "Unauthorized");
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

async function publicRequest(path: string) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  let data: any = {};
  try { data = await res.json(); } catch { data = {}; }
  if (!res.ok) throw new Error(data.error || "Public request failed");
  return data;
}

export const apiGet = (path: string) => request(path);
export const apiPost = (path: string, body?: any) => request(path, { method: "POST", body: JSON.stringify(body) });
export const apiPut = (path: string, body?: any) => request(path, { method: "PUT", body: JSON.stringify(body) });
export const apiDelete = (path: string) => request(path, { method: "DELETE" });

export const getUserDashboard = () => apiGet("/api/dashboard");
export const getUserAssets = () => apiGet("/api/user/assets");
export const getAssetDashboard = (slug: string) => apiGet(`/api/dashboard/assets/${slug}`);
export const getAdminDashboard = () => apiGet("/api/admin/dashboard");
export const createExperienceAsset = (payload: { slug: string; prompt: string; priceCents?: number }) => apiPost("/api/admin/assets/create-experience", payload);
export const getAssetFlows = (assetId: string) => apiGet(`/api/flow/asset/${assetId}`);
export const attachFlow = (assetId: string, flowId: string, priority = 0) => apiPost("/api/flow/assign-flow", { assetId, flowId, priority });
export const detachFlow = (assetId: string, flowId: string) => apiPost("/api/flow/detach-flow", { assetId, flowId });
export const getAnalytics = () => apiGet("/api/analytics");

export const getScan = (
  slug: string,
  geo?: { lat: number; lng: number; accuracy?: number },
) => {
  const params = new URLSearchParams();
  if (geo) {
    params.set("lat", String(geo.lat));
    params.set("lng", String(geo.lng));
    if (geo.accuracy !== undefined) params.set("accuracy", String(geo.accuracy));
  }
  const query = params.toString();
  return publicRequest(`/api/scan/${slug}${query ? `?${query}` : ""}`);
};

export const scanLiveUrl = (slug: string) => `${API_BASE}/api/scan/${slug}`;
export const checkout = (slug: string) => apiPost("/api/checkout", { slug });

export type ServiceReceiptInput = {
  assetId: string;
  recipient: string;
  service?: string;
  facts?: string[];
  funny?: string;
  odd?: string;
  different?: string;
  notes?: string;
  mediaUrls?: string[];
  geo?: {
    latitude: number;
    longitude: number;
    label?: string;
    city?: string;
    region?: string;
    country?: string;
  };
};

export const createServiceReceipt = (input: ServiceReceiptInput) =>
  apiPost("/api/service-receipt/create", input) as Promise<{
    success: true;
    sessionId: string;
    recipient: string;
    shareUrl: string;
    delivered: boolean;
    deliveryReason: string;
    experience: any;
  }>;

export const getSharedExperience = (id: string) =>
  publicRequest(`/api/service-receipt/share/${encodeURIComponent(id)}`);
