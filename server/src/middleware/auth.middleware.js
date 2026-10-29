import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

/**
 * Authentication middleware that verifies JWT from httpOnly cookie,
 * checks user existence and approval status in the database,
 * and attaches the populated user document to req.user.
 */
export const authenticate = async (req, res, next) => {
  try {
    const cookieName = process.env.COOKIE_NAME || "token";
    const token = req.cookies?.[cookieName];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is not configured");
      return res.status(500).json({
        success: false,
        message: "Server authentication misconfigured",
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    if (!decoded?.id) {
      return res.status(401).json({
        success: false,
        message: "Invalid token payload",
      });
    }

    const user = await User.findById(decoded.id).populate("class");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User no longer exists",
      });
    }

    if (user.status !== "approved") {
      const message =
        user.status === "pending"
          ? "Account pending approval"
          : user.status === "rejected"
          ? "Account rejected"
          : "Account not approved";

      return res.status(403).json({
        success: false,
        message,
      });
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

export default authenticate;
