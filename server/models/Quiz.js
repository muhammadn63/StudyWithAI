const mongoose = require("mongoose");

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