import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";


import Login from "./pages/Login";

import Dashboard from "./pages/Dashboard";
import AssetDashboard from "./pages/AssetDashboard";
import ExperiencePreview from "./pages/ExperiencePreview";

import AdminDashboard from "./pages/admin/AdminDashboard";
import CreateAsset from "./pages/admin/CreateAsset";

import FlowEditor from "./components/flow/FlowEditor";
import Checkout from "./pages/Checkout";
import Scan from "./pages/scan";
import Store from "./pages/store";
import Product from "./pages/product";

import Success from "./pages/Success";
import Cancel from "./pages/Cancel";


import { useAuth } from "./components/auth/authContext";



export default function App() {

const {
  isAuthed,
  loading,
} = useAuth();


if (loading) {
  return (
    <div
      style={{
        minHeight:"100vh",
        display:"grid",
        placeItems:"center",
        background:"#030509",
        color:"#00ffcc"
      }}
    >
      LOADING QRE NODE...
    </div>
  );
}



  return (

    <BrowserRouter>

      <Routes>


        {/* =========================
            AUTH
        ========================= */}

        <Route
          path="/login"
          element={
            isAuthed
              ? <Navigate to="/dashboard" replace />
              : <Login />
          }
        />



        {/* =========================
            ROOT REDIRECT
        ========================= */}

        <Route
          path="/"
          element={
            isAuthed
              ? <Navigate to="/dashboard" />
              : <Navigate to="/login" />
          }
        />



        {/* =========================
            CUSTOMER DASHBOARD
        ========================= */}


        <Route
          path="/dashboard"
          element={
            isAuthed
              ? <Dashboard />
              : <Navigate to="/login" />
          }
        />



        <Route
          path="/dashboard/assets/:slug"
          element={
            isAuthed
              ? <AssetDashboard />
              : <Navigate to="/login" />
          }
        />



        {/* =========================
            EXPERIENCE COMPILER PREVIEW
        ========================= */}


        <Route
          path="/experience/preview"
          element={
            isAuthed
              ? <ExperiencePreview />
              : <Navigate to="/login" />
          }
        />





             <Route
  path="/experience/builder/:flowId"
  element={
    isAuthed
      ? <FlowEditor />
      : <Navigate to="/login" />
  }
/>

        {/* =========================
            ADMIN
        ========================= */}


        <Route
          path="/admin"
          element={
            isAuthed
              ? <AdminDashboard />
              : <Navigate to="/login" />
          }
        />



        <Route
          path="/admin/create"
          element={
            isAuthed
              ? <CreateAsset />
              : <Navigate to="/login" />
          }
        />



        



        {/* =========================
            PUBLIC RUNTIME
        ========================= */}


        <Route
          path="/checkout/:slug"
          element={<Checkout />}
        />



        <Route
          path="/scan/:slug"
          element={<Scan />}
        />



        <Route
          path="/s/:slug"
          element={<Scan />}
        />



        <Route
          path="/product/:slug"
          element={<Product />}
        />



        <Route
          path="/store"
          element={<Store />}
        />



        <Route
          path="/success"
          element={<Success />}
        />



        <Route
          path="/cancel"
          element={<Cancel />}
        />



        {/* =========================
            FALLBACK
        ========================= */}


        <Route
          path="*"
          element={
            <Navigate to="/" />
          }
        />


      </Routes>

    </BrowserRouter>

  );

}