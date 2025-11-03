const express = require("express");
const router = express.Router();
const {
  ChatPostController,
  GetChatController,
  GetReceiverController,
  EditChatController,
  DeleteChatController,
} = require("../Controllers/chatController");
const verifyToken = require("../middleware/authMiddleware");

// ✅ Get receiver details
router.get("/receiver/:receiverId", verifyToken, GetReceiverController);

// ✅ Send message
router.post("/send", verifyToken, ChatPostController);

// ✅ Get messages between two users
router.get("/:senderId/:receiverId", verifyToken, GetChatController);

// ✅ Edit message
router.put("/edit/:chatId", verifyToken, EditChatController);

// ✅ Delete message
router.delete("/delete/:chatId/:userId", verifyToken, DeleteChatController);

module.exports = router;
