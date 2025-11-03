const express = require("express");
const router = express.Router();
const {
  sendRequestController,
  acceptRequestController,
  rejectRequestController,
  GetStudentBatchController,
  disconnectController,
} = require("../Controllers/studentController");
const authMiddleware = require("../middleware/authMiddleware");

router.get("/all-students", authMiddleware, GetStudentBatchController);
router.post("/send-request", authMiddleware, sendRequestController);
router.get("/accept-request/:token", acceptRequestController);
router.get("/reject-request/:token", rejectRequestController);
router.post("/disconnect", authMiddleware, disconnectController);

module.exports = router;
