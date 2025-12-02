/**
 * Shopping Cart Page (Buyer)
 * Display cart items, update quantity, remove items
 */

import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getCart, updateCartItem, removeFromCart, clearCart, saveForLater, moveToCart, removeFromSaved } from '../../redux/actions/cartActions';
import ConfirmDialog from '../../components/ConfirmDialog';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import { useState, useEffect } from 'react';
import { fadeInUp, staggerContainer, staggerItem } from '../../utils/animations';
import { roundPrice } from '../../utils/priceUtils';

const Cart = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, savedItems } = useSelector(state => state.cart);
  const { user } = useSelector(state => state.auth);
  const [showClearDialog, setShowClearDialog] = useState(false);

  useEffect(() => {
    // Fetch cart when component mounts
    dispatch(getCart());
  }, [dispatch]);

  const calculateSubtotal = () => {
    return items.reduce((total, item) => {
      const book = item.book || item;
      const price = book.discountPrice || item.price || book.price || 0;
      return total + (price * item.quantity);
    }, 0);
  };

  const handleUpdateQuantity = (bookId, newQuantity) => {
    if (newQuantity < 1) return;
    dispatch(updateCartItem(bookId, newQuantity));
  };

  const handleRemoveItem = (bookId) => {
    dispatch(removeFromCart(bookId));
  };

  const handleSaveForLater = (bookId) => {
    dispatch(saveForLater(bookId));
  };

  const handleMoveToCart = (bookId) => {
    dispatch(moveToCart(bookId));
  };

  const handleRemoveFromSaved = (bookId) => {
    dispatch(removeFromSaved(bookId));
  };

  const handleClearCart = () => {
    dispatch(clearCart());
    setShowClearDialog(false);
  };

  const handleCheckout = () => {
    if (!user) {
      navigate('/login', { state: { from: '/buyer/cart' } });
      return;
    }
    navigate('/buyer/checkout');
  };

  const subtotal = calculateSubtotal();
  const tax = subtotal * 0.08; // 8% tax
  const total = subtotal + tax;

  if (items.length === 0 && (!savedItems || savedItems.length === 0)) {
    return (
      <div className="min-h-screen bg-background-primary py-12">
        <div className="container-custom">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="heading-1 mb-12"
          >
            Shopping Cart
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Card elevated padding="lg" className="text-center py-16">
              <svg
                className="mx-auto h-24 w-24 text-text-tertiary mb-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <h2 className="heading-2 mb-3">Your cart is empty</h2>
              <p className="body-lg text-text-secondary mb-8">Add some books to get started!</p>
              <Link to="/buyer/browse">
                <button
                  type="button"
                  className="text-white text-base rounded-lg transition-all duration-300 hover:scale-105 hover:brightness-110 focus:outline-none shadow-sm hover:shadow-md whitespace-nowrap"
                  style={{
                    backgroundColor: '#8B7355',
                    padding: '0.625rem 1.5rem',
                    border: '1px solid transparent',
                    lineHeight: '1.5',
                    height: '50px',
                    fontWeight: '500'
                  }}
                >
                  Browse Books
                  <svg className="w-5 h-5 ml-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </button>
              </Link>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-primary py-12">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-12"
        >
          <div>
            <h1 className="heading-1 mb-2">Shopping Cart</h1>
            <p className="body-lg text-text-secondary">
              Review and manage your selected items
            </p>
          </div>
          {items.length > 0 && (
            <Button
              onClick={() => setShowClearDialog(true)}
              variant="outline"
              size="md"
              className="text-error border-error hover:bg-error/10"
            >
              Clear Cart
            </Button>
          )}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-8">
            {items.length > 0 ? (
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="space-y-4"
              >
                {items.map((item) => {
                  const book = item.book || item;
                  const bookId = book._id || item._id;
                  const discountedPrice = book.discountPrice || item.price || book.price;
                  const originalPrice = book.price || item.price;
                  const hasDiscount = discountedPrice < originalPrice;

                  return (
                    <motion.div key={item._id} variants={staggerItem}>
                      <Card elevated padding="lg">
                        <div className="flex gap-6">
                          {/* Book Image */}
                          <Link to={`/buyer/book/${bookId}`} className="flex-shrink-0">
                            <img
                              src={book.coverImage || '/placeholder-book.png'}
                              alt={book.title}
                              className="w-24 h-32 object-cover rounded-lg"
                            />
                          </Link>

                          {/* Book Info */}
                          <div className="flex-1">
                            <Link
                              to={`/buyer/book/${bookId}`}
                              className="heading-4 hover:text-accent-brown transition-colors"
                            >
                              {book.title}
                            </Link>
                            <p className="text-text-secondary mt-1 body">{book.author}</p>
                            <Badge variant={book.condition === 'new' ? 'success' : 'brown'} size="sm" className="mt-2">
                              {book.condition}
                            </Badge>

                            {/* Price */}
                            <div className="mt-4 flex items-baseline gap-2">
                              <span className="text-xl font-bold text-text-primary">
                                ₹{roundPrice(discountedPrice) || '0'}
                              </span>
                              {hasDiscount && (
                                <span className="text-sm text-text-tertiary line-through">
                                  ₹{roundPrice(originalPrice) || '0'}
                                </span>
                              )}
                            </div>

                            {/* Quantity and Actions */}
                            <div className="mt-4 flex flex-wrap items-center gap-4">
                              <div className="flex items-center border border-border-primary rounded-lg overflow-hidden">
                                <button
                                  onClick={() => handleUpdateQuantity(item._id, item.quantity - 1)}
                                  disabled={item.quantity <= 1}
                                  className="px-4 py-2 text-text-primary hover:bg-background-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                  −
                                </button>
                                <span className="px-4 py-2 border-x border-border-primary font-medium">{item.quantity}</span>
                                <button
                                  onClick={() => handleUpdateQuantity(item._id, item.quantity + 1)}
                                  disabled={item.quantity >= item.stock}
                                  className="px-4 py-2 text-text-primary hover:bg-background-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                  +
                                </button>
                              </div>

                              <div className="flex items-center gap-3">
                                <button
                                  onClick={() => handleSaveForLater(item._id)}
                                  className="text-accent-brown hover:text-accent-brown-hover text-sm font-medium transition-colors"
                                >
                                  Save for Later
                                </button>
                                <span className="text-border-primary">|</span>
                                <button
                                  onClick={() => handleRemoveItem(item._id)}
                                  className="text-error hover:text-error/80 text-sm font-medium transition-colors"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Item Total */}
                          <div className="text-right">
                            <p className="text-xl font-bold text-text-primary">
                              ₹{roundPrice(discountedPrice * item.quantity)}
                            </p>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </motion.div>
            ) : (
              <Card padding="lg" className="text-center py-12 bg-background-secondary/50 border-dashed">
                <p className="text-text-secondary mb-4">Your cart is empty</p>
                <Link to="/buyer/browse">
                  <Button variant="outline" size="sm">Browse Books</Button>
                </Link>
              </Card>
            )}

            {/* Saved for Later Section */}
            {savedItems && savedItems.length > 0 && (
              <div className="mt-12">
                <h2 className="heading-3 mb-6">Saved for Later ({savedItems.length})</h2>
                <motion.div
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                  className="space-y-4"
                >
                  {savedItems.map((item) => {
                    const book = item.book || item;
                    const bookId = book._id || item._id;
                    const discountedPrice = book.discountPrice || item.price || book.price;
                    const originalPrice = book.price || item.price;
                    const hasDiscount = discountedPrice < originalPrice;

                    return (
                      <motion.div key={item._id} variants={staggerItem}>
                        <Card padding="lg" className="bg-background-secondary/30">
                          <div className="flex gap-6">
                            {/* Book Image */}
                            <Link to={`/buyer/book/${bookId}`} className="flex-shrink-0">
                              <img
                                src={book.coverImage || '/placeholder-book.png'}
                                alt={book.title}
                                className="w-20 h-28 object-cover rounded-lg opacity-90"
                              />
                            </Link>

                            {/* Book Info */}
                            <div className="flex-1">
                              <Link
                                to={`/buyer/book/${bookId}`}
                                className="heading-5 hover:text-accent-brown transition-colors"
                              >
                                {book.title}
                              </Link>
                              <p className="text-text-secondary mt-1 body-sm">{book.author}</p>

                              {/* Price */}
                              <div className="mt-2 flex items-baseline gap-2">
                                <span className="text-lg font-bold text-text-primary">
                                  ₹{roundPrice(discountedPrice) || '0'}
                                </span>
                                {hasDiscount && (
                                  <span className="text-xs text-text-tertiary line-through">
                                    ₹{roundPrice(originalPrice) || '0'}
                                  </span>
                                )}
                              </div>

                              {/* Actions */}
                              <div className="mt-4 flex items-center gap-4">
                                <Button
                                  onClick={() => handleMoveToCart(item._id)}
                                  variant="outline"
                                  size="sm"
                                >
                                  Move to Cart
                                </Button>
                                <button
                                  onClick={() => handleRemoveFromSaved(item._id)}
                                  className="text-error hover:text-error/80 text-sm font-medium transition-colors"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    );
                  })}
                </motion.div>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="sticky top-24"
            >
              <Card elevated padding="lg">
                <h2 className="heading-3 mb-6">Order Summary</h2>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between body text-text-secondary">
                    <span>Subtotal ({items.length} {items.length === 1 ? 'item' : 'items'})</span>
                    <span className="font-medium text-text-primary">₹{roundPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between body text-text-secondary">
                    <span>Tax (8%)</span>
                    <span className="font-medium text-text-primary">₹{roundPrice(tax)}</span>
                  </div>
                  <div className="border-t border-border-primary pt-4 flex justify-between">
                    <span className="heading-4">Total</span>
                    <span className="heading-3 text-accent-brown">₹{roundPrice(total)}</span>
                  </div>
                </div>

                <Button
                  onClick={handleCheckout}
                  variant="primary"
                  size="lg"
                  fullWidth
                  className="mb-4"
                  disabled={items.length === 0}
                >
                  Proceed to Checkout
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Button>

                <Link to="/buyer/browse">
                  <Button variant="ghost" size="md" fullWidth>
                    Continue Shopping
                  </Button>
                </Link>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Clear Cart Confirmation */}
      <ConfirmDialog
        isOpen={showClearDialog}
        onClose={() => setShowClearDialog(false)}
        onConfirm={handleClearCart}
        title="Clear Cart"
        message="Are you sure you want to remove all items from your cart?"
        confirmText="Clear Cart"
        type="danger"
      />
    </div>
  );
};

export default Cart;
