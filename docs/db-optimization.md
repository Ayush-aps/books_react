# Database Optimization Report

## Scope
Focused on high-frequency paths:
- Login (`User.findOne({ email })`)
- Get by id (`User.findById`, `Book.findById`, `Order.findOne`)
- List APIs (`admin users`, `books browse`, `orders listing`)

## Issues Identified (Before)
1. Broad field selection in login query.
2. Repeated list filters on status/role/seller without compound indexes.
3. List APIs hydrating full Mongoose documents where plain JSON was enough.

## Optimizations Applied

### 1) Indexing (Mongoose schema-level)
Added/validated B-tree indexes:

- `models/User.js`
  - `{ role: 1, createdAt: -1 }`
  - `{ verificationStatus: 1, role: 1, createdAt: -1 }`
  - `{ isVerified: 1, createdAt: -1 }`

- `models/Book.js`
  - `{ isApproved: 1, isAvailable: 1, createdAt: -1 }`
  - `{ seller: 1, createdAt: -1 }`
  - `{ condition: 1, price: 1 }`
  - `{ genres: 1, createdAt: -1 }`
  - Existing text index retained for search

- `models/Order.js`
  - `{ buyer: 1, createdAt: -1 }`
  - `{ "items.seller": 1, createdAt: -1 }`
  - `{ orderStatus: 1, createdAt: -1 }`
  - `{ buyer: 1, orderStatus: 1, createdAt: -1 }`

- `models/Library.js`
  - `{ user: 1 }` unique
  - `{ "items.book": 1 }`

- `models/Subscription.js`
  - `{ user: 1, isActive: 1, endDate: -1 }`
  - `{ stripeSubscriptionId: 1 }` sparse
  - `{ stripeCustomerId: 1 }` sparse

### 2) Query Optimization
- Login query narrowed to required fields only:
  - `config/passport.js`
  - `User.findOne({ email }).select("name email role avatar isVerified +password")`

- Admin users list now selects only required columns and uses `.lean()`:
  - `controllers/adminController.js`

- Books browse list now uses `.select(...)` + `.lean()`:
  - `routes/books.js`

## Before vs After (Representative)

### Login
Before:
```js
User.findOne({ email }).select("+password")
```
After:
```js
User.findOne({ email }).select("name email role avatar isVerified +password")
```

### Admin users list
Before:
```js
User.find(query).sort({ createdAt: -1 })
```
After:
```js
User.find(query)
  .select("name email role isVerified verificationStatus avatar createdAt")
  .sort({ createdAt: -1 })
  .lean()
```

### Books browse list
Before:
```js
Book.find(query).sort(sortOption).populate("seller", "name")
```
After:
```js
Book.find(query)
  .select("title author coverImage price discountPrice discountPercentage condition rating reviewCount seller isApproved isAvailable createdAt")
  .sort(sortOption)
  .populate("seller", "name")
  .lean()
```

## Why Indexing Improves Performance
MongoDB uses B-tree indexes. A B-tree lets lookups, range scans, and sorted retrieval run approximately in `O(log n)` instead of scanning all documents (`O(n)`).

That means:
- Faster authentication lookups by indexed keys (email).
- Faster list filtering and sorting by indexed compound fields.
- Lower CPU and IO usage under load.
