const express = require("express");
const router = express.Router();
const Notification = require("../models/Notification");

// GET notifications for a specific user
router.get("/notifications", async (req, res) => {
  try {
    const { userId } = req.query;
    const query = userId ? { userId } : {};
    const notifications = await Notification.find(query).sort({ createdAt: -1 });
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

// POST a new notification and emit to user via WebSocket
router.post("/notifications", async (req, res) => {
  try {
    const { userId, title, message } = req.body;

    if (!userId || !title || !message) {
      return res.status(400).json({ error: "userId, title, and message are required" });
    }

    const notification = new Notification({ userId, title, message });
    await notification.save();

    const io = req.app.get("io");
    const connectedUsers = req.app.get("connectedUsers");

    const targetSocket = connectedUsers.get(userId);
    if (targetSocket) {
      targetSocket.emit("new-notification", notification);
      console.log(`📤 Sent real-time notification to ${userId}`);
    }

    res.status(201).json(notification);
  } catch (err) {
    res.status(500).json({ error: "Failed to create notification" });
  }
});

module.exports = router;
