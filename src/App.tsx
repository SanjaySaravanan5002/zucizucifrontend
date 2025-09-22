import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Layouts
import DashboardLayout from './layouts/DashboardLayout';
import WasherLayout from './layouts/WasherLayout';
import AuthLayout from './layouts/AuthLayout';
import LeadDetails from './pages/LeadDetails';
import Revenue from './pages/Revenue';

// Pages
import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
import Customers from './pages/Customers';
import UpcomingWash from './pages/UpcomingWash';
import WasherPanel from "./pages/WasherPanel";
import WasherDetails from "./pages/WasherDetails";
import Attendance from './pages/Attendance';
import ScheduleWash from './pages/ScheduleWash';
import Reports from './pages/Reports';
import Expenses from './pages/Expenses';
import SalaryCalculation from './pages/SalaryCalculation';
import Performance from './pages/Performance';
import Login from './pages/Login';
import NotFound from './pages/NotFound';

// Washer Pages
import TabbedWasherDashboard from './pages/washer/TabbedWasherDashboard';
import AssignedLeads from './pages/washer/AssignedLeads';
import WasherAttendance from './pages/washer/WasherAttendance';

// Auth Provider
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router>
          <Toaster position="top-right" />
        <Routes>
          {/* Auth Routes */}
          <Route path="/login" element={<AuthLayout><Login /></AuthLayout>} />
          
          {/* Admin Protected Routes */}
          <Route path="/" element={<DashboardLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="leads" element={<Leads />} />
            <Route path="customers" element={<Customers />} />
            <Route path="upcoming-wash" element={<UpcomingWash />} />
            <Route path="/washer" element={<WasherPanel />} />
            <Route path="/washer/:id/details" element={<WasherDetails />} />
            <Route path="attendance" element={<Attendance />} />
            <Route path="schedule-wash" element={<ScheduleWash />} />
            <Route path="user/:id" element={<LeadDetails />} />
            <Route path="revenue" element={<Revenue />} />
            <Route path="expenses" element={<Expenses />} />
            <Route path="salary-calculation" element={<SalaryCalculation />} />
            <Route path="performance" element={<Performance />} />
            <Route path="reports" element={<Reports />} />
          </Route>
          
          {/* Washer Protected Routes */}
          <Route path="/washer-dashboard" element={<WasherLayout />}>
            <Route index element={<TabbedWasherDashboard />} />
            <Route path="assigned-leads" element={<AssignedLeads />} />
            <Route path="attendance" element={<WasherAttendance />} />
          </Route>
          
          {/* 404 Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        </Router>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;

