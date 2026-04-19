/**
 * Seed 4 department managers into the database
 * Run: node seedManagers.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const MANAGERS = [
  { name: 'Manager Marketplace', email: 'bookish.marketplace.mgr@gmail.com', department: 'marketplace' },
  { name: 'Manager Support',     email: 'bookish.support.mgr@gmail.com',     department: 'support' },
  { name: 'Manager Finance',     email: 'bookish.finance.mgr@gmail.com',     department: 'finance' },
  { name: 'Manager Tech',        email: 'bookish.tech.mgr@gmail.com',        department: 'tech' },
];

const PASSWORD = 'Manager@123';

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    for (const mgr of MANAGERS) {
      const exists = await User.findOne({ email: mgr.email });
      if (exists) {
        console.log(`Already exists: ${mgr.email} (role: ${exists.role})`);
        // Update to manager if needed
        if (exists.role !== 'manager' || exists.department !== mgr.department) {
          exists.role = 'manager';
          exists.department = mgr.department;
          exists.verificationStatus = 'approved';
          await exists.save();
          console.log(`  -> Updated to manager, dept: ${mgr.department}`);
        }
        // Fix password if double-hashed
        exists.password = PASSWORD;
        await exists.save();
        console.log(`  -> Password reset for: ${mgr.email}`);
        continue;
      }

      const user = new User({
        name: mgr.name,
        email: mgr.email,
        password: PASSWORD, // pre-save hook will hash it
        role: 'manager',
        department: mgr.department,
        verificationStatus: 'approved',
        isVerified: true,
      });
      await user.save();
      console.log(`Created: ${mgr.email} (dept: ${mgr.department})`);
    }

    console.log('\n--- Manager Credentials ---');
    MANAGERS.forEach(m => console.log(`  ${m.email} / ${PASSWORD}  (dept: ${m.department})`));
    console.log('---------------------------\n');

    await mongoose.disconnect();
    console.log('Done. Disconnected.');
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seed();
