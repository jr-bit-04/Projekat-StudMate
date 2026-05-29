import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "../pages/Login";
import Register from "../pages/Register";
import ForgotPassword from "../pages/ForgotPassword";

import Dashboard from "../pages/Dashboard";
import Dom from "../pages/Dom";
import Menza from "../pages/Menza";
import Citaona from "../pages/Citaona";
import Popusti from "../pages/Popusti";
import Stipendije from "../pages/Stipendije";
import Profil from "../pages/Profil";
import Admin from "../pages/Admin";

import AdminMenza from "../pages/AdminMenza";
import AdminMenzaObavjestenja from "../pages/AdminMenzaObavjestenja";
import AdminMenzaBonovi from "../pages/AdminMenzaBonovi";
import AdminCitaona from "../pages/AdminCitaona";

import AdminDom from "../pages/AdminDom";
import AdminDomObavjestenja from "../pages/AdminDomObavjestenja";
import PartnerPopusti from "../pages/PartnerPopusti";
import PopustiModeracija from "../pages/PopustiModeracija";
import AdminStipendije from "../pages/AdminStipendije";
import AdminKorisnici from "../pages/AdminKorisnici";
import AdminApiPartneri from "../pages/AdminApiPartneri";


function getUser() {
  return (
    JSON.parse(localStorage.getItem("user")) ||
    JSON.parse(sessionStorage.getItem("user"))
  );
}

function ProtectedRoute({ children }) {
  const token =
    localStorage.getItem("token") ||
    sessionStorage.getItem("token");

  return token ? children : <Navigate to="/login" replace />;
}

function AdminModuleRoute({ module, children }) {
  const user = getUser();

  const allowed =
    user?.role === "admin" &&
    (user.admin_module === "all" || user.admin_module === module);

  if (!allowed) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/dom" element={<ProtectedRoute><Dom /></ProtectedRoute>} />
        <Route path="/menza" element={<ProtectedRoute><Menza /></ProtectedRoute>} />
        <Route path="/citaona" element={<ProtectedRoute><Citaona /></ProtectedRoute>} />
        <Route path="/popusti" element={<ProtectedRoute><Popusti /></ProtectedRoute>} />
        <Route path="/stipendije" element={<ProtectedRoute><Stipendije /></ProtectedRoute>} />
        <Route path="/profil" element={<ProtectedRoute><Profil /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
        <Route path="/partner-popusti" element={<PartnerPopusti />} />
        
        <Route
          path="/admin/popusti/moderacija"
          element={
            <ProtectedRoute>
              <AdminModuleRoute module="popusti">
                <PopustiModeracija />
              </AdminModuleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/popusti/api-partneri"
          element={
            <ProtectedRoute>
              <AdminModuleRoute module="popusti">
                <AdminApiPartneri />
              </AdminModuleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/citaona"
          element={
            <ProtectedRoute>
              <AdminModuleRoute module="citaona">
                <AdminCitaona />
              </AdminModuleRoute>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/menza"
          element={
            <ProtectedRoute>
              <AdminModuleRoute module="menza">
                <AdminMenza />
              </AdminModuleRoute>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/menza/bonovi"
          element={
            <ProtectedRoute>
              <AdminModuleRoute module="menza">
                <AdminMenzaBonovi />
              </AdminModuleRoute>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/menza/obavjestenja"
          element={
            <ProtectedRoute>
              <AdminModuleRoute module="menza">
                <AdminMenzaObavjestenja />
              </AdminModuleRoute>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/dom"
          element={
            <ProtectedRoute>
              <AdminModuleRoute module="dom">
                <AdminDom />
              </AdminModuleRoute>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/dom/obavjestenja"
          element={
            <ProtectedRoute>
              <AdminModuleRoute module="dom">
                <AdminDomObavjestenja />
              </AdminModuleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/stipendije"
          element={
            <ProtectedRoute>
              <AdminModuleRoute module="stipendije">
                <AdminStipendije />
              </AdminModuleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/krediti"
          element={
            <ProtectedRoute>
              <AdminModuleRoute module="stipendije">
                <AdminStipendije />
              </AdminModuleRoute>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/korisnici"
          element={
            <ProtectedRoute>
              <AdminModuleRoute module="all">
                <AdminKorisnici />
              </AdminModuleRoute>
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;