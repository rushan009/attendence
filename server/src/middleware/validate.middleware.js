/**
 * Generic Zod validation middleware for Express req.body.
 * Validates and sanitizes incoming body against a Zod schema.
 */
export const validate = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (error) {
    next(error);
  }
};

export default validate;
