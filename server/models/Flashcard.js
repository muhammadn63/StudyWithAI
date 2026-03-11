const mongoose = require("mongoose");

// Schema for storing flashcards generated for a user
const flashcardSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  topic: {
    type: String,
    required: true
  },
  cards: [
    {
      question: String,
      answer: String
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Flashcard", flashcardSchema);