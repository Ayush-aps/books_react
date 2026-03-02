/**
 * Private Route Component
 * Protects routes that require authentication and specific roles
 * Supports both single role (string) and multiple roles (array)
 */

import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const PrivateRoute = ({ children, role }) => {
  const { isAuthenticated, user, loading } = useSelector(state => state.auth);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Support both string and array of roles
  if (role) {
    const hasRole = Array.isArray(role)
      ? role.includes(user.role)
      : user.role === role;

    if (!hasRole) {
      // Redirect based on user's actual role
      const roleRedirects = {
        buyer: '/buyer/browse',
        seller: '/seller/dashboard',
        admin: '/admin/dashboard',
        moderator: '/moderator/dashboard',
        employee: '/employee/dashboard',
      };
      return <Navigate to={roleRedirects[user.role] || '/'} />;
    }
  }

  return children;
};

export default PrivateRoute;
