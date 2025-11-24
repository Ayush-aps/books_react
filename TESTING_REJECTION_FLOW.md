# Testing Guide: Book Rejection Flow

## Test Scenario: Complete Rejection Workflow

### Prerequisites
- Admin account logged in
- Seller account with at least one pending book
- Backend and frontend servers running

### Test Steps

#### 1. **Upload a Book as Seller**
1. Login as Seller
2. Navigate to `/seller/inventory`
3. Click "Add New Book"
4. Fill in book details (Title: "Test Book", Author: "Test Author", etc.)
5. Submit the book
6. **Expected**: Book shows with "Pending Review" badge in inventory

#### 2. **Admin Reviews and Rejects the Book**
1. Logout and login as Admin
2. Navigate to `/admin/content`
3. Click on "Pending Review" tab
4. Find "Test Book" in the list
5. Click "View Details" button
   - **Bug Check**: Button should navigate to `/admin/content/:id`
   - **Expected**: Book details page loads successfully
6. Click "Reject Book" button
7. In the modal, enter feedback:
   ```
   Please provide a higher quality cover image (minimum 800x1200px) 
   and verify that the ISBN format is correct.
   ```
8. Click "Confirm Rejection"
9. **Expected**: 
   - Success message: "Book rejected. Seller has been notified with feedback."
   - Book moves to "Rejected" tab

#### 3. **Verify Rejected Tab (Admin)**
1. Still on `/admin/content`
2. Click "Rejected" tab
3. **Expected**: 
   - "Test Book" appears in the rejected list
   - Shows red "Rejected" badge
   - Book is NOT deleted from database

#### 4. **Seller Views Rejection Feedback**
1. Logout and login as Seller
2. Navigate to `/seller/inventory`
3. **Expected**: "Test Book" still appears in inventory
4. Click "Rejected" tab in the status filters
5. **Expected**: 
   - "Test Book" appears in rejected list
   - Red warning box shows admin feedback
   - Message: "⚠️ Admin Feedback: Please provide a higher quality cover image..."
   - Shows: "Please update this book based on the feedback above."

#### 5. **Verify Database State**
Check MongoDB for the book document:
```javascript
{
  _id: ObjectId("..."),
  title: "Test Book",
  isApproved: false,
  rejectionReason: "Please provide a higher quality cover image...",
  rejectionDate: ISODate("2025-11-24T..."),
  approvalDate: null,
  seller: ObjectId("..."),
  // ... other fields
}
```

#### 6. **Test Re-Approval Flow**
1. As Seller, edit the book to improve based on feedback
2. As Admin, go to `/admin/content` → "Rejected" tab
3. Click "View Details" on "Test Book"
4. Click "Re-Approve Book" button
5. **Expected**:
   - Book moves from Rejected to Approved
   - `isApproved: true`, `rejectionReason: null`, `approvalDate: Date`
   - Book now visible to buyers in browse section

### Expected Results Summary

| Location | Before Rejection | After Rejection | After Re-Approval |
|----------|-----------------|-----------------|-------------------|
| Admin - Pending | ✅ Shows book | ❌ Book removed | ❌ Not here |
| Admin - Approved | ❌ Not here | ❌ Not here | ✅ Shows book |
| Admin - Rejected | ❌ Not here | ✅ Shows book | ❌ Book removed |
| Seller - All Books | ✅ Shows book | ✅ Shows book | ✅ Shows book |
| Seller - Pending | ✅ Shows book | ❌ Book removed | ❌ Not here |
| Seller - Rejected | ❌ Not here | ✅ Shows book | ❌ Book removed |
| Seller - Approved | ❌ Not here | ❌ Not here | ✅ Shows book |
| Buyer - Browse | ❌ Not visible | ❌ Not visible | ✅ Visible |
| Database | isApproved: false | isApproved: false + reason | isApproved: true |

### Bug Fixes Implemented

#### Issue 1: View Details Button Not Working
**Problem**: Button with `as={Link}` prop didn't navigate
**Fix**: Wrapped Button with Link component directly
```jsx
<Link to={`/admin/content/${book._id}`} className="flex-1">
  <Button variant="outline" size="sm" fullWidth>
    View Details
  </Button>
</Link>
```

#### Issue 2: Rejected Books Not Showing in Lists
**Problems**:
1. Backend query for rejected books had logic issues
2. Frontend not properly handling rejected books
3. Seller inventory filter not working for rejected status

**Fixes**:
1. **Backend**: Updated `getInventory` to properly filter rejected books
2. **Backend**: Fixed query conflict between search and status filters using `$and`
3. **Backend**: `getContent` now returns `rejectedBooks` array
4. **Frontend**: Admin Books page handles rejected books state
5. **Frontend**: Seller inventory shows rejected status with feedback

#### Issue 3: Books Being Deleted Instead of Marked
**Problem**: Original code deleted rejected books
**Fix**: Changed to update book with rejection fields instead of delete:
```javascript
// Before (WRONG)
await Book.findByIdAndDelete(req.params.id);

// After (CORRECT)
await Book.findByIdAndUpdate(req.params.id, {
  isApproved: false,
  rejectionReason: reason,
  rejectionDate: new Date()
});
```

### API Endpoints

#### Admin
- `GET /api/admin/content` - Returns `{ pendingBooks, approvedBooks, rejectedBooks }`
- `POST /api/admin/content/:id/approve` - Approves book
- `POST /api/admin/content/:id/reject` - Rejects book with reason (body: `{ reason }`)

#### Seller
- `GET /api/seller/inventory?status=rejected` - Get rejected books
- `GET /api/seller/inventory?status=pending` - Get pending books
- `GET /api/seller/inventory?status=approved` - Get approved books
- `GET /api/seller/inventory` - Get all books

### Common Issues & Solutions

**Issue**: Rejected books don't appear after rejection
**Solution**: Clear browser cache, check MongoDB to verify book has `rejectionReason` field

**Issue**: "View Details" button doesn't work
**Solution**: Ensure Link component is imported and wrapping Button

**Issue**: Seller can't see rejection feedback
**Solution**: Verify book has `rejectionReason` populated in database

**Issue**: Pending filter shows rejected books
**Solution**: Backend filters by both `isApproved: false` AND no `rejectionReason`

---

**Last Updated**: November 24, 2025
**Status**: ✅ All issues fixed and tested
