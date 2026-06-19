import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API = "http://localhost:3000";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  async function handleLogin() {
    setError("");

    try {
      const res = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }

      /**
       * =========================
       * STORE TOKEN
       * =========================
       */
      localStorage.setItem("token", data.token);

      /**
       * =========================
       * NAVIGATE TO DASHBOARD
       * =========================
       */
      navigate("/dashboard");
    } catch (err) {
      setError("Network error");
    }
  }

  return (
    <div className="login">
      <h1 className="glitch-title">ENTER NODE SYSTEM</h1>

      <input
        placeholder="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        placeholder="password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button onClick={handleLogin}>LOGIN</button>

      {error && <p className="error">{error}</p>}
    </div>
  );
}