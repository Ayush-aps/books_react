// src/pages/Login.jsx
/**
 * Login Page - Refactored with React Hook Form and Zod
 */

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { login } from '../../redux/actions/authActions';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Input from '../../components/Input';
import SuccessToast from '../../components/SuccessToast';
import { motion } from 'framer-motion';
import { fadeInUp } from '../../utils/animations';

// RHF and Zod Imports
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema } from '../../schemas/allFormSchemas';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { loading, error, isAuthenticated, user } = useSelector(state => state.auth);

  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Check for redirect message (e.g. from registration)
  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      setShowSuccessToast(true);
      // Clear state to prevent showing again on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isSubmitting }
  } = useForm({
    resolver: zodResolver(loginSchema),
    mode: 'onTouched',
    defaultValues: { email: '', password: '' }
  });

  useEffect(() => { window.scrollTo(0, 0); }, []);

  useEffect(() => {
    if (isAuthenticated && user) {
      const role = user.role;
      navigate(role === 'admin' ? '/admin/dashboard' : '/');
    }
  }, [isAuthenticated, user, navigate]);

  const onSubmit = async (data) => {
    const result = await dispatch(login(data.email, data.password));

    if (result.success) {
      // Show success toast
      setSuccessMessage('Login successful! Redirecting...');
      setShowSuccessToast(true);

      // Redirect after short delay
      setTimeout(() => {
        const role = user?.role || 'buyer';
        navigate(role === 'admin' ? '/admin/dashboard' : '/');
      }, 1500);
    } else {
      // Check if error indicates user not found
      const errorMessage = result.message || error || '';
      const isUserNotFound = errorMessage.toLowerCase().includes('not found') ||
        errorMessage.toLowerCase().includes('not registered') ||
        errorMessage.toLowerCase().includes('does not exist') ||
        errorMessage.toLowerCase().includes('no user');

      if (isUserNotFound) {
        // Redirect immediately to signup
        navigate('/register', {
          state: {
            message: 'Account not found. Please sign up to create an account.',
            email: data.email
          }
        });
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        className="max-w-md w-full"
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
      >
        <div className="text-center mb-8">
          <h2 className="heading-1 text-charcoal mb-2">Welcome Back</h2>
          <p className="body text-charcoal/70">Sign in to access your account</p>
        </div>

        <Card>
          <Card.Body className="p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <div className="space-y-4">
                <Input
                  id="email"
                  label="Email Address"
                  placeholder="Enter your email"
                  required
                  {...register("email")}
                  error={errors.email?.message}
                />

                <Input
                  id="password"
                  label="Password"
                  type="password"
                  placeholder="Enter your password"
                  required
                  {...register("password")}
                  error={errors.password?.message}
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                disabled={loading || isSubmitting || !isValid}
                isLoading={loading || isSubmitting}
              >
                {loading || isSubmitting ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="body-sm text-charcoal/60">
                Don't have an account?{' '}
                <Link to="/register" className="text-brown font-semibold hover:text-accent-brown transition-colors">
                  Sign up
                </Link>
              </p>
            </div>
          </Card.Body>
        </Card>
      </motion.div>

      {/* Success Toast */}
      {showSuccessToast && (
        <SuccessToast
          message={successMessage}
          onClose={() => setShowSuccessToast(false)}
          duration={3000}
        />
      )}
    </div>
  );
};

export default Login;