import bcrypt from "bcrypt";
import User from "../models/user.model.js";

const BCRYPT_SALT_ROUNDS = 10;

/**
 * Automatically seeds the default super-admin if no admin exists in the database.
 * Does not exit the process; returns the created or existing admin, or null.
 */
export const autoSeedAdmin = async () => {
  const phone = (process.env.ADMIN_PHONE || "9816995484").trim();
  const pin = (process.env.ADMIN_PIN || "1234").trim();
  const name = (process.env.ADMIN_NAME || "Super Admin").trim();

  // Validate phone format (10 digits starting with 9)
  if (!/^9\d{9}$/.test(phone)) {
    console.warn(`[Auto-Seed] Invalid ADMIN_PHONE: "${phone}". Must be 10 digits starting with 9. Skipping seed.`);
    return null;
  }

  // Validate PIN format (exactly 4 digits)
  if (!/^\d{4}$/.test(pin)) {
    console.warn(`[Auto-Seed] Invalid ADMIN_PIN: "${pin}". Must be exactly 4 digits. Skipping seed.`);
    return null;
  }

  try {
    // Check if any admin account already exists
    const existingAdmin = await User.findOne({ role: "admin" });
    if (existingAdmin) {
      console.log(`[Auto-Seed] Admin account already exists (Phone: ${existingAdmin.phone}, Name: ${existingAdmin.name}). Skipping seed.`);
      return existingAdmin;
    }

    // Check if phone number is already registered under another role
    const phoneInUse = await User.findOne({ phone });
    if (phoneInUse) {
      console.warn(`[Auto-Seed] Phone ${phone} is already registered as ${phoneInUse.role} (${phoneInUse.name}). Skipping seed.`);
      return null;
    }

    // Hash the 4-digit PIN
    const pinHash = await bcrypt.hash(pin, BCRYPT_SALT_ROUNDS);

    // Create the admin user with approved status
    const admin = await User.create({
      name,
      phone,
      pinHash,
      role: "admin",
      status: "approved",
      approved: true,
    });

    console.log("==================================================");
    console.log("[Auto-Seed] Default Admin Created Successfully!");
    console.log(`  Name:   ${admin.name}`);
    console.log(`  Phone:  ${admin.phone}`);
    console.log(`  Role:   ${admin.role}`);
    console.log(`  Status: ${admin.status}`);
    console.log("==================================================");

    return admin;
  } catch (error) {
    console.error("[Auto-Seed] Error checking or seeding admin:", error.message);
    return null;
  }
};

export default autoSeedAdmin;

