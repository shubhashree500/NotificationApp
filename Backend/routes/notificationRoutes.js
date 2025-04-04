const express = require("express");
const router = express.Router();
const Notification = require("../models/Notification");

// Get all notifications
router.get("/notifications", async (req, res) => {
  try {
    const notifications = await Notification.find().sort({ createdAt: -1 });
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

// Create a new notification and emit to clients
router.post("/notifications", async (req, res) => {
  try {
    const { title, message } = req.body;
    const notification = new Notification({ title, message });
    await notification.save();

    // Emit real-time event
    const io = req.app.get("io");
    io.emit("new-notification", notification);

    res.status(201).json(notification);
  } catch (err) {
    res.status(500).json({ error: "Failed to create notification" });
  }
});

module.exports = router;
