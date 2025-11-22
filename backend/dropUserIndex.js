/**
 * Script to drop the unique index on user field in subscriptions collection
 * This allows multiple subscriptions per user (one active, others queued)
 */

require('dotenv').config();
const mongoose = require('mongoose');

async function dropUserIndex() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get the subscriptions collection
    const db = mongoose.connection.db;
    const collection = db.collection('subscriptions');

    // List all indexes to see what exists
    const indexes = await collection.indexes();
    console.log('\n📋 Current indexes:', JSON.stringify(indexes, null, 2));

    // Drop the user_1 unique index
    try {
      await collection.dropIndex('user_1');
      console.log('\n✅ Successfully dropped user_1 unique index');
    } catch (err) {
      if (err.code === 27) {
        console.log('\n⚠️ Index user_1 does not exist (already dropped)');
      } else {
        throw err;
      }
    }

    // List indexes after dropping
    const indexesAfter = await collection.indexes();
    console.log('\n📋 Indexes after drop:', JSON.stringify(indexesAfter, null, 2));

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Error:', err);
    process.exit(1);
  }
}

dropUserIndex();
