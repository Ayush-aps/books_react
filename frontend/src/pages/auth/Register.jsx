/**
 * Register Page
 */

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../../redux/actions/authActions';
import useFormValidation from '../../hooks/useFormValidation';
import { validateEmail, validatePassword, validateRequired, validateMatch } from '../../utils/validation';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Input from '../../components/Input';
import ErrorMessage from '../../components/ErrorMessage';
import { motion } from 'framer-motion';
import { fadeInUp } from '../../utils/animations';

const Register = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading, registerErrors, isAuthenticated, user } = useSelector(state => state.auth);

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated && user) {
      const role = user.role;
      navigate(role === 'admin' ? '/admin/dashboard' : role === 'seller' ? '/seller/dashboard' : '/buyer/dashboard');
    }
  }, [isAuthenticated, user, navigate]);

  // Validation schema
  const validationSchema = {
    name: (value) => validateRequired(value, 'Full Name'),
    email: (value) => validateEmail(value),
    password: (value) => validatePassword(value),
    password2: (value, allValues) => validateMatch(allValues.password, value, 'Passwords'),
    role: (value) => validateRequired(value, 'Role'),
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
    { name: '', email: '', password: '', password2: '', role: 'buyer' },
    validationSchema
  );

  const onSubmit = async (formData) => {
    const result = await dispatch(register(formData));

    if (result.success) {
      navigate('/login');
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
            Join Our Community
          </h2>
          <p className="body text-charcoal/70">
            Create your account to start exploring
          </p>
        </div>

        {/* Register Card */}
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
                  name="name"
                  type="text"
                  label="Full Name"
                  placeholder="Enter your full name"
                  value={values.name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.name && errors.name ? errors.name : ''}
                  required
                />

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
                  placeholder="Create a password"
                  value={values.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.password && errors.password ? errors.password : ''}
                  helpText="At least 6 characters with 1 letter and 1 number"
                  required
                />

                <Input
                  id="password2"
                  name="password2"
                  type="password"
                  label="Confirm Password"
                  placeholder="Confirm your password"
                  value={values.password2}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.password2 && errors.password2 ? errors.password2 : ''}
                  required
                />

                <Input.Select
                  id="role"
                  name="role"
                  label="Register As"
                  value={values.role}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                >
                  <option value="buyer">Buyer - Browse and purchase books</option>
                  <option value="seller">Seller - List and sell books</option>
                </Input.Select>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                disabled={loading || !isValid}
                loading={loading}
              >
                {loading ? 'Creating account...' : 'Create Account'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="body-sm text-charcoal/70">
                Already have an account?{' '}
                <Link to="/login" className="text-brown hover:text-brown/80 font-semibold transition-colors">
                  Sign in
                </Link>
              </p>
            </div>
          </Card.Body>
        </Card>

        {/* Help Links */}
        <div className="mt-8 text-center">
          <p className="body-sm text-charcoal/60 mb-3">Need help?</p>
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

export default Register;
