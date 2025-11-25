/**
 * Private Route Component
 * Protects routes that require authentication and specific roles
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

  if (role && user.role !== role) {
    // Redirect based on user's actual role
    if (user.role === 'buyer') {
      return <Navigate to="/buyer/browse" />;
    } else if (user.role === 'seller') {
      return <Navigate to="/seller/dashboard" />;
    } else if (user.role === 'admin') {
      return <Navigate to="/admin/dashboard" />;
    }
    return <Navigate to="/" />;
  }

  return children;
};

export default PrivateRoute;
