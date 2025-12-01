/**
 * Admin Users Page
 * Manage all users in the system
 */

import { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import ConfirmDialog from '../../components/ConfirmDialog';
import SuccessToast from '../../components/SuccessToast';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Input from '../../components/Input';
import { motion } from 'framer-motion';
import { fadeInUp, staggerContainer, staggerItem } from '../../utils/animations';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [roleFilter, setRoleFilter] = useState('all');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [updatingUserId, setUpdatingUserId] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await adminService.getUsers();
      // Map isVerified to status for frontend display
      const usersWithStatus = (response.data?.users || []).map(user => ({
        ...user,
        status: user.isVerified ? 'verified' : 'not verified'
      }));
      setUsers(usersWithStatus);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      setUpdatingUserId(userId);
      await adminService.updateUserRole(userId, newRole);
      setUsers(users.map(user =>
        user._id === userId ? { ...user, role: newRole } : user
      ));
      setSuccessMessage(`User role updated to ${newRole}`);
      setShowSuccessToast(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update user role');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      setUpdatingUserId(userId);
      await adminService.toggleUserStatus(userId);
      const newStatus = currentStatus === 'verified' ? 'not verified' : 'verified';
      setUsers(users.map(user =>
        user._id === userId ? { ...user, status: newStatus, isVerified: newStatus === 'verified' } : user
      ));
      setSuccessMessage(`User ${newStatus === 'verified' ? 'verified' : 'unverified'} successfully`);
      setShowSuccessToast(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to toggle user status');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleDeleteClick = (user) => {
    setUserToDelete(user);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;

    try {
      await adminService.deleteUser(userToDelete._id);
      setUsers(users.filter(user => user._id !== userToDelete._id));
      setSuccessMessage('User deleted successfully');
      setShowSuccessToast(true);
      setShowDeleteDialog(false);
      setUserToDelete(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete user');
      setShowDeleteDialog(false);
    }
  };

  const filteredUsers = roleFilter === 'all'
    ? users
    : users.filter(user => user.role === roleFilter);

  const getRoleVariant = (role) => {
    const variants = {
      admin: 'error',
      seller: 'info',
      buyer: 'success'
    };
    return variants[role] || 'default';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" message="Loading users..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream py-6 sm:py-8 md:py-12">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          className="mb-6 sm:mb-8 md:mb-12"
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
        >
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-charcoal mb-1 sm:mb-2">User Management</h1>
          <p className="text-sm sm:text-base text-charcoal/70">Manage all users in the system</p>
        </motion.div>

        {error && (
          <motion.div
            className="mb-4 sm:mb-6"
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
          >
            <ErrorMessage message={error} />
          </motion.div>
        )}

        {/* Filter Tabs - Mobile Optimized */}
        <motion.div
          className="mb-6 sm:mb-8"
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
        >
          <Card>
            <Card.Body className="p-1 sm:p-2">
              <nav className="flex space-x-1 overflow-x-auto scrollbar-hide">
                {[
                  { value: 'all', label: 'All Users', mobileLabel: 'All', count: users.length },
                  { value: 'buyer', label: 'Buyers', mobileLabel: 'Buyers', count: users.filter(u => u.role === 'buyer').length },
                  { value: 'seller', label: 'Sellers', mobileLabel: 'Sellers', count: users.filter(u => u.role === 'seller').length },
                  { value: 'admin', label: 'Admins', mobileLabel: 'Admins', count: users.filter(u => u.role === 'admin').length }
                ].map(tab => (
                  <button
                    key={tab.value}
                    onClick={() => setRoleFilter(tab.value)}
                    className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-lg font-medium text-xs sm:text-sm whitespace-nowrap transition-all ${
                      roleFilter === tab.value
                        ? 'bg-brown text-white shadow-sm'
                        : 'text-charcoal/70 hover:bg-taupe/10'
                    }`}
                  >
                    <span className="hidden sm:inline">{tab.label}</span>
                    <span className="sm:hidden">{tab.mobileLabel}</span>
                    <Badge
                      variant={roleFilter === tab.value ? 'light' : 'default'}
                      size="sm"
                      className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5"
                    >
                      {tab.count}
                    </Badge>
                  </button>
                ))}
              </nav>
            </Card.Body>
          </Card>
        </motion.div>

        {/* Users List - Responsive */}
        {filteredUsers.length === 0 ? (
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
          >
            <Card>
              <Card.Body className="py-12 sm:py-16 text-center">
                <div className="max-w-md mx-auto px-4">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-taupe/10 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                    <svg className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-taupe" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-charcoal mb-2 sm:mb-3">
                    {roleFilter === 'all' ? 'No users found' : `No ${roleFilter}s found`}
                  </h3>
                </div>
              </Card.Body>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            className="space-y-3 sm:space-y-4"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {filteredUsers.map(user => (
              <motion.div key={user._id} variants={staggerItem}>
                <Card hoverable>
                  <Card.Body className="p-3 sm:p-4 md:p-6">
                    <div className="flex flex-col gap-4">
                      {/* User Info */}
                      <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-brown/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-brown font-semibold text-base sm:text-lg">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base sm:text-lg font-semibold text-charcoal truncate">{user.name}</h3>
                          <p className="text-xs sm:text-sm text-charcoal/60 truncate">{user.email}</p>
                          <p className="text-xs sm:text-sm text-charcoal/50 mt-1">
                            Joined {new Date(user.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {/* Role & Status - Mobile Stacked */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:items-center gap-3 sm:gap-4">
                        <div className="w-full lg:w-40">
                          <Input.Select
                            id={`role-${user._id}`}
                            label="Role"
                            value={user.role}
                            onChange={(e) => handleRoleChange(user._id, e.target.value)}
                            disabled={updatingUserId === user._id}
                            className="text-sm"
                          >
                            <option value="buyer">Buyer</option>
                            <option value="seller">Seller</option>
                            <option value="admin">Admin</option>
                          </Input.Select>
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <p className="text-xs sm:text-sm text-charcoal/60">Status</p>
                          <Button
                            variant={user.status === 'verified' ? 'success' : 'secondary'}
                            size="sm"
                            onClick={() => handleToggleStatus(user._id, user.status)}
                            disabled={updatingUserId === user._id}
                            className="w-full sm:w-auto text-xs sm:text-sm"
                          >
                            {user.status === 'verified' ? 'Verified' : 'Not Verified'}
                          </Button>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(user)}
                          disabled={updatingUserId === user._id}
                          className="text-error hover:text-error w-full sm:w-auto text-xs sm:text-sm lg:ml-auto"
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Delete Confirmation Dialog */}
        {showDeleteDialog && (
          <ConfirmDialog
            isOpen={showDeleteDialog}
            onClose={() => {
              setShowDeleteDialog(false);
              setUserToDelete(null);
            }}
            onConfirm={handleDeleteConfirm}
            title="Delete User"
            message={`Are you sure you want to delete ${userToDelete?.name}? This action cannot be undone.`}
            confirmText="Delete"
            type="danger"
          />
        )}

        {/* Success Toast */}
        {showSuccessToast && (
          <SuccessToast
            message={successMessage}
            onClose={() => setShowSuccessToast(false)}
          />
        )}
      </div>
    </div>
  );
};

export default Users;
