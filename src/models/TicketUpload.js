const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: true,
      trim: true,
      maxlength: 40,
    },
    originalName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 180,
    },
    mimeType: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    bytes: {
      type: Number,
      required: true,
      min: 0,
    },
    url: {
      type: String,
      required: true,
      trim: true,
    },
    secureUrl: {
      type: String,
      required: true,
      trim: true,
    },
    publicId: {
      type: String,
      required: true,
      trim: true,
    },
    resourceType: {
      type: String,
      required: true,
      trim: true,
      enum: ["image", "video", "raw"],
    },
    format: {
      type: String,
      trim: true,
      maxlength: 24,
      default: "",
    },
  },
  { _id: false },
);

const ticketUploadSchema = new mongoose.Schema(
  {
    passengerName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 80,
    },
    contact: {
      type: String,
      trim: true,
      maxlength: 80,
      default: "",
    },
    route: {
      type: String,
      trim: true,
      maxlength: 120,
      default: "",
    },
    note: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
    uploadedBy: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    files: {
      type: [fileSchema],
      validate: {
        validator(files) {
          return files.length > 0 && files.length <= 7;
        },
        message: "Upload between 1 and 7 files.",
      },
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

ticketUploadSchema.index({ createdAt: -1 });

module.exports = mongoose.model("TicketUpload", ticketUploadSchema);
