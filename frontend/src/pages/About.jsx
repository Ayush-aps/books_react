/**
 * About Page - Premium Design
 * Information about Bookish platform with elevated styling
 */

import { motion } from 'framer-motion';
import { fadeInUp, staggerContainer, staggerItem, scrollReveal } from '../utils/animations';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';

const About = () => {
  const stats = [
    { label: 'Books Listed', value: '10,000+', color: 'brown' },
    { label: 'Active Users', value: '5,000+', color: 'green' },
    { label: 'Trusted Sellers', value: '1,200+', color: 'accent-brown' },
    { label: 'Orders Completed', value: '25,000+', color: 'success' }
  ];

  const values = [
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: 'Quality First',
      description: 'Every book is reviewed and verified before listing to ensure the highest quality for our customers.',
      color: 'brown'
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      title: 'Community Driven',
      description: 'Built by book lovers, for book lovers. We foster a vibrant community of readers and sellers.',
      color: 'green'
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      title: 'Fast & Reliable',
      description: 'Quick processing, secure payments, and reliable shipping to get books to you as fast as possible.',
      color: 'info'
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: 'Fair Pricing',
      description: 'Competitive prices for buyers and fair commissions for sellers, making the marketplace work for everyone.',
      color: 'warning'
    }
  ];

  const buyerSteps = [
    {
      number: 1,
      title: 'Browse Books',
      description: 'Search through thousands of books across all genres'
    },
    {
      number: 2,
      title: 'Add to Cart',
      description: 'Select your books and proceed to checkout'
    },
    {
      number: 3,
      title: 'Secure Payment',
      description: 'Pay safely using our secure payment system'
    },
    {
      number: 4,
      title: 'Enjoy Reading',
      description: 'Receive your books and start reading!'
    }
  ];

  const sellerSteps = [
    {
      number: 1,
      title: 'Create Account',
      description: 'Sign up as a seller in minutes'
    },
    {
      number: 2,
      title: 'List Your Books',
      description: 'Upload book details and set your prices'
    },
    {
      number: 3,
      title: 'Manage Orders',
      description: 'Process orders and ship books to buyers'
    },
    {
      number: 4,
      title: 'Earn Money',
      description: 'Receive payments for your sales'
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
          <div className="absolute -top-1/2 -right-1/4 w-96 h-96 bg-brown/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-1/2 -left-1/4 w-96 h-96 bg-green/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <motion.div 
            className="text-center"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={staggerItem} className="mb-6">
              <Badge variant="outline" className="border-cream/50 bg-transparent" style={{ color: '#F5F1E8' }}>
                Est. 2024
              </Badge>
            </motion.div>
            
            <motion.h1 
              variants={staggerItem}
              className="font-serif font-bold text-5xl md:text-6xl lg:text-7xl leading-tight tracking-tight mb-6"
              style={{ color: '#F5F1E8' }}
            >
              About Bookish
            </motion.h1>
            
            <motion.p 
              variants={staggerItem}
              className="text-lg md:text-xl max-w-3xl mx-auto"
              style={{ color: '#C4B5A0' }}
            >
              Connecting book lovers worldwide through a trusted marketplace for buying and selling books.
            </motion.p>
          </motion.div>
        </div>
      </motion.div>

      {/* Stats Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12">
        <motion.div 
          className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {stats.map((stat, index) => (
            <motion.div key={index} variants={staggerItem}>
              <Card elevated hoverable className="text-center p-6 md:p-8">
                <p className={`text-4xl md:text-5xl font-serif font-bold text-${stat.color} mb-2`}>
                  {stat.value}
                </p>
                <p className="body text-text-secondary">{stat.label}</p>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Mission Section */}
      <motion.div 
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24"
        variants={scrollReveal}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <Card className="p-8 md:p-12">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="heading-2 mb-8">Our Mission</h2>
            <p className="body-lg text-text-secondary leading-relaxed mb-6">
              At Bookish, we believe that every book has a story beyond its pages. Our mission is to create a 
              trusted platform where readers can discover their next favorite book and sellers can reach a 
              community of passionate book lovers.
            </p>
            <p className="body-lg text-text-secondary leading-relaxed">
              Whether you're looking for a rare first edition, a popular bestseller, or want to give your 
              beloved books a new home, Bookish is here to make it happen. We're more than just a marketplace—we're 
              a community that celebrates the joy of reading.
            </p>
          </div>
        </Card>
      </motion.div>

      {/* Values Section */}
      <div className="bg-white py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <h2 className="heading-2 mb-4">Our Values</h2>
            <p className="body-lg text-text-secondary max-w-2xl mx-auto">
              These core principles guide everything we do at Bookish
            </p>
          </motion.div>

          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {values.map((value, index) => (
              <motion.div key={index} variants={staggerItem}>
                <Card hoverable className="text-center h-full p-6">
                  <div className={`w-16 h-16 bg-${value.color}/10 rounded-full flex items-center justify-center mx-auto mb-6 text-${value.color}`}>
                    {value.icon}
                  </div>
                  <h3 className="heading-4 mb-4">{value.title}</h3>
                  <p className="body text-text-secondary">{value.description}</p>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* How It Works */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <motion.div 
          className="text-center mb-16"
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <h2 className="heading-2 mb-4">How It Works</h2>
          <p className="body-lg text-text-secondary max-w-2xl mx-auto">
            Getting started with Bookish is easy, whether you're buying or selling
          </p>
        </motion.div>

        <motion.div 
          className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {/* For Buyers */}
          <motion.div variants={staggerItem}>
            <Card elevated className="h-full">
              <Card.Header className="flex items-center gap-3 border-b border-border pb-6">
                <div className="w-12 h-12 bg-green/10 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                <h3 className="heading-3">For Buyers</h3>
              </Card.Header>

              <Card.Body>
                <div className="space-y-6">
                  {buyerSteps.map((step) => (
                    <div key={step.number} className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-green/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="heading-5 text-green">{step.number}</span>
                      </div>
                      <div>
                        <h4 className="heading-5 mb-2">{step.title}</h4>
                        <p className="body text-text-secondary">{step.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card.Body>
            </Card>
          </motion.div>

          {/* For Sellers */}
          <motion.div variants={staggerItem}>
            <Card elevated className="h-full">
              <Card.Header className="flex items-center gap-3 border-b border-border pb-6">
                <div className="w-12 h-12 bg-brown/10 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-brown" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="heading-3">For Sellers</h3>
              </Card.Header>

              <Card.Body>
                <div className="space-y-6">
                  {sellerSteps.map((step) => (
                    <div key={step.number} className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-brown/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="heading-5 text-brown">{step.number}</span>
                      </div>
                      <div>
                        <h4 className="heading-5 mb-2">{step.title}</h4>
                        <p className="body text-text-secondary">{step.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card.Body>
            </Card>
          </motion.div>
        </motion.div>
      </div>

      {/* CTA Section */}
      <motion.div 
        className="relative bg-charcoal text-cream py-24 overflow-hidden"
        variants={fadeInUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        {/* Decorative Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-brown/20 to-green/20 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-serif font-bold text-4xl md:text-5xl leading-tight mb-6" style={{ color: '#F5F1E8' }}>
            Join Our Community Today
          </h2>
          <p className="text-lg md:text-xl mb-10" style={{ color: '#C4B5A0' }}>
            Whether you're buying or selling, Bookish is the perfect place to connect with fellow book enthusiasts.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              variant="outline" 
              size="lg"
              className="bg-white text-charcoal hover:bg-cream border-white"
            >
              Get Started
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              className="text-cream border-cream hover:bg-white/10"
            >
              Contact Us
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default About;
