require("dotenv").config();

const app = require("./app");
const connectDatabase = require("./config/db");
const { upsertInitialFeedback } = require("./services/seedFeedbackService");

const port = process.env.PORT || 5000;

connectDatabase()
  .then(async () => {
    const seedResult = await upsertInitialFeedback();
    console.log(
      `Initial feedback ready: ${seedResult.inserted} inserted, ${seedResult.existing} already present.`,
    );
  })
  .then(() => {
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  })
  .catch((error) => {
    console.log(error)
    console.error("Failed to start server:", error.message);
    process.exit(1);
  });
