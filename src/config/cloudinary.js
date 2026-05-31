const cloudinary = require("cloudinary").v2;

function configureCloudinary() {
  if (process.env.CLOUDINARY_URL) {
    return cloudinary;
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (cloudName && apiKey && apiSecret) {
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });
  }

  return cloudinary;
}

function assertCloudinaryConfigured() {
  const config = cloudinary.config();

  if (!config.cloud_name || !config.api_key || !config.api_secret) {
    const error = new Error("Cloudinary is not configured on the backend.");
    error.statusCode = 503;
    throw error;
  }
}

module.exports = {
  assertCloudinaryConfigured,
  cloudinary: configureCloudinary(),
};
