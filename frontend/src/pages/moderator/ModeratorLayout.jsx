/**
 * Moderator Layout
 */
import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';

const ModeratorLayout = () => (
    <div className="min-h-screen bg-background-primary w-full">
        {/* Page Content */}
        <motion.div key="outlet" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}>
            <Outlet />
        </motion.div>
    </div>
);

export default ModeratorLayout;
