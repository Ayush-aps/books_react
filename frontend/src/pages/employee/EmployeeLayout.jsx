/**
 * Employee Layout — shared tab navigation for all /employee/* pages
 */
import { NavLink, Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';

const TABS = [
    { label: 'Dashboard', to: '/employee/dashboard', icon: '📊' },
    { label: 'Orders', to: '/employee/orders', icon: '📦' },
    { label: 'Complaints', to: '/employee/complaints', icon: '⚠️' },
];

const EmployeeLayout = () => (
    <div className="min-h-screen bg-background-primary">
        {/* Tab Bar */}
        <div className="sticky top-0 z-40 bg-background-primary/95 backdrop-blur-md border-b border-border-primary shadow-sm">
            <div className="container-custom">
                <div className="flex items-center justify-center gap-1 overflow-x-auto py-1 scrollbar-hide">
                    {TABS.map(tab => (
                        <NavLink
                            key={tab.to}
                            to={tab.to}
                            className={({ isActive }) =>
                                `flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-all rounded-t-lg border-b-2 ${isActive
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

export default EmployeeLayout;
