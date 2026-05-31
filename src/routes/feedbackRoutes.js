const express = require("express");
const rateLimit = require("express-rate-limit");
const {
  createFeedback,
  deleteFeedback,
  likeFeedback,
  listFeedback,
  updateFeedback,
} = require("../controllers/feedbackController");
const {
  createTicketUpload,
  deleteTicketUpload,
  listAllTicketUploads,
  listTicketUploads,
  updateTicketUpload,
} = require("../controllers/ticketUploadController");
const adminGuard = require("../middleware/adminGuard");
const { ticketUploadFields, uploadErrorHandler } = require("../middleware/uploadMiddleware");

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

// Public ticket upload routes (users can upload and browse)
router.get("/ticket-uploads", listTicketUploads);
router.post("/ticket-uploads", ticketUploadFields, uploadErrorHandler, createTicketUpload);

// Admin routes
router.put("/admin/feedback/:id", adminGuard, updateFeedback);
router.delete("/admin/feedback/:id", adminGuard, deleteFeedback);
router.get("/admin/ticket-uploads", adminGuard, listAllTicketUploads);
router.post(
  "/admin/ticket-uploads",
  adminGuard,
  (req, res, next) => {
    req.isAdminUpload = true;
    next();
  },
  ticketUploadFields,
  uploadErrorHandler,
  createTicketUpload,
);
router.put("/admin/ticket-uploads/:id", adminGuard, updateTicketUpload);
router.delete("/admin/ticket-uploads/:id", adminGuard, deleteTicketUpload);

module.exports = router;
