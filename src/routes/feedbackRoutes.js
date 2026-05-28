const express = require("express");
const rateLimit = require("express-rate-limit");
const {
  createFeedback,
  deleteFeedback,
  likeFeedback,
  listFeedback,
  updateFeedback,
} = require("../controllers/feedbackController");
const adminGuard = require("../middleware/adminGuard");

const router = express.Router();

const createLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many feedback submissions. Please try again soon." },
});

const likeLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many likes. Please slow down." },
});

router.get("/feedback", listFeedback);
router.post("/feedback", createLimiter, createFeedback);
router.post("/feedback/:id/like", likeLimiter, likeFeedback);

router.put("/admin/feedback/:id", adminGuard, updateFeedback);
router.delete("/admin/feedback/:id", adminGuard, deleteFeedback);

module.exports = router;
