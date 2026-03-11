const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
const path = require("path");

// Import route files for authentication and AI features
const authRoutes = require("./routes/auth");
const aiRoutes = require("./routes/ai");   

const app = express();

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, "public")));

app.use("/api/auth", authRoutes);
app.use("/api/ai", aiRoutes);   

// test route to check the backend server is running
app.get("/api/test", (req, res) => {
    res.json({ message: "StudyWithAI backend is running 🚀" });
});

// Connect to MongoDB database
mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB connected"))
    .catch((err) => console.error("MongoDB connection error:", err));

// Start the server
const PORT = process.env.PORT || 5050;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
