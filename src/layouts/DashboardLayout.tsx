import React, { useState } from 'react';
import { Outlet, Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Menu, X, LayoutDashboard, Users, Car, ClipboardList, BarChart3, LogOut, Bell } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import Logo from '../components/Logo';

const DashboardLayout = () => {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Leads', href: '/leads', icon: ClipboardList },
    { name: 'Customers', href: '/customers', icon: Users },
    { name: 'Washer Panel', href: '/washer', icon: Car },
    { name: 'Revenue', href: '/revenue', icon: BarChart3 },
    { name: 'Reports', href: '/reports', icon: BarChart3 },
  ];
  
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar for mobile */}
      <div 
        className={`fixed inset-0 z-40 bg-gray-800 bg-opacity-60 transition-opacity duration-300 lg:hidden ${
          sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={toggleSidebar}
      ></div>
      
      {/* Sidebar */}
      <div 
        className={twMerge(
          "fixed inset-y-0 left-0 z-50 w-64 transform overflow-y-auto bg-white shadow-lg transition-all duration-300 ease-in-out lg:static lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between px-4 py-6">
          <Logo />
          <button 
            type="button" 
            className="rounded-md p-2 text-gray-500 lg:hidden hover:bg-gray-100"
            onClick={toggleSidebar}
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="mt-6 px-4 pb-4">
          <nav className="space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={twMerge(
                    "group flex items-center px-3 py-3 text-sm font-medium rounded-md transition-colors",
                    isActive 
                      ? "bg-primary text-white" 
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon 
                    className={twMerge(
                      "mr-3 h-5 w-5 flex-shrink-0",
                      isActive ? "text-white" : "text-gray-500"
                    )}
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>
          
          <button
            onClick={logout}
            className="mt-8 flex w-full items-center px-3 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          >
            <LogOut className="mr-3 h-5 w-5 text-gray-500" />
            Logout
          </button>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top header */}
        <header className="border-b border-gray-200 bg-white shadow-sm">
          <div className="flex h-16 items-center justify-between px-4">
            <div className="flex items-center">
              <button
                type="button"
                className="rounded-md p-2 text-gray-500 lg:hidden hover:bg-gray-100"
                onClick={toggleSidebar}
              >
                <Menu size={20} />
              </button>
              <h1 className="ml-2 text-lg font-semibold text-gray-800 lg:ml-0">
                {navigation.find(item => item.href === location.pathname)?.name || 'Dashboard'}
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <button className="relative p-1 text-gray-500 hover:text-gray-700">
                <Bell size={20} />
                <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500"></span>
              </button>
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center">
                  {user?.name.charAt(0)}
                </div>
                <span className="hidden text-sm font-medium text-gray-700 md:block">
                  {user?.name}
                </span>
              </div>
            </div>
          </div>
        </header>
        
        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;