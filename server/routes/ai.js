const express = require("express");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const router = express.Router();
const OpenAI = require("openai");

// Import database to store flashcards and quizzes
const Flashcard = require("../models/Flashcard");
const Quiz = require("../models/Quiz");
const authMiddleware = require("../middleware/authMiddleware");

// Initialize OpenAI client using the API key 
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// This is route to generate flashcards for a given topic using AI
router.post("/flashcards", authMiddleware, async (req, res) => {
  try {
    const { topic, count = 5 } = req.body;

    if (!topic) {
      return res.status(400).json({ message: "Topic is required" });
    }

    // Send request to OpenAI to generate flashcards
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: `
Generate ${count} simple study flashcards about ${topic}.

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
      max_tokens: count * 150
    });

    const text = completion.choices[0].message.content;

    let flashcardsData;

    try {
      flashcardsData = JSON.parse(text);
    } catch (err) {
      return res.status(500).json({ message: "Invalid AI response format" });
    }
    
    // Save generated flashcards to the database
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

// Route to generate a quiz with multiple choice questions
router.post("/quiz", authMiddleware, async (req, res) => {
  try {
    const { topic, count = 5 } = req.body;

    if (!topic) {
      return res.status(400).json({ message: "Topic is required" });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: `
Generate ${count} multiple choice quiz questions about ${topic}.

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
      max_tokens: count * 200
    });

    const text = completion.choices[0].message.content;


    let quizData;

    // Cleaning the AI responses
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
    
    // Save quiz questions to the database
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

// Route to quiz history for the user
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

// Route to delete a flashcard set by ID
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

// Route to delete a quiz by ID
router.delete("/quiz/:id", authMiddleware, async (req, res) => {
  try {
    console.log("DELETE HIT");
    console.log("req.user =", req.user);
    console.log("req.params.id =", req.params.id);
    
    const quiz = await Quiz.findOne({
      _id: req.params.id,
      user: req.user  
    });

    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    await quiz.deleteOne();

    res.json({ message: "Quiz deleted successfully" });

  } catch (err) {
    console.error("Delete Quiz Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/quiz/score", authMiddleware, async (req, res) => {
  try {
    const { topic, score, total } = req.body;

    const quiz = await Quiz.findOne({ user: req.user, topic })
      .sort({ createdAt: -1 });

    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    quiz.score = score;
    quiz.total = total;
    await quiz.save();

    res.json({ message: "Score saved" });
  } catch (err) {
    res.status(500).json({ message: "Failed to save score" });
  }
});

const upload = multer({ storage: multer.memoryStorage() });

router.post("/pdf/flashcards", authMiddleware, upload.single("pdf"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No PDF uploaded" });
    const { count = 5 } = req.body;
    const pdfData = await pdfParse(req.file.buffer);
    const text = pdfData.text.slice(0, 8000);
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: `Generate ${count} simple study flashcards based on this content:\n\n${text}\n\nFormat EXACTLY like this JSON:\n[{ "question": "Question text", "answer": "Answer text" }]\nReturn ONLY valid JSON.` }],
      max_tokens: count * 150
    });
    const cleaned = completion.choices[0].message.content.replace(/```json|```/g, "").trim();
    const flashcardsData = JSON.parse(cleaned);
    const newFlashcard = new Flashcard({ user: req.user, topic: req.file.originalname.replace(".pdf", ""), cards: flashcardsData });
    await newFlashcard.save();
    res.json({ flashcards: flashcardsData, topic: newFlashcard.topic });
  } catch (err) {
    console.log("PDF flashcard error:", err);
    res.status(500).json({ message: "Failed to generate from PDF" });
  }
});

router.post("/pdf/quiz", authMiddleware, upload.single("pdf"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No PDF uploaded" });
    const { count = 5 } = req.body;
    const pdfData = await pdfParse(req.file.buffer);
    const text = pdfData.text.slice(0, 8000);
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: `Generate ${count} multiple choice quiz questions based on this content:\n\n${text}\n\nReturn ONLY valid JSON:\n[{ "question": "Question text", "options": { "A": "Option A", "B": "Option B", "C": "Option C", "D": "Option D" }, "correct": "A" }]` }],
      max_tokens: count * 200
    });
    const cleaned = completion.choices[0].message.content.replace(/```json|```/g, "").trim();
    const quizData = JSON.parse(cleaned);
    const newQuiz = new Quiz({ user: req.user, topic: req.file.originalname.replace(".pdf", ""), questions: quizData });
    await newQuiz.save();
    res.json({ quiz: quizData, topic: newQuiz.topic });
  } catch (err) {
    console.log("PDF quiz error:", err);
    res.status(500).json({ message: "Failed to generate quiz from PDF" });
  }
});


module.exports = router;