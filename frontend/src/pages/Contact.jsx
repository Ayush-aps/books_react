/**
 * Contact Page - Premium Design
 * Contact form and company information with elevated styling
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { contactSchema } from '../schemas/allFormSchemas';
import { motion } from 'framer-motion';
import { fadeInUp, staggerContainer, staggerItem } from '../utils/animations';
import api from '../services/api';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import ErrorMessage from '../components/ErrorMessage';
import SuccessToast from '../components/SuccessToast';

const Contact = () => {
  const [error, setError] = useState(null);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // React Hook Form setup
  const { register, handleSubmit, formState: { errors, isSubmitting, isValid }, reset } = useForm({
    resolver: zodResolver(contactSchema),
    mode: 'onChange',
    defaultValues: { name: '', email: '', subject: '', message: '' }
  });

  const onSubmit = async (formData) => {
    setError(null);

    try {
      await api.post('/public/contact', formData);

      // Reset form
      reset();

      setShowSuccessToast(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send message. Please try again.');
    }
  };

  const contactInfo = [
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      title: 'Email',
      content: (
        <a href="mailto:support@bookish.com" className="text-brown hover:text-accent-brown transition-colors">
          support@bookish.com
        </a>
      ),
      color: 'brown'
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
      ),
      title: 'Phone',
      content: (
        <a href="tel:+1234567890" className="text-brown hover:text-accent-brown transition-colors">
          +1 (234) 567-890
        </a>
      ),
      color: 'green'
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      title: 'Address',
      content: (
        <p className="text-text-secondary">
          123 Book Street<br />
          Reading City, RC 12345<br />
          United States
        </p>
      ),
      color: 'info'
    }
  ];

  const faqs = [
    {
      question: 'How do I create an account?',
      answer: 'Click on "Sign Up" in the navigation bar and fill in your details. You can choose to register as a buyer or seller.'
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards, debit cards, and offer secure payment processing through Stripe.'
    },
    {
      question: 'How long does shipping take?',
      answer: 'Shipping times vary by seller and location. Typically, orders are processed within 1-2 business days and delivered within 5-7 business days.'
    },
    {
      question: 'Can I return a book?',
      answer: 'Yes, we offer a 14-day return policy. Books must be in the same condition as when received. Contact the seller for return instructions.'
    },
    {
      question: 'How do I become a seller?',
      answer: 'Sign up for an account and select "Seller" as your account type. Once approved, you can start listing your books immediately.'
    },
    {
      question: 'What are the seller fees?',
      answer: (
        <>
          We charge a small commission on each sale. Visit our <a href="/pricing" className="text-brown hover:text-accent-brown">Pricing</a> page for detailed information.
        </>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-cream">
      {/* Hero Section */}
      <motion.div
        className="relative bg-charcoal text-cream overflow-hidden pt-20"
        initial="initial"
        animate="animate"
        variants={fadeInUp}
      >
        {/* Decorative Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/4 -right-1/4 w-96 h-96 bg-brown/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-1/4 -left-1/4 w-96 h-96 bg-green/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-24">
          <motion.div
            className="text-center"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            <motion.h1
              variants={staggerItem}
              className="font-serif font-bold text-5xl md:text-6xl lg:text-7xl leading-tight tracking-tight mb-4"
              style={{ color: '#F5F1E8' }}
            >
              Contact Us
            </motion.h1>
            <motion.p
              variants={staggerItem}
              className="text-lg md:text-xl max-w-2xl mx-auto"
              style={{ color: '#C4B5A0' }}
            >
              Have a question or need assistance? We're here to help!
            </motion.p>
          </motion.div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {/* Contact Info Sidebar */}
          <motion.div variants={staggerItem} className="lg:col-span-1 space-y-6">
            {/* Contact Info Cards */}
            <Card elevated>
              <Card.Header>
                <h2 className="heading-3">Get in Touch</h2>
              </Card.Header>
              <Card.Body className="space-y-6">
                {contactInfo.map((info, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <div className={`w-12 h-12 bg-${info.color}/10 rounded-full flex items-center justify-center flex-shrink-0 text-${info.color}`}>
                      {info.icon}
                    </div>
                    <div>
                      <h3 className="heading-5 mb-1">{info.title}</h3>
                      <div className="body">{info.content}</div>
                    </div>
                  </div>
                ))}
              </Card.Body>
            </Card>

            {/* Business Hours */}
            <Card>
              <Card.Header>
                <h2 className="heading-4">Business Hours</h2>
              </Card.Header>
              <Card.Body className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="body text-text-secondary">Monday - Friday</span>
                  <span className="body-sm font-medium">9:00 AM - 6:00 PM</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="body text-text-secondary">Saturday</span>
                  <span className="body-sm font-medium">10:00 AM - 4:00 PM</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="body text-text-secondary">Sunday</span>
                  <span className="body-sm font-medium">Closed</span>
                </div>
              </Card.Body>
            </Card>
          </motion.div>

          {/* Contact Form */}
          <motion.div variants={staggerItem} className="lg:col-span-2">
            <Card elevated>
              <Card.Header>
                <h2 className="heading-3">Send Us a Message</h2>
              </Card.Header>

              <Card.Body>
                {error && (
                  <div className="mb-6">
                    <ErrorMessage message={error} />
                  </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                      type="text"
                      id="name"
                      label="Your Name"
                      {...register('name')}
                      error={errors.name?.message}
                      placeholder="John Doe"
                    />

                    <Input
                      type="email"
                      id="email"
                      label="Email Address"
                      {...register('email')}
                      error={errors.email?.message}
                      placeholder="john@example.com"
                    />
                  </div>

                  <Input
                    type="text"
                    id="subject"
                    label="Subject"
                    {...register('subject')}
                    error={errors.subject?.message}
                    placeholder="How can we help you?"
                  />

                  <Input.Textarea
                    id="message"
                    label="Message"
                    {...register('message')}
                    error={errors.message?.message}
                    placeholder="Please describe your inquiry in detail... (min 20 characters)"
                    rows={6}
                  />

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    disabled={isSubmitting || !isValid}
                    loading={isSubmitting}
                    className="w-full"
                  >
                    Send Message
                  </Button>
                </form>
              </Card.Body>
            </Card>
          </motion.div>
        </motion.div>
      </div>

      {/* FAQ Section */}
      <div className="bg-white py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-12"
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <h2 className="heading-2 mb-4">Frequently Asked Questions</h2>
            <p className="body-lg text-text-secondary">Find quick answers to common questions</p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {faqs.map((faq, index) => (
              <motion.div key={index} variants={staggerItem}>
                <Card hoverable className="h-full">
                  <Card.Body>
                    <h3 className="heading-5 mb-3">{faq.question}</h3>
                    <p className="body text-text-secondary">{faq.answer}</p>
                  </Card.Body>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Success Toast */}
      {showSuccessToast && (
        <SuccessToast
          message="Message sent successfully! We'll get back to you soon."
          onClose={() => setShowSuccessToast(false)}
          duration={5000}
        />
      )}
    </div>
  );
};

export default Contact;
