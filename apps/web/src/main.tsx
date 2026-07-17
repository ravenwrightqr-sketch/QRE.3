import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/glass.css";
import { AuthProvider } from "./components/auth/authContext";

function BootScreen() {
  return (
    <div className="boot">
      <div className="glow">ENTER NODE SYSTEM</div>
      <div className="sub">initializing quantum qr mesh...</div>
    </div>
  );
}

function Root() {
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    const t = setTimeout(() => setReady(true), 250);
    return () => clearTimeout(t);
  }, []);

  if (!ready) return <BootScreen />;

  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found");
}

ReactDOM.createRoot(rootElement).render(
  // ⚠️ IMPORTANT: REMOVE STRICT MODE (it duplicates scans + effects)
  <Root />
);