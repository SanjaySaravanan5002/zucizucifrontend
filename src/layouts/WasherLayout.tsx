import React, { useState } from 'react';
import { Outlet, Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Menu, X, LayoutDashboard, ClipboardList, Clock, LogOut, ChevronLeft, ChevronRight } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import Logo from '../components/Logo';

const WasherLayout = () => {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();
  
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }
  
  if (!isAuthenticated || user?.role !== 'washer') {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  const navigation = [
    { name: 'Dashboard', href: '/washer-dashboard', icon: LayoutDashboard },
    { name: 'Assigned Leads', href: '/washer-dashboard/assigned-leads', icon: ClipboardList },
    { name: 'Attendance', href: '/washer-dashboard/attendance', icon: Clock },
  ];
  
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const toggleCollapse = () => setSidebarCollapsed(!sidebarCollapsed);
  
  const getIconColor = (itemName: string) => {
    const colors = {
      'Dashboard': 'text-blue-500 group-hover:text-blue-600',
      'Assigned Leads': 'text-green-500 group-hover:text-green-600',
      'Attendance': 'text-orange-500 group-hover:text-orange-600'
    };
    return colors[itemName] || 'text-gray-500 group-hover:text-gray-700';
  };
  
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      <div 
        className={`fixed inset-0 z-40 bg-gray-800 bg-opacity-60 transition-opacity duration-300 lg:hidden ${
          sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={toggleSidebar}
      ></div>
      
      {/* Sidebar */}
      <div 
        className={twMerge(
          "fixed inset-y-0 left-0 z-50 transform overflow-y-auto bg-white shadow-lg transition-all duration-300 ease-in-out lg:static lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
          sidebarCollapsed ? "lg:w-16" : "lg:w-64",
          "w-64"
        )}
      >
        <div className="flex h-16 items-center justify-between px-4 py-6">
          <div className={twMerge("transition-opacity duration-300", sidebarCollapsed ? "lg:opacity-0 lg:w-0" : "opacity-100")}>
            <Logo />
          </div>
          <div className="flex items-center space-x-2">
            <button 
              type="button" 
              className="hidden lg:block rounded-md p-2 text-gray-500 hover:bg-gray-100 transition-colors"
              onClick={toggleCollapse}
            >
              {sidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            </button>
            <button 
              type="button" 
              className="rounded-md p-2 text-gray-500 lg:hidden hover:bg-gray-100"
              onClick={toggleSidebar}
            >
              <X size={20} />
            </button>
          </div>
        </div>
        
        <div className="mt-6 px-4 pb-4">
          <div className={twMerge(
            "mb-6 p-3 bg-blue-50 rounded-lg transition-all duration-300",
            sidebarCollapsed ? "lg:opacity-0 lg:h-0 lg:mb-0 lg:p-0 lg:overflow-hidden" : "opacity-100"
          )}>
            <div className="text-sm font-medium text-blue-900">Welcome, {user?.name}</div>
            <div className="text-xs text-blue-600">Washer Dashboard</div>
          </div>
          
          <nav className="space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={twMerge(
                    "group flex items-center px-3 py-3 text-sm font-medium rounded-md transition-all duration-200 relative",
                    isActive 
                      ? "bg-primary text-white shadow-md" 
                      : "text-gray-700 hover:bg-gray-100 hover:text-gray-900",
                    sidebarCollapsed ? "lg:justify-center lg:px-2" : ""
                  )}
                  onClick={() => setSidebarOpen(false)}
                  title={sidebarCollapsed ? item.name : ''}
                >
                  <item.icon 
                    className={twMerge(
                      "h-6 w-6 flex-shrink-0 transition-colors",
                      isActive ? "text-white" : getIconColor(item.name),
                      sidebarCollapsed ? "lg:mr-0" : "mr-3"
                    )}
                  />
                  <span className={twMerge(
                    "transition-all duration-300",
                    sidebarCollapsed ? "lg:opacity-0 lg:w-0 lg:overflow-hidden" : "opacity-100"
                  )}>
                    {item.name}
                  </span>
                  {sidebarCollapsed && (
                    <div className="hidden lg:block absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50">
                      {item.name}
                    </div>
                  )}
                </Link>
              );
            })}
          </nav>
          
          <button
            onClick={logout}
            className={twMerge(
              "mt-8 flex w-full items-center px-3 py-3 text-sm font-medium text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-md transition-all duration-200 relative group",
              sidebarCollapsed ? "lg:justify-center lg:px-2" : ""
            )}
            title={sidebarCollapsed ? 'Logout' : ''}
          >
            <LogOut className={twMerge(
              "h-6 w-6 text-red-500 group-hover:text-red-600 transition-colors",
              sidebarCollapsed ? "lg:mr-0" : "mr-3"
            )} />
            <span className={twMerge(
              "transition-all duration-300",
              sidebarCollapsed ? "lg:opacity-0 lg:w-0 lg:overflow-hidden" : "opacity-100"
            )}>
              Logout
            </span>
            {sidebarCollapsed && (
              <div className="hidden lg:block absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50">
                Logout
              </div>
            )}
          </button>
        </div>
      </div>
      
      {/* Main content */}
      <div className={twMerge(
        "flex flex-1 flex-col overflow-hidden transition-all duration-300",
        sidebarCollapsed ? "lg:ml-0" : ""
      )}>
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

export default WasherLayout;
