/**
 * Orders Page (Buyer)
 * Display list of user's orders with status
 */

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchOrders } from '../../redux/actions/orderActions';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';

const Orders = () => {
  const dispatch = useDispatch();
  const { orders, loading, error } = useSelector(state => state.orders);
  const [filter, setFilter] = useState('all'); // all, pending, shipped, delivered, cancelled

  useEffect(() => {
    dispatch(fetchOrders());
  }, [dispatch]);

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      shipped: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const filteredOrders = filter === 'all' 
    ? orders 
    : orders.filter(order => order.status === filter);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" message="Loading orders..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">My Orders</h1>

        {error && (
          <div className="mb-6">
            <ErrorMessage message={error} onRetry={() => dispatch(fetchOrders())} />
          </div>
        )}

        {/* Filter Tabs */}
        <div className="mb-6 flex gap-2 overflow-x-auto">
          {['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                filter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
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
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              {filter === 'all' ? 'No orders yet' : `No ${filter} orders`}
            </h2>
            <p className="text-gray-600 mb-6">
              {filter === 'all' 
                ? 'Start shopping to see your orders here'
                : `You don't have any ${filter} orders`}
            </p>
            {filter === 'all' && (
              <Link
                to="/buyer/browse"
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Browse Books
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <div key={order._id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-6">
                  {/* Order Header */}
                  <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">
                        Order ID: <span className="font-mono font-medium text-gray-900">{order._id}</span>
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        Placed on {(order.createdAt || order.orderDate) ? new Date(order.createdAt || order.orderDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        }) : 'N/A'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(order.status)}`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                      <Link
                        to={`/buyer/orders/${order._id}`}
                        className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                      >
                        View Details →
                      </Link>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="border-t border-gray-200 pt-4">
                    <div className="space-y-3">
                      {order.items.slice(0, 2).map((item, index) => (
                        <div key={item._id || index} className="flex gap-4">
                          <img
                            src={item.book?.coverImage || item.coverImage || '/img/books/default-cover.jpg'}
                            alt={item.book?.title || item.title || 'Book'}
                            className="w-16 h-20 object-cover rounded"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = '/img/books/default-cover.jpg';
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">
                              {item.book?.title || item.title || 'Book Title'}
                            </p>
                            <p className="text-sm text-gray-600">
                              Quantity: {item.quantity}
                            </p>
                            <p className="text-sm font-semibold text-gray-900">
                              ₹{item.price?.toFixed(2) || '0.00'}
                            </p>
                          </div>
                        </div>
                      ))}
                      {order.items.length > 2 && (
                        <p className="text-sm text-gray-600">
                          + {order.items.length - 2} more item(s)
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Order Total */}
                  <div className="border-t border-gray-200 mt-4 pt-4 flex justify-between items-center">
                    <span className="text-gray-600">Total Amount</span>
                    <span className="text-xl font-bold text-gray-900">
                      ₹{order.totalAmount.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;
