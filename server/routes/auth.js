const express = require("express");
const router = express.Router();
const User = require("../models/User");

router.post("/signup", async (req, res) => {
    try {
        const { username, email, password } = req.body;

        console.log("Signup request body:", req.body); 

        if (!username || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Email already registered" });
        }

        const newUser = new User({ username, email, password });
        await newUser.save();

        res.status(201).json({ message: "User created successfully" });
    } catch (err) {
        console.error("Error in /signup:", err); 
        res.status(500).json({ message: "Server error", error: err.message }); 
    }
});

router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        console.log("Login request body:", req.body); 

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password required" });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        res.json({ message: "Logged in successfully", username: user.username });
    } catch (err) {
        console.error("Error in /login:", err); 
        res.status(500).json({ message: "Server error", error: err.message }); // Return error message
    }
});

module.exports = router;