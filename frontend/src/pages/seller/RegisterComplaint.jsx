/**
 * Register Complaint Page (Seller)
 * Form to submit new platform-related complaints
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import api from '../../services/api';
import Card from '../../components/Card';
import Button from '../../components/Button';
import ErrorMessage from '../../components/ErrorMessage';
import { useToast } from '../../components/Toast';
import { fadeInUp } from '../../utils/animations';
import { complaintSchema } from '../../schemas/allFormSchemas';

const RegisterComplaint = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [error, setError] = useState(null);

  const categories = [
    'Payment Issue',
    'Platform Fee Dispute',
    'Buyer Issue',
    'Account Issue',
    'Technical Problem',
    'Policy Violation Report',
    'Other'
  ];

  // Auto-assign priority based on category
  const priorityLevels = {
    'Payment Issue': 'urgent',
    'Account Issue': 'high',
    'Technical Problem': 'high',
    'Platform Fee Dispute': 'medium',
    'Buyer Issue': 'medium',
    'Policy Violation Report': 'medium',
    'Other': 'medium'
  };

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(complaintSchema),
    mode: 'onTouched',
    defaultValues: {
      subject: '',
      category: '',
      description: ''
    }
  });

  const descriptionValue = watch('description', '');
  const categoryValue = watch('category', '');

  const onSubmit = async (data) => {
    try {
      setError(null);

      const complaintData = {
        ...data,
        priority: priorityLevels[data.category] || 'medium'
      };

      await api.post('/seller/complaints', complaintData);

      // Show success toast
      toast.success('Complaint registered successfully! We will review it and get back to you soon.', 5000);
      
      // Redirect to complaints page
      navigate('/seller/complaints');
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to submit complaint';
      setError(errorMessage);
      toast.error(errorMessage, 5000);
    }
  };

  return (
    <div className="min-h-screen bg-cream py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div variants={fadeInUp} initial="hidden" animate="visible">
          {/* Header */}
          <div className="mb-8">
            <h1 className="heading-2 text-charcoal mb-2">Register Complaint</h1>
            <p className="body text-charcoal/60">
              Submit a platform-related issue or concern
            </p>
          </div>

          {/* Info Banner */}
          <Card className="mb-6 bg-blue-50 border-blue-200">
            <Card.Body>
              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  <svg
                    className="w-6 h-6 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="heading-6 text-blue-900 mb-2">Before You Submit</h3>
                  <ul className="body-sm text-blue-800 space-y-1 list-disc list-inside">
                    <li>Provide clear and detailed information about your issue</li>
                    <li>Select the most appropriate category for faster resolution</li>
                    <li>You'll be able to track your complaint status and add comments</li>
                    <li>Our admin team will respond within 24-48 hours</li>
                  </ul>
                </div>
              </div>
            </Card.Body>
          </Card>

          {/* Error Display */}
          {error && (
            <div className="mb-6">
              <ErrorMessage message={error} onClose={() => setError(null)} />
            </div>
          )}

          {/* Form */}
          <Card>
            <Card.Body>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Subject */}
                <div>
                  <label htmlFor="subject" className="form-label">
                    Subject <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="subject"
                    {...register("subject")}
                    className={`form-control ${errors.subject ? 'border-red-500' : ''}`}
                    placeholder="Brief summary of your issue"
                    disabled={isSubmitting}
                  />
                  {errors.subject && (
                    <p className="form-error">{errors.subject.message}</p>
                  )}
                </div>

                {/* Category */}
                <div>
                  <label htmlFor="category" className="form-label">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="category"
                    {...register("category")}
                    className={`form-control ${errors.category ? 'border-red-500' : ''}`}
                    disabled={isSubmitting}
                  >
                    <option value="">Select a category</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                        {priorityLevels[category] && (
                          ` (${priorityLevels[category]} priority)`
                        )}
                      </option>
                    ))}
                  </select>
                  {errors.category && (
                    <p className="form-error">{errors.category.message}</p>
                  )}
                  {categoryValue && (
                    <p className="form-help text-blue-600 mt-1">
                      This will be marked as <strong>{priorityLevels[categoryValue]}</strong> priority
                    </p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="description" className="form-label">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="description"
                    {...register("description")}
                    rows="8"
                    className={`form-control resize-none ${errors.description ? 'border-red-500' : ''
                      }`}
                    placeholder="Provide detailed information about your issue:
- What happened?
- When did it occur?
- What were you trying to do?
- Any relevant transaction IDs or book details?"
                    disabled={isSubmitting}
                  />
                  {errors.description && (
                    <p className="form-error">{errors.description.message}</p>
                  )}
                  <p className="form-help mt-1">
                    {descriptionValue.length} / minimum 20 characters
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/seller/complaints')}
                    disabled={isSubmitting}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={isSubmitting}
                    isLoading={isSubmitting}
                    className="flex-1"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Complaint'}
                  </Button>
                </div>
              </form>
            </Card.Body>
          </Card>

          {/* Help Section */}
          <Card className="mt-6">
            <Card.Header>
              <h3 className="heading-6 text-charcoal">Need Immediate Help?</h3>
            </Card.Header>
            <Card.Body>
              <div className="space-y-3 body-sm text-charcoal/80">
                <p>
                  For urgent payment issues or account problems, you can also:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-2">
                  <li>
                    Email us directly at{' '}
                    <a href="mailto:support@bookstore.com" className="text-brown hover:underline">
                      support@bookstore.com
                    </a>
                  </li>
                  <li>
                    Check our{' '}
                    <a href="/seller/faq" className="text-brown hover:underline">
                      FAQ section
                    </a>{' '}
                    for common issues
                  </li>
                  <li>
                    Review the{' '}
                    <a href="/seller/policies" className="text-brown hover:underline">
                      Seller Policies
                    </a>{' '}
                    for platform guidelines
                  </li>
                </ul>
              </div>
            </Card.Body>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default RegisterComplaint;
