import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  register,
  login,
  logout,
  getMe,
  registerValidationSchema,
  loginValidationSchema,
} from "../controllers/auth.controller.js";
import validate from "../middleware/validate.middleware.js";
import authenticate from "../middleware/auth.middleware.js";

const router = Router();

// Rate limiter: relaxed in development, 20 requests per 15 minutes in production
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === "development" ? 1000 : 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many attempts from this IP, please try again after 15 minutes",
  },
});

// Routes
router.post("/register", authLimiter, validate(registerValidationSchema), register);
router.post("/login", authLimiter, validate(loginValidationSchema), login);
router.post("/logout", logout);
router.get("/me", authenticate, getMe);

export default router;
