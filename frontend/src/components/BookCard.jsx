/**
 * Book Card Component
 * Display a book in a card format with components!
 */

import { Link } from 'react-router-dom';

const BookCard = ({ book, onAddToCart, isAddingToCart }) => {
  const effectivePrice = book.discountPrice || book.price;
  const hasDiscount = book.discountPrice && book.discountPrice < book.price;

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <Link to={`/buyer/book/${book._id}`}>
        <div className="relative pb-[140%] bg-gray-200">
          <img
            src={book.coverImage || 'https://via.placeholder.com/300x420?text=No+Cover'}
            alt={book.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
          {hasDiscount && (
            <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-md text-sm font-bold">
              {Math.round(((book.price - book.discountPrice) / book.price) * 100)}% OFF
            </div>
          )}
          {(book.approvalStatus === 'pending' || book.approvalStatus === 'rejected') && (
            <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded-md text-xs font-bold">
              Pending
            </div>
          )}
          {book.stock === 0 && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <span className="text-white font-bold text-lg">Out of Stock</span>
            </div>
          )}
        </div>
      </Link>

      <div className="p-4">
        <Link to={`/buyer/book/${book._id}`}>
          <h3 className="text-lg font-semibold text-gray-800 hover:text-blue-600 line-clamp-2 min-h-[3.5rem]">
            {book.title}
          </h3>
        </Link>
        <p className="text-sm text-gray-600 mt-1">{book.author}</p>

        <div className="mt-2 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-gray-900">₹{effectivePrice}</span>
              {hasDiscount && (
                <span className="text-sm text-gray-500 line-through">₹{book.price}</span>
              )}
            </div>
            {book.condition && (
              <span className="text-xs text-gray-500 capitalize">{book.condition}</span>
            )}
          </div>
        </div>

        {book.rating > 0 && (
          <div className="mt-2 flex items-center">
            <div className="flex text-yellow-400">
              {[...Array(5)].map((_, i) => (
                <svg
                  key={i}
                  className={`w-4 h-4 ${i < Math.floor(book.rating) ? 'fill-current' : 'fill-gray-300'}`}
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                >
                  <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                </svg>
              ))}
            </div>
            <span className="ml-1 text-sm text-gray-600">({book.reviewCount || 0})</span>
          </div>
        )}

        <button
          onClick={() => onAddToCart && onAddToCart(book._id)}
          disabled={book.stock === 0 || book.approvalStatus === 'pending' || book.approvalStatus === 'rejected' || isAddingToCart}
          className="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-300 flex items-center justify-center gap-2"
        >
          {isAddingToCart && (
            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          )}
          {isAddingToCart ? 'Adding...' : book.stock === 0 ? 'Out of Stock' : (book.approvalStatus === 'pending' || book.approvalStatus === 'rejected') ? 'Pending Approval' : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
};

export default BookCard;
