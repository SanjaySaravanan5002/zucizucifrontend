import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Layouts
import DashboardLayout from './layouts/DashboardLayout';
import AuthLayout from './layouts/AuthLayout';
import LeadDetails from './pages/LeadDetails';
import Revenue from './pages/Revenue';

// Pages
import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
import Customers from './pages/Customers';
import WasherPanel from "./pages/WasherPanel";
import WasherDetails from "./pages/WasherDetails";
import Reports from './pages/Reports';
import Login from './pages/Login';
import NotFound from './pages/NotFound';

// Auth Provider
import { AuthProvider } from './contexts/AuthContext';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster position="top-right" />
        <Routes>
          {/* Auth Routes */}
          <Route path="/login" element={<AuthLayout><Login /></AuthLayout>} />
          
          {/* Protected Routes */}
          <Route path="/" element={<DashboardLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="leads" element={<Leads />} />
            <Route path="customers" element={<Customers />} />
            <Route path="/washer" element={<WasherPanel />} />
            <Route path="/washer/:id/details" element={<WasherDetails />} />
            <Route path="user/:id" element={<LeadDetails />} />
            <Route path="revenue" element={<Revenue />} />
            <Route path="reports" element={<Reports />} />
          </Route>
          
          {/* 404 Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;