const jwt = require("jsonwebtoken");

// Middleware to verify JWT token
module.exports = function (req, res, next) {
  const authHeader = req.headers.authorization;

  // Check if token exists
  if (!authHeader) {
    return res.status(401).json({ message: "No token provided" });
  }

  // Get token from header
  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.id;

    // Continue to next route
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};