import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { z } from "zod";
import User from "../models/user.model.js";

// Validation Schemas
export const registerValidationSchema = z.object({
  name: z
    .string({ required_error: "Name is required" })
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(60, "Name cannot exceed 60 characters"),
  phone: z
    .string({ required_error: "Phone number is required" })
    .trim()
    .regex(/^9\d{9}$/, "Phone must be a 10-digit number starting with 9"),
  pin: z
    .string({ required_error: "PIN is required" })
    .regex(/^\d{4}$/, "PIN must be exactly 4 digits"),
  classId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid class ID format")
    .nullable()
    .optional()
    .or(z.literal("")),
});

export const loginValidationSchema = z.object({
  phone: z
    .string({ required_error: "Phone number is required" })
    .trim()
    .regex(/^9\d{9}$/, "Phone must be a 10-digit number starting with 9"),
  pin: z
    .string({ required_error: "PIN is required" })
    .regex(/^\d{4}$/, "PIN must be exactly 4 digits"),
});

const BCRYPT_SALT_ROUNDS = 10;
const DUMMY_HASH = "$2b$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012";

/**
 * Register a new teacher
 * POST /api/auth/register
 */
export const register = async (req, res, next) => {
  try {
    const { name, phone, pin } = req.body;

    // Check if phone number already exists
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Phone number already registered",
      });
    }

    // Hash the 4-digit PIN
    const pinHash = await bcrypt.hash(pin, BCRYPT_SALT_ROUNDS);

    // Enforce role and status (never taken from request body)
    await User.create({
      name,
      phone,
      pinHash,
      role: "teacher",
      status: "pending",
      approved: false,
      class: null,
    });

    return res.status(201).json({
      success: true,
      message: "Registration submitted. Wait for admin approval.",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login teacher or admin
 * POST /api/auth/login
 */
export const login = async (req, res, next) => {
  try {
    const { phone, pin } = req.body;

    // Retrieve user including pinHash and lockout fields
    const user = await User.findOne({ phone }).select(
      "+pinHash +failedAttempts +lockUntil"
    );

    // Handle user not found (with dummy bcrypt timing defense)
    if (!user) {
      await bcrypt.compare(pin, DUMMY_HASH).catch(() => {});
      return res.status(401).json({
        success: false,
        message: "Invalid phone or PIN",
      });
    }

    // Check account lockout
    if (user.isLocked()) {
      const remainingMinutes = Math.ceil(
        (new Date(user.lockUntil).getTime() - Date.now()) / (60 * 1000)
      );
      return res.status(423).json({
        success: false,
        message: `Account is temporarily locked due to 5 failed attempts. Please try again in ${remainingMinutes} minute(s).`,
      });
    }

    // Verify PIN
    const isMatch = await bcrypt.compare(pin, user.pinHash);

    if (!isMatch) {
      user.failedAttempts = (user.failedAttempts || 0) + 1;
      if (user.failedAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // lock for 15 minutes
        user.failedAttempts = 0;
      }
      await user.save();

      return res.status(401).json({
        success: false,
        message: "Invalid phone or PIN",
      });
    }

    // Reset failed attempts upon successful PIN verification
    if (user.failedAttempts > 0 || user.lockUntil) {
      user.failedAttempts = 0;
      user.lockUntil = null;
      await user.save();
    }

    // Check status only AFTER the PIN is verified
    if (user.status === "pending") {
      return res.status(403).json({
        success: false,
        message: "Account pending approval",
      });
    }

    if (user.status === "rejected") {
      return res.status(403).json({
        success: false,
        message: "Account rejected",
      });
    }

    if (user.status !== "approved") {
      return res.status(403).json({
        success: false,
        message: "Account not approved",
      });
    }

    // Generate JWT
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not configured");
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Set JWT in httpOnly cookie (in production with cross-origin domains, requires sameSite: 'none' and secure: true)
    const cookieName = process.env.COOKIE_NAME || "token";
    const isProduction = process.env.NODE_ENV === "production";

    res.cookie(cookieName, token, {
      httpOnly: true,
      sameSite: isProduction ? "none" : "lax",
      secure: isProduction,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    });

    // Populate class if attached
    await user.populate("class");

    return res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        approved: user.status === "approved",
        class: user.class,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Logout user by clearing the JWT cookie
 * POST /api/auth/logout
 */
export const logout = (req, res) => {
  const cookieName = process.env.COOKIE_NAME || "token";
  const isProduction = process.env.NODE_ENV === "production";

  res.clearCookie(cookieName, {
    httpOnly: true,
    sameSite: isProduction ? "none" : "lax",
    secure: isProduction,
  });

  return res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
};

/**
 * Get current authenticated user details
 * GET /api/auth/me
 */
export const getMe = async (req, res) => {
  return res.status(200).json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      phone: req.user.phone,
      role: req.user.role,
      approved: req.user.status === "approved",
      class: req.user.class,
      status: req.user.status,
      createdAt: req.user.createdAt,
      updatedAt: req.user.updatedAt,
    },
  });
};
