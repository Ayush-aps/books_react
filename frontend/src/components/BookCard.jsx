/**
 * Book Card Component
 * Display a book in a card format
 */

import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { roundPrice } from '../utils/priceUtils';

const BookCard = ({ book, onAddToCart, compact = false }) => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useSelector(state => state.auth);
  const effectivePrice = book.discountPrice || book.price;
  const hasDiscount = book.discountPrice && book.discountPrice < book.price;
  const isBuyer = !isAuthenticated || (user && user.role === 'buyer');
  const isSeller = user && user.role === 'seller';
  const isAdmin = user && user.role === 'admin';

  // Determine the correct details path based on role
  // Determine the correct details path based on role
  let detailsPath = `/buyer/book/${book._id}`;
  if (isSeller) {
    // Check if the current user is the seller of this book
    const isOwner = book.seller && (
      (typeof book.seller === 'object' && book.seller._id === user?._id) ||
      (typeof book.seller === 'string' && book.seller === user?._id)
    );

    if (isOwner) {
      detailsPath = `/seller/books/${book._id}`; // Manage book
    } else {
      detailsPath = `/seller/view-book/${book._id}`; // View only
    }
  } else if (isAdmin) {
    detailsPath = `/admin/view-book/${book._id}`;
  }

  const handleAddToCartClick = (e) => {
    e.preventDefault(); // Prevent link navigation if wrapped in Link
    if (!isAuthenticated) {
      // Redirect to login if not authenticated
      navigate('/login', { state: { from: window.location.pathname } });
      return;
    }
    // Call the parent's onAddToCart handler if authenticated
    if (onAddToCart) {
      onAddToCart(book._id);
    }
  };

  const handleViewClick = (e) => {
    // If wrapped in a Link, this might be redundant but safe
    e.preventDefault();
    navigate(detailsPath);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-300 h-full flex flex-col">
      <Link to={detailsPath} className="block">
        <div className={`relative ${compact ? 'pb-[135%]' : 'pb-[140%]'} bg-gray-50`}>
          <img
            src={book.coverImage || 'https://via.placeholder.com/300x420?text=No+Cover'}
            alt={book.title}
            className="absolute inset-0 w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
          {hasDiscount && (
            <div className={`absolute top-2 right-2 bg-red-500 text-white rounded font-bold shadow-sm ${compact ? 'px-2 py-1 text-[10px]' : 'px-2 py-1 text-xs'}`}>
              {Math.round(((book.price - book.discountPrice) / book.price) * 100)}% OFF
            </div>
          )}
          {(book.approvalStatus === 'pending' || book.approvalStatus === 'rejected') && (
            <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded text-xs font-bold">
              Pending
            </div>
          )}
          {book.stock === 0 && (
            <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
              <span className={`text-white font-bold ${compact ? 'text-xs' : 'text-sm'}`}>Out of Stock</span>
            </div>
          )}
          {book.stock > 0 && book.stock <= 5 && (
            <div className="absolute top-2 left-2 bg-gray-100 text-black px-2 py-1 rounded text-xs font-bold shadow-sm">
              Only {book.stock} left
            </div>
          )}
        </div>
      </Link>

      <div className={`flex flex-col flex-grow ${compact ? 'p-3' : 'p-4'}`}>
        <Link to={detailsPath} className="block mb-1">
          <h3 className={`font-semibold text-gray-900 hover:text-accent-brown line-clamp-2 transition-colors ${compact ? 'text-sm leading-tight min-h-[2rem]' : 'text-base min-h-[2.5rem]'}`}>
            {book.title}
          </h3>
        </Link>
        <p className={`text-gray-500 line-clamp-1 ${compact ? 'text-[11px] mb-2' : 'text-xs mb-2'}`}>{book.author}</p>

        <div className="mt-auto">
          <div className="flex flex-wrap items-center gap-1.5 mb-2">
            <span className={`font-bold text-gray-900 ${compact ? 'text-sm' : 'text-base'}`}>₹{roundPrice(effectivePrice)}</span>
            {hasDiscount && (
              <span className={`text-gray-400 line-through ${compact ? 'text-[10px]' : 'text-xs'}`}>₹{roundPrice(book.price)}</span>
            )}
            {book.condition && (
              <span className="text-[10px] text-gray-500 capitalize bg-gray-50 px-1.5 py-0.5 rounded">{book.condition}</span>
            )}
          </div>

          {book.rating > 0 && (
            <div className="flex items-center gap-1 mb-2">
              <div className="flex text-yellow-400">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className={`${compact ? 'w-2.5 h-2.5' : 'w-3 h-3'} ${i < Math.floor(book.rating) ? 'fill-current' : 'fill-gray-300'}`}
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                  >
                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                  </svg>
                ))}
              </div>
              <span className={`text-gray-500 ${compact ? 'text-[10px]' : 'text-xs'}`}>({book.reviewCount || 0})</span>
            </div>
          )}

          {isBuyer ? (
            <button
              onClick={handleAddToCartClick}
              disabled={book.stock === 0 || book.approvalStatus === 'pending' || book.approvalStatus === 'rejected'}
              className={`w-full bg-accent-brown text-white rounded font-medium hover:bg-accent-brown/90 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200 shadow-sm ${compact ? 'py-1.5 text-xs' : 'py-2 text-sm'}`}
            >
              {book.stock === 0 ? 'Out of Stock' : (book.approvalStatus === 'pending' || book.approvalStatus === 'rejected') ? 'Pending' : 'Add to Cart'}
            </button>
          ) : (
            <button
              onClick={handleViewClick}
              className={`w-full bg-gray-100 text-gray-700 border border-gray-300 rounded font-medium hover:bg-gray-200 transition-colors duration-200 shadow-sm ${compact ? 'py-1.5 text-xs' : 'py-2 text-sm'}`}
            >
              View Details
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookCard;
