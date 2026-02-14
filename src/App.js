import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import AdminLogin from './pages/AdminLogin';
import StudioLogin from './pages/StudioLogin';
import Dashboard from './pages/Dashboard';
import StoragePlans from './pages/StoragePlans';
import MediaUpload from './pages/MediaUpload';
import MediaList from './pages/MediaList';
import MediaDriveDetail from './pages/MediaDriveDetail';
import MediaView from './pages/MediaView';
import Profile from './pages/Profile';
import HowToUse from './pages/HowToUse';
import Layout from './components/Layout';
import AdminLayout from './components/AdminLayout';
import StudioLayout from './components/StudioLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminUserDetail from './pages/admin/AdminUserDetail';
import AdminMedia from './pages/admin/AdminMedia';
import AdminStudioDetail from './pages/admin/AdminStudioDetail';
import AdminSettings from './pages/admin/AdminSettings';
import AdminCommission from './pages/admin/AdminCommission';
import AdminWithdrawRequests from './pages/admin/AdminWithdrawRequests';
import AdminStorage from './pages/admin/AdminStorage';
import AdminPlans from './pages/admin/AdminPlans';
import AdminStudios from './pages/admin/AdminStudios';
import StudioDashboard from './pages/studio/StudioDashboard';
import StudioClients from './pages/studio/StudioClients';
import StudioClientDetails from './pages/studio/StudioClientDetails';
import StudioDriveDetail from './pages/studio/StudioDriveDetail';
import StudioUpload from './pages/studio/StudioUpload';
import StudioFundRequests from './pages/studio/StudioFundRequests';
import StudioBankDetails from './pages/studio/StudioBankDetails';

const PrivateRoute = ({ children, allowedTypes = ['customer'] }) => {
  const { user, loading } = useAuth();
  if (loading) return null; // or a spinner
  if (!user) return <Navigate to="/login" />;
  if (!allowedTypes.includes(user.userType)) {
    if (user.userType === 'admin') return <Navigate to="/admin/dashboard" />;
    if (user.userType === 'studio') return <Navigate to="/studio/dashboard" />;
    return <Navigate to="/login" />;
  }
  return children;
};

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null; // or a spinner
  if (!user) return <Navigate to="/admin/login" />;
  if (user.userType !== 'admin') return <Navigate to="/admin/login" />;
  return children;
};

const StudioRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null; // or a spinner
  if (!user) return <Navigate to="/studio/login" />;
  if (user.userType !== 'studio') return <Navigate to="/studio/login" />;
  return children;
};

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/studio/login" element={<StudioLogin />} />

        {/* Customer Routes */}
        <Route
          path="/"
          element={
            <PrivateRoute allowedTypes={['customer']}>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="storage-plans" element={<StoragePlans />} />
          <Route path="upload" element={<MediaUpload />} />
          <Route path="media" element={<MediaList />} />
          <Route path="media/drive/:planId" element={<MediaDriveDetail />} />
          <Route path="media/:id" element={<MediaView />} />
          <Route path="how-to-use" element={<HowToUse />} />
          <Route path="profile" element={<Profile />} />
        </Route>

        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="users/:id" element={<AdminUserDetail />} />
          <Route path="studios" element={<AdminStudios />} />
          <Route path="studios/:id" element={<AdminStudioDetail />} />
          <Route path="withdraw-requests" element={<AdminWithdrawRequests />} />
          <Route path="media" element={<AdminMedia />} />
          <Route path="storage" element={<AdminStorage />} />
          <Route path="plans" element={<AdminPlans />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="commission" element={<AdminCommission />} />
        </Route>

        {/* Studio Routes */}
        <Route
          path="/studio"
          element={
            <StudioRoute>
              <StudioLayout />
            </StudioRoute>
          }
        >
          <Route path="dashboard" element={<StudioDashboard />} />
          <Route path="clients" element={<StudioClients />} />
          <Route path="clients/:id" element={<StudioClientDetails />} />
          <Route path="clients/:id/drive/:planId" element={<StudioDriveDetail />} />
          <Route path="upload" element={<StudioUpload />} />
          <Route path="fund-requests" element={<StudioFundRequests />} />
          <Route path="bank-details" element={<StudioBankDetails />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;