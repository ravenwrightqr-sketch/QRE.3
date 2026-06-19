const API_URL = "http://localhost:3000";

/**
 * =========================
 * TOKEN HELPERS
 * =========================
 */
function getToken() {
  return localStorage.getItem("token");
}

/**
 * =========================
 * SCAN
 * =========================
 */
export async function scan(slug: string) {
  const res = await fetch(`${API_URL}/scan/${slug}`);
  return res.json();
}

/**
 * =========================
 * CHECKOUT
 * =========================
 */
export async function createCheckout(assetId: string) {
  const res = await fetch(`${API_URL}/checkout/${assetId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
  });

  return res.json();
}

/**
 * =========================
 * AUTH - LOGIN
 * =========================
 */
export async function login(email: string, password: string) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  return res.json();
}

/**
 * =========================
 * AUTH - REGISTER
 * =========================
 */
export async function register(email: string, password: string) {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  return res.json();
}