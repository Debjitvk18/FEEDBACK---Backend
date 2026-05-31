const Feedback = require("../models/Feedback");
const { parseFeedbackPayload, validateObjectId } = require("../utils/validation");

function paginationFromQuery(query) {
  const page = Math.max(Number.parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(query.limit, 10) || 10, 1), 50);
  return { page, limit, skip: (page - 1) * limit };
}

function buildSearchFilter(q) {
  if (!q || !q.trim()) return {};
  const regex = new RegExp(q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
  return { $or: [{ name: regex }, { feedback: regex }, { route: regex }] };
}

async function listFeedback(req, res, next) {
  try {
    const { page, limit, skip } = paginationFromQuery(req.query);
    const filter = buildSearchFilter(req.query.q);
    const [items, total] = await Promise.all([
      Feedback.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Feedback.countDocuments(filter),
    ]);

    res.json({
      items,
      page,
      limit,
      total,
      totalPages: Math.max(Math.ceil(total / limit), 1),
    });
  } catch (error) {
    next(error);
  }
}

async function createFeedback(req, res, next) {
  try {
    const payload = parseFeedbackPayload(req.body);
    const feedback = await Feedback.create(payload);
    res.status(201).json(feedback);
  } catch (error) {
    next(error);
  }
}

async function likeFeedback(req, res, next) {
  try {
    if (!validateObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid feedback id" });
    }

    const feedback = await Feedback.findByIdAndUpdate(
      req.params.id,
      { $inc: { likes: 1 } },
      { new: true },
    ).lean();

    if (!feedback) {
      return res.status(404).json({ message: "Feedback not found" });
    }

    return res.json(feedback);
  } catch (error) {
    return next(error);
  }
}

async function updateFeedback(req, res, next) {
  try {
    if (!validateObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid feedback id" });
    }

    const payload = parseFeedbackPayload(req.body);
    const feedback = await Feedback.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true,
    }).lean();

    if (!feedback) {
      return res.status(404).json({ message: "Feedback not found" });
    }

    return res.json(feedback);
  } catch (error) {
    return next(error);
  }
}

async function deleteFeedback(req, res, next) {
  try {
    if (!validateObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid feedback id" });
    }

    const feedback = await Feedback.findByIdAndDelete(req.params.id).lean();

    if (!feedback) {
      return res.status(404).json({ message: "Feedback not found" });
    }

    return res.json({ message: "Feedback deleted" });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  createFeedback,
  deleteFeedback,
  likeFeedback,
  listFeedback,
  updateFeedback,
};
