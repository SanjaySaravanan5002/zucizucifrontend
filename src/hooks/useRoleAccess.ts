import { useAuth } from '../contexts/AuthContext';

export type UserRole = 'superadmin' | 'admin' | 'limited_admin' | 'washer';

interface RolePermissions {
  canViewDashboard: boolean;
  canViewReports: boolean;
  canManageUsers: boolean;
  canManageWashers: boolean;
  canViewFinancials: boolean;
  canManageLeads: boolean;
  canViewAttendance: boolean;
  canManageExpenses: boolean;
}

const rolePermissions: Record<UserRole, RolePermissions> = {
  superadmin: {
    canViewDashboard: true,
    canViewReports: true,
    canManageUsers: true,
    canManageWashers: true,
    canViewFinancials: true,
    canManageLeads: true,
    canViewAttendance: true,
    canManageExpenses: true,
  },
  admin: {
    canViewDashboard: true,
    canViewReports: true,
    canManageUsers: false,
    canManageWashers: true,
    canViewFinancials: true,
    canManageLeads: true,
    canViewAttendance: true,
    canManageExpenses: true,
  },
  limited_admin: {
    canViewDashboard: false,
    canViewReports: true,
    canManageUsers: false,
    canManageWashers: true,
    canViewFinancials: false,
    canManageLeads: true,
    canViewAttendance: true,
    canManageExpenses: false,
  },
  washer: {
    canViewDashboard: false,
    canViewReports: false,
    canManageUsers: false,
    canManageWashers: false,
    canViewFinancials: false,
    canManageLeads: false,
    canViewAttendance: true,
    canManageExpenses: false,
  },
};

export const useRoleAccess = () => {
  const { user } = useAuth();

  const getUserPermissions = (): RolePermissions => {
    if (!user || !user.role) {
      return {
        canViewDashboard: false,
        canViewReports: false,
        canManageUsers: false,
        canManageWashers: false,
        canViewFinancials: false,
        canManageLeads: false,
        canViewAttendance: false,
        canManageExpenses: false,
      };
    }

    return rolePermissions[user.role as UserRole] || rolePermissions.washer;
  };

  const hasPermission = (permission: keyof RolePermissions): boolean => {
    const permissions = getUserPermissions();
    return permissions[permission];
  };

  const hasRole = (roles: UserRole | UserRole[]): boolean => {
    if (!user || !user.role) return false;
    
    const rolesToCheck = Array.isArray(roles) ? roles : [roles];
    return rolesToCheck.includes(user.role as UserRole);
  };

  const isAdmin = (): boolean => {
    return hasRole(['superadmin', 'admin']);
  };

  const isSuperAdmin = (): boolean => {
    return hasRole('superadmin');
  };

  const hasAdminAccess = (): boolean => {
    return hasRole(['superadmin', 'admin', 'limited_admin']);
  };

  const canAccessDashboard = (): boolean => {
    return hasPermission('canViewDashboard');
  };

  const canAccessReports = (): boolean => {
    return hasPermission('canViewReports');
  };

  const canAccessFinancials = (): boolean => {
    return hasPermission('canViewFinancials');
  };

  return {
    user,
    permissions: getUserPermissions(),
    hasPermission,
    hasRole,
    isAdmin,
    isSuperAdmin,
    hasAdminAccess,
    canAccessDashboard,
    canAccessReports,
    canAccessFinancials,
  };
};

export default useRoleAccess;