/**
 * Profile Page (Buyer)
 * User profile with personal info, addresses, and subscription status
 */

import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchSubscriptionStatus } from '../../redux/actions/subscriptionActions';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import { motion } from 'framer-motion';
import { fadeInUp, staggerContainer, staggerItem } from '../../utils/animations';

const Profile = () => {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const { currentSubscription } = useSelector(state => state.subscription);
  
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, [dispatch]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch subscription status
      dispatch(fetchSubscriptionStatus());
      
      // Fetch addresses
      const addressResponse = await api.get('/buyer/addresses');
      setAddresses(addressResponse.data.data || []);
      
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load profile data');
    } finally {
      setLoading(false);
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
                      <div className="w-10 h-10 rounded-full bg-brown/10 flex items-center justify-center">
                        <svg className="w-5 h-5 text-brown" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <h2 className="heading-3 text-charcoal">Personal Information</h2>
                    </div>
                    <Button
                      as={Link}
                      to="/buyer/profile/edit"
                      variant="outline"
                      size="sm"
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
                      <label className="body-sm font-medium text-charcoal/60 mb-2 block">Member Since</label>
                      <p className="body text-charcoal">
                        {user?.createdAt 
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
                    <Button
                      as={Link}
                      to="/buyer/addresses"
                      variant="outline"
                      size="sm"
                    >
                      Manage Addresses
                    </Button>
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
                      <Button
                        as={Link}
                        to="/buyer/addresses/new"
                        variant="primary"
                        size="sm"
                      >
                        Add Address
                      </Button>
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
                        <Button
                          as={Link}
                          to="/buyer/addresses"
                          variant="ghost"
                          size="sm"
                          fullWidth
                        >
                          View all {addresses.length} addresses
                        </Button>
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
                  {currentSubscription ? (
                    <div>
                      <div className="bg-gradient-to-r from-brown to-brown/80 text-white rounded-lg p-5 mb-4">
                        <p className="body-sm opacity-90 mb-1">Active Plan</p>
                        <p className="heading-3">{currentSubscription.planName}</p>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="body-sm text-charcoal/60">Status</span>
                          <Badge variant="success">{currentSubscription.status}</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="body-sm text-charcoal/60">Started</span>
                          <span className="body-sm font-medium text-charcoal">
                            {new Date(currentSubscription.startDate).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="body-sm text-charcoal/60">Renews</span>
                          <span className="body-sm font-medium text-charcoal">
                            {new Date(currentSubscription.endDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <Button
                        as={Link}
                        to="/subscription"
                        variant="outline"
                        size="sm"
                        fullWidth
                        className="mt-4"
                      >
                        Manage Subscription
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-taupe/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-taupe" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </div>
                      <p className="body text-charcoal/70 mb-4">No active subscription</p>
                      <Button
                        as={Link}
                        to="/pricing"
                        variant="primary"
                        size="sm"
                      >
                        View Plans
                      </Button>
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
                    <Button
                      as={Link}
                      to="/buyer/orders"
                      variant="ghost"
                      size="md"
                      fullWidth
                      className="justify-between"
                    >
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
                    </Button>

                    <Button
                      as={Link}
                      to="/buyer/library"
                      variant="ghost"
                      size="md"
                      fullWidth
                      className="justify-between"
                    >
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
                    </Button>

                    <Button
                      as={Link}
                      to="/buyer/cart"
                      variant="ghost"
                      size="md"
                      fullWidth
                      className="justify-between"
                    >
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
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Profile;
