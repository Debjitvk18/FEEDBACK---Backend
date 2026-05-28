const mongoose = require("mongoose");

function cleanText(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}

function validateObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

function parseFeedbackPayload(body) {
  const name = cleanText(body.name);
  const feedback = cleanText(body.feedback);
  const improvementArea = cleanText(body.improvementArea);
  const rating = Number(body.rating);
  const errors = [];

  if (!name || name.length < 2 || name.length > 60) {
    errors.push("Name must be between 2 and 60 characters.");
  }

  if (!feedback || feedback.length < 5 || feedback.length > 1000) {
    errors.push("Feedback must be between 5 and 1000 characters.");
  }

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    errors.push("Rating must be a whole number from 1 to 5.");
  }

  if (improvementArea.length > 250) {
    errors.push("Improvement area must be 250 characters or less.");
  }

  if (errors.length > 0) {
    const error = new Error(errors.join(" "));
    error.statusCode = 400;
    throw error;
  }

  return { name, feedback, rating, improvementArea };
}

module.exports = {
  cleanText,
  parseFeedbackPayload,
  validateObjectId,
};
