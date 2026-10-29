import { ZodError } from "zod";

/**
 * Centralized error handling middleware.
 * Handles Zod validation errors, MongoDB duplicate keys, and other server errors.
 */
const errorHandler = (err, req, res, next) => {
  // Handle Zod Validation Errors
  if (err instanceof ZodError || err.name === "ZodError") {
    const fieldErrors = (err.errors || err.issues || []).map((issue) => ({
      field: issue.path.join(".") || "root",
      message: issue.message,
    }));

    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: fieldErrors,
    });
  }

  // Handle MongoDB Duplicate Key Error (E11000)
  if (err.code === 11000) {
    const keys = Object.keys(err.keyPattern || err.keyValue || {});
    if (keys.includes("phone")) {
      return res.status(409).json({
        success: false,
        message: "Phone number already registered",
      });
    }

    return res.status(409).json({
      success: false,
      message: `Duplicate entry for ${keys.join(", ") || "field"}`,
    });
  }

  // Handle Mongoose CastError (e.g. invalid ObjectId)
  if (err.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: `Invalid format for ${err.path}: ${err.value}`,
    });
  }

  // Default / Internal Server Errors
  const statusCode = err.statusCode || (res.statusCode >= 400 ? res.statusCode : 500);

  const response = {
    success: false,
    message: err.message || "Internal server error",
  };

  if (process.env.NODE_ENV !== "production") {
    response.stack = err.stack;
  }

  return res.status(statusCode).json(response);
};

export default errorHandler;
