const express = require("express");
const router = express.Router();
const OpenAI = require("openai");

const Flashcard = require("../models/Flashcard");
const Quiz = require("../models/Quiz");
const authMiddleware = require("../middleware/authMiddleware");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

router.post("/flashcards", authMiddleware, async (req, res) => {
  try {
    const { topic } = req.body;

    if (!topic) {
      return res.status(400).json({ message: "Topic is required" });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: `
Generate 5 simple study flashcards about ${topic}.

Format EXACTLY like this JSON:

[
  {
    "question": "Question text",
    "answer": "Answer text"
  }
]

Return ONLY valid JSON.
`
        }
      ],
      max_tokens: 500
    });

    const text = completion.choices[0].message.content;

    let flashcardsData;

    try {
      flashcardsData = JSON.parse(text);
    } catch (err) {
      return res.status(500).json({ message: "Invalid AI response format" });
    }

    const newFlashcard = new Flashcard({
      user: req.user,
      topic: topic,
      cards: flashcardsData
    });

    await newFlashcard.save();

    res.json({ flashcards: flashcardsData });

  } catch (error) {
    res.status(500).json({ message: "Flashcard generation failed" });
  }
});

router.post("/quiz", authMiddleware, async (req, res) => {
  try {
    const { topic } = req.body;

    if (!topic) {
      return res.status(400).json({ message: "Topic is required" });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: `
Generate 5 multiple choice quiz questions about ${topic}.

Return ONLY valid JSON in this format:

[
  {
    "question": "Question text",
    "options": {
      "A": "Option A",
      "B": "Option B",
      "C": "Option C",
      "D": "Option D"
    },
    "correct": "A"
  }
]
`
        }
      ],
      max_tokens: 700
    });

    const text = completion.choices[0].message.content;


    let quizData;

    try {
      const cleaned = text
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      quizData = JSON.parse(cleaned);
    } catch (err) {
      console.log("PARSE FAILED");
      console.log(text);
      return res.status(500).json({ message: "Invalid AI response format" });
    }

    const newQuiz = new Quiz({
      user: req.user,
      topic: topic,
      questions: quizData
    });

    await newQuiz.save();

    res.json({ quiz: quizData });

  } catch (error) {
    console.log("QUIZ ROUTE ERROR:", error);
    res.status(500).json({ message: "Quiz generation failed" });
  }
});

router.get("/flashcards/history", authMiddleware, async (req, res) => {
  try {
    const flashcards = await Flashcard
      .find({ user: req.user })
      .sort({ createdAt: -1 });

    res.json(flashcards);
  } catch (err) {
    res.status(500).json({ message: "Error fetching flashcard history" });
  }
});

router.get("/quiz/history", authMiddleware, async (req, res) => {
  try {
    const quizzes = await Quiz
      .find({ user: req.user })
      .sort({ createdAt: -1 });

    res.json(quizzes);
  } catch (err) {
    res.status(500).json({ message: "Error fetching quiz history" });
  }
});

router.delete("/flashcards/:id", authMiddleware, async (req, res) => {
  try {
    const flashcard = await Flashcard.findOne({
      _id: req.params.id,
      user: req.user
    });

    if (!flashcard) {
      return res.status(404).json({ message: "Flashcards not found" });
    }

    await flashcard.deleteOne();

    res.json({ message: "Flashcards deleted successfully" });

  } catch (err) {
    console.error("Delete Flashcards Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;