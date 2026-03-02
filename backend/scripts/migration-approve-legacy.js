/**
 * Migration Script: Approve Legacy Data
 *
 * This one-time script sets all pre-existing Books and Users to "approved" status
 * so they are visible on the public site after the schema update.
 *
 * Safety: Only targets records created before today OR currently "pending",
 * so newly uploaded content won't be auto-approved.
 *
 * Usage: node scripts/migration-approve-legacy.js
 */

const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

// Load env from backend root
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const Book = require("../models/Book");
const User = require("../models/User");

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error("ERROR: MONGODB_URI not found in .env");
    process.exit(1);
}

async function migrate() {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(MONGODB_URI);
        console.log("Connected.\n");

        // Use start of today as the cutoff date
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // ========================================
        // 1. Migrate Books
        // ========================================

        // Case A: Books that were already isApproved=true but don't have approvalStatus set properly
        const alreadyApprovedBooks = await Book.updateMany(
            {
                isApproved: true,
                $or: [
                    { approvalStatus: { $exists: false } },
                    { approvalStatus: "pending" },
                ],
            },
            {
                $set: {
                    approvalStatus: "approved",
                    approvalDate: new Date(),
                },
            }
        );
        console.log(
            `[Books] Already-approved books synced: ${alreadyApprovedBooks.modifiedCount}`
        );

        // Case B: Legacy pending books created before today
        const legacyPendingBooks = await Book.updateMany(
            {
                approvalStatus: "pending",
                isApproved: false,
                createdAt: { $lt: today },
                $or: [
                    { rejectionReason: null },
                    { rejectionReason: { $exists: false } },
                ],
            },
            {
                $set: {
                    approvalStatus: "approved",
                    isApproved: true,
                    approvalDate: new Date(),
                },
            }
        );
        console.log(
            `[Books] Legacy pending books approved: ${legacyPendingBooks.modifiedCount}`
        );

        // ========================================
        // 2. Migrate Users
        // ========================================

        // Approve all existing sellers, employees, moderators, buyers, and admins
        // that are still "pending" and were created before today
        const legacyUsers = await User.updateMany(
            {
                verificationStatus: "pending",
                createdAt: { $lt: today },
            },
            {
                $set: {
                    verificationStatus: "approved",
                    // Leave managedBy as null to signify system migration
                },
            }
        );
        console.log(
            `[Users] Legacy pending users approved: ${legacyUsers.modifiedCount}`
        );

        // Also handle users that don't have verificationStatus at all (pre-migration records)
        const missingStatusUsers = await User.updateMany(
            {
                $or: [
                    { verificationStatus: { $exists: false } },
                ],
            },
            {
                $set: {
                    verificationStatus: "approved",
                },
            }
        );
        console.log(
            `[Users] Users missing verificationStatus fixed: ${missingStatusUsers.modifiedCount}`
        );

        // ========================================
        // Summary
        // ========================================
        console.log("\n✅ Migration complete!");
        console.log(
            `   Books updated: ${alreadyApprovedBooks.modifiedCount + legacyPendingBooks.modifiedCount}`
        );
        console.log(
            `   Users updated: ${legacyUsers.modifiedCount + missingStatusUsers.modifiedCount}`
        );
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log("\nDisconnected from MongoDB.");
    }
}

migrate();
