/**
 * Employee Layout — Department-Aware Navigation
 */
import { NavLink, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';

const ALL_TABS = [
    { label: 'My Tasks',    to: '/employee/dashboard',   icon: '✅' },
    { label: 'Orders',      to: '/employee/orders',      icon: '📦' },
    { label: 'Complaints',  to: '/employee/complaints',  icon: '⚠️' },
];

// Show only relevant tabs per department
const DEPT_TABS = {
  marketplace: ['My Tasks', 'Orders', 'Complaints'],
  support:     ['My Tasks', 'Complaints'],
  finance:     ['My Tasks', 'Orders'],
  tech:        ['My Tasks'],
};

const DEPT_META = {
  marketplace: { label: 'Marketplace',  color: 'bg-[#8B7355]/15 text-[#6F5C44]'  },
  support:     { label: 'Support',      color: 'bg-[#4A5D4F]/15 text-[#3A4D3F]'  },
  finance:     { label: 'Finance',      color: 'bg-[#C9A96E]/25 text-[#7A5C2E]'  },
  tech:        { label: 'Tech',         color: 'bg-[#4A4A4A]/10 text-[#2C2C2C]'  },
};

const EmployeeLayout = () => {
    const user = useSelector((state) => state.auth.user);
    const department = user?.department;
    const allowedLabels = DEPT_TABS[department] || ALL_TABS.map(t => t.label);
    const tabs = ALL_TABS.filter(t => allowedLabels.includes(t.label));
    const deptMeta = department ? DEPT_META[department] : null;

    return (
        <div className="min-h-screen bg-background-primary">
            {/* Tab Bar */}
            <div className="sticky top-0 z-40 bg-background-primary/95 backdrop-blur-md border-b border-border-primary shadow-sm">
                <div className="container-custom">
                    {deptMeta && (
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
};

export default EmployeeLayout;

