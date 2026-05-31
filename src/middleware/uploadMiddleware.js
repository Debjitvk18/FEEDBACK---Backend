const multer = require("multer");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 7,
  },
});

const ticketUploadFields = upload.fields([
  { name: "ticketPdf", maxCount: 1 },
  { name: "paymentScreenshot", maxCount: 1 },
  { name: "documents", maxCount: 5 },
]);

function uploadErrorHandler(error, req, res, next) {
  if (error instanceof multer.MulterError) {
    return res.status(400).json({ message: error.message });
  }

  return next(error);
}

module.exports = {
  ticketUploadFields,
  uploadErrorHandler,
};
