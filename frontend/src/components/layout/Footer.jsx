/**
 * Footer Component
 */

import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-800 text-white mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <h3 className="text-lg font-semibold mb-4">About Bookish</h3>
            <p className="text-gray-400 text-sm">
              Your one-stop marketplace for buying and selling new and used books.
              Discover, read, and share your love for books.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/about" className="text-gray-400 hover:text-white">About Us</Link></li>
              <li><Link to="/contact" className="text-gray-400 hover:text-white">Contact</Link></li>
              <li><Link to="/pricing" className="text-gray-400 hover:text-white">Pricing</Link></li>
            </ul>
          </div>

          {/* For Buyers */}
          <div>
            <h3 className="text-lg font-semibold mb-4">For Buyers</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/buyer/browse" className="text-gray-400 hover:text-white">Browse Books</Link></li>
              <li><Link to="/buyer/library" className="text-gray-400 hover:text-white">My Library</Link></li>
              <li><Link to="/buyer/orders" className="text-gray-400 hover:text-white">My Orders</Link></li>
            </ul>
          </div>

          {/* For Sellers */}
          <div>
            <h3 className="text-lg font-semibold mb-4">For Sellers</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/seller/dashboard" className="text-gray-400 hover:text-white">Seller Dashboard</Link></li>
              <li><Link to="/seller/upload" className="text-gray-400 hover:text-white">Upload Book</Link></li>
              <li><Link to="/seller/inventory" className="text-gray-400 hover:text-white">My Inventory</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-6 text-center text-sm text-gray-400">
          <p>&copy; {currentYear} Bookish. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
