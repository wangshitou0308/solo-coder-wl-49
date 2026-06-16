import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import Layout from "@/components/Layout";
import Login from "@/pages/Login";
import Home from "@/pages/Home";
import Dashboard from "@/pages/Dashboard";
import Tasks from "@/pages/Tasks";
import CompostSites from "@/pages/CompostSites";
import CompostSiteDetail from "@/pages/CompostSiteDetail";
import Deposit from "@/pages/Deposit";
import DepositRecords from "@/pages/DepositRecords";
import Monitor from "@/pages/Monitor";
import Alerts from "@/pages/Alerts";
import Store from "@/pages/Store";
import Profile from "@/pages/Profile";
import UserManagement from "@/pages/UserManagement";
import PointsDetail from "@/pages/PointsDetail";
import BinDetail from "@/pages/BinDetail";
import { useAuthStore } from "@/stores/auth";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, token, fetchMe } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (token && !isAuthenticated) {
      fetchMe().catch(() => {
        navigate('/login', { replace: true, state: { from: location } });
      });
    }
  }, [token, isAuthenticated, fetchMe, navigate, location]);

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  const { isAuthenticated, token } = useAuthStore();

  return (
    <Routes>
      <Route
        path="/login"
        element={
          token || isAuthenticated ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <Login />
          )
        }
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Home />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="tasks" element={<Tasks />} />
        <Route path="compost-sites" element={<CompostSites />} />
        <Route path="compost-sites/:id" element={<CompostSiteDetail />} />
        <Route path="deposit" element={<Deposit />} />
        <Route path="deposit/records" element={<DepositRecords />} />
        <Route path="monitor" element={<Monitor />} />
        <Route path="monitor/alerts" element={<Alerts />} />
        <Route path="store" element={<Store />} />
        <Route path="profile" element={<Profile />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="points" element={<PointsDetail />} />
        <Route path="bins/:binId" element={<BinDetail />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}
