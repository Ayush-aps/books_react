/**
 * Profile Page (Buyer)
 * User profile with personal info, addresses, and subscription status
 */

import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { fetchSubscriptionStatus } from '../../redux/actions/subscriptionActions';
import { checkAuth } from '../../redux/actions/authActions';
import { profileUpdateSchema } from '../../schemas/allFormSchemas';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Modal from '../../components/Modal';
import { motion } from 'framer-motion';
import { fadeInUp, staggerContainer, staggerItem } from '../../utils/animations';
import SuccessToast from '../../components/SuccessToast';

const Profile = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector(state => state.auth);
  const { currentSubscription } = useSelector(state => state.subscription);

  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  
  // Edit Profile Modal States
  const [showEditModal, setShowEditModal] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  
  // React Hook Form
  const { register, handleSubmit, formState: { errors }, setValue, reset } = useForm({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
  });

  useEffect(() => {
    fetchData();
  }, [dispatch]);

  useEffect(() => {
    // Initialize form data when user data is available
    if (user) {
      setValue('name', user.name || '');
      setValue('email', user.email || '');
      setValue('phone', user.phone || '');
    }
  }, [user, setValue]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch subscription status
      dispatch(fetchSubscriptionStatus());

      // Fetch addresses
      const addressResponse = await api.get('/buyer/addresses');
      setAddresses(addressResponse.data.data.addresses || []);

      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleEditProfile = () => {
    setShowEditModal(true);
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCloseModal = () => {
    setShowEditModal(false);
    setAvatarPreview(null);
    setAvatarFile(null);
    // Reset form
    reset({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
  };

  const handleSubmitProfile = async (data) => {
    try {
      setEditLoading(true);
      
      // Use FormData to support file upload
      const formDataToSend = new FormData();
      formDataToSend.append('name', data.name);
      formDataToSend.append('email', data.email);
      if (data.phone) {
        formDataToSend.append('phone', data.phone);
      }

      // Add avatar if selected
      if (avatarFile) {
        formDataToSend.append('avatar', avatarFile);
      }

      // Only include password fields if user is changing password AND they're not empty
      if (data.currentPassword && data.currentPassword.trim() !== '' && 
          data.newPassword && data.newPassword.trim() !== '') {
        formDataToSend.append('currentPassword', data.currentPassword);
        formDataToSend.append('newPassword', data.newPassword);
      }

      const response = await api.put('/buyer/profile', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data.success) {
        setToastMessage('Profile updated successfully!');
        setToastType('success');
        setShowToast(true);
        setShowEditModal(false);
        
        // Refresh user data
        dispatch(checkAuth());
        
        // Reset fields
        setAvatarPreview(null);
        setAvatarFile(null);
        reset({
          name: response.data.data.user.name,
          email: response.data.data.user.email,
          phone: response.data.data.user.phone || '',
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      }
    } catch (err) {
      setToastMessage(err.response?.data?.message || 'Failed to update profile');
      setToastType('error');
      setShowToast(true);
    } finally {
      setEditLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" message="Loading profile..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
        >
          <h1 className="heading-1 text-charcoal mb-2">My Profile</h1>
          <p className="body text-charcoal/70 mb-8">Manage your account information and preferences</p>
        </motion.div>

        {error && (
          <motion.div
            className="mb-6"
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
          >
            <ErrorMessage message={error} onRetry={fetchData} />
          </motion.div>
        )}

        <motion.div
          className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {/* Personal Information */}
          <div className="lg:col-span-2 space-y-6">
            <motion.div variants={staggerItem}>
              <Card>
                <Card.Header>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {/* User Avatar */}
                      {user?.avatar ? (
                        <img 
                          src={`http://localhost:3000${user.avatar}`}
                          alt={user.name}
                          className="w-12 h-12 rounded-full object-cover border-2 border-brown/20"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '/img/users/default-avatar.jpg';
                          }}
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-brown/10 flex items-center justify-center">
                          <svg className="w-6 h-6 text-brown" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                      )}
                      <h2 className="heading-4 text-charcoal">Personal Information</h2>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleEditProfile}
                    >
                      Edit Profile
                    </Button>
                  </div>
                </Card.Header>
                <Card.Body>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="body-sm font-medium text-charcoal/60 mb-2 block">Full Name</label>
                      <p className="body text-charcoal">{user?.name || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="body-sm font-medium text-charcoal/60 mb-2 block">Email</label>
                      <p className="body text-charcoal">{user?.email || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="body-sm font-medium text-charcoal/60 mb-2 block">Role</label>
                      <Badge variant="info">{user?.role || 'N/A'}</Badge>
                    </div>
                    <div>
                      <label className="body-sm font-medium text-charcoal/60 mb-2 block">
                        {currentSubscription?.startDate ? 'Subscribed Since' : 'Member Since'}
                      </label>
                      <p className="body text-charcoal">
                        {currentSubscription?.startDate
                          ? new Date(currentSubscription.startDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })
                          : user?.createdAt
                          ? new Date(user.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })
                          : 'N/A'}
                      </p>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </motion.div>

            {/* Addresses */}
            <motion.div variants={staggerItem}>
              <Card>
                <Card.Header>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-green/10 flex items-center justify-center">
                        <svg className="w-5 h-5 text-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <h2 className="heading-3 text-charcoal">Saved Addresses</h2>
                    </div>
                    <Link to="/buyer/addresses">
                      <Button
                        variant="outline"
                        size="sm"
                      >
                        Manage Addresses
                      </Button>
                    </Link>
                  </div>
                </Card.Header>
                <Card.Body>
                  {addresses.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-taupe/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-taupe" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <p className="body text-charcoal/70 mb-4">No saved addresses</p>
                      <Link to="/buyer/addresses">
                        <Button
                          variant="primary"
                          size="sm"
                        >
                          Add Address
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {addresses.slice(0, 3).map((address) => (
                        <div key={address._id} className="border border-charcoal/10 rounded-lg p-4 hover:border-brown/30 transition-colors">
                          <p className="body font-medium text-charcoal mb-2">{address.fullName}</p>
                          <p className="body-sm text-charcoal/70">
                            {address.street}, {address.city}
                          </p>
                          <p className="body-sm text-charcoal/70">
                            {address.state}, {address.zipCode}
                          </p>
                          <p className="body-sm text-charcoal/70 mt-2">{address.phone}</p>
                        </div>
                      ))}
                      {addresses.length > 3 && (
                        <Link to="/buyer/addresses" className="block">
                          <Button
                            variant="ghost"
                            size="sm"
                            fullWidth
                          >
                            View all {addresses.length} addresses
                          </Button>
                        </Link>
                      )}
                    </div>
                  )}
                </Card.Body>
              </Card>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Subscription Status */}
            <motion.div variants={staggerItem}>
              <Card>
                <Card.Header>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-brown/10 flex items-center justify-center">
                      <svg className="w-5 h-5 text-brown" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <h2 className="heading-3 text-charcoal">Subscription</h2>
                  </div>
                </Card.Header>
                <Card.Body>
                  {currentSubscription && currentSubscription.isActive && new Date(currentSubscription.endDate) > new Date() ? (
                    <div>
                      <div className="bg-gradient-to-r from-brown to-brown/80 text-white rounded-lg p-5 mb-4">
                        <p className="body-sm text-white opacity-90 mb-1">Active Plan</p>
                        <p className="heading-3 text-white">
                          {currentSubscription.plan === 'premium' ? 'Premium' : 
                           currentSubscription.plan === 'premium_plus' ? 'Premium Plus' : 
                           currentSubscription.plan}
                        </p>
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="body-sm text-charcoal/60">Status</span>
                          <Badge variant="success">Active</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="body-sm text-charcoal/60">Start Date</span>
                          <span className="body-sm font-medium text-charcoal">
                            {new Date(currentSubscription.startDate).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="body-sm text-charcoal/60">End Date</span>
                          <span className="body-sm font-medium text-charcoal">
                            {new Date(currentSubscription.endDate).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </span>
                        </div>
                      </div>

                      <Link to="/pricing" className="block mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          fullWidth
                        >
                          Manage Subscription
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-taupe/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-taupe" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </div>
                      <div className="space-y-3 mb-4">
                        <div className="flex justify-between items-center px-4">
                          <span className="body-sm text-charcoal/60">Status</span>
                          <Badge variant="secondary">No Subscription</Badge>
                        </div>
                      </div>
                      <p className="body-sm text-charcoal/60 mb-4">Subscribe to access our library of books</p>
                      <Link to="/pricing">
                        <Button
                          variant="primary"
                          size="sm"
                        >
                          View Plans
                        </Button>
                      </Link>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </motion.div>

            {/* Quick Stats */}
            <motion.div variants={staggerItem}>
              <Card>
                <Card.Header>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green/10 flex items-center justify-center">
                      <svg className="w-5 h-5 text-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <h2 className="heading-3 text-charcoal">Quick Actions</h2>
                  </div>
                </Card.Header>
                <Card.Body>
                  <div className="space-y-2">
                    <Link to="/buyer/orders" className="block">
                      <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-background-secondary transition-colors text-left">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-brown/10 rounded-lg flex items-center justify-center">
                            <svg className="w-4 h-4 text-brown" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                            </svg>
                          </div>
                          <span className="body-sm font-medium">My Orders</span>
                        </div>
                        <svg className="w-4 h-4 text-charcoal/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </Link>

                    <Link to="/buyer/library" className="block">
                      <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-background-secondary transition-colors text-left">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-green/10 rounded-lg flex items-center justify-center">
                            <svg className="w-4 h-4 text-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                          </div>
                          <span className="body-sm font-medium">My Library</span>
                        </div>
                        <svg className="w-4 h-4 text-charcoal/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </Link>

                    <Link to="/buyer/cart" className="block">
                      <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-background-secondary transition-colors text-left">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-taupe/20 rounded-lg flex items-center justify-center">
                            <svg className="w-4 h-4 text-charcoal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                          </div>
                          <span className="body-sm font-medium">Shopping Cart</span>
                        </div>
                        <svg className="w-4 h-4 text-charcoal/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </Link>
                  </div>
                </Card.Body>
              </Card>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Edit Profile Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={handleCloseModal}
        title="Edit Profile"
        size="lg"
      >
        <form onSubmit={handleSubmit(handleSubmitProfile)} className="space-y-6">
          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="heading-5 text-charcoal">Personal Information</h3>
            
            {/* Avatar Upload */}
            <div>
              <label className="form-label">Profile Photo</label>
              <div className="flex items-center gap-4">
                {/* Current or Preview Avatar */}
                {avatarPreview ? (
                  <img 
                    src={avatarPreview} 
                    alt="Preview" 
                    className="w-20 h-20 rounded-full object-cover border-2 border-brown/20"
                  />
                ) : user?.avatar ? (
                  <img 
                    src={`http://localhost:3000${user.avatar}`}
                    alt={user.name}
                    className="w-20 h-20 rounded-full object-cover border-2 border-brown/20"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/img/users/default-avatar.jpg';
                    }}
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-brown/10 flex items-center justify-center">
                    <svg className="w-10 h-10 text-brown" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                )}
                
                {/* Upload Button */}
                <div className="flex-1">
                  <input
                    type="file"
                    id="avatar"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="avatar"
                    className="inline-flex items-center gap-2 px-4 py-2 border border-border-light rounded-lg cursor-pointer hover:bg-cream transition-colors"
                  >
                    <svg className="w-5 h-5 text-brown" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="body-sm">Choose Photo</span>
                  </label>
                  <p className="body-xs text-text-secondary mt-1">JPG, PNG or GIF (max 5MB)</p>
                </div>
              </div>
            </div>
            
            <div>
              <label className="form-label">Full Name</label>
              <input
                type="text"
                {...register('name')}
                className={`form-control ${errors.name ? 'border-red-500' : ''}`}
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="form-label">Email</label>
              <input
                type="email"
                {...register('email')}
                className={`form-control ${errors.email ? 'border-red-500' : ''}`}
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="form-label">Phone</label>
              <input
                type="tel"
                {...register('phone')}
                className={`form-control ${errors.phone ? 'border-red-500' : ''}`}
                placeholder="10-digit mobile number (optional)"
              />
              {errors.phone && (
                <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
              )}
            </div>
          </div>

          {/* Change Password Section */}
          <div className="space-y-4 pt-4 border-t border-border-light">
            <h3 className="heading-5 text-charcoal">Change Password (Optional)</h3>
            <p className="body-sm text-text-secondary">Leave blank if you don't want to change your password</p>
            
            <div>
              <label className="form-label">Current Password</label>
              <input
                type="password"
                {...register('currentPassword')}
                className={`form-control ${errors.currentPassword ? 'border-red-500' : ''}`}
                placeholder="Enter current password"
              />
              {errors.currentPassword && (
                <p className="text-red-500 text-sm mt-1">{errors.currentPassword.message}</p>
              )}
            </div>

            <div>
              <label className="form-label">New Password</label>
              <input
                type="password"
                {...register('newPassword')}
                className={`form-control ${errors.newPassword ? 'border-red-500' : ''}`}
                placeholder="Enter new password (min 8 characters)"
              />
              {errors.newPassword && (
                <p className="text-red-500 text-sm mt-1">{errors.newPassword.message}</p>
              )}
            </div>

            <div>
              <label className="form-label">Confirm New Password</label>
              <input
                type="password"
                {...register('confirmPassword')}
                className={`form-control ${errors.confirmPassword ? 'border-red-500' : ''}`}
                placeholder="Confirm new password"
              />
              {errors.confirmPassword && (
                <p className="text-red-500 text-sm mt-1">{errors.confirmPassword.message}</p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCloseModal}
              disabled={editLoading}
              fullWidth
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={editLoading}
              disabled={editLoading}
              fullWidth
            >
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Toast Notification */}
      {showToast && (
        <SuccessToast
          message={toastMessage}
          type={toastType}
          onClose={() => setShowToast(false)}
        />
      )}
    </div>
  );
};

export default Profile;
