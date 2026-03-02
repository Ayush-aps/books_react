"use client";
import {
  Navbar,
  NavBody,
  MobileNav,
  NavbarButton,
  MobileNavHeader,
  MobileNavToggle,
  MobileNavMenu,
} from "@/components/ui/resizable-navbar";

import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { logout } from "../../redux/actions/authActions";
import Button from "../Button";
import Badge from "../Badge";

// --- Custom Link Components ---
const NavLink = ({ to, isActive, children }) => {
  const location = useLocation();
  const active = isActive || location.pathname === to;

  return (
    <Link
      to={to}
      className={`text-sm font-medium transition-colors relative py-1 ${active
        ? "text-accent-brown"
        : "text-text-primary hover:text-accent-brown"
        }`}
    >
      {children}
      {active && (
        <motion.div
          layoutId="activeLink"
          className="absolute -bottom-1 left-0 right-0 h-0.5 bg-accent-brown"
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
        />
      )}
    </Link>
  );
};

const DropdownLink = ({ to, children }) => (
  <Link
    to={to}
    className="block px-4 py-2 text-sm text-text-primary hover:bg-background-secondary transition-colors"
  >
    {children}
  </Link>
);

const MobileNavLink = ({ to, children }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link
      to={to}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
        ? "bg-accent-brown/10 text-accent-brown"
        : "text-text-primary hover:bg-background-secondary"
        }`}
    >
      {children}
    </Link>
  );
};

// --- More Dropdown Component ---
const MoreDropdown = ({ navItems, cartItems, onItemClick, user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-sm font-medium text-text-primary hover:text-accent-brown transition-colors py-1 px-3 rounded-md hover:bg-background-secondary flex items-center gap-1"
      >
        More
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"></path>
        </svg>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-xl border border-border-light py-2 z-50"
          >
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.link}
                onClick={(e) => {
                  setIsOpen(false);
                  onItemClick(e);
                }}
                className={`block px-4 py-2 text-sm transition-colors ${location.pathname === item.link
                  ? "bg-accent-brown/10 text-accent-brown"
                  : "text-text-primary hover:bg-background-secondary"
                  }`}
              >
                <span className="flex justify-between items-center w-full">
                  {item.name}
                  {item.name === "Cart" && cartItems.length > 0 && (
                    <Badge variant="brown" size="sm">
                      {cartItems.length}
                    </Badge>
                  )}
                </span>
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- Main Header Component ---
export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const { items: cartItems } = useSelector((state) => state.cart);

  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsUserMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await dispatch(logout());
    navigate("/login");
  };

  // --- Dynamic Navigation Items ---
  let navItems = [];

  // Add standard navigation items
  navItems.push({ name: "Home", link: "/" });

  // Add Browse for buyers after Home
  if (isAuthenticated && user?.role === "buyer") {
    navItems.push({ name: "Browse", link: "/buyer/browse" });
  }

  navItems.push(
    { name: "About", link: "/about" },
    { name: "Pricing", link: "/pricing" },
    { name: "Contact", link: "/contact" }
  );

  // For dropdown: include Cart
  const dropdownItems = isAuthenticated && user?.role === "buyer"
    ? [...navItems, { name: "Cart", link: "/buyer/cart" }]
    : navItems;

  const handleNavClick = (e) => {
    setIsUserMenuOpen(false);
    setIsMobileMenuOpen(false);
  };



  return (
    <>
      <Navbar
        className={`fixed !top-0 !left-0 !right-0 !w-full !rounded-none z-30 transition-all duration-300 ${isScrolled
          ? "bg-white shadow-lg border-b border-gray-200"
          : "bg-white border-b border-border-light"
          }`}
      >
        {/* --- Desktop Navigation --- */}
        <NavBody>
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group flex-shrink-0">
            <motion.div
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              <div className="w-10 h-10 bg-accent-brown rounded-lg flex items-center justify-center shadow-sm">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
            </motion.div>
            <div className="flex flex-col">
              <span
                className={`font-serif font-bold ${isScrolled ? "text-xl" : "text-2xl"
                  } text-gray-900 group-hover:text-accent-brown transition-all duration-300`}
              >
                Bookish
              </span>
              <AnimatePresence>
                {!isScrolled && (
                  <motion.span
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-xs text-text-tertiary tracking-wider uppercase overflow-hidden"
                  >
                    Premium Books
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </Link>

          {/* Nav Items - Always visible */}
          <div className="hidden lg:flex items-center gap-2 mx-4">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.link}
                onClick={handleNavClick}
                className={`text-sm font-semibold transition-colors px-4 py-2 rounded-full ${location.pathname === item.link
                  ? "bg-accent-brown text-white"
                  : "text-gray-800 hover:bg-gray-100 hover:text-accent-brown"
                  }`}
              >
                {item.name}
              </Link>
            ))}
          </div>



          {/* Right Side Actions */}
          <div className="hidden lg:flex items-center gap-4 flex-shrink-0">
            {isAuthenticated ? (
              <>
                {/* Show Cart for buyers */}
                {user?.role === "buyer" && (
                  <Link
                    to="/buyer/cart"
                    className={`text-sm font-semibold transition-colors px-4 py-2 rounded-full ${location.pathname === "/buyer/cart"
                      ? "bg-accent-brown text-white"
                      : "text-gray-800 hover:bg-gray-100 hover:text-accent-brown"
                      }`}
                  >
                    <span className="flex items-center gap-2">
                      Cart
                      {cartItems.length > 0 && (
                        <Badge variant="brown" size="sm">
                          {cartItems.length}
                        </Badge>
                      )}
                    </span>
                  </Link>
                )}

                {/* User Menu */}
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition-all duration-200 hover:-translate-y-0.5"
                  >
                    <div className="w-8 h-8 bg-accent-brown/10 text-accent-brown rounded-full flex items-center justify-center font-medium">
                      {user?.name?.charAt(0).toUpperCase()}
                    </div>
                    {!isScrolled && (
                      <span className="text-gray-900 font-medium hidden xl:block">
                        {user?.name}
                      </span>
                    )}
                  </button>
                  <AnimatePresence>
                    {isUserMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-border-light py-2 z-50"
                      >
                        <div className="px-4 py-2 border-b border-border-light">
                          <p className="text-sm text-text-secondary">Signed in as</p>
                          <p className="font-medium text-text-primary">{user?.name}</p>
                          <Badge variant="green" size="sm" className="mt-1">
                            {user?.role}
                          </Badge>
                        </div>
                        <div className="py-2">
                          {user?.role === "buyer" && (
                            <>
                              <DropdownLink to="/buyer/dashboard">Dashboard</DropdownLink>
                              <DropdownLink to="/buyer/library">My Library</DropdownLink>
                            </>
                          )}
                          {user?.role === "seller" && (
                            <>
                              <DropdownLink to="/seller/dashboard">Dashboard</DropdownLink>
                              <DropdownLink to="/seller/inventory">Inventory</DropdownLink>
                            </>
                          )}
                          {user?.role === "admin" && (
                            <>
                              <DropdownLink to="/admin/dashboard">Dashboard</DropdownLink>
                              <DropdownLink to="/admin/users">Manage Users</DropdownLink>
                            </>
                          )}
                          {user?.role === "moderator" && (
                            <>
                              <DropdownLink to="/moderator/dashboard">Dashboard</DropdownLink>
                              <DropdownLink to="/employee/dashboard">Employee View</DropdownLink>
                            </>
                          )}
                          {user?.role === "employee" && (
                            <>
                              <DropdownLink to="/employee/dashboard">Dashboard</DropdownLink>
                            </>
                          )}
                        </div>
                        <div className="pt-2 border-t border-border-light px-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            fullWidth
                            onClick={handleLogout}
                            className="justify-start"
                          >
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
                <button
                  onClick={() => navigate("/login")}
                  className="px-5 py-2.5 text-sm font-semibold text-accent-brown border-2 border-accent-brown rounded-lg hover:bg-accent-brown hover:text-white transition-all duration-200 hover:-translate-y-0.5"
                >
                  Login
                </button>
                <button
                  onClick={() => navigate("/register")}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-accent-brown rounded-lg hover:bg-accent-brown-hover transition-all duration-200 hover:-translate-y-0.5 shadow-md hover:shadow-lg"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>
        </NavBody>

        {/* --- Mobile Navigation --- */}
        <MobileNav>
          <MobileNavHeader>
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-accent-brown rounded-lg flex items-center justify-center shadow-sm">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
              <span className="font-serif font-bold text-2xl text-charcoal">
                Bookish
              </span>
            </Link>
            <MobileNavToggle
              isOpen={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            />
          </MobileNavHeader>

          <MobileNavMenu
            isOpen={isMobileMenuOpen}
            onClose={() => setIsMobileMenuOpen(false)}
          >
            {isAuthenticated && (
              <div className="p-6 bg-background-secondary border-b border-border-light">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-accent-brown/10 text-accent-brown rounded-full flex items-center justify-center font-medium text-lg">
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium">{user?.name}</p>
                    <Badge variant="green" size="sm">
                      {user?.role}
                    </Badge>
                  </div>
                </div>
              </div>
            )}



            <div className="p-6 space-y-1">
              <MobileNavLink to="/">Home</MobileNavLink>
              <MobileNavLink to="/about">About</MobileNavLink>
              <MobileNavLink to="/pricing">Pricing</MobileNavLink>
              <MobileNavLink to="/contact">Contact</MobileNavLink>

              {isAuthenticated && user?.role === "buyer" && (
                <>
                  <div className="my-4 border-t border-border-light"></div>
                  <MobileNavLink to="/buyer/dashboard">Dashboard</MobileNavLink>
                  <MobileNavLink to="/buyer/library">My Library</MobileNavLink>
                  <MobileNavLink to="/buyer/browse">Browse Books</MobileNavLink>
                  <MobileNavLink to="/buyer/cart">
                    <span className="flex justify-between w-full">
                      Cart
                      {cartItems.length > 0 && (
                        <Badge variant="brown" size="sm">
                          {cartItems.length}
                        </Badge>
                      )}
                    </span>
                  </MobileNavLink>
                </>
              )}

              {isAuthenticated && user?.role === "seller" && (
                <>
                  <div className="my-4 border-t border-border-light"></div>
                  <MobileNavLink to="/seller/dashboard">Dashboard</MobileNavLink>
                  <MobileNavLink to="/seller/inventory">Inventory</MobileNavLink>
                </>
              )}

              {isAuthenticated && user?.role === "admin" && (
                <>
                  <div className="my-4 border-t border-border-light"></div>
                  <MobileNavLink to="/admin/dashboard">Dashboard</MobileNavLink>
                  <MobileNavLink to="/admin/users">Manage Users</MobileNavLink>
                </>
              )}

              {isAuthenticated && user?.role === "moderator" && (
                <>
                  <div className="my-4 border-t border-border-light"></div>
                  <MobileNavLink to="/moderator/dashboard">Dashboard</MobileNavLink>
                  <MobileNavLink to="/employee/dashboard">Employee View</MobileNavLink>
                </>
              )}

              {isAuthenticated && user?.role === "employee" && (
                <>
                  <div className="my-4 border-t border-border-light"></div>
                  <MobileNavLink to="/employee/dashboard">Dashboard</MobileNavLink>
                </>
              )}
            </div>

            <div className="p-6 border-t border-border-light">
              {isAuthenticated ? (
                <Button variant="error" fullWidth onClick={handleLogout}>
                  Logout
                </Button>
              ) : (
                <div className="space-y-3">
                  <NavbarButton
                    as="button"
                    variant="secondary"
                    className="w-full"
                    onClick={() => navigate("/login")}
                  >
                    Login
                  </NavbarButton>
                  <NavbarButton
                    as="button"
                    variant="primary"
                    className="w-full"
                    onClick={() => navigate("/register")}
                  >
                    Sign Up
                  </NavbarButton>
                </div>
              )}
            </div>
          </MobileNavMenu>
        </MobileNav>
      </Navbar>

      <div className="h-20"></div>
    </>
  );
}
