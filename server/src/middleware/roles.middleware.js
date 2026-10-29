/**
 * Role-based access control middleware generator.
 * @param {...string} allowedRoles - List of authorized roles (e.g. 'admin', 'teacher')
 */
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: insufficient permissions",
      });
    }
    next();
  };
};

export default requireRole;
