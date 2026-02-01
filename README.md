# Bookish — Unified Marketplace for Book Buyers, Sellers & Admins

A full-stack web platform that connects **buyers**, **sellers**, and **administrators** with role-based dashboards and features like browsing, selling, cart & orders, payment/subscriptions, video reviews, complaint resolution, and admin moderation. This README is crafted from your mid-review artifacts and demo plan to be copy-paste ready; placeholders are included where you may want to update project-specific links or secrets.

---

##  Quick links

* **Repository:** `https://github.com/Ayush-aps/books`
* **Demo video (Unlisted):** `https://www.youtube.com/watch?v=0gduV02pDyA`

---
## Metadata

* **Groupid:** 53
* **Project Title:** Bookish
* **SPOC / Team lead:** Ayush Pratap Singh — `ayushpratap.s23@iiits.in` — Roll: `S20230010033`
---

##  Project Summary

**Bookish** is a unified platform providing:

* Buyer features: book browsing, cart, subscriptions, personal library, reading progress, video reviews, complaint/support.
* Seller features: upload/manage books, inventory, order management, analytics.
* Admin features: user management, content moderation (approve/reject books), system reports, complaint resolution.

---

##  Team & Responsibilities

| Name               | Roll Number  | Responsibilities                                              |
| ------------------ | ------------ | ------------------------------------------------------------- |
| Ayush Pratap Singh | S20230010033 | Payment gateway, buyer’s library, admin reports, video feed.  |
| Piyush Kumar       | S20230010186 | Buyer profile, homepage, seller upload, user management.      |
| Ujjwal Singh       | S20230010245 | Order tracking, seller dashboard, admin moderation.           |
| Daivik Wadhwani    | S20230010064 | Complaint system, seller inventory, cart.                     |
| Gugulothu Nithin   | S20230010099 | Authentication, contact & about us, shared UI (header/footer) |

---

##  Tech Stack

**Frontend**

* EJS templating (server-side rendered pages)
* HTML5 & JavaScript
* Tailwind CSS for styling

**Backend**

* Node.js + Express
* MongoDB (Mongoose ODM)
* Cloudinary
* Payment integration (e.g. stripe)

---

##  Project Structure (typical)

```
bookish/
├── app.js                 # Express entry (or node server.js)
├── package.json
├── /config                # DB, cloudinary, payment keys
├── /controllers
├── /models                # Mongoose schemas
├── /routes
├── /views                 # EJS templates
├── /public                # static assets: css, js, images
├── /uploads               # if used
├── /artifacts             # network_evidence/, git-logs.txt, test_plan.md
└── README.md
```

---

##  Features (high level)

* Buyer:

  * Browse & search books, add to cart, checkout (subscription & purchases)
  * Personal library, reading progress, video reviews/feed
  * Submit & track complaints.
  * Profile management (addresses, orders)
    
* Seller:

  * Upload books with metadata and images
  * Inventory & order management
  * Sales analytics on dashboard
    
* Admin:

  * Content moderation (approve/reject books)
  * User & role management
  * Reports: users, books, orders, complaints

---

## Prerequisites

* Node.js v14+ and npm
* MongoDB (Local or Atlas)
* Git
* (Optional) nodemon for development
* Cloudinary account 
* Payment gateway credentials

---

##  Environment Variables

Create a `.env` file in project root (or `backend/`) with the following keys (fill values):

```env
# Database
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster0.mongodb.net/bookishdb

# Cloudinary (images)
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# Payment gateway (example Stripe)
Stripe_KEY_ID=...
Stripe_KEY_SECRET=...

# App
PORT=4000
```

---

## 🛠 Installation & Running (local)

1. **Clone**

```bash
git clone https://github.com/Ayush-aps/books.git
cd books
```

2. **Install**

```bash
npm install
```

3. **Set .env**
   Create `.env` with variables listed above.

4. **Run**

* Development with nodemon:

```bash
npx nodemon app.js
```

* Or:

```bash
node app.js
# or
npm start
```

5. **Open in browser**

```
http://localhost:4000
```

---

##  Demo flows & testing checklist

The mid-review demo requires showing these flows — recommend verifying & recording them for evidence:

1. **Form validation demo** (client-side DOM validation).
2. **Dynamic DOM update** — e.g., admin approves a book and the UI updates without reload.
3. **Three async flows (show DevTools Network tab):**

   * GET `/api/books` — Load books list.
   * POST `/api/cart` — Add to cart.
   * POST `/api/complaints` — Submit complaint.

**Artifacts to collect**

* `network_evidence/` — screenshots of each network request in DevTools.
* `git-logs.txt` — git commits per author (or screenshots).
* `test_plan.md` — validated tests and results.
* Mongo dump

---

##  Key files & where to look (implementation notes)

* `app.js` — Express entry point; session and middleware setup.
* `routes/` — routes for books, users, orders, complaints, admin.
* `controllers/` — actual business logic (orderController).
* `models/` — Mongoose schemas: `User`, `Book`, `Order`, `Complaint`, etc.
* `views/` — EJS templates and partials (header, footer, dashboards).
* `public/js/` — client-side form validation, dynamic DOM, AJAX calls (fetch).
* `config/` — DB connection, cloudinary, payment config.


---

## 💳 Payments & Subscriptions

* Payment integration implemented for subscription/purchase flows (example: stripe).
* Ensure `Stripe_*` keys are set in `.env` for live testing.

---

##  Status & Roadmap

**Current version:** 1.0 (Mid-review)
**Status:** Core features implemented as per FDFED; testing & final polish pending. 

---

## 🐞 Troubleshooting

**Backend not starting**

* Check `.env` variables and MongoDB URI.
* Ensure MongoDB server (local or Atlas) is reachable.

**Frontend errors**

* Open browser console for JS errors.
* Verify EJS variables passed from server.

---

## 📦 Submission artifacts (for mid-review)

* `/source` — full source code
* `README_FULL.md` (this file)
* `demo_link.txt` — video URL + timestamps
* `test_plan.md` — validation & async tests with results
* `network_evidence/` — screenshots
* `git-logs.txt`
* `Mongo dump`
* `documenation.pdf` 

---

## 📞 Contact & Support

* **SPOC / Team lead:** Ayush Pratap Singh — `ayushpratap.s23@iiits.in`. Roll: `S20230010033`
* For issues: open GitHub issues in the repository.

p---

## 🧾 License

This project is released under the **MIT License**.

---

## 🎬 Demo Video Timestamps (suggested)

https://www.youtube.com/watch?v=0gduV02pDyA

```
0:00  - Title slide & business case
0:50  - Form validation demo (client-side)
2:00  - Dynamic DOM demo (admin approve -> UI update)
3:30  - Async flows: Load Books, Add to Cart, Submit Complaint (show DevTools)
6:00  - Team contributions (10–20s per member)
6:30  - Wrap-up & artifacts location
```

---

## Evidence Locations
* **Git logs** - gitlogs.txt - https://github.com/Ayush-aps/books/blob/main/git-logs.txt
* **Network evidences** - Network Evidence Screenshot.pdf - https://github.com/Ayush-aps/books/blob/main/Network%20Evidence%20-Screenshots.pdf
* **Test Plan** - Test_Plan.pdf - https://github.com/Ayush-aps/books/blob/main/Test_Plan.pdf
* **Task Assignments** - Task Assignment.md - https://github.com/Ayush-aps/books/blob/main/task_assignment.md
* **Documentation pdf** - Group 53 Documentation.pdf - https://github.com/Ayush-aps/books/blob/main/Group%2053%20Documentation.pdf
---
