const jwt = require("jsonwebtoken");

const authenticateToken = (req, res, next) => {
  // Skip authentication for public routes
  const publicRoutes = [
    "/api/auth/login",
    "/api/auth/register",
    "/api/auth/quick-signup",
  ];
  if (publicRoutes.includes(req.path)) {
    return next();
  }

  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: "Invalid or expired token" });
  }
};

module.exports = {
  authenticateToken,
};
