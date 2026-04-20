import { useEffect, lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { checkAuth } from './redux/actions/authActions'

// Layout Components
import Header from './components/layout/Header'
import Footer from './components/layout/Footer'

// Toast Provider
import { ToastProvider } from './components/Toast'

// Theme Provider (Context API)
import { ThemeProvider } from './context/ThemeContext'
import ThemeToggle from './components/ThemeToggle'

// Protected Route Component
import PrivateRoute from './components/PrivateRoute'
import ErrorBoundary from './components/ErrorBoundary'

import ScrollToTop from './components/ScrollToTop'

// Public Pages
const Home = lazy(() => import('./pages/Home'))
const About = lazy(() => import('./pages/About'))
const Contact = lazy(() => import('./pages/Contact'))
const Pricing = lazy(() => import('./pages/Pricing'))

// Auth Pages
const Login = lazy(() => import('./pages/auth/Login'))
const Register = lazy(() => import('./pages/auth/Register'))

// Buyer Pages
const BuyerDashboard = lazy(() => import('./pages/buyer/Dashboard'))
const BuyerBrowse = lazy(() => import('./pages/buyer/Browse'))
const BookDetails = lazy(() => import('./pages/buyer/BookDetails'))
const Cart = lazy(() => import('./pages/buyer/Cart'))
const Checkout = lazy(() => import('./pages/buyer/Checkout'))
const BuyerOrders = lazy(() => import('./pages/buyer/Orders'))
const OrderDetails = lazy(() => import('./pages/buyer/OrderDetails'))
const Profile = lazy(() => import('./pages/buyer/Profile'))
const Library = lazy(() => import('./pages/buyer/Library'))
const VideoFeed = lazy(() => import('./pages/buyer/VideoFeed'))
const VideoWatch = lazy(() => import('./pages/buyer/VideoWatch'))
const Addresses = lazy(() => import('./pages/buyer/Addresses'))
const Reader = lazy(() => import('./pages/buyer/PdfReader'))
const RegisterComplaint = lazy(() => import('./pages/buyer/RegisterComplaint'))
const BuyerComplaints = lazy(() => import('./pages/buyer/Complaints'))
const BuyerComplaintDetails = lazy(() => import('./pages/buyer/ComplaintDetails'))
const UploadVideo = lazy(() => import('./pages/buyer/UploadVideo'))
const PaymentSuccess = lazy(() => import('./pages/buyer/PaymentSuccess'))

// Seller Pages
const SellerDashboard = lazy(() => import('./pages/seller/Dashboard'))
const Inventory = lazy(() => import('./pages/seller/Inventory'))
const UploadBook = lazy(() => import('./pages/seller/UploadBook'))
const EditBook = lazy(() => import('./pages/seller/EditBook'))
const SellerBookDetails = lazy(() => import('./pages/seller/BookDetails'))
const SellerOrders = lazy(() => import('./pages/seller/Orders'))
const SellerOrderDetails = lazy(() => import('./pages/seller/OrderDetails'))
const SellerComplaints = lazy(() => import('./pages/seller/Complaints'))
const SellerRegisterComplaint = lazy(() => import('./pages/seller/RegisterComplaint'))
const SellerComplaintDetails = lazy(() => import('./pages/seller/ComplaintDetails'))
const SellerViewBook = lazy(() => import('./pages/seller/ViewBook'))
const SellerRevenue = lazy(() => import('./pages/seller/Revenue'))

// Admin Pages
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'))
const AdminUsers = lazy(() => import('./pages/admin/Users'))
const AdminBooks = lazy(() => import('./pages/admin/Books'))
const AdminBookDetails = lazy(() => import('./pages/admin/BookDetails'))
const AdminOrders = lazy(() => import('./pages/admin/Orders'))
const AdminOrderDetails = lazy(() => import('./pages/admin/OrderDetails'))
const AdminReports = lazy(() => import('./pages/admin/Reports'))
const AdminComplaints = lazy(() => import('./pages/admin/Complaints'))
const AdminComplaintDetails = lazy(() => import('./pages/admin/ComplaintDetails'))
const AdminViewBook = lazy(() => import('./pages/admin/ViewBook'))
const Revenue = lazy(() => import('./pages/admin/Revenue'))

// Moderator Pages
const ModeratorLayout = lazy(() => import('./pages/moderator/ModeratorLayout'))
const ModeratorOverview = lazy(() => import('./pages/moderator/Dashboard'))
const ModeratorVerification = lazy(() => import('./pages/moderator/Verification'))
const ModeratorBooks = lazy(() => import('./pages/moderator/Books'))
const ModeratorUsers = lazy(() => import('./pages/moderator/Users'))
const ModeratorLibrary = lazy(() => import('./pages/moderator/Library'))
const ModeratorOrders = lazy(() => import('./pages/moderator/Orders'))
const ModeratorReports = lazy(() => import('./pages/moderator/Reports'))
const ModeratorComplaints = lazy(() => import('./pages/moderator/Complaints'))

// Employee Pages
const EmployeeLayout = lazy(() => import('./pages/employee/EmployeeLayout'))
const EmployeeDashboard = lazy(() => import('./pages/employee/Dashboard'))
const EmployeeOrders = lazy(() => import('./pages/employee/Orders'))
const EmployeeComplaints = lazy(() => import('./pages/employee/Complaints'))

// Subscription Pages
const SubscriptionCheckout = lazy(() => import('./pages/subscription/SubscriptionCheckout'))
const SubscriptionSuccess = lazy(() => import('./pages/subscription/SubscriptionSuccess'))

// Error Pages
const NotFound = lazy(() => import('./pages/errors/NotFound'))
const ServerError = lazy(() => import('./pages/errors/ServerError'))

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[50vh]">Loading page...</div>
)

function App() {
  const dispatch = useDispatch()

  useEffect(() => {
    dispatch(checkAuth())
  }, [dispatch])

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ToastProvider>
          <div className="min-h-screen flex flex-col">
            <ScrollToTop />
            <Header />
            <ThemeToggle />
            <main className="flex-grow">
              <Suspense fallback={<PageLoader />}>
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
              </Suspense>
            </main>
            <Footer />
          </div>
        </ToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}

export default App
