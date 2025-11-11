# Bookish - Modern React Frontend

This is the React frontend application for the Bookish online book marketplace.

## Tech Stack

- **React 18+**: UI library
- **Vite**: Build tool and dev server
- **React Router v6**: Client-side routing
- **Redux**: State management
- **Redux Thunk**: Async actions
- **Redux Persist**: State persistence
- **Axios**: HTTP client
- **Tailwind CSS**: Utility-first CSS framework

## Project Structure

```
frontend/
├── public/                  # Static assets
├── src/
│   ├── components/          # Reusable React components
│   │   ├── layout/         # Header, Footer, etc.
│   │   └── PrivateRoute.jsx
│   ├── pages/              # Page components
│   │   ├── auth/           # Login, Register
│   │   ├── buyer/          # Buyer pages
│   │   ├── seller/         # Seller pages
│   │   └── admin/          # Admin pages
│   ├── redux/              # State management
│   │   ├── actions/        # Action creators
│   │   ├── reducers/       # Reducers
│   │   └── store.js        # Redux store config
│   ├── services/           # API service layer
│   │   ├── api.js          # Axios instance
│   │   ├── authService.js
│   │   └── buyerService.js
│   ├── utils/              # Utility functions
│   ├── App.jsx             # Main App component
│   ├── main.jsx            # Entry point
│   └── index.css           # Global styles
├── .env.example            # Environment variables template
├── index.html              # HTML template
├── package.json            # Dependencies
├── tailwind.config.js      # Tailwind configuration
├── postcss.config.js       # PostCSS configuration
└── vite.config.js          # Vite configuration
```

## Setup Instructions

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
VITE_API_URL=http://localhost:5000/api
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```

### 3. Start Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### 4. Build for Production

```bash
npm run build
```

## Implementation Status

### ✅ Completed
- Project scaffolding with Vite
- Redux store configuration
- Redux Persist for state management
- API service layer with Axios interceptors
- Authentication actions and reducers
- Cart actions and reducers
- Auth pages (Login, Register)
- Layout components (Header, Footer)
- Private route component
- Routing structure with React Router

### 🚧 In Progress (Requires Implementation)
- All buyer page implementations
- All seller page implementations
- All admin page implementations
- Remaining Redux actions/reducers
- Additional API services
- Reusable UI components
- Form validation
- Error boundary components
- Loading states
- Toast notifications

## Development Guide

### Adding a New Page

1. Create the component in `src/pages/[role]/PageName.jsx`
2. Add the route in `App.jsx`
3. Create API service methods if needed
4. Create Redux actions/reducers if needed
5. Connect component to Redux store

Example:

```javascript
// src/pages/buyer/NewPage.jsx
import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchData } from '../../redux/actions/dataActions';

const NewPage = () => {
  const dispatch = useDispatch();
  const { data, loading } = useSelector(state => state.data);
  
  useEffect(() => {
    dispatch(fetchData());
  }, [dispatch]);
  
  if (loading) return <div>Loading...</div>;
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1>New Page</h1>
      {/* Component content */}
    </div>
  );
};

export default NewPage;
```

### Redux Action Pattern

```javascript
// src/redux/actions/exampleActions.js
export const FETCH_DATA_REQUEST = 'FETCH_DATA_REQUEST';
export const FETCH_DATA_SUCCESS = 'FETCH_DATA_SUCCESS';
export const FETCH_DATA_FAILURE = 'FETCH_DATA_FAILURE';

export const fetchData = () => async (dispatch) => {
  try {
    dispatch({ type: FETCH_DATA_REQUEST });
    
    const response = await api.get('/endpoint');
    
    dispatch({
      type: FETCH_DATA_SUCCESS,
      payload: response.data
    });
  } catch (error) {
    dispatch({
      type: FETCH_DATA_FAILURE,
      payload: error.message
    });
  }
};
```

### API Service Pattern

```javascript
// src/services/exampleService.js
import api from './api';

export const exampleService = {
  getData: async () => {
    return await api.get('/endpoint');
  },
  
  postData: async (data) => {
    return await api.post('/endpoint', data);
  },
};
```

## Key Features

### Authentication
- Session-based authentication with cookies
- Protected routes based on user roles
- Auto-redirect based on user role after login

### State Management
- Centralized state with Redux
- Persistent authentication state
- Cart state persistence

### API Integration
- Axios interceptors for error handling
- Automatic auth token inclusion (if using JWT)
- Global error handling

## Common Tasks

### Check Authentication Status
Authentication is automatically checked on app load via the `checkAuth` action.

### Access Current User
```javascript
const { user, isAuthenticated } = useSelector(state => state.auth);
```

### Make API Calls
```javascript
import buyerService from '../services/buyerService';

const data = await buyerService.getBooks();
```

### Dispatch Actions
```javascript
import { addToCart } from '../redux/actions/cartActions';
const dispatch = useDispatch();
dispatch(addToCart(bookId, quantity));
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Development Tools

- **Redux DevTools**: Install the browser extension for debugging Redux state
- **React Developer Tools**: Install for debugging React components
- **Vite Dev Tools**: Built-in HMR and fast refresh

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API base URL | `http://localhost:5000/api` |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | - |

## Scripts

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run preview`: Preview production build
- `npm run lint`: Run ESLint

## Next Steps

1. **Implement Page Components**: Convert EJS views to React components
2. **Add Remaining Redux Actions**: Implement actions for books, orders, subscriptions, etc.
3. **Create Reusable Components**: BookCard, Filter, Pagination, etc.
4. **Add Form Validation**: Use a library like Formik or React Hook Form
5. **Implement Error Handling**: Add error boundaries and toast notifications
6. **Add Loading States**: Implement skeleton screens
7. **Optimize Performance**: Code splitting, lazy loading
8. **Add Tests**: Unit tests with Vitest, E2E tests with Playwright

## Troubleshooting

### CORS Issues
Ensure the backend has CORS configured for `http://localhost:5173`

### Session Cookie Not Set
Check that `withCredentials: true` is set in Axios config

### Redux State Not Persisting
Check Redux Persist configuration in `store.js`

### 401 Unauthorized Errors
Verify that the backend session is active and cookies are being sent

## Resources

- [React Documentation](https://react.dev/)
- [Redux Documentation](https://redux.js.org/)
- [React Router Documentation](https://reactrouter.com/)
- [Vite Documentation](https://vitejs.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [Axios Documentation](https://axios-http.com/)
