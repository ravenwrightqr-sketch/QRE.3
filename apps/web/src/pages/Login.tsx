import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiPost } from "../lib/api";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin() {
    setError("");

    try {
      setLoading(true);

      const res = await apiPost("/auth/login", {
        email,
        password,
      });

      // expected: { token }
      if (res?.token) {
        localStorage.setItem("token", res.token);
      }

      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#050505",
      }}
    >
      <div
        style={{
          width: 420,
          padding: 40,
          border: "1px solid #222",
          borderRadius: 18,
          background: "#0b0b0b",
        }}
      >
        <h1 style={{ textAlign: "center", marginBottom: 30 }}>
          ⚡ ENTER NODE SYSTEM
        </h1>

        <input
          placeholder="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: "100%", padding: 14, marginBottom: 12 }}
        />

        <input
          placeholder="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: "100%", padding: 14, marginBottom: 20 }}
        />

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{ width: "100%", padding: 14 }}
        >
          {loading ? "Connecting..." : "LOGIN"}
        </button>

        {error && (
          <p style={{ color: "red", marginTop: 20, textAlign: "center" }}>
            {error}
          </p>
        )}
      </div>
    </div>
  );
}