// --- This is your new, combined Header.jsx file ---

"use client";
import {
  Navbar,
  NavBody,
  MobileNav,
  NavbarButton, // /** 1. IMPORTED NavbarButton */
  MobileNavHeader,
  MobileNavToggle,
  MobileNavMenu,
  NavItems, // /** 1. IMPORTED NavItems */
} from "@/components/ui/resizable-navbar";

// Imports from your functional Header.jsx
import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { logout } from "../../redux/actions/authActions";
import Button from "../Button"; // We still need this for 'Logout'
import Badge from "../Badge";

export default function Header() {
  // --- All logic from your Header component ---
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
  
  // /** 2. CREATED DYNAMIC NAVITEMS ARRAY
  //  * The <NavItems> component expects this format.
  //  */
  const navItems = [
    { name: "Home", link: "/" },
    { name: "About", link: "/about" },
    { name: "Pricing", link: "/pricing" },
    { name: "Contact", link: "/contact" },
  ];

  if (isAuthenticated && user.role === "buyer") {
    navItems.push({ name: "Browse", link: "/buyer/browse" });
  }

  // /** 3. CREATED ROUTER-AWARE CLICK HANDLER
  //  * This prevents full page reloads when using <NavItems>.
  //  */
  const handleNavClick = (e) => {
    // Prevent the default <a> tag behavior
    e.preventDefault();
    // Get the href from the clicked <a> tag
    const href = e.currentTarget.getAttribute("href");
    if (href) {
      // Use React Router to navigate
      navigate(href);
    }
  };

  return (
    <>
      <Navbar
        className={`fixed !top-0 !left-0 !right-0 !w-full !rounded-none z-30 transition-all duration-300 ${
          isScrolled
            ? "bg-white/90 backdrop-blur-md shadow-md border-b border-border-light"
            : "bg-white border-b border-border-light"
        }`}>
        
        {/* --- Desktop Navigation --- */}
        <NavBody>
          {/* Your Custom Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <motion.div
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}>
              <div className="w-10 h-10 bg-accent-brown rounded-lg flex items-center justify-center shadow-sm">
                {/* ... svg ... */}
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
              </div>
            </motion.div>
            <div className="flex flex-col">
              <span className="font-serif font-bold text-2xl text-charcoal group-hover:text-accent-brown transition-colors">
                Bookish
              </span>
              <span className="text-xs text-text-tertiary tracking-wider uppercase">
                Premium Books
              </span>
            </div>
          </Link>

          {/**
           * 4. REPLACED NavLink div WITH <NavItems>
           * This gives you the sliding hover effect.
           */}
          <NavItems items={navItems} onItemClick={handleNavClick} />

          {/**
           * 5. REPLACED <Button> WITH <NavbarButton>
           * This gives you the press-down hover effect.
           */}
          <div className="hidden lg:flex items-center gap-4">
            {isAuthenticated ? (
              <>
                {/* Cart (Still uses NavLink for active state) */}
                {user.role === "buyer" && (
                  <NavLink
                    to="/buyer/cart"
                    isActive={location.pathname === "/buyer/cart"}>
                    <span className="flex items-center gap-2">
                      Cart
                      {cartItems.length > 0 && (
                        <Badge variant="brown" size="sm">
                          {cartItems.length}
                        </Badge>
                      )}
                    </span>
                  </NavLink>
                )}
                {/* User Menu */}
                <div className="relative">
                  {/** 6. ADDED HOVER EFFECT to user menu button */ }
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-background-secondary transition-all duration-200 hover:-translate-y-0.5">
                    <div className="w-8 h-8 bg-accent-brown/10 text-accent-brown rounded-full flex items-center justify-center font-medium">
                      {user.name?.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-text-primary font-medium hidden xl:block">
                      {user.name}
                    </span>
                  </button>
                  <AnimatePresence>
                    {isUserMenuOpen && (
                      <motion.div
                        /* ... dropdown motion ... */
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-border-light py-2">
                        {/* ... all your dropdown content (unchanged) ... */}
                        <div className="px-4 py-2 border-b border-border-light"><p className="text-sm text-text-secondary">Signed in as</p><p className="font-medium text-text-primary">{user.name}</p><Badge variant="green" size="sm" className="mt-1">{user.role}</Badge></div>
                        <div className="py-2">
                          {user.role === "buyer" && (<><DropdownLink to="/buyer/dashboard">Dashboard</DropdownLink><DropdownLink to="/buyer/library">My Library</DropdownLink></>)}
                          {user.role === "seller" && (<><DropdownLink to="/seller/dashboard">Dashboard</DropdownLink><DropdownLink to="/seller/inventory">Inventory</DropdownLink></>)}
                          {user.role === "admin" && (<><DropdownLink to="/admin/dashboard">Dashboard</DropdownLink><DropdownLink to="/admin/users">Manage Users</DropdownLink></>)}
                        </div>
                        <div className="pt-2 border-t border-border-light px-2">
                          {/* We keep your custom <Button> here for variant="error" */}
                          <Button variant="ghost" size="sm" fullWidth onClick={handleLogout} className="justify-start">Logout</Button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <NavbarButton
                  as="button"
                  variant="secondary"
                  onClick={() => navigate("/login")}>
                  Login
                </NavbarButton>
                <NavbarButton
                  as="button"
                  variant="primary"
                  onClick={() => navigate("/register")}>
                  Sign Up
                </NavbarButton>
              </div>
            )}
          </div>
        </NavBody>

        {/* --- Mobile Navigation --- */}
        <MobileNav>
          <MobileNavHeader>
            {/* Your Custom Mobile Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-accent-brown rounded-lg flex items-center justify-center shadow-sm">
                 <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
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
            onClose={() => setIsMobileMenuOpen(false)}>
            
            {/* User Info Block (Unchanged) */}
            {isAuthenticated && (
              <div className="p-6 bg-background-secondary border-b border-border-light">
                {/* ... user info content ... */}
                 <div className="flex items-center gap-3"><div className="w-12 h-12 bg-accent-brown/10 text-accent-brown rounded-full flex items-center justify-center font-medium text-lg">{user.name?.charAt(0).toUpperCase()}</div><div><p className="font-medium">{user.name}</p><Badge variant="green" size="sm">{user.role}</Badge></div></div>
              </div>
            )}

            {/* Navigation Links (Unchanged) */}
            <div className="p-6 space-y-1">
              <MobileNavLink to="/">Home</MobileNavLink>
              <MobileNavLink to="/about">About</MobileNavLink>
              <MobileNavLink to="/pricing">Pricing</MobileNavLink>
              {isAuthenticated && user.role === "buyer" && (
                <>
                  {/* ... mobile buyer links ... */}
                  <div className="my-4 border-t border-border-light"></div>
                  <MobileNavLink to="/buyer/dashboard">Dashboard</MobileNavLink>
                  <MobileNavLink to="/buyer/browse">Browse Books</MobileNavLink>
                  <MobileNavLink to="/buyer/cart"><span className="flex justify-between w-full">Cart{cartItems.length > 0 && <Badge variant="brown" size="sm">{cartItems.length}</Badge>}</span></MobileNavLink>
                </>
              )}
            </div>

            {/* Auth Buttons */}
            <div className="p-6 border-t border-border-light">
              {isAuthenticated ? (
                // Keep custom Button for variant="error"
                <Button variant="error" fullWidth onClick={handleLogout}>
                  Logout
                </Button>
              ) : (
                /**
                 * 7. REPLACED mobile <Button> WITH <NavbarButton>
                 */
                <div className="space-y-3">
                  <NavbarButton
                    as="button"
                    variant="secondary"
                    className="w-full"
                    onClick={() => navigate("/login")}>
                    Login
                  </NavbarButton>
                  <NavbarButton
                    as="button"
                    variant="primary"
                    className="w-full"
                    onClick={() => navigate("/register")}>
                    Sign Up
                  </NavbarButton>
                </div>
              )}
            </div>
          </MobileNavMenu>
        </MobileNav>
      </Navbar>
      
      {/* The spacer div */}
      <div className="h-20"></div>
    </>
  );
}

// --- Helper sub-components (Your NavLink is modified) ---

/**
 * Your NavLink component.
 * I'm keeping this for the 'Cart' link, which benefits
 * from the 'isActive' prop.
 */
const NavLink = ({ to, isActive, children }) => (
  <Link
    to={to}
    className={`text-sm font-medium transition-colors relative py-1 ${
      isActive
        ? "text-accent-brown"
        : "text-text-primary hover:text-accent-brown"
    }`}>
    {children}
    {isActive && (
      <motion.div
        layoutId="activeLink"
        className="absolute -bottom-1 left-0 right-0 h-0.5 bg-accent-brown"
        transition={{ type: "spring", stiffness: 380, damping: 30 }}
      />
    )}
  </Link>
);

const DropdownLink = ({ to, children }) => (
  <Link
    to={to}
    className="block px-4 py-2 text-sm text-text-primary hover:bg-background-secondary transition-colors">
    {children}
  </Link>
);

const MobileNavLink = ({ to, children }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link
      to={to}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
        isActive
          ? "bg-accent-brown/10 text-accent-brown"
          : "text-text-primary hover:bg-background-secondary"
      }`}>
      {children}
    </Link>
  );
};