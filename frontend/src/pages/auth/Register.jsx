// src/pages/Register.jsx
/**
 * Register Page - Refactored with React Hook Form and Zod
 */

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { register as registerAction } from '../../redux/actions/authActions';
// Removed: useFormValidation
// Removed: validation utilities
import Button from '../../components/Button';
import Card from '../../components/Card';
import Input from '../../components/Input';
import ErrorMessage from '../../components/ErrorMessage';
import { motion } from 'framer-motion';
import { fadeInUp } from '../../utils/animations';
import SuccessToast from '../../components/SuccessToast';

// RHF and Zod Imports
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema } from '../../schemas/allFormSchemas'; // Import Zod schema

const Register = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { loading, registerErrors, isAuthenticated, user } = useSelector(state => state.auth);

  // Get message and email from location state (from login redirect)
  const redirectMessage = location.state?.message;
  const prefillEmail = location.state?.email || '';

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isSubmitting }
  } = useForm({
    resolver: zodResolver(registerSchema),
    mode: 'onTouched',
    defaultValues: { name: '', email: prefillEmail, password: '', password2: '', role: 'buyer' }
  });

  // Scroll and Redirect effects remain the same
  useEffect(() => { window.scrollTo(0, 0); }, []);

  useEffect(() => {
    if (isAuthenticated && user) {
      const role = user.role;
      const redirects = {
        admin: '/admin/dashboard',
        moderator: '/moderator/dashboard',
        employee: '/employee/dashboard',
        seller: '/seller/dashboard',
        buyer: '/buyer/browse',
      };
      navigate(redirects[role] || '/');
    }
  }, [isAuthenticated, user, navigate]);

  // Show toast if redirected with a message
  useEffect(() => {
    if (redirectMessage) {
      setToastMessage(redirectMessage);
      setToastType('info');
      setShowToast(true);
      // Clear state to prevent showing again on refresh
      window.history.replaceState({}, document.title);
    }
  }, [redirectMessage]);

  const onSubmit = async (data) => {
    // RHF guarantees data is valid based on registerSchema
    // Note: RHF is role-agnostic; it just passes the form data.
    const result = await dispatch(registerAction(data));

    if (result.success) {
      navigate('/login', {
        state: {
          message: 'Registration successful! Please login to continue.',
          email: data.email
        }
      });
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
          <h2 className="heading-1 text-charcoal mb-2">Join Our Community</h2>
          <p className="body text-charcoal/70">Create your account to start exploring</p>
        </div>

        <Card>
          <Card.Body className="p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {registerErrors && registerErrors.length > 0 && (
                <div className="mb-6">
                  {registerErrors.map((error, index) => (
                    <ErrorMessage key={index} message={error.msg} />
                  ))}
                </div>
              )}

              <div className="space-y-4">
                <Input
                  id="name"
                  label="Full Name"
                  placeholder="Enter your full name"
                  required
                  {...register("name")}
                  error={errors.name?.message}
                />

                <Input
                  id="email"
                  label="Email Address"
                  type="email"
                  placeholder="Enter your email"
                  required
                  {...register("email")}
                  error={errors.email?.message}
                />

                <Input
                  id="password"
                  label="Password"
                  type="password"
                  placeholder="Create a password"
                  required
                  {...register("password")}
                  error={errors.password?.message}
                  // Password complexity note is now based on Zod's strict regex
                  helpText="Min 8 chars, with Uppercase, Lowercase, Number, and Special Character."
                />

                <Input
                  id="password2"
                  label="Confirm Password"
                  type="password"
                  placeholder="Confirm your password"
                  required
                  {...register("password2")}
                  // Error shows "Passwords do not match" if the refine() check fails
                  error={errors.password2?.message}
                />

                <Input.Select
                  id="role"
                  label="Register As"
                  required
                  {...register("role")}
                  error={errors.role?.message}
                >
                  {/* Keep the initial blank/default option */}
                  <option value="">Select your role</option>
                  <option value="buyer">Buyer — Browse and purchase books</option>
                  <option value="seller">Seller — List and sell books</option>
                  <option value="employee">Employee — Book approvals & support tickets</option>
                </Input.Select>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                disabled={loading || isSubmitting || !isValid}
                isLoading={loading || isSubmitting}
              >
                {loading || isSubmitting ? 'Creating account...' : 'Create Account'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="body-sm text-charcoal/60">
                Already have an account?{' '}
                <Link to="/login" className="text-brown font-semibold hover:text-accent-brown transition-colors">
                  Sign in
                </Link>
              </p>
            </div>
          </Card.Body>
        </Card>
      </motion.div>

      {/* Toast Notification */}
      {showToast && (
        <SuccessToast
          message={toastMessage}
          type={toastType}
          onClose={() => setShowToast(false)}
          duration={5000}
          position="top-center"
        />
      )}
    </div>
  );
};

export default Register;