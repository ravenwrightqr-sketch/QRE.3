import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import UserDashboard from "./pages/UserDashboard";

import AdminDashboard from "./pages/admin/AdminDashboard";
import CreateAsset from "./pages/admin/CreateAsset";
import EditAsset from "./pages/admin/EditAsset";

import AssetDashboard from "./pages/AssetDashboard";
import Scan from "./pages/scan";
import Store from "./pages/store";
import Product from "./pages/product";
import Success from "./pages/Success";
import Cancel from "./pages/Cancel";

function isAuth(): boolean {
  return !!localStorage.getItem("token");
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

          {/* ===================== AUTH ===================== */}
        <Route path="/login" element={<Login />} />

        {/* ===================== MAIN DASHBOARD ===================== */}
        <Route
          path="/dashboard"
          element={isAuth() ? <Dashboard /> : <Navigate to="/login" />}
        />

        <Route path="/user" element={<UserDashboard />} />

        {/* ===================== ADMIN ===================== */}
        <Route
          path="/admin"
          element={isAuth() ? <AdminDashboard /> : <Navigate to="/login" />}
        />

        <Route
          path="/admin/create"
          element={isAuth() ? <CreateAsset /> : <Navigate to="/login" />}
        />

        <Route
          path="/admin/edit/:id"
          element={isAuth() ? <EditAsset /> : <Navigate to="/login" />}
        />

        <Route
          path="/admin/assets/:slug"
          element={isAuth() ? <AssetDashboard /> : <Navigate to="/login" />}
        />

        {/* ===================== PUBLIC PRODUCT FLOW ===================== */}
        <Route path="/product/:slug" element={<Product />} />

        <Route path="/scan/:slug" element={<Scan />} />

        <Route path="/store" element={<Store />} />

        <Route path="/success" element={<Success />} />

        <Route path="/cancel" element={<Cancel />} />

        {/* ===================== DEFAULT ===================== */}
        <Route
          path="/"
          element={
            isAuth()
              ? <Navigate to="/dashboard" />
              : <Navigate to="/login" />
          }
        />

      </Routes>
    </BrowserRouter>
  );
}