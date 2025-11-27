// src/pages/Register.jsx
/**
 * Register Page
 */

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { register as registerAction } from '../redux/actions/authActions'; // Renamed import to avoid conflict
import Button from '../components/Button';
import Card from '../components/Card';
import Input from '../components/Input';
import ErrorMessage from '../components/ErrorMessage';
import { motion } from 'framer-motion';
import { fadeInUp } from '../utils/animations';

// RHF and Zod Imports
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema } from '../schemas/authSchemas'; // Import the Zod schema

const Register = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading, registerErrors, isAuthenticated, user } = useSelector(state => state.auth);

  // RHF Setup
  const { 
    register, 
    handleSubmit, 
    formState: { errors, isValid, isSubmitting } 
  } = useForm({
    resolver: zodResolver(registerSchema), // Connects Zod validation
    mode: 'onTouched',
    defaultValues: { name: '', email: '', password: '', password2: '', role: 'buyer' }
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
    // RHF guarantees data is valid based on registerSchema
    const result = await dispatch(registerAction(data));

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
        {/* Header structure remains the same */}
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
                  name="name"
                  type="text"
                  label="Full Name"
                  placeholder="Enter your full name"
                  required
                  {...register("name")}
                  error={errors.name?.message}
                />

                <Input
                  id="email"
                  name="email"
                  type="email"
                  label="Email Address"
                  placeholder="Enter your email"
                  required
                  {...register("email")}
                  error={errors.email?.message}
                />

                <Input
                  id="password"
                  name="password"
                  type="password"
                  label="Password"
                  placeholder="Create a password"
                  required
                  {...register("password")}
                  error={errors.password?.message}
                  helpText="Min 8 characters, with Uppercase, Lowercase, Number, and Special Character."
                />

                <Input
                  id="password2"
                  name="password2"
                  type="password"
                  label="Confirm Password"
                  placeholder="Confirm your password"
                  required
                  {...register("password2")}
                  error={errors.password2?.message}
                />

                <Input.Select
                  id="role"
                  name="role"
                  label="Register As"
                  required
                  {...register("role")}
                  error={errors.role?.message}
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
                disabled={loading || isSubmitting || !isValid}
                loading={loading || isSubmitting}
              >
                {loading || isSubmitting ? 'Creating account...' : 'Create Account'}
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
        {/* Help Links remain the same */}
      </motion.div>
    </div>
  );
};

export default Register;