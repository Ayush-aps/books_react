/**
 * MIGRATION SCRIPT — moderator → manager
 * 
 * Run once: node scripts/migrate-moderator-to-manager.js
 * 
 * This script:
 * 1. Renames role:"moderator" → role:"manager" in users collection
 * 2. Updates userRole:"moderator" → "manager" in complaints collection
 * 3. Ensures existing employee docs have employee_type (defaults to "support")
 * 4. Seeds the admin account if missing
 * 5. Seeds the 4 manager accounts if missing
 * 6. Creates one sample employee per department (optional, for dev/testing)
 * 7. Adds manager_type to existing manager docs
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI;

// ═══════════════════════════════════════════════
// SEED DATA
// ═══════════════════════════════════════════════

const ADMIN_SEED = {
  name: 'Super Admin',
  email: 'admin@bookish.com',
  password: 'Admin@123',
  role: 'admin',
  verificationStatus: 'approved',
  isVerified: true,
};

const MANAGER_SEEDS = [
  {
    name: 'Marketplace Manager',
    email: 'marketplace.manager@bookish.com',
    password: 'Manager@123',
    role: 'manager',
    manager_type: 'marketplace',
    verificationStatus: 'approved',
    isVerified: true,
  },
  {
    name: 'Support Manager',
    email: 'support.manager@bookish.com',
    password: 'Manager@123',
    role: 'manager',
    manager_type: 'support',
    verificationStatus: 'approved',
    isVerified: true,
  },
  {
    name: 'Finance Manager',
    email: 'finance.manager@bookish.com',
    password: 'Manager@123',
    role: 'manager',
    manager_type: 'finance',
    verificationStatus: 'approved',
    isVerified: true,
  },
  {
    name: 'Tech Manager',
    email: 'tech.manager@bookish.com',
    password: 'Manager@123',
    role: 'manager',
    manager_type: 'tech',
    verificationStatus: 'approved',
    isVerified: true,
  },
];

const SAMPLE_EMPLOYEES = [
  { name: 'MKT Employee 1', email: 'emp.marketplace@bookish.com', password: 'Employee@123', employee_type: 'marketplace' },
  { name: 'SUP Employee 1', email: 'emp.support@bookish.com', password: 'Employee@123', employee_type: 'support' },
  { name: 'FIN Employee 1', email: 'emp.finance@bookish.com', password: 'Employee@123', employee_type: 'finance' },
  { name: 'TECH Employee 1', email: 'emp.tech@bookish.com', password: 'Employee@123', employee_type: 'tech' },
];

const SAMPLE_SELLERS = [
  { name: 'Sample Seller', email: 'seller@bookish.com', password: 'Seller@123', role: 'seller', verificationStatus: 'approved', isVerified: true },
];

const SAMPLE_BUYERS = [
  { name: 'Sample Buyer', email: 'buyer@bookish.com', password: 'Buyer@123', role: 'buyer', verificationStatus: 'approved', isVerified: true },
];

// ═══════════════════════════════════════════════
// MIGRATION LOGIC
// ═══════════════════════════════════════════════

async function migrate() {
  console.log('🔄 Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;
  console.log('✅ Connected.\n');

  // ─── Step 1: Rename role "moderator" → "manager" in users ───
  console.log('Step 1: Renaming role "moderator" → "manager" in users collection...');
  const userResult = await db.collection('users').updateMany(
    { role: 'moderator' },
    { $set: { role: 'manager' } }
  );
  console.log(`   Updated ${userResult.modifiedCount} user(s).\n`);

  // ─── Step 2: Update complaints collection ───
  console.log('Step 2: Updating complaints — userRole "moderator" → "manager"...');
  const complaintResult = await db.collection('complaints').updateMany(
    { userRole: 'moderator' },
    { $set: { userRole: 'manager' } }
  );
  console.log(`   Updated ${complaintResult.modifiedCount} complaint(s).\n`);

  // Also update comments.userRole inside complaints
  console.log('Step 2b: Updating complaint comments userRole...');
  const commentResult = await db.collection('complaints').updateMany(
    { 'comments.userRole': 'moderator' },
    { $set: { 'comments.$[elem].userRole': 'manager' } },
    { arrayFilters: [{ 'elem.userRole': 'moderator' }] }
  );
  console.log(`   Updated ${commentResult.modifiedCount} complaint comment(s).\n`);

  // ─── Step 3: Ensure employees have employee_type ───
  console.log('Step 3: Ensuring all employees have employee_type...');
  const empResult = await db.collection('users').updateMany(
    { role: 'employee', employee_type: { $exists: false } },
    { $set: { employee_type: 'support' } } // default to support if unknown
  );
  console.log(`   Updated ${empResult.modifiedCount} employee(s) with default employee_type.\n`);

  // ─── Step 4: Assign manager_type to existing managers ───
  console.log('Step 4: Assigning manager_type to existing managers without one...');
  const managersWithout = await db.collection('users').find(
    { role: 'manager', manager_type: { $exists: false } }
  ).toArray();
  
  for (const mgr of managersWithout) {
    // Try to infer from name/email
    let mType = 'support'; // default
    const lower = (mgr.name + ' ' + mgr.email).toLowerCase();
    if (lower.includes('marketplace') || lower.includes('mkt')) mType = 'marketplace';
    else if (lower.includes('finance') || lower.includes('fin')) mType = 'finance';
    else if (lower.includes('tech')) mType = 'tech';
    else if (lower.includes('support') || lower.includes('sup')) mType = 'support';

    await db.collection('users').updateOne(
      { _id: mgr._id },
      { $set: { manager_type: mType } }
    );
    console.log(`   Set manager_type="${mType}" for ${mgr.name} (${mgr.email})`);
  }
  console.log('');

  // ─── Step 5: Link employees to their manager ───
  console.log('Step 5: Linking employees to their department manager...');
  const managers = await db.collection('users').find({ role: 'manager' }).toArray();
  const managerMap = {};
  for (const m of managers) {
    if (m.manager_type) managerMap[m.manager_type] = m._id;
  }

  const employees = await db.collection('users').find({ role: 'employee', employee_type: { $exists: true } }).toArray();
  for (const emp of employees) {
    const managerId = managerMap[emp.employee_type];
    if (managerId && (!emp.managedBy || emp.managedBy.toString() !== managerId.toString())) {
      await db.collection('users').updateOne(
        { _id: emp._id },
        { $set: { managedBy: managerId } }
      );
      console.log(`   Linked ${emp.name} → ${emp.employee_type} manager`);
    }
  }
  console.log('');

  // ─── Step 6: Seed Admin ───
  console.log('Step 6: Seeding Admin account...');
  const existingAdmin = await db.collection('users').findOne({ role: 'admin' });
  if (existingAdmin) {
    console.log(`   Admin already exists: ${existingAdmin.email}\n`);
  } else {
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(ADMIN_SEED.password, salt);
    await db.collection('users').insertOne({
      ...ADMIN_SEED,
      password: hashed,
      avatar: '/img/users/default-avatar.jpg',
      recentlyViewed: [],
      createdAt: new Date(),
    });
    console.log(`   ✅ Admin seeded: ${ADMIN_SEED.email}\n`);
  }

  // ─── Step 7: Seed 4 Managers ───
  console.log('Step 7: Seeding 4 Manager accounts...');
  for (const mgr of MANAGER_SEEDS) {
    const existing = await db.collection('users').findOne({ email: mgr.email });
    if (existing) {
      // Ensure manager_type is set
      if (!existing.manager_type) {
        await db.collection('users').updateOne(
          { _id: existing._id },
          { $set: { manager_type: mgr.manager_type, role: 'manager' } }
        );
        console.log(`   Updated existing: ${mgr.email} → manager_type: ${mgr.manager_type}`);
      } else {
        console.log(`   Already exists: ${mgr.email}`);
      }
    } else {
      const salt = await bcrypt.genSalt(10);
      const hashed = await bcrypt.hash(mgr.password, salt);
      await db.collection('users').insertOne({
        ...mgr,
        password: hashed,
        avatar: '/img/users/default-avatar.jpg',
        recentlyViewed: [],
        createdAt: new Date(),
      });
      console.log(`   ✅ Seeded: ${mgr.email} (${mgr.manager_type})`);
    }
  }
  console.log('');

  // ─── Step 8: Seed sample employees (for testing) ───
  console.log('Step 8: Seeding sample employees (one per department)...');
  // Refresh manager map
  const freshManagers = await db.collection('users').find({ role: 'manager' }).toArray();
  const freshMap = {};
  for (const m of freshManagers) {
    if (m.manager_type) freshMap[m.manager_type] = m._id;
  }

  for (const emp of SAMPLE_EMPLOYEES) {
    const existing = await db.collection('users').findOne({ email: emp.email });
    if (existing) {
      console.log(`   Already exists: ${emp.email}`);
    } else {
      const salt = await bcrypt.genSalt(10);
      const hashed = await bcrypt.hash(emp.password, salt);
      await db.collection('users').insertOne({
        name: emp.name,
        email: emp.email,
        password: hashed,
        role: 'employee',
        employee_type: emp.employee_type,
        managedBy: freshMap[emp.employee_type] || null,
        verificationStatus: 'approved',
        isVerified: true,
        avatar: '/img/users/default-avatar.jpg',
        recentlyViewed: [],
        createdAt: new Date(),
      });
      console.log(`   ✅ Seeded: ${emp.email} (${emp.employee_type})`);
    }
  }
  console.log('');

  // ─── Step 9: Seed sample seller & buyer ───
  console.log('Step 9: Seeding sample seller & buyer...');
  for (const user of [...SAMPLE_SELLERS, ...SAMPLE_BUYERS]) {
    const existing = await db.collection('users').findOne({ email: user.email });
    if (existing) {
      console.log(`   Already exists: ${user.email}`);
    } else {
      const salt = await bcrypt.genSalt(10);
      const hashed = await bcrypt.hash(user.password, salt);
      await db.collection('users').insertOne({
        ...user,
        password: hashed,
        avatar: '/img/users/default-avatar.jpg',
        recentlyViewed: [],
        createdAt: new Date(),
      });
      console.log(`   ✅ Seeded: ${user.email} (${user.role})`);
    }
  }
  console.log('');

  // ─── Step 10: Create indexes for new queries ───
  console.log('Step 10: Creating indexes...');
  
  // User indexes
  await db.collection('users').createIndex({ role: 1, employee_type: 1 });
  await db.collection('users').createIndex({ role: 1, manager_type: 1 });
  await db.collection('users').createIndex({ managedBy: 1 });
  await db.collection('users').createIndex({ role: 1, verificationStatus: 1 });
  console.log('   ✅ User indexes created');

  // Order indexes
  await db.collection('orders').createIndex({ orderStatus: 1, paymentStatus: 1 });
  await db.collection('orders').createIndex({ 'items.seller': 1 });
  await db.collection('orders').createIndex({ orderDate: -1 });
  await db.collection('orders').createIndex({ buyer: 1, orderDate: -1 });
  console.log('   ✅ Order indexes created');

  // Complaint indexes
  await db.collection('complaints').createIndex({ status: 1, priority: -1 });
  await db.collection('complaints').createIndex({ assignedTo: 1 });
  await db.collection('complaints').createIndex({ 'resolution.resolvedBy': 1 });
  console.log('   ✅ Complaint indexes created');

  // Book indexes (additional)
  await db.collection('books').createIndex({ seller: 1, approvalStatus: 1 });
  await db.collection('books').createIndex({ rating: -1 });
  console.log('   ✅ Book indexes created');
  
  console.log('');

  // ─── Summary ───
  console.log('═══════════════════════════════════════════');
  console.log('  MIGRATION COMPLETE');
  console.log('═══════════════════════════════════════════');
  console.log('');
  console.log('Test Credentials:');
  console.log('  Admin:     admin@bookish.com / Admin@123');
  console.log('  Managers:  marketplace.manager@bookish.com / Manager@123');
  console.log('             support.manager@bookish.com / Manager@123');
  console.log('             finance.manager@bookish.com / Manager@123');
  console.log('             tech.manager@bookish.com / Manager@123');
  console.log('  Employees: emp.marketplace@bookish.com / Employee@123');
  console.log('             emp.support@bookish.com / Employee@123');
  console.log('             emp.finance@bookish.com / Employee@123');
  console.log('             emp.tech@bookish.com / Employee@123');
  console.log('  Seller:    seller@bookish.com / Seller@123');
  console.log('  Buyer:     buyer@bookish.com / Buyer@123');
  console.log('');

  await mongoose.disconnect();
  console.log('Disconnected from MongoDB.');
}

migrate().catch(err => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
