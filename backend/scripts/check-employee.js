/**
 * Quick script to check employee1@gmail.com account status
 * and reset its password if needed.
 * 
 * Usage: node scripts/check-employee.js
 */
const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

async function main() {
    await mongoose.connect(process.env.MONGODB_URI);
    const User = require("../models/User");

    const user = await User.findOne({ email: "employee1@gmail.com" }).select("+password");

    if (!user) {
        console.log("❌ No user found with email employee1@gmail.com");
        process.exit(0);
    }

    console.log("✅ User found:");
    console.log("   Name:", user.name);
    console.log("   Email:", user.email);
    console.log("   Role:", user.role);
    console.log("   isVerified:", user.isVerified);
    console.log("   verificationStatus:", user.verificationStatus);
    console.log("   Password hash exists:", !!user.password);
    console.log("   Created:", user.createdAt);

    // Test password
    const testPasswords = ["Employee@1", "employee@1", "Employee1", "employee1", "password", "123456"];
    for (const pwd of testPasswords) {
        const match = await user.matchPassword(pwd);
        if (match) {
            console.log(`\n🔑 Current password matches: "${pwd}"`);
            break;
        }
    }

    await mongoose.disconnect();
}

main().catch(err => { console.error(err); process.exit(1); });
