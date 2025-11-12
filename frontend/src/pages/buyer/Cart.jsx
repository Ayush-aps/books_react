/**
 * Shopping Cart Page (Buyer)
 * Display cart items, update quantity, remove items
 */

import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { getCart, updateCartItem, removeFromCart, clearCart } from '../../redux/actions/cartActions';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useState, useEffect } from 'react';

const Cart = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items } = useSelector(state => state.cart);
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

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>
          
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <svg
              className="mx-auto h-24 w-24 text-gray-300 mb-4"
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
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Your cart is empty</h2>
            <p className="text-gray-600 mb-6">Add some books to get started!</p>
            <Link
              to="/buyer/browse"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Browse Books
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
          <button
            onClick={() => setShowClearDialog(true)}
            className="text-red-600 hover:text-red-800 font-medium"
          >
            Clear Cart
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => {
              const book = item.book || item;
              const bookId = book._id || item._id;
              const discountedPrice = book.discountPrice || item.price || book.price;
              const originalPrice = book.price || item.price;
              const hasDiscount = discountedPrice < originalPrice;

              return (
                <div key={item._id} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex gap-6">
                    {/* Book Image */}
                    <Link to={`/buyer/book/${bookId}`} className="flex-shrink-0">
                      <img
                        src={book.coverImage || '/placeholder-book.png'}
                        alt={book.title}
                        className="w-24 h-32 object-cover rounded"
                      />
                    </Link>

                    {/* Book Info */}
                    <div className="flex-1">
                      <Link 
                        to={`/buyer/book/${bookId}`}
                        className="text-lg font-semibold text-gray-900 hover:text-blue-600"
                      >
                        {book.title}
                      </Link>
                      <p className="text-gray-600 mt-1">{book.author}</p>
                      <p className="text-sm text-gray-500 mt-1 capitalize">{book.condition}</p>

                      {/* Price */}
                      <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-xl font-bold text-gray-900">
                          ₹{discountedPrice?.toFixed(2) || '0.00'}
                        </span>
                        {hasDiscount && (
                          <span className="text-sm text-gray-500 line-through">
                            ₹{originalPrice?.toFixed(2) || '0.00'}
                          </span>
                        )}
                      </div>

                      {/* Quantity and Remove */}
                      <div className="mt-4 flex items-center gap-4">
                        <div className="flex items-center border border-gray-300 rounded">
                          <button
                            onClick={() => handleUpdateQuantity(item._id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                            className="px-3 py-1 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            −
                          </button>
                          <span className="px-4 py-1 border-x border-gray-300">{item.quantity}</span>
                          <button
                            onClick={() => handleUpdateQuantity(item._id, item.quantity + 1)}
                            disabled={item.quantity >= item.stock}
                            className="px-3 py-1 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            +
                          </button>
                        </div>

                        <button
                          onClick={() => handleRemoveItem(item._id)}
                          className="text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                          Remove
                        </button>
                      </div>
                    </div>

                    {/* Item Total */}
                    <div className="text-right">
                      <p className="text-xl font-bold text-gray-900">
                        ₹{(discountedPrice * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h2>
              
              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal ({items.length} {items.length === 1 ? 'item' : 'items'})</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Tax (8%)</span>
                  <span>₹{tax.toFixed(2)}</span>
                </div>
                <div className="border-t border-gray-200 pt-3 flex justify-between text-lg font-bold text-gray-900">
                  <span>Total</span>
                  <span>₹{total.toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Proceed to Checkout
              </button>

              <Link
                to="/buyer/browse"
                className="block text-center mt-4 text-blue-600 hover:text-blue-800 font-medium"
              >
                Continue Shopping
              </Link>
            </div>
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
