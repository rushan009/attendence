import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import bcrypt from "bcrypt";
import connectDB from "../src/config/db.config.js";
import User from "../src/models/user.model.js";

const BCRYPT_SALT_ROUNDS = 10;

const seedAdmin = async () => {
  const args = process.argv.slice(2);
  const phone = args[0] || process.env.ADMIN_PHONE;
  const pin = args[1] || process.env.ADMIN_PIN;
  const name = args[2] || process.env.ADMIN_NAME || "Super Admin";

  if (!phone || !pin) {
    console.error("Usage: node scripts/seedAdmin.js <phone> <pin> [name]");
    console.error("Or set ADMIN_PHONE and ADMIN_PIN environment variables.");
    process.exit(1);
  }

  // Validate phone format (10 digits starting with 9)
  if (!/^9\d{9}$/.test(phone)) {
    console.error(`Invalid phone number: "${phone}". Must be 10 digits starting with 9.`);
    process.exit(1);
  }

  // Validate PIN format (exactly 4 digits)
  if (!/^\d{4}$/.test(pin)) {
    console.error(`Invalid PIN: "${pin}". Must be exactly 4 digits.`);
    process.exit(1);
  }

  try {
    await connectDB();

    // Check if an admin user already exists
    const existingAdmin = await User.findOne({ role: "admin" });
    if (existingAdmin) {
      console.log(`An admin account already exists (Phone: ${existingAdmin.phone}, Name: ${existingAdmin.name}). Skipping seed.`);
      await mongoose.disconnect();
      process.exit(0);
    }

    // Check if phone number is already registered under any other role
    const phoneInUse = await User.findOne({ phone });
    if (phoneInUse) {
      console.error(`Phone number ${phone} is already registered to user: ${phoneInUse.name} (${phoneInUse.role}).`);
      await mongoose.disconnect();
      process.exit(1);
    }

    // Hash the 4-digit PIN
    const pinHash = await bcrypt.hash(pin, BCRYPT_SALT_ROUNDS);

    // Create the admin user with status "approved"
    const admin = await User.create({
      name,
      phone,
      pinHash,
      role: "admin",
      status: "approved", // explicitly set as approved
    });

    console.log("Admin account successfully created!");
    console.log(`  ID:     ${admin._id}`);
    console.log(`  Name:   ${admin.name}`);
    console.log(`  Phone:  ${admin.phone}`);
    console.log(`  Role:   ${admin.role}`);
    console.log(`  Status: ${admin.status}`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Failed to seed admin:", error.message);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    process.exit(1);
  }
};

seedAdmin();
