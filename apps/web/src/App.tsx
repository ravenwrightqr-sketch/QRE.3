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

import { useAuth } from "./components/dashboard/authContext";

export default function App() {
  const { isAuthed } = useAuth();

  return (
    <BrowserRouter>
      <Routes>

        {/* AUTH */}
        <Route path="/login" element={<Login />} />

        {/* ROOT REDIRECT */}
        <Route
          path="/"
          element={
            isAuthed ? <Navigate to="/dashboard" /> : <Navigate to="/login" />
          }
        />

        {/* USER DASHBOARD */}
        <Route
          path="/dashboard"
          element={isAuthed ? <Dashboard /> : <Navigate to="/login" />}
        />

        <Route path="/user" element={<UserDashboard />} />

        {/* ADMIN */}
        <Route
          path="/admin"
          element={isAuthed ? <AdminDashboard /> : <Navigate to="/login" />}
        />

        <Route
          path="/admin/create"
          element={isAuthed ? <CreateAsset /> : <Navigate to="/login" />}
        />

        <Route
          path="/admin/edit/:id"
          element={isAuthed ? <EditAsset /> : <Navigate to="/login" />}
        />

        <Route
          path="/admin/assets/:slug"
          element={isAuthed ? <AssetDashboard /> : <Navigate to="/login" />}
        />

        {/* PUBLIC SYSTEM */}
        <Route path="/product/:slug" element={<Product />} />
        <Route path="/scan/:slug" element={<Scan />} />
        <Route path="/store" element={<Store />} />
        <Route path="/success" element={<Success />} />
        <Route path="/cancel" element={<Cancel />} />

      </Routes>
    </BrowserRouter>
  );
}