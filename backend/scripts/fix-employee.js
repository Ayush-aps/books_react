/**
 * Reset employee1@gmail.com password and verify the account.
 * 
 * Usage: node scripts/fix-employee.js
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

    // Reset password and verify
    user.password = "Employee@1";
    user.isVerified = true;
    await user.save(); // pre-save hook will bcrypt the password

    console.log("✅ employee1@gmail.com has been fixed:");
    console.log("   Password reset to: Employee@1");
    console.log("   isVerified set to: true");

    await mongoose.disconnect();
}

main().catch(err => { console.error(err); process.exit(1); });
