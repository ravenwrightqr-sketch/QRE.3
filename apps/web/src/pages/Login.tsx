import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiPost } from "../lib/api";
import { useAuth } from "../components/auth/authContext";

export default function Login() {
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "register">("login");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    setError("");

    try {
      setLoading(true);

      const endpoint = mode === "login" ? "/auth/login" : "/auth/register";
      const res = await apiPost(endpoint, {
        email,
        password,
      });

      if (res?.token) {
  localStorage.setItem(
    "token",
    res.token
  );
}

if (res?.user) {
  setUser(res.user);
}

navigate("/dashboard");
    } catch (err: any) {
      setError(err.message || (mode === "login" ? "Login failed" : "Account creation failed"));
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
          onClick={handleSubmit}
          disabled={loading}
          style={{ width: "100%", padding: 14 }}
        >
          {loading
            ? "Connecting..."
            : mode === "login"
              ? "LOGIN"
              : "CREATE ACCOUNT"}
        </button>

        <button
          type="button"
          onClick={() => {
            setMode((current) => (current === "login" ? "register" : "login"));
            setError("");
          }}
          style={{
            width: "100%",
            padding: 12,
            marginTop: 12,
            border: "1px solid #333",
            background: "transparent",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          {mode === "login" ? "Need an account? Create one" : "Already have an account? Log in"}
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