const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
const path = require("path");

const authRoutes = require("./routes/auth");

const app = express();

app.use(cors());
app.use(express.json());

// Serve frontend from /server/public
app.use(express.static(path.join(__dirname, "public")));

// API routes
app.use("/api/auth", authRoutes);

// Test route
app.get("/api/test", (req, res) => {
    res.json({ message: "StudyWithAI backend is running 🚀" });
});

// MongoDB connection
mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB connected"))
    .catch((err) => console.error("MongoDB connection error:", err));

// Start server
const PORT = process.env.PORT || 5050;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
