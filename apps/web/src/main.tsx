import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/global.css";
import { AuthProvider } from "./components/dashboard/authContext";

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

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);