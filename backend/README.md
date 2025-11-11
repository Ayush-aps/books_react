# Bookish Backend API

This is the backend API server for the Bookish online book marketplace application.

## Project Structure

```
backend/
├── config/
│   ├── db.js              # MongoDB connection
│   └── passport.js        # Passport authentication config
├── middleware/
│   └── auth.js            # Authentication & authorization middleware
├── models/
│   ├── User.js            # User model
│   ├── Book.js            # Book model
│   ├── Cart.js            # Shopping cart model
│   ├── Order.js           # Order model
│   ├── Address.js         # User address model
│   ├── Subscription.js    # Subscription model
│   ├── Library.js         # User library model
│   ├── Complaint.js       # Complaint/support model
│   ├── BookVideo.js       # Video review model
│   └── VideoComment.js    # Video comment model
├── routes/
│   ├── auth.js            # Authentication routes
│   ├── buyer.js           # Buyer-specific routes
│   ├── seller.js          # Seller-specific routes
│   ├── admin.js           # Admin-specific routes
│   ├── public.js          # Public routes
│   ├── books.js           # Book routes
│   ├── orders.js          # Order routes
│   ├── subscription.js    # Subscription routes
│   ├── library.js         # Library routes
│   └── videos.js          # Video routes
├── uploads/               # Uploaded files (videos, images)
├── .env                   # Environment variables (create from .env.example)
├── .env.example           # Environment variables template
├── app.js                 # Main application entry point
└── package.json           # Dependencies and scripts
```

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment Variables

Copy the `.env.example` file to `.env` and fill in your configuration:

```bash
cp .env.example .env
```

Edit `.env` with your actual values:
- `MONGODB_URI`: Your MongoDB connection string
- `SESSION_SECRET`: A secure random string for session encryption
- `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`: Your Stripe API keys
- `FRONTEND_URL`: The URL where your React frontend is running (default: http://localhost:5173)

### 3. Start the Server

**Development mode** (with auto-restart):
```bash
npm run dev
```

**Production mode**:
```bash
npm start
```

The server will start on `http://localhost:5000` by default.

## API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication Endpoints

#### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "password2": "password123",
  "role": "buyer"  // or "seller"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

#### Logout
```http
POST /api/auth/logout
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Session cookie
```

#### Check Authentication Status
```http
GET /api/auth/check
```

### Buyer Endpoints

#### Browse Books
```http
GET /api/buyer/browse?search=term&genre=Fiction&condition=new&sort=price-asc
```

#### Get Book Details
```http
GET /api/buyer/book/:id
```

#### Cart Operations
```http
GET /api/buyer/cart
POST /api/buyer/cart/add/:bookId
POST /api/buyer/cart/update/:itemId
POST /api/buyer/cart/remove/:itemId
POST /api/buyer/cart/clear
```

#### Checkout and Orders
```http
GET /api/buyer/checkout
POST /api/buyer/create-payment-intent
POST /api/buyer/confirm-payment
GET /api/buyer/orders
GET /api/buyer/orders/:id
```

#### Profile Management
```http
GET /api/buyer/profile
POST /api/buyer/profile/update
GET /api/buyer/profile/addresses
POST /api/buyer/profile/addresses/create
POST /api/buyer/profile/addresses/update/:id
POST /api/buyer/profile/addresses/delete/:id
```

#### Library
```http
GET /api/buyer/library
```

#### Video Feed
```http
GET /api/buyer/video-feed
GET /api/buyer/video-feed/watch/:id
POST /api/buyer/video-feed/like/:id
POST /api/buyer/video-feed/comment/:id
```

### Seller Endpoints

#### Dashboard
```http
GET /api/seller/dashboard
```

#### Book Management
```http
GET /api/seller/inventory
GET /api/seller/books
POST /api/seller/upload
GET /api/seller/edit/:id
POST /api/seller/edit/:id
POST /api/seller/delete/:id
```

#### Order Management
```http
GET /api/seller/orders
GET /api/seller/orders/:id
```

### Admin Endpoints

#### User Management
```http
GET /api/admin/users
POST /api/admin/users/:id/update-role
POST /api/admin/users/:id/toggle-status
```

#### Content Moderation
```http
GET /api/admin/content
POST /api/admin/content/:id/approve
POST /api/admin/content/:id/reject
```

#### Order Management
```http
GET /api/admin/orders
POST /api/admin/orders/update/:id
```

#### Complaints
```http
GET /api/admin/complaints
GET /api/admin/complaints/:id
POST /api/admin/complaints/:id/respond
```

#### Reports
```http
GET /api/admin/reports
```

### Public Endpoints

#### Home Page Data
```http
GET /api/public/home
```

#### Browse Books (Public)
```http
GET /api/public/books/browse
```

#### Contact Form
```http
POST /api/public/contact/submit
```

### Subscription Endpoints

```http
GET /api/subscription/plans
GET /api/subscription/checkout/:plan
POST /api/subscription/create-subscription-session
GET /api/subscription/success
```

## Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "errors": [
    { "msg": "Specific error detail" }
  ]
}
```

## Authentication

The API uses session-based authentication with Passport.js. After logging in, a session cookie is set that must be included in subsequent requests.

For the frontend, configure axios to include credentials:
```javascript
axios.defaults.withCredentials = true;
```

## CORS Configuration

The backend is configured to accept requests from the frontend URL specified in the `FRONTEND_URL` environment variable. The default is `http://localhost:5173`.

## File Uploads

File uploads (book videos, user avatars) are handled using Multer middleware. Uploaded files are stored in the `uploads/` directory.

## Database Models

- **User**: Stores user account information (buyers, sellers, admins)
- **Book**: Book listings with details, pricing, and inventory
- **Cart**: Shopping cart items for buyers
- **Order**: Order records with items, payment, and shipping details
- **Address**: Multiple addresses per user
- **Subscription**: Premium subscription management
- **Library**: User's digital library with reading progress
- **Complaint**: Customer support and complaint tickets
- **BookVideo**: Video reviews and recommendations
- **VideoComment**: Comments on videos

## Security Features

- Password hashing with bcrypt
- Session encryption
- Rate limiting on authentication routes
- Helmet.js for HTTP header security
- CORS configuration
- Role-based access control

## Notes for Frontend Integration

1. All API endpoints are prefixed with `/api`
2. Authentication state is managed through session cookies
3. Ensure `withCredentials: true` is set in axios configuration
4. Handle 401 (Unauthorized) and 403 (Forbidden) responses appropriately
5. Flash messages are no longer used; handle messages from JSON responses

## Development Tips

- Use Postman or similar tools to test API endpoints
- Check `app.js` for middleware configuration
- Add new routes in the appropriate route file
- Follow the existing pattern of returning JSON responses
- Validate user input and handle errors gracefully
- Use appropriate HTTP status codes

## Migration Notes

This backend has been refactored from an EJS-based monolithic application to a REST API. Key changes:

- Removed all `res.render()` calls, replaced with `res.json()`
- Removed flash message redirects, return JSON errors instead
- Added CORS support for frontend communication
- Maintained all business logic and database operations
- Preserved authentication and authorization middleware

## Future Enhancements

- JWT token-based authentication (optional alternative to sessions)
- Email notifications
- Advanced analytics endpoints
- Real-time features with WebSocket
- API rate limiting per user
- Comprehensive API documentation with Swagger
