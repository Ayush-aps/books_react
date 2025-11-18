import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';

function BuyerDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dashboardData, setDashboardData] = useState({
    recentOrders: [],
    libraryCount: 0,
    activeOrders: 0,
    completedOrders: 0,
    complaints: [],
    recentlyViewed: []
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/buyer/dashboard');
      setDashboardData(response.data);
      setError('');
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      console.error('Error response:', err.response);
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">My Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="bg-primary rounded-full w-12 h-12 flex items-center justify-center mr-4">
              <i className="fas fa-book-open text-xl text-dark"></i>
            </div>
            <div>
              <p className="text-gray-600 text-sm">My Library</p>
              <h3 className="text-2xl font-bold">{dashboardData.libraryCount}</h3>
            </div>
          </div>
          <div className="mt-4 text-sm">
            <Link to="/buyer/library" className="text-primary hover:text-dark">
              View Library <i className="fas fa-arrow-right ml-1"></i>
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="bg-primary rounded-full w-12 h-12 flex items-center justify-center mr-4">
              <i className="fas fa-shopping-cart text-xl text-dark"></i>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Active Orders</p>
              <h3 className="text-2xl font-bold">{dashboardData.activeOrders}</h3>
            </div>
          </div>
          <div className="mt-4 text-sm">
            <Link to="/buyer/orders" className="text-primary hover:text-dark">
              View Orders <i className="fas fa-arrow-right ml-1"></i>
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="bg-primary rounded-full w-12 h-12 flex items-center justify-center mr-4">
              <i className="fas fa-check-circle text-xl text-dark"></i>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Completed Orders</p>
              <h3 className="text-2xl font-bold">{dashboardData.completedOrders}</h3>
            </div>
          </div>
          <div className="mt-4 text-sm">
            <span className="text-gray-600">Total delivered</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="bg-primary rounded-full w-12 h-12 flex items-center justify-center mr-4">
              <i className="fas fa-exclamation-circle text-xl text-dark"></i>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Open Complaints</p>
              <h3 className="text-2xl font-bold">{dashboardData.complaints.length}</h3>
            </div>
          </div>
          <div className="mt-4 text-sm">
            <Link to="/buyer/complaints" className="text-primary hover:text-dark">
              View Complaints <i className="fas fa-arrow-right ml-1"></i>
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Orders & Recently Viewed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Recent Orders */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Recent Orders</h2>
            <Link to="/buyer/orders" className="text-primary hover:text-dark text-sm">
              View All
            </Link>
          </div>
          {dashboardData.recentOrders.length === 0 ? (
            <p className="text-gray-600 text-center py-8">No orders yet</p>
          ) : (
            <div className="space-y-4">
              {dashboardData.recentOrders.map((order) => (
                <div key={order._id} className="flex items-center justify-between border-b pb-4 last:border-b-0">
                  <div className="flex-1">
                    <p className="font-medium">Order #{order._id.slice(-6)}</p>
                    <p className="text-sm text-gray-600">
                      {(order.createdAt || order.orderDate) ? new Date(order.createdAt || order.orderDate).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">₹{order.totalAmount}</p>
                    <span className={`text-xs px-2 py-1 rounded ${
                      order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                      order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                      order.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recently Viewed Books */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Recently Viewed</h2>
            <Link to="/buyer/browse" className="text-primary hover:text-dark text-sm">
              Browse More
            </Link>
          </div>
          {dashboardData.recentlyViewed.length === 0 ? (
            <p className="text-gray-600 text-center py-8">No recently viewed books</p>
          ) : (
            <div className="space-y-4">
              {dashboardData.recentlyViewed.map((book) => (
                <Link 
                  key={book._id} 
                  to={`/buyer/book/${book._id}`}
                  className="flex items-center gap-4 hover:bg-gray-50 p-2 rounded transition"
                >
                  <img 
                    src={book.coverImage || '/img/books/default-cover.jpg'} 
                    alt={book.title}
                    className="w-16 h-20 object-cover rounded"
                  />
                  <div className="flex-1">
                    <p className="font-medium">{book.title}</p>
                    <p className="text-sm text-gray-600">{book.author}</p>
                    <p className="font-bold text-primary mt-1">₹{book.price}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link 
            to="/buyer/browse" 
            className="flex flex-col items-center justify-center p-4 border-2 border-gray-200 rounded-lg hover:border-primary hover:bg-gray-50 transition"
          >
            <i className="fas fa-search text-3xl text-primary mb-2"></i>
            <span className="text-sm font-medium">Browse Books</span>
          </Link>
          
          <Link 
            to="/buyer/cart" 
            className="flex flex-col items-center justify-center p-4 border-2 border-gray-200 rounded-lg hover:border-primary hover:bg-gray-50 transition"
          >
            <i className="fas fa-shopping-cart text-3xl text-primary mb-2"></i>
            <span className="text-sm font-medium">My Cart</span>
          </Link>
          
          <Link 
            to="/buyer/library" 
            className="flex flex-col items-center justify-center p-4 border-2 border-gray-200 rounded-lg hover:border-primary hover:bg-gray-50 transition"
          >
            <i className="fas fa-book-open text-3xl text-primary mb-2"></i>
            <span className="text-sm font-medium">My Library</span>
          </Link>
          
          <Link 
            to="/buyer/video-feed" 
            className="flex flex-col items-center justify-center p-4 border-2 border-gray-200 rounded-lg hover:border-primary hover:bg-gray-50 transition"
          >
            <i className="fas fa-video text-3xl text-primary mb-2"></i>
            <span className="text-sm font-medium">Video Feed</span>
          </Link>
          
          <Link 
            to="/buyer/profile" 
            className="flex flex-col items-center justify-center p-4 border-2 border-gray-200 rounded-lg hover:border-primary hover:bg-gray-50 transition"
          >
            <i className="fas fa-user text-3xl text-primary mb-2"></i>
            <span className="text-sm font-medium">My Profile</span>
          </Link>
          
          <Link 
            to="/buyer/addresses" 
            className="flex flex-col items-center justify-center p-4 border-2 border-gray-200 rounded-lg hover:border-primary hover:bg-gray-50 transition"
          >
            <i className="fas fa-map-marker-alt text-3xl text-primary mb-2"></i>
            <span className="text-sm font-medium">Addresses</span>
          </Link>
          
          <Link 
            to="/buyer/register-complaint" 
            className="flex flex-col items-center justify-center p-4 border-2 border-gray-200 rounded-lg hover:border-primary hover:bg-gray-50 transition"
          >
            <i className="fas fa-exclamation-triangle text-3xl text-primary mb-2"></i>
            <span className="text-sm font-medium">Register Complaint</span>
          </Link>
          
          <Link 
            to="/subscription/checkout" 
            className="flex flex-col items-center justify-center p-4 border-2 border-gray-200 rounded-lg hover:border-primary hover:bg-gray-50 transition"
          >
            <i className="fas fa-crown text-3xl text-primary mb-2"></i>
            <span className="text-sm font-medium">Upgrade Plan</span>
          </Link>
        </div>
      </div>

      {/* Active Complaints (if any) */}
      {dashboardData.complaints.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
          <h2 className="text-xl font-bold mb-4">Active Complaints</h2>
          <div className="space-y-4">
            {dashboardData.complaints.map((complaint) => (
              <div key={complaint._id} className="flex items-center justify-between border-b pb-4 last:border-b-0">
                <div className="flex-1">
                  <p className="font-medium">{complaint.subject}</p>
                  <p className="text-sm text-gray-600">{new Date(complaint.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <span className={`text-xs px-2 py-1 rounded ${
                    complaint.status === 'resolved' ? 'bg-green-100 text-green-800' :
                    complaint.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {complaint.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default BuyerDashboard;
