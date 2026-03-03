import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { checkAuth } from './redux/actions/authActions'

// Layout Components
import Header from './components/layout/Header'
import Footer from './components/layout/Footer'

// Toast Provider
import { ToastProvider } from './components/Toast'

// Theme Provider (Context API)
import { ThemeProvider } from './context/ThemeContext'
import ThemeToggle from './components/ThemeToggle'

// Public Pages
import Home from './pages/Home'
import About from './pages/About'
import Contact from './pages/Contact'
import Pricing from './pages/Pricing'

// Auth Pages
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'

// Buyer Pages
import BuyerDashboard from './pages/buyer/Dashboard'
import BuyerBrowse from './pages/buyer/Browse'
import BookDetails from './pages/buyer/BookDetails'
import Cart from './pages/buyer/Cart'
import Checkout from './pages/buyer/Checkout'
import BuyerOrders from './pages/buyer/Orders'
import OrderDetails from './pages/buyer/OrderDetails'
import Profile from './pages/buyer/Profile'
import Library from './pages/buyer/Library'
import VideoFeed from './pages/buyer/VideoFeed'
import VideoWatch from './pages/buyer/VideoWatch'
import Addresses from './pages/buyer/Addresses'
import Reader from './pages/buyer/PdfReader'
import RegisterComplaint from './pages/buyer/RegisterComplaint'
import BuyerComplaints from './pages/buyer/Complaints'
import BuyerComplaintDetails from './pages/buyer/ComplaintDetails'
import UploadVideo from './pages/buyer/UploadVideo'
import PaymentSuccess from './pages/buyer/PaymentSuccess'

// Seller Pages
import SellerDashboard from './pages/seller/Dashboard'
import Inventory from './pages/seller/Inventory'
import UploadBook from './pages/seller/UploadBook'
import EditBook from './pages/seller/EditBook'
import SellerBookDetails from './pages/seller/BookDetails'
import SellerOrders from './pages/seller/Orders'
import SellerOrderDetails from './pages/seller/OrderDetails'
import SellerComplaints from './pages/seller/Complaints'
import SellerRegisterComplaint from './pages/seller/RegisterComplaint'
import SellerComplaintDetails from './pages/seller/ComplaintDetails'
import SellerViewBook from './pages/seller/ViewBook'
import SellerRevenue from './pages/seller/Revenue'

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard'
import AdminUsers from './pages/admin/Users'
import AdminBooks from './pages/admin/Books'
import AdminBookDetails from './pages/admin/BookDetails'
import AdminOrders from './pages/admin/Orders'
import AdminOrderDetails from './pages/admin/OrderDetails'
import AdminReports from './pages/admin/Reports'
import AdminComplaints from './pages/admin/Complaints'
import AdminComplaintDetails from './pages/admin/ComplaintDetails'
import AdminViewBook from './pages/admin/ViewBook'
import Revenue from './pages/admin/Revenue'

// Moderator Pages
import ModeratorLayout from './pages/moderator/ModeratorLayout'
import ModeratorOverview from './pages/moderator/Dashboard'
import ModeratorVerification from './pages/moderator/Verification'
import ModeratorBooks from './pages/moderator/Books'
import ModeratorUsers from './pages/moderator/Users'
import ModeratorLibrary from './pages/moderator/Library'
import ModeratorOrders from './pages/moderator/Orders'
import ModeratorReports from './pages/moderator/Reports'
import ModeratorComplaints from './pages/moderator/Complaints'

// Employee Pages
import EmployeeLayout from './pages/employee/EmployeeLayout'
import EmployeeDashboard from './pages/employee/Dashboard'
import EmployeeOrders from './pages/employee/Orders'
import EmployeeComplaints from './pages/employee/Complaints'

// Subscription Pages
import SubscriptionCheckout from './pages/subscription/SubscriptionCheckout'
import SubscriptionSuccess from './pages/subscription/SubscriptionSuccess'

// Error Pages
import NotFound from './pages/errors/NotFound'
import ServerError from './pages/errors/ServerError'

// Protected Route Component
import PrivateRoute from './components/PrivateRoute'
import ErrorBoundary from './components/ErrorBoundary'

import ScrollToTop from './components/ScrollToTop'

function App() {
  const dispatch = useDispatch()
  const { isAuthenticated, loading } = useSelector(state => state.auth)

  useEffect(() => {
    dispatch(checkAuth())
  }, [dispatch])

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ToastProvider>
          <div className="min-h-screen flex flex-col">
            <ScrollToTop />
            <Header />
            <ThemeToggle />
            <main className="flex-grow">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/pricing" element={<Pricing />} />

                {/* Auth Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Buyer Routes */}
                <Route path="/buyer/dashboard" element={<PrivateRoute role="buyer"><BuyerDashboard /></PrivateRoute>} />
                <Route path="/buyer/browse" element={<PrivateRoute role="buyer"><BuyerBrowse /></PrivateRoute>} />
                <Route path="/buyer/book/:id" element={<PrivateRoute role="buyer"><BookDetails /></PrivateRoute>} />
                <Route path="/buyer/cart" element={<PrivateRoute role="buyer"><Cart /></PrivateRoute>} />
                <Route path="/buyer/checkout" element={<PrivateRoute role="buyer"><Checkout /></PrivateRoute>} />
                <Route path="/buyer/orders" element={<PrivateRoute role="buyer"><BuyerOrders /></PrivateRoute>} />
                <Route path="/buyer/orders/:id" element={<PrivateRoute role="buyer"><OrderDetails /></PrivateRoute>} />
                <Route path="/buyer/profile" element={<PrivateRoute role="buyer"><Profile /></PrivateRoute>} />
                <Route path="/buyer/library" element={<PrivateRoute role="buyer"><Library /></PrivateRoute>} />
                <Route path="/buyer/video-feed" element={<PrivateRoute role="buyer"><VideoFeed /></PrivateRoute>} />
                <Route path="/buyer/videos/upload" element={<Navigate to="/buyer/upload-video" replace />} />
                <Route path="/buyer/videos/:id" element={<PrivateRoute role="buyer"><VideoWatch /></PrivateRoute>} />
                <Route path="/buyer/addresses" element={<PrivateRoute role="buyer"><Addresses /></PrivateRoute>} />
                <Route path="/buyer/complaints" element={<PrivateRoute role="buyer"><BuyerComplaints /></PrivateRoute>} />
                <Route path="/buyer/complaints/:id" element={<PrivateRoute role="buyer"><BuyerComplaintDetails /></PrivateRoute>} />
                <Route path="/buyer/register-complaint" element={<PrivateRoute role="buyer"><RegisterComplaint /></PrivateRoute>} />
                <Route path="/buyer/upload-video" element={<PrivateRoute role="buyer"><UploadVideo /></PrivateRoute>} />
                <Route path="/buyer/payment-success" element={<PrivateRoute role="buyer"><PaymentSuccess /></PrivateRoute>} />
                <Route path="/buyer/reader/:bookId" element={<PrivateRoute role="buyer"><Reader /></PrivateRoute>} />

                {/* Seller Routes */}
                <Route path="/seller/dashboard" element={<PrivateRoute role="seller"><SellerDashboard /></PrivateRoute>} />
                <Route path="/seller/revenue" element={<PrivateRoute role="seller"><SellerRevenue /></PrivateRoute>} />
                <Route path="/seller/inventory" element={<PrivateRoute role="seller"><Inventory /></PrivateRoute>} />
                <Route path="/seller/upload" element={<PrivateRoute role="seller"><UploadBook /></PrivateRoute>} />
                <Route path="/seller/books/:id" element={<PrivateRoute role="seller"><SellerBookDetails /></PrivateRoute>} />
                <Route path="/seller/edit-book/:id" element={<PrivateRoute role="seller"><EditBook /></PrivateRoute>} />
                <Route path="/seller/orders" element={<PrivateRoute role="seller"><SellerOrders /></PrivateRoute>} />
                <Route path="/seller/orders/:id" element={<PrivateRoute role="seller"><SellerOrderDetails /></PrivateRoute>} />
                <Route path="/seller/complaints" element={<PrivateRoute role="seller"><SellerComplaints /></PrivateRoute>} />
                <Route path="/seller/complaints/:id" element={<PrivateRoute role="seller"><SellerComplaintDetails /></PrivateRoute>} />
                <Route path="/seller/register-complaint" element={<PrivateRoute role="seller"><SellerRegisterComplaint /></PrivateRoute>} />
                <Route path="/seller/view-book/:id" element={<PrivateRoute role="seller"><SellerViewBook /></PrivateRoute>} />

                {/* Admin Routes */}
                <Route path="/admin/dashboard" element={<PrivateRoute role="admin"><AdminDashboard /></PrivateRoute>} />
                <Route path="/admin/revenue" element={<PrivateRoute role="admin"><Revenue /></PrivateRoute>} />
                <Route path="/admin/users" element={<PrivateRoute role="admin"><AdminUsers /></PrivateRoute>} />
                <Route path="/admin/books" element={<PrivateRoute role="admin"><AdminBooks /></PrivateRoute>} />
                <Route path="/admin/content" element={<PrivateRoute role="admin"><AdminBooks /></PrivateRoute>} />
                <Route path="/admin/content/:id" element={<PrivateRoute role="admin"><AdminBookDetails /></PrivateRoute>} />
                <Route path="/admin/orders" element={<PrivateRoute role="admin"><AdminOrders /></PrivateRoute>} />
                <Route path="/admin/orders/:id" element={<PrivateRoute role="admin"><AdminOrderDetails /></PrivateRoute>} />
                <Route path="/admin/reports" element={<PrivateRoute role="admin"><AdminReports /></PrivateRoute>} />
                <Route path="/admin/complaints" element={<PrivateRoute role="admin"><AdminComplaints /></PrivateRoute>} />
                <Route path="/admin/complaints/:id" element={<PrivateRoute role="admin"><AdminComplaintDetails /></PrivateRoute>} />
                <Route path="/admin/view-book/:id" element={<PrivateRoute role="admin"><AdminViewBook /></PrivateRoute>} />

                {/* Moderator Routes - nested under shared layout */}
                <Route element={<PrivateRoute role={['moderator', 'admin', 'employee']}><ModeratorLayout /></PrivateRoute>}>
                  <Route path="/moderator/dashboard" element={<ModeratorOverview />} />
                  <Route path="/moderator/verification" element={<ModeratorVerification />} />
                  <Route path="/moderator/books" element={<ModeratorBooks />} />
                  <Route path="/moderator/orders" element={<ModeratorOrders />} />
                  <Route path="/moderator/reports" element={<ModeratorReports />} />
                  <Route path="/moderator/complaints" element={<ModeratorComplaints />} />
                  <Route path="/moderator/users" element={<ModeratorUsers />} />
                  <Route path="/moderator/library" element={<ModeratorLibrary />} />
                </Route>

                {/* Employee Routes — nested under shared layout */}
                <Route element={<PrivateRoute role={['employee', 'moderator', 'admin']}><EmployeeLayout /></PrivateRoute>}>
                  <Route path="/employee/dashboard" element={<EmployeeDashboard />} />
                  <Route path="/employee/orders" element={<EmployeeOrders />} />
                  <Route path="/employee/complaints" element={<EmployeeComplaints />} />
                </Route>

                {/* Subscription Routes */}
                <Route path="/subscription/checkout" element={<PrivateRoute role="buyer"><SubscriptionCheckout /></PrivateRoute>} />
                <Route path="/subscription/success" element={<PrivateRoute role="buyer"><SubscriptionSuccess /></PrivateRoute>} />

                {/* Error Pages */}
                <Route path="/500" element={<ServerError />} />

                {/* Catch all - 404 */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </ToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}

export default App
