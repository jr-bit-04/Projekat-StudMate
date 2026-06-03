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
import { getStoredToken, getStoredUser } from "../utils/authStorage";

function getUser() {
  return getStoredUser();
}

function ProtectedRoute({ children }) {
  const token = getStoredToken();

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
/*da se ne ponavljastalno isti */
function AdminRoute({ module, element }) {
  return (
    <ProtectedRoute>
      <AdminModuleRoute module={module}>
        {element}
      </AdminModuleRoute>
    </ProtectedRoute>
  );
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

        <Route path="/admin/popusti/moderacija" element={<AdminRoute module="popusti" element={<PopustiModeracija />} />} />
        <Route path="/admin/popusti/api-partneri" element={<AdminRoute module="popusti" element={<AdminApiPartneri />} />} />
        <Route path="/admin/citaona" element={<AdminRoute module="citaona" element={<AdminCitaona />} />} />
        <Route path="/admin/menza" element={<AdminRoute module="menza" element={<AdminMenza />} />} />
        <Route path="/admin/menza/bonovi" element={<AdminRoute module="menza" element={<AdminMenzaBonovi />} />} />
        <Route path="/admin/menza/obavjestenja" element={<AdminRoute module="menza" element={<AdminMenzaObavjestenja />} />} />
        <Route path="/admin/dom" element={<AdminRoute module="dom" element={<AdminDom />} />} />
        <Route path="/admin/dom/obavjestenja" element={<AdminRoute module="dom" element={<AdminDomObavjestenja />} />} />
        <Route path="/admin/stipendije" element={<AdminRoute module="stipendije" element={<AdminStipendije />} />} />
        <Route path="/admin/krediti" element={<AdminRoute module="stipendije" element={<AdminStipendije />} />} />
        <Route path="/admin/korisnici" element={<AdminRoute module="all" element={<AdminKorisnici />} />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
          
      </Routes>
    </BrowserRouter>


);
}

export default AppRoutes;
