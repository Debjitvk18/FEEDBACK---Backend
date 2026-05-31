const mongoose = require("mongoose");
const path = require("path");

require("dotenv").config({ path: path.join(__dirname, "../../.env") });

const connectDatabase = require("../config/db");
const { upsertInitialFeedback } = require("../services/seedFeedbackService");

async function seedFeedback() {
  await connectDatabase();
  const result = await upsertInitialFeedback();

  console.log(
    `Feedback seed complete: ${result.inserted} inserted, ${result.existing} already present.`,
  );
}

if (require.main === module) {
  seedFeedback()
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    })
    .finally(async () => {
      await mongoose.disconnect();
    });
}

module.exports = seedFeedback;
