/**
 * Header Component
 */

import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../redux/actions/authActions';

const Header = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector(state => state.auth);
  const { items: cartItems } = useSelector(state => state.cart);

  const handleLogout = async () => {
    await dispatch(logout());
    navigate('/login');
  };

  return (
    <header className="bg-white shadow-md border-b-2 border-primary-500">
      <nav className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="text-2xl font-bold text-primary-600 hover:text-primary-700 transition-colors">
            Bookish
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center space-x-6">
            <Link to="/" className="text-gray-700 hover:text-primary-600 transition-colors">Home</Link>
            <Link to="/about" className="text-gray-700 hover:text-primary-600 transition-colors">About</Link>
            <Link to="/pricing" className="text-gray-700 hover:text-primary-600 transition-colors">Subscription</Link>
            <Link to="/contact" className="text-gray-700 hover:text-primary-600 transition-colors">Contact</Link>

            {isAuthenticated ? (
              <>
                {/* Role-based navigation */}
                {user.role === 'buyer' && (
                  <>
                    <Link to="/buyer/dashboard" className="text-gray-700 hover:text-primary-600 transition-colors">Dashboard</Link>
                    <Link to="/buyer/browse" className="text-gray-700 hover:text-primary-600 transition-colors">Browse</Link>
                    <Link to="/buyer/video-feed" className="text-gray-700 hover:text-primary-600 transition-colors flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Videos
                    </Link>
                    <Link to="/buyer/library" className="text-gray-700 hover:text-primary-600 transition-colors">Library</Link>
                    <Link to="/buyer/cart" className="text-gray-700 hover:text-primary-600 transition-colors relative">
                      Cart
                      {cartItems.length > 0 && (
                        <span className="absolute -top-2 -right-2 bg-primary-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                          {cartItems.length}
                        </span>
                      )}
                    </Link>
                  </>
                )}

                {user.role === 'seller' && (
                  <>
                    <Link to="/seller/dashboard" className="text-gray-700 hover:text-primary-600 transition-colors">Dashboard</Link>
                    <Link to="/seller/inventory" className="text-gray-700 hover:text-primary-600 transition-colors">Inventory</Link>
                    <Link to="/seller/upload" className="text-gray-700 hover:text-primary-600 transition-colors">Upload</Link>
                  </>
                )}

                {user.role === 'admin' && (
                  <>
                    <Link to="/admin/dashboard" className="text-gray-700 hover:text-primary-600 transition-colors">Dashboard</Link>
                    <Link to="/admin/users" className="text-gray-700 hover:text-primary-600 transition-colors">Users</Link>
                    <Link to="/admin/books" className="text-gray-700 hover:text-primary-600 transition-colors">Books</Link>
                  </>
                )}

                {/* User menu */}
                <div className="flex items-center space-x-3">
                  <span className="text-gray-700">Hello, {user.name}</span>
                  <button
                    onClick={handleLogout}
                    className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="text-gray-700 hover:text-primary-600 transition-colors">Login</Link>
                <Link to="/register" className="bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700 transition-colors">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;
