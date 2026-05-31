const mongoose = require("mongoose");

const googleColors = ["#4285F4", "#DB4437", "#F4B400", "#0F9D58"];

function colorFromName(name) {
  const total = [...name].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return googleColors[total % googleColors.length];
}

const feedbackSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 60,
    },
    feedback: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
      maxlength: 1000,
    },
    route: {
      type: String,
      trim: true,
      maxlength: 120,
      default: "",
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    improvementArea: {
      type: String,
      trim: true,
      maxlength: 250,
      default: "",
    },
    likes: {
      type: Number,
      default: 0,
      min: 0,
    },
    avatarColor: {
      type: String,
      default: "#4285F4",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

feedbackSchema.pre("validate", function setAvatarColor() {
  if (this.isModified("name") || !this.avatarColor) {
    this.avatarColor = colorFromName(this.name || "Guest");
  }
});

feedbackSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Feedback", feedbackSchema);
