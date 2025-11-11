/**
 * Redux Store Configuration
 */

import { createStore, applyMiddleware, combineReducers } from 'redux';
import {thunk} from 'redux-thunk';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

// Import reducers
import authReducer from './reducers/authReducer';
import cartReducer from './reducers/cartReducer';
import booksReducer from './reducers/booksReducer';
import ordersReducer from './reducers/ordersReducer';
import subscriptionReducer from './reducers/subscriptionReducer';
import libraryReducer from './reducers/libraryReducer';
import complaintReducer from './reducers/complaintReducer';

// Combine all reducers
const rootReducer = combineReducers({
  auth: authReducer,
  cart: cartReducer,
  books: booksReducer,
  orders: ordersReducer,
  subscription: subscriptionReducer,
  library: libraryReducer,
  complaints: complaintReducer,
});

// Persist configuration
const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['auth', 'cart'], // Only persist auth and cart
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

// Create store
const store = createStore(
  persistedReducer,
  applyMiddleware(thunk)
);

export const persistor = persistStore(store);
export default store;
