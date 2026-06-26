import { formatResponse } from '../utils/response.js';

export const roleMiddleware = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json(formatResponse(false, `Access denied. Requires one of roles: ${allowedRoles.join(', ')}`));
    }
    next();
  };
};
