const initialFeedback = require("../data/initialFeedback");
const Feedback = require("../models/Feedback");

async function upsertInitialFeedback() {
  const seededAt = new Date();
  const operations = initialFeedback.map((item, index) => {
    const createdAt = new Date(seededAt.getTime() - index * 60 * 1000);

    return {
      updateOne: {
        filter: {
          name: item.name,
          route: item.route,
          feedback: item.feedback,
        },
        update: {
          $setOnInsert: {
            ...item,
            rating: 5,
            improvementArea: "",
            likes: 0,
            createdAt,
            updatedAt: createdAt,
          },
        },
        upsert: true,
      },
    };
  });

  const result = await Feedback.bulkWrite(operations, {
    ordered: false,
    timestamps: false,
  });

  return {
    inserted: result.upsertedCount || 0,
    existing: initialFeedback.length - (result.upsertedCount || 0),
    total: initialFeedback.length,
  };
}

module.exports = {
  upsertInitialFeedback,
};
