// Import required packages
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

// Load environment variables from .env
dotenv.config();

// Initialize Express
const app = express();
app.use(cors()); // allow requests from frontend
app.use(express.json()); // parse JSON from requests

// -----------------------------
// Step 2: Connect to MongoDB
// -----------------------------
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log("MongoDB connected"))
    .catch((err) => console.log("MongoDB error:", err));

// -----------------------------
// Step 3: Create Message Schema
// -----------------------------
const messageSchema = new mongoose.Schema({
    fullname: String,
    email: String,
    contact: String,
    subject: String,
    message: String,
    createdAt: { type: Date, default: Date.now },
});

const Message = mongoose.model("Message", messageSchema);

// -----------------------------
// Step 4: Setup Nodemailer
// -----------------------------
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER, // sending email
        pass: process.env.EMAIL_PASS, // App Password
    },
});

// -----------------------------
// Step 5: API Route to receive form data
// -----------------------------
app.post("/api/send-message", async (req, res) => {
    try {
        const { fullname, email, contact, subject, message } = req.body;

        // Save message in MongoDB
        const newMessage = new Message({ fullname, email, contact, subject, message });
        await newMessage.save();

        // Send email to yourself
        await transporter.sendMail({
            from: email, // sender (user who submitted the form)
            to: process.env.EMAIL_USER, // your email
            subject: `New Contact Form Submission: ${subject}`,
            text: `Name: ${fullname}\nEmail: ${email}\nContact: ${contact}\nMessage: ${message}`,
        });

        res.status(200).json({ success: true, message: "Message saved & email sent!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// -----------------------------
// Step 6: Test Route
// -----------------------------
app.get("/", (req, res) => {
    res.send("Backend is running!");
});

// -----------------------------
// Step 7: Start server
// -----------------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
