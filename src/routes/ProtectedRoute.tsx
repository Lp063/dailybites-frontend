import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

type UserRole = 'ADMIN' | 'RESTAURANT' | 'CUSTOMER';

type ProtectedRouteProps = {
  allowedRoles?: UserRole[];
};

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { token } = useAuth();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles) {
    return <Outlet />;
  }

  try {
    const payload = JSON.parse(atob(token.split('.')[1])) as { role?: UserRole };

    if (!payload.role || !allowedRoles.includes(payload.role)) {
      return <Navigate to="/login" replace />;
    }
  } catch {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}