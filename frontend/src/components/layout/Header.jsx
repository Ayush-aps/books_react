import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { logout } from '../../redux/actions/authActions';
import { drawerSlide } from '../../utils/animations';
import Button from '../Button';
import Badge from '../Badge';
import SuccessToast from '../SuccessToast';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector(state => state.auth);
  const { items: cartItems } = useSelector(state => state.cart);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [showRestrictedToast, setShowRestrictedToast] = useState(false);
  const [restrictedMessage, setRestrictedMessage] = useState('');

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsUserMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await dispatch(logout());
    navigate('/login');
  };

  const handlePricingClick = (e) => {
    // Check if user is seller or admin
    if (user && (user.role === 'seller' || user.role === 'admin')) {
      e.preventDefault();
      setRestrictedMessage(`Access restricted. ${user.role === 'seller' ? 'Sellers' : 'Admins'} are not allowed to view pricing page.`);
      setShowRestrictedToast(true);
      return;
    }
    // For buyers or non-authenticated users, allow normal navigation
  };

  const isActiveLink = (path) => location.pathname === path;

  return (
    <>
      <header className="bg-white border-b border-border-light shadow-sm">
        <nav className="container-custom">
          <div className="flex items-center justify-between h-20">
            <Link to="/" className="flex items-center gap-3 group focus:outline-none">
              <motion.div whileHover={{ scale: 1.05 }} transition={{ duration: 0.2 }}>
                <div className="w-10 h-10 bg-accent-brown rounded-lg flex items-center justify-center shadow-sm transition-all duration-300 group-hover:shadow-md" style={{ backgroundColor: '#8B7355' }}>
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
              </motion.div>
              <div className="flex flex-col">
                <span className="font-serif font-bold text-2xl text-charcoal group-hover:text-accent-brown transition-all duration-300">
                  Bookish
                </span>
                <span className="text-xs text-text-tertiary tracking-wider uppercase">
                  Premium Books
                </span>
              </div>
            </Link>

            <div className="hidden lg:flex items-center gap-8">
              <NavLink to="/" isActive={isActiveLink('/')}>Home</NavLink>
              <NavLink to="/about" isActive={isActiveLink('/about')}>About</NavLink>
              <NavLink to="/pricing" isActive={isActiveLink('/pricing')} onClick={handlePricingClick}>Pricing</NavLink>
              <NavLink to="/contact" isActive={isActiveLink('/contact')}>Contact</NavLink>
            </div>

            <div className="hidden lg:flex items-center gap-4">
              {isAuthenticated ? (
                <>
                  {user.role === 'buyer' && (
                    <>
                      <NavLink to="/buyer/browse" isActive={isActiveLink('/buyer/browse')}>Browse</NavLink>
                      <NavLink to="/buyer/cart" isActive={isActiveLink('/buyer/cart')}>
                        <span className="flex items-center gap-2">
                          Cart
                          {cartItems.length > 0 && <Badge variant="brown" size="sm">{cartItems.length}</Badge>}
                        </span>
                      </NavLink>
                    </>
                  )}
                  <div className="relative">
                    <button onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-background-secondary transition-colors">
                      <div className="w-8 h-8 bg-accent-brown/10 text-accent-brown rounded-full flex items-center justify-center font-medium">
                        {user.name?.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-text-primary font-medium hidden xl:block">{user.name}</span>
                    </button>
                    <AnimatePresence>
                      {isUserMenuOpen && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-border-light py-2 z-[1060]">
                          <div className="px-4 py-2 border-b border-border-light">
                            <p className="text-sm text-text-secondary">Signed in as</p>
                            <p className="font-medium text-text-primary">{user.name}</p>
                            <Badge variant="green" size="sm" className="mt-1">{user.role}</Badge>
                          </div>
                          <div className="py-2">
                            {user.role === 'buyer' && (
                              <>
                                <DropdownLink to="/buyer/dashboard">Dashboard</DropdownLink>
                                <DropdownLink to="/buyer/library">My Library</DropdownLink>
                              </>
                            )}
                            {user.role === 'seller' && (
                              <>
                                <DropdownLink to="/seller/dashboard">Dashboard</DropdownLink>
                                <DropdownLink to="/seller/inventory">Inventory</DropdownLink>
                              </>
                            )}
                            {user.role === 'admin' && (
                              <>
                                <DropdownLink to="/admin/dashboard">Dashboard</DropdownLink>
                                <DropdownLink to="/admin/users">Manage Users</DropdownLink>
                              </>
                            )}
                          </div>
                          <div className="pt-2 border-t border-border-light px-2">
                            <Button variant="ghost" size="sm" fullWidth onClick={handleLogout} className="justify-start">
                              Logout
                            </Button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>Login</Button>
                  <Button variant="primary" size="sm" onClick={() => navigate('/register')}>Sign Up</Button>
                </div>
              )}
            </div>

            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="lg:hidden p-2 rounded-lg hover:bg-background-secondary transition-colors" aria-label="Toggle menu">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </nav>
      </header>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsMobileMenuOpen(false)} className="fixed inset-0 bg-black/50 z-modal-backdrop lg:hidden" />
            <motion.div variants={drawerSlide} initial="hidden" animate="visible" exit="exit" className="fixed top-0 right-0 bottom-0 w-80 bg-white shadow-2xl z-modal lg:hidden overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-border-light">
                <span className="font-serif font-bold text-xl">Bookish</span>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 rounded-lg hover:bg-background-secondary">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              {isAuthenticated && (
                <div className="p-6 bg-background-secondary border-b border-border-light">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-accent-brown/10 text-accent-brown rounded-full flex items-center justify-center font-medium text-lg">
                      {user.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <Badge variant="green" size="sm">{user.role}</Badge>
                    </div>
                  </div>
                </div>
              )}
              <div className="p-6 space-y-1">
                <MobileNavLink to="/">Home</MobileNavLink>
                <MobileNavLink to="/about">About</MobileNavLink>
                <MobileNavLink to="/pricing" onClick={handlePricingClick}>Pricing</MobileNavLink>
                {isAuthenticated && user.role === 'buyer' && (
                  <>
                    <div className="my-4 border-t border-border-light"></div>
                    <MobileNavLink to="/buyer/dashboard">Dashboard</MobileNavLink>
                    <MobileNavLink to="/buyer/browse">Browse Books</MobileNavLink>
                    <MobileNavLink to="/buyer/cart">
                      <span className="flex justify-between w-full">
                        Cart
                        {cartItems.length > 0 && <Badge variant="brown" size="sm">{cartItems.length}</Badge>}
                      </span>
                    </MobileNavLink>
                  </>
                )}
              </div>
              <div className="p-6 border-t border-border-light">
                {isAuthenticated ? (
                  <Button variant="error" fullWidth onClick={handleLogout}>Logout</Button>
                ) : (
                  <div className="space-y-3">
                    <Button variant="outline" fullWidth onClick={() => navigate('/login')}>Login</Button>
                    <Button variant="primary" fullWidth onClick={() => navigate('/register')}>Sign Up</Button>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Restricted Access Toast */}
      {showRestrictedToast && (
        <SuccessToast
          message={restrictedMessage}
          type="warning"
          onClose={() => setShowRestrictedToast(false)}
        />
      )}
    </>
  );
};

const NavLink = ({ to, isActive, children, onClick }) => (
  <Link to={to} onClick={onClick} className={`text-sm font-medium transition-all duration-300 relative py-1 hover:scale-110 focus:outline-none ${isActive ? 'text-accent-brown' : 'text-text-primary hover:text-accent-brown'}`}>
    {children}
    {isActive && <motion.div layoutId="activeLink" className="absolute -bottom-1 left-0 right-0 h-0.5 bg-accent-brown" transition={{ type: "spring", stiffness: 380, damping: 30 }} />}
  </Link>
);

const DropdownLink = ({ to, children }) => (
  <Link to={to} className="block px-4 py-2 text-sm text-text-primary hover:bg-background-secondary transition-all duration-300 hover:pl-6 focus:outline-none rounded">
    {children}
  </Link>
);

const MobileNavLink = ({ to, children, onClick }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link to={to} onClick={onClick} className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 hover:pl-6 focus:outline-none ${isActive ? 'bg-accent-brown/10 text-accent-brown' : 'text-text-primary hover:bg-background-secondary'}`}>
      {children}
    </Link>
  );
};

export default Header;
