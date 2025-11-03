const express = require("express");
const router = express.Router();
const {
  sendRequestController,
  acceptRequestController,
  rejectRequestController,
  disconnectController,
  GetAlumniBatchController,
} = require("../Controllers/alumniController");
const authMiddleware = require("../middleware/authMiddleware");

// ✅ Send Request
router.post("/send-request", authMiddleware, sendRequestController);

// ✅ Accept / Reject (Email Links)
router.get("/accept-request/:token", acceptRequestController);
router.get("/reject-request/:token", rejectRequestController);

// ✅ Disconnect
router.post("/disconnect", authMiddleware, disconnectController);

// ✅ Get Alumni by Batch
router.get("/all-alumni", authMiddleware, GetAlumniBatchController);

module.exports = router;
