// src/pages/Login.jsx
/**
 * Login Page
 */

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../redux/actions/authActions';
import Button from '../components/Button';
import Card from '../components/Card';
import Input from '../components/Input';
import ErrorMessage from '../components/ErrorMessage';
import { motion } from 'framer-motion';
import { fadeInUp } from '../utils/animations';

// RHF and Zod Imports
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema } from '../schemas/authSchemas'; // Import the Zod schema

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading, error, isAuthenticated, user } = useSelector(state => state.auth);

  // RHF Setup
  const { 
    register, 
    handleSubmit, 
    formState: { errors, isValid, isSubmitting } 
  } = useForm({
    resolver: zodResolver(loginSchema), // Connects Zod validation
    mode: 'onTouched', // Validates on blur/change after first touch
    defaultValues: { email: '', password: '' }
  });

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated && user) {
      const role = user.role;
      navigate(role === 'admin' ? '/admin/dashboard' : role === 'seller' ? '/seller/dashboard' : '/buyer/dashboard');
    }
  }, [isAuthenticated, user, navigate]);

  const onSubmit = async (data) => {
    // RHF ensures data is valid before calling this function
    const result = await dispatch(login(data.email, data.password));

    if (result.success) {
      navigate('/');
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
        {/* Header and Card structure remains the same */}
        <div className="text-center mb-8">
          <h2 className="heading-1 text-charcoal mb-2">Welcome Back</h2>
          <p className="body text-charcoal/70">Sign in to access your account</p>
        </div>

        <Card>
          <Card.Body className="p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {error && (
                <div className="mb-6">
                  <ErrorMessage message={error} />
                </div>
              )}

              <div className="space-y-4">
                <Input
                  id="email"
                  name="email"
                  type="email"
                  label="Email Address"
                  placeholder="Enter your email"
                  required
                  {...register("email")} // ⬅️ RHF integration
                  error={errors.email?.message} // ⬅️ RHF error handling
                />

                <Input
                  id="password"
                  name="password"
                  type="password"
                  label="Password"
                  placeholder="Enter your password"
                  required
                  {...register("password")} // ⬅️ RHF integration
                  error={errors.password?.message} // ⬅️ RHF error handling
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                disabled={loading || isSubmitting || !isValid}
                loading={loading || isSubmitting}
              >
                {loading || isSubmitting ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="body-sm text-charcoal/70">
                Don't have an account?{' '}
                <Link to="/register" className="text-brown hover:text-brown/80 font-semibold transition-colors">
                  Create one now
                </Link>
              </p>
            </div>
          </Card.Body>
        </Card>
        {/* Help Links remain the same */}
      </motion.div>
    </div>
  );
};

export default Login;