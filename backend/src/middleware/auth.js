import { verifyToken } from "../utils/security.js";

const parseAuthHeader = (header) => {
  if (!header) return null;
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) return null;
  return token;
};

export const requireAuth =
  (allowedRoles = []) =>
  (req, res, next) => {
    try {
      const token = parseAuthHeader(req.headers.authorization);
      if (!token) {
        return res.status(401).json({ message: "Missing authorization token" });
      }
      const payload = verifyToken(token);
      if (allowedRoles.length && !allowedRoles.includes(payload.role)) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }
      req.user = payload;
      return next();
    } catch (error) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }
  };
