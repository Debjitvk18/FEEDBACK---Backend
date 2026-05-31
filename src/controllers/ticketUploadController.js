const { PassThrough } = require("stream");

const { assertCloudinaryConfigured, cloudinary } = require("../config/cloudinary");
const TicketUpload = require("../models/TicketUpload");
const { cleanText, validateObjectId } = require("../utils/validation");

const allowedMimeTypes = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

function uploadBuffer(file) {
  assertCloudinaryConfigured();

  const isPdf = file.mimetype === "application/pdf";

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "confirm-ticket-uploads",
        resource_type: isPdf ? "raw" : "auto",
        use_filename: true,
        unique_filename: true,
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(result);
      },
    );

    const bufferStream = new PassThrough();
    bufferStream.end(file.buffer);
    bufferStream.pipe(uploadStream);
  });
}

function flattenFiles(files = {}) {
  return [
    ...(files.ticketPdf || []).map((file) => ({ label: "Confirm ticket PDF", file })),
    ...(files.paymentScreenshot || []).map((file) => ({ label: "Advance payment screenshot", file })),
    ...(files.documents || []).map((file) => ({ label: "Supporting document", file })),
  ];
}

function validateUploadBody(body, files) {
  const passengerName = cleanText(body.passengerName);
  const contact = cleanText(body.contact);
  const route = cleanText(body.route);
  const note = cleanText(body.note);
  const selectedFiles = flattenFiles(files);
  const errors = [];

  if (!passengerName || passengerName.length < 2 || passengerName.length > 80) {
    errors.push("Passenger name must be between 2 and 80 characters.");
  }

  if (contact.length > 80) {
    errors.push("Contact must be 80 characters or less.");
  }

  if (route.length > 120) {
    errors.push("Route must be 120 characters or less.");
  }

  if (note.length > 500) {
    errors.push("Note must be 500 characters or less.");
  }

  if (selectedFiles.length === 0) {
    errors.push("Upload at least one ticket, payment screenshot, or document.");
  }

  if (selectedFiles.length > 7) {
    errors.push("Upload 7 files or fewer.");
  }

  selectedFiles.forEach(({ file }) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      errors.push(`${file.originalname} is not a supported PDF or image file.`);
    }
  });

  if (errors.length > 0) {
    const error = new Error(errors.join(" "));
    error.statusCode = 400;
    throw error;
  }

  return { passengerName, contact, route, note, selectedFiles };
}

async function createTicketUpload(req, res, next) {
  const uploadedAssets = [];

  try {
    const payload = validateUploadBody(req.body, req.files);

    const files = await Promise.all(
      payload.selectedFiles.map(async ({ label, file }) => {
        const asset = await uploadBuffer(file);
        uploadedAssets.push(asset);

        return {
          label,
          originalName: file.originalname,
          mimeType: file.mimetype,
          bytes: asset.bytes || file.size,
          url: asset.url,
          secureUrl: asset.secure_url,
          publicId: asset.public_id,
          resourceType: asset.resource_type,
          format: asset.format || "",
        };
      }),
    );

    const upload = await TicketUpload.create({
      passengerName: payload.passengerName,
      contact: payload.contact,
      route: payload.route,
      note: payload.note,
      uploadedBy: req.isAdminUpload ? "admin" : "user",
      files,
    });

    return res.status(201).json(upload);
  } catch (error) {
    await Promise.allSettled(
      uploadedAssets.map((asset) =>
        cloudinary.uploader.destroy(asset.public_id, { resource_type: asset.resource_type }),
      ),
    );
    return next(error);
  }
}

function paginationFromQuery(query) {
  const page = Math.max(Number.parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(query.limit, 10) || 12, 1), 50);
  return { page, limit, skip: (page - 1) * limit };
}

function buildTicketSearchFilter(q) {
  if (!q || !q.trim()) return {};
  const regex = new RegExp(q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
  return { $or: [{ passengerName: regex }, { route: regex }] };
}

async function listTicketUploads(req, res, next) {
  try {
    const { page, limit, skip } = paginationFromQuery(req.query);
    const filter = buildTicketSearchFilter(req.query.q);
    const [items, total] = await Promise.all([
      TicketUpload.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      TicketUpload.countDocuments(filter),
    ]);

    return res.json({
      items,
      page,
      limit,
      total,
      totalPages: Math.max(Math.ceil(total / limit), 1),
    });
  } catch (error) {
    return next(error);
  }
}

async function listAllTicketUploads(req, res, next) {
  try {
    const uploads = await TicketUpload.find().sort({ createdAt: -1 }).lean();
    return res.json({ items: uploads, total: uploads.length });
  } catch (error) {
    return next(error);
  }
}

async function updateTicketUpload(req, res, next) {
  try {
    if (!validateObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid upload id" });
    }

    const passengerName = cleanText(req.body.passengerName);
    if (!passengerName || passengerName.length < 2 || passengerName.length > 80) {
      return res.status(400).json({ message: "Passenger name must be between 2 and 80 characters." });
    }

    const upload = await TicketUpload.findByIdAndUpdate(
      req.params.id,
      { passengerName },
      { new: true, runValidators: true },
    ).lean();

    if (!upload) {
      return res.status(404).json({ message: "Upload not found" });
    }

    return res.json(upload);
  } catch (error) {
    return next(error);
  }
}

async function deleteTicketUpload(req, res, next) {
  try {
    if (!validateObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid upload id" });
    }

    const upload = await TicketUpload.findByIdAndDelete(req.params.id).lean();

    if (!upload) {
      return res.status(404).json({ message: "Upload not found" });
    }

    await Promise.allSettled(
      upload.files.map((file) =>
        cloudinary.uploader.destroy(file.publicId, { resource_type: file.resourceType }),
      ),
    );

    return res.json({ message: "Upload deleted" });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  createTicketUpload,
  deleteTicketUpload,
  listAllTicketUploads,
  listTicketUploads,
  updateTicketUpload,
};
