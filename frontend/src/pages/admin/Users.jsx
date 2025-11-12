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
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await adminService.getUsers();
      setUsers(response.data?.users || []);
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
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      setUsers(users.map(user => 
        user._id === userId ? { ...user, status: newStatus } : user
      ));
      setSuccessMessage(`User ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`);
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
    <div className="min-h-screen bg-cream py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div 
          className="mb-12"
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
        >
          <h1 className="heading-1 text-charcoal mb-2">User Management</h1>
          <p className="body text-charcoal/70">Manage all users in the system</p>
        </motion.div>

        {error && (
          <motion.div 
            className="mb-6"
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
          >
            <ErrorMessage message={error} />
          </motion.div>
        )}

        {/* Filter Tabs */}
        <motion.div 
          className="mb-8"
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
        >
          <Card>
            <Card.Body className="p-0">
              <nav className="flex space-x-1 overflow-x-auto p-2">
                {[
                  { value: 'all', label: 'All Users', count: users.length },
                  { value: 'buyer', label: 'Buyers', count: users.filter(u => u.role === 'buyer').length },
                  { value: 'seller', label: 'Sellers', count: users.filter(u => u.role === 'seller').length },
                  { value: 'admin', label: 'Admins', count: users.filter(u => u.role === 'admin').length }
                ].map(tab => (
                  <button
                    key={tab.value}
                    onClick={() => setRoleFilter(tab.value)}
                    className={`px-6 py-3 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${
                      roleFilter === tab.value
                        ? 'bg-brown text-white shadow-sm'
                        : 'text-charcoal/70 hover:bg-taupe/10'
                    }`}
                  >
                    {tab.label}
                    <Badge 
                      variant={roleFilter === tab.value ? 'light' : 'default'} 
                      size="sm" 
                      className="ml-2"
                    >
                      {tab.count}
                    </Badge>
                  </button>
                ))}
              </nav>
            </Card.Body>
          </Card>
        </motion.div>

        {/* Users List */}
        {filteredUsers.length === 0 ? (
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
          >
            <Card>
              <Card.Body className="py-16 text-center">
                <div className="max-w-md mx-auto">
                  <div className="w-24 h-24 bg-taupe/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-12 h-12 text-taupe" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <h3 className="heading-4 text-charcoal mb-3">
                    {roleFilter === 'all' ? 'No users found' : `No ${roleFilter}s found`}
                  </h3>
                </div>
              </Card.Body>
            </Card>
          </motion.div>
        ) : (
          <motion.div 
            className="space-y-4"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {filteredUsers.map(user => (
              <motion.div key={user._id} variants={staggerItem}>
                <Card hoverable>
                  <Card.Body>
                    <div className="flex flex-col md:flex-row md:items-center gap-6">
                      {/* User Info */}
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="w-12 h-12 rounded-full bg-brown/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-brown font-semibold text-lg">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="heading-5 text-charcoal truncate">{user.name}</h3>
                          <p className="body-sm text-charcoal/60 truncate">{user.email}</p>
                          <p className="body-sm text-charcoal/50 mt-1">
                            Joined {new Date(user.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {/* Role & Status */}
                      <div className="flex items-center gap-4">
                        <div className="w-40">
                          <Input.Select
                            id={`role-${user._id}`}
                            label="Role"
                            value={user.role}
                            onChange={(e) => handleRoleChange(user._id, e.target.value)}
                            disabled={updatingUserId === user._id}
                          >
                            <option value="buyer">Buyer</option>
                            <option value="seller">Seller</option>
                            <option value="admin">Admin</option>
                          </Input.Select>
                        </div>

                        <div className="flex flex-col items-center gap-2">
                          <p className="body-sm text-charcoal/60">Status</p>
                          <Button
                            variant={user.status === 'active' ? 'success' : 'error'}
                            size="sm"
                            onClick={() => handleToggleStatus(user._id, user.status)}
                            disabled={updatingUserId === user._id}
                          >
                            {user.status === 'active' ? 'Active' : 'Inactive'}
                          </Button>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(user)}
                          disabled={updatingUserId === user._id}
                          className="text-error hover:text-error"
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
