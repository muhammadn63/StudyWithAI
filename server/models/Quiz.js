const mongoose = require("mongoose");

// Schema for storing quizzes generated for a user
const quizSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  topic: {
    type: String,
    required: true
  },
  score: {
    type: Number,
    default: null
  },
  total: {
    type: Number,
    default: null
  },
  questions: [
    {
      question: String,
      options: {
        A: String,
        B: String,
        C: String,
        D: String
      },
      correct: String
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model("Quiz", quizSchema);