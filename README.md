# Bookish — Unified Marketplace for Book Buyers, Sellers & Admins

A full-stack web platform that connects **buyers**, **sellers**, and **administrators** with role-based dashboards and features like browsing, selling, cart & orders, payment/subscriptions, video reviews, complaint resolution, and admin moderation. Built with a modern React frontend and Node.js backend.

---

## 📺 Demo Video

**Demo video (Unlisted):** `(https://youtu.be/u79hp5E6ZAY)`

---

## 📋 Metadata

* **Groupid:** 53
* **Project Title:** Bookish
* **SPOC / Team lead:** Ayush Pratap Singh — `ayushpratap.s23@iiits.in` — Roll: `S20230010033`

---

## 📖 Project Summary

**Bookish** is a unified platform providing:

* **Buyer features:** book browsing, cart, subscriptions, personal library, reading progress, video reviews, complaint/support.
* **Seller features:** upload/manage books, inventory, order management, analytics.
* **Admin features:** user management, content moderation (approve/reject books), system reports, complaint resolution.

---

## 👥 Team & Responsibilities

| Name               | Roll Number  | Responsibilities                                              |
| ------------------ | ------------ | ------------------------------------------------------------- |
| Ayush Pratap Singh | S20230010033 | Payment gateway, buyer's library, admin reports, video feed.  |
| Piyush Kumar       | S20230010186 | Buyer profile, homepage, seller upload, user management.      |
| Ujjwal Singh       | S20230010245 | Order tracking, seller dashboard, admin moderation.           |
| Daivik Wadhwani    | S20230010064 | Complaint system, seller inventory, cart.                     |
| Gugulothu Nithin   | S20230010099 | Authentication, contact & about us, shared UI (header/footer) |

---

## 🛠 Tech Stack

### **Frontend**

* **React 18.2** - UI library
* **Vite** - Build tool and dev server
* **Redux Toolkit** - State management
* **Redux Persist** - State persistence
* **React Router DOM** - Client-side routing
* **Tailwind CSS** - Utility-first styling
* **Axios** - HTTP client
* **React Hook Form** - Form validation
* **Zod** - Schema validation
* **Stripe (React)** - Payment integration
* **React PDF** - PDF rendering
* **Recharts** - Data visualization
* **Framer Motion** - Animations
* **Lucide React** - Icons

### **Backend**

* **Node.js** - Runtime environment
* **Express.js** - Web framework
* **MongoDB** - Database
* **Mongoose** - ODM for MongoDB
* **Passport.js** - Authentication middleware
* **Cloudinary** - Image/file storage
* **Stripe** - Payment processing
* **Node-cron** - Scheduled tasks

### **Backend Middlewares**

* **morgan** - HTTP request logger for debugging and monitoring
* **multer** - Multipart form-data handling for file uploads
* **cors** - Cross-Origin Resource Sharing enablement
* **express-session** - Session management
* **connect-mongo** - MongoDB session store
* **helmet** - Security headers
* **express-rate-limit** - Rate limiting protection
* **method-override** - HTTP method override
* **connect-flash** - Flash messages
* **bcryptjs** - Password hashing

---

## 📁 Project Structure

```
books_react/
├── backend/
│   ├── app.js                 # Express entry point
│   ├── package.json
│   ├── config/                # DB, cloudinary, passport, cron
│   │   ├── cloudinary.js
│   │   ├── db.js
│   │   ├── passport.js
│   │   └── subscriptionCron.js
│   ├── controllers/           # Business logic
│   │   ├── adminController.js
│   │   ├── authController.js
│   │   ├── buyerController.js
│   │   ├── orderController.js
│   │   ├── sellerController.js
│   │   └── subscriptionController.js
│   ├── models/                # Mongoose schemas
│   │   ├── User.js
│   │   ├── Book.js
│   │   ├── Order.js
│   │   ├── Cart.js
│   │   ├── Complaint.js
│   │   ├── Library.js
│   │   └── Subscription.js
│   ├── routes/                # API routes
│   │   ├── auth.js
│   │   ├── books.js
│   │   ├── buyer.js
│   │   ├── seller.js
│   │   ├── admin.js
│   │   └── orders.js
│   ├── middleware/            # Custom middleware
│   │   └── auth.js
│   └── uploads/               # Temporary file uploads
│
├── frontend/
│   ├── package.json
│   ├── vite.config.js         # Vite configuration
│   ├── tailwind.config.js     # Tailwind CSS config
│   ├── index.html
│   ├── src/
│   │   ├── main.jsx           # React entry point
│   │   ├── App.jsx            # Root component
│   │   ├── components/        # Reusable components
│   │   ├── pages/             # Page components
│   │   ├── redux/             # Redux slices & store
│   │   │   ├── store.js
│   │   │   └── slices/
│   │   ├── services/          # API service layers
│   │   ├── context/           # React contexts
│   │   ├── utils/             # Utility functions
│   │   ├── schemas/           # Validation schemas
│   │   └── styles/            # Global styles
│   └── public/                # Static assets
│       ├── css/
│       ├── js/
│       └── img/
│
└── README.md
```

---

## ✨ Features (high level)

### Buyer

* Browse & search books, add to cart, checkout (subscription & purchases)
* Personal library with reading progress tracking
* Highlight and bookmark support
* Video reviews/feed for books
* Submit & track complaints
* Profile management (addresses, orders)
* Subscription plans with auto-renewal

### Seller

* Upload books with metadata and images
* Inventory & order management
* Sales analytics on dashboard
* Book review and video management
* Commission tracking

### Admin

* Content moderation (approve/reject books)
* User & role management
* Reports: users, books, orders, complaints
* Platform-wide analytics
* Complaint resolution system

---

## 📦 Prerequisites

* **Node.js** v14+ and npm
* **MongoDB** (Local or Atlas)
* **Git**
* **Cloudinary account** for image/file storage
* **Stripe account** for payment processing
* (Optional) **nodemon** for development

---

## 🔐 Environment Variables

### Backend `.env` file

Create a `.env` file in the `backend/` directory with the following keys:

```env
# Database
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster0.mongodb.net/bookishdb

# Cloudinary (images & files)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Stripe Payment Gateway
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# Session Secret
SESSION_SECRET=your_session_secret_here

# Server
PORT=4000
NODE_ENV=development

# CORS
FRONTEND_URL=http://localhost:5173
```

### Frontend `.env` file (optional)

Create a `.env` file in the `frontend/` directory:

```env
# API Base URL
VITE_API_URL=http://localhost:4000/api

# Stripe Publishable Key
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

---

## 🚀 Installation & Running (local)

### 1. Clone the repository

```bash
git clone https://github.com/Ayush-aps/books_react.git
cd books
```

### 2. Setup Backend

```bash
cd backend
npm install
```

Create `.env` file with the variables listed above, then start the server:

```bash
# Development mode with nodemon
npm run dev

# Or production mode
npm start
```

Backend will run on `http://localhost:4000`

### 3. Setup Frontend

Open a new terminal:

```bash
cd frontend
npm install
```

Start the development server:

```bash
npm run dev
```

Frontend will run on `http://localhost:5173`

### 4. Open in browser

```
http://localhost:5173
```

---

## 🏗 Build for Production

### Backend

```bash
cd backend
npm start
```

### Frontend

```bash
cd frontend
npm run build
npm run preview
```

The optimized production build will be created in the `frontend/dist/` directory.

---

## 🧪 Demo flows & testing checklist

The mid-review demo requires showing these flows:

1. **Form validation demo** - Client-side validation using React Hook Form + Zod schemas
2. **Dynamic UI updates** - Real-time updates using Redux state management (e.g., admin approves a book)
3. **Three async flows** (show DevTools Network tab):
   * GET `/api/books` — Load books list
   * POST `/api/cart` — Add to cart
   * POST `/api/complaints` — Submit complaint

### Artifacts to collect

* `network_evidence/` — Screenshots of each network request in DevTools
* `git-logs.txt` — Git commits per author
* `test_plan.md` — Validated tests and results
* MongoDB dump

---

## 🔑 Key Implementation Details

### Frontend Architecture

* **State Management:** Redux Toolkit with Redux Persist for data persistence
* **Routing:** React Router DOM with protected routes
* **API Layer:** Centralized Axios services with interceptors
* **Form Handling:** React Hook Form with Zod validation schemas
* **Styling:** Tailwind CSS with custom components
* **Animations:** Framer Motion for smooth transitions

### Backend Architecture

* **Authentication:** Passport.js with local strategy
* **File Upload:** Multer middleware with Cloudinary storage
* **Session Management:** Express-session with MongoDB store
* **Logging:** Morgan for HTTP request logging
* **Security:** Helmet for security headers, rate limiting, CORS
* **Scheduled Tasks:** Node-cron for subscription renewals

### API Endpoints Structure

* `/api/auth/*` — Authentication routes
* `/api/books/*` — Book management
* `/api/buyer/*` — Buyer-specific operations
* `/api/seller/*` — Seller-specific operations
* `/api/admin/*` — Admin operations
* `/api/orders/*` — Order management
* `/api/subscription/*` — Subscription handling

---

## 💳 Payments & Subscriptions

* Stripe integration for secure payment processing
* Subscription plans with automated renewal via node-cron
* Support for both one-time purchases and recurring subscriptions
* Ensure `STRIPE_SECRET_KEY` and `STRIPE_PUBLISHABLE_KEY` are set in `.env` files

---

## 📊 Status & Roadmap

**Current version:** 1.0 (Mid-review)  
**Status:** Core features implemented as per FDFED; testing & final polish pending.

---

## 🐞 Troubleshooting

### Backend not starting

* Check `.env` variables in `backend/` directory
* Ensure MongoDB server (local or Atlas) is reachable
* Verify all required npm packages are installed

### Frontend errors

* Open browser console for JS errors
* Check that backend API is running on correct port
* Verify CORS settings allow frontend origin
* Ensure environment variables are prefixed with `VITE_`

### CORS issues

* Verify `FRONTEND_URL` in backend `.env` matches frontend dev server
* Check CORS middleware configuration in `backend/app.js`

### File upload issues

* Verify Cloudinary credentials in backend `.env`
* Check multer middleware configuration
* Ensure uploads directory exists and has write permissions

---

## 📞 Contact & Support

* **SPOC / Team lead:** Ayush Pratap Singh — `ayushpratap.s23@iiits.in` — Roll: `S20230010033`
* For issues: Open GitHub issues in the repository

---

## 🧾 License

This project is released under the **MIT License**.

---

## 🙏 Acknowledgments

* IIIT Sri City for project guidance
* Team members for their dedicated contributions
* Open-source community for amazing tools and libraries

---

**Made with ❤️ by Team 53**
