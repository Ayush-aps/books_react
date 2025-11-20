/**
 * Login Page
 */

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../../redux/actions/authActions';
import useFormValidation from '../../hooks/useFormValidation';
import { validateEmail, validateRequired } from '../../utils/validation';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Input from '../../components/Input';
import ErrorMessage from '../../components/ErrorMessage';
import { motion } from 'framer-motion';
import { fadeInUp } from '../../utils/animations';

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading, error, isAuthenticated, user } = useSelector(state => state.auth);

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated && user) {
      const role = user.role;
      navigate(role === 'admin' ? '/admin/dashboard' : role === 'seller' ? '/seller/dashboard' : '/buyer/dashboard');
    }
  }, [isAuthenticated, user, navigate]);

  // Validation schema
  const validationSchema = {
    email: (value) => validateEmail(value),
    password: (value) => validateRequired(value, 'Password'),
  };

  // Form validation hook
  const {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    handleSubmit,
    isValid
  } = useFormValidation(
    { email: '', password: '' },
    validationSchema
  );

  const onSubmit = async (formData) => {
    const result = await dispatch(login(formData.email, formData.password));

    if (result.success) {
      // Redirect based on role (handled by Header component)
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
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="heading-1 text-charcoal mb-2">
            Welcome Back
          </h2>
          <p className="body text-charcoal/70">
            Sign in to access your account
          </p>
        </div>

        {/* Login Card */}
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
                  value={values.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.email && errors.email ? errors.email : ''}
                  required
                />

                <Input
                  id="password"
                  name="password"
                  type="password"
                  label="Password"
                  placeholder="Enter your password"
                  value={values.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.password && errors.password ? errors.password : ''}
                  required
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                disabled={loading || !isValid || !values.email || !values.password}
                loading={loading}
              >
                {loading ? 'Signing in...' : 'Sign In'}
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

        {/* Help Links */}
        <div className="mt-8 text-center">
          <p className="body-sm text-charcoal/60 mb-3">Need assistance?</p>
          <div className="flex justify-center gap-6">
            <Link to="/about" className="body-sm text-brown hover:text-brown/80 transition-colors">
              About Us
            </Link>
            <Link to="/contact" className="body-sm text-brown hover:text-brown/80 transition-colors">
              Contact Support
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
