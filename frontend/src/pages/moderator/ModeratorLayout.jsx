/**
 * Manager Layout — Department-Aware Navigation
 * Each department manager sees only their relevant tabs.
 * Employees also use this layout but with restricted tabs.
 */
import { NavLink, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';

// ─── Department-specific tab sets ────────────────────────────────────────
const DEPT_TABS = {
  marketplace: [
    { label: 'Dashboard',         to: '/manager/dashboard',     icon: '📊' },
    { label: 'Pending Books',     to: '/manager/books',         icon: '📚' },
    { label: 'Verification',      to: '/manager/verification',  icon: '✅' },
    { label: 'User Management',   to: '/manager/users',         icon: '👥' },
    { label: 'Verified Library',  to: '/manager/library',       icon: '🏛️' },
  ],
  support: [
    { label: 'Dashboard',   to: '/manager/dashboard',    icon: '📊' },
    { label: 'Complaints',  to: '/manager/complaints',   icon: '⚠️' },
    { label: 'Reports',     to: '/manager/reports',      icon: '📈' },
  ],
  finance: [
    { label: 'Dashboard',   to: '/manager/dashboard',   icon: '📊' },
    { label: 'Orders',      to: '/manager/orders',      icon: '📦' },
    { label: 'Reports',     to: '/manager/reports',     icon: '📈' },
  ],
  tech: [
    { label: 'Dashboard',        to: '/manager/dashboard',    icon: '📊' },
    { label: 'Reports',          to: '/manager/reports',      icon: '📈' },
    { label: 'User Management',  to: '/manager/users',        icon: '👥' },
  ],
};

// Employee tabs — employees only see their own dashboard
const EMPLOYEE_TABS = [
  { label: 'My Dashboard',     to: '/employee/dashboard',   icon: '📊' },
  { label: 'Orders',           to: '/employee/orders',      icon: '📦' },
  { label: 'Complaints',       to: '/employee/complaints',  icon: '⚠️' },
];

// Admin sees everything
const ADMIN_TABS = [
  { label: 'Overview',          to: '/manager/dashboard',    icon: '📊' },
  { label: 'Verification',      to: '/manager/verification', icon: '✅' },
  { label: 'Pending Books',     to: '/manager/books',        icon: '📚' },
  { label: 'Orders',            to: '/manager/orders',       icon: '📦' },
  { label: 'Complaints',        to: '/manager/complaints',   icon: '⚠️' },
  { label: 'Reports',           to: '/manager/reports',      icon: '📈' },
  { label: 'User Management',   to: '/manager/users',        icon: '👥' },
  { label: 'Verified Library',  to: '/manager/library',      icon: '🏛️' },
];

// Dept label + color for the header badge
const DEPT_META = {
  marketplace: { label: 'Marketplace',  color: 'bg-[#8B7355]/15 text-[#6F5C44]'  },
  support:     { label: 'Support',      color: 'bg-[#4A5D4F]/15 text-[#3A4D3F]'  },
  finance:     { label: 'Finance',      color: 'bg-[#C9A96E]/25 text-[#7A5C2E]'  },
  tech:        { label: 'Tech',         color: 'bg-[#4A4A4A]/10 text-[#2C2C2C]'  },
};

const ModeratorLayout = () => {
  const user = useSelector((state) => state.auth.user);
  const role = user?.role;
  const department = user?.department;

  let tabs;
  if (role === 'admin') {
    tabs = ADMIN_TABS;
  } else if (role === 'employee') {
    tabs = EMPLOYEE_TABS;
  } else {
    // manager — fall back to marketplace tabs if department not set
    tabs = DEPT_TABS[department] || DEPT_TABS.marketplace;
  }

  const deptMeta = department ? DEPT_META[department] : null;

  return (
    <div className="min-h-screen bg-background-primary">
      {/* Tab Bar */}
      <div className="sticky top-0 z-40 bg-background-primary/95 backdrop-blur-md border-b border-border-primary shadow-sm">
        <div className="container-custom">
          {/* Department badge */}
          {deptMeta && role === 'manager' && (
            <div className="flex items-center gap-2 pt-2 px-1">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${deptMeta.color}`}>
                {deptMeta.label} Department
              </span>
              <span className="text-xs text-text-secondary">{user?.name || user?.email}</span>
            </div>
          )}
          <div className="flex items-center gap-1 overflow-x-auto py-1 scrollbar-hide">
            {tabs.map(tab => (
              <NavLink
                key={tab.to}
                to={tab.to}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-all rounded-t-lg border-b-2 ${
                    isActive
                      ? 'text-accent-brown border-accent-brown bg-accent-brown/5'
                      : 'text-text-secondary border-transparent hover:text-text-primary hover:border-border-primary'
                  }`
                }
              >
                <span>{tab.icon}</span>
                {tab.label}
              </NavLink>
            ))}
          </div>
        </div>
      </div>

      {/* Page Content */}
      <motion.div key="outlet" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}>
        <Outlet />
      </motion.div>
    </div>
  );
};

export default ModeratorLayout;

