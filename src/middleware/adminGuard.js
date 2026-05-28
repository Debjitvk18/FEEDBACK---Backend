function adminGuard(req, res, next) {
  const adminSecret = process.env.ADMIN_SECRET?.trim();

  if (!adminSecret) {
    return res.status(503).json({
      message: "Admin key is not configured on the backend.",
    });
  }

  if (req.get("x-admin-secret") !== adminSecret) {
    return res.status(401).json({ message: "Admin access denied" });
  }

  return next();
}

module.exports = adminGuard;
