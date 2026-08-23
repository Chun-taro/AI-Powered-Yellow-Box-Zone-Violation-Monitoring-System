import { Navigate, useLocation } from 'react-router-dom';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';
import { useEffect } from 'react';

export function PrivateRoute({ children, allowedRoles }) {
  const token = Cookies.get('auth_token');
  const role = Cookies.get('user_role') || 'admin';
  const location = useLocation();

  const isRoleAllowed = !allowedRoles || allowedRoles.includes(role);

  useEffect(() => {
    if (token && !isRoleAllowed) {
      toast.error(`Access Restricted: This section requires ${allowedRoles.join(' or ').toUpperCase()} privileges.`);
    }
  }, [token, isRoleAllowed, allowedRoles]);

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isRoleAllowed) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
