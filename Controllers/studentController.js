const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const UserModel = require("../Models/UserModel");
const RequestModel = require("../Models/RequestModel");
dotenv.config();

// ✅ Get all students
const GetStudentBatchController = async (req, res) => {
  try {
    const students = await UserModel.find({ role: "student" }).select("-password");
    res.status(200).json({ success: true, students });
  } catch (error) {
    console.error("❌ Error fetching students:", error);
    res.status(500).json({ success: false, message: "Failed to fetch students" });
  }
};

// ✅ Send connection request
const sendRequestController = async (req, res) => {
  try {
    const { receiverId } = req.body;
    console.log("Receiver ID:", receiverId);
    const senderId = req.user._id;

    if (!receiverId)
      return res.status(400).json({ success: false, message: "Receiver ID is required" });

    const sender = await UserModel.findById(senderId);
    const receiver = await UserModel.findById(receiverId);

    if (!receiver)
      return res.status(404).json({ success: false, message: "Receiver not found" });

    if (sender._id.equals(receiver._id))
      return res.status(400).json({ success: false, message: "Cannot send request to yourself" });

    if (sender.connections.includes(receiver._id))
      return res.status(400).json({ success: false, message: "Already connected" });

    // 🔍 Check if a pending request already exists
    const existingRequest = await RequestModel.findOne({
      from: senderId,
      to: receiverId,
      status: "pending",
    });

    if (existingRequest)
      return res.status(400).json({ success: false, message: "Request already sent" });

    // 🔑 Create token & save request
    const token = jwt.sign({ senderId, receiverId }, process.env.JWT_SECRET, {
      expiresIn: "24h",
    });

    const newRequest = new RequestModel({
      from: senderId,
      to: receiverId,
      token,
      status: "pending",
    });

    await newRequest.save();

    const backendUrl = process.env.BACKEND_URL || "http://localhost:5000";
    const acceptUrl = `${backendUrl}/api/student/accept-request/${token}`;
    const rejectUrl = `${backendUrl}/api/student/reject-request/${token}`;

    // ✉️ Send email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: receiver.email,
      subject: "New Connection Request",
      html: `
        <div style="font-family:sans-serif;padding:20px;">
          <h3>Hello ${receiver.username},</h3>
          <p>${sender.username} has sent you a connection request.</p>
          <p>Please click one of the options below:</p>
          <a href="${acceptUrl}" style="padding:10px 15px;background:#4CAF50;color:white;text-decoration:none;margin-right:10px;">Accept</a>
          <a href="${rejectUrl}" style="padding:10px 15px;background:#f44336;color:white;text-decoration:none;">Reject</a>
          <p>This link will expire in 24 hours.</p>
        </div>
      `,
    });

    res.json({ success: true, message: "Connection request sent successfully!" });
  } catch (error) {
    console.error("❌ Send Request Error:", error);
    res.status(500).json({ success: false, message: "Error sending connection request" });
  }
};

// ✅ Accept connection request
const acceptRequestController = async (req, res) => {
  try {
    const { token } = req.params;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { senderId, receiverId } = decoded;

    const request = await RequestModel.findOne({ token, status: "pending" });
    if (!request) return res.status(400).send("Request already handled or expired.");

    const sender = await UserModel.findById(senderId);
    const receiver = await UserModel.findById(receiverId);

    if (!sender || !receiver)
      return res.status(404).send("User not found or link expired.");

    if (!sender.connections.includes(receiverId)) sender.connections.push(receiverId);
    if (!receiver.connections.includes(senderId)) receiver.connections.push(senderId);

    await sender.save();
    await receiver.save();

    // ✅ Update request status
    request.status = "connected";
    await request.save();

    res.send(`
      <html><body style="text-align:center;font-family:sans-serif;margin-top:100px;">
      <h2>✅ Connection Accepted!</h2>
      <p>You and ${sender.username} are now connected.</p>
      </body></html>
    `);
  } catch (error) {
    console.error("❌ Accept Request Error:", error);
    res.status(500).send("Invalid or expired link.");
  }
};

// ✅ Reject connection request
const rejectRequestController = async (req, res) => {
  try {
    const { token } = req.params;
    const request = await RequestModel.findOne({ token });

    if (!request)
      return res.status(400).send("Invalid or expired link.");

    request.status = "rejected";
    await request.save();

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { senderId } = decoded;
    const sender = await UserModel.findById(senderId);

    res.send(`
      <html><body style="text-align:center;font-family:sans-serif;margin-top:100px;">
      <h2>❌ Connection Request Rejected</h2>
      <p>You have rejected the request from ${sender?.username || "the user"}.</p>
      </body></html>
    `);
  } catch (error) {
    console.error("❌ Reject Request Error:", error);
    res.status(500).send("Invalid or expired link.");
  }
};

// ✅ Disconnect controller
const disconnectController = async (req, res) => {
  try {
    const { targetUserId } = req.body;
    const currentUser = await UserModel.findById(req.user._id);
    const targetUser = await UserModel.findById(targetUserId);

    if (!currentUser || !targetUser)
      return res.status(404).json({ success: false, message: "User not found" });

    currentUser.connections = currentUser.connections.filter(
      (id) => id.toString() !== targetUserId
    );
    targetUser.connections = targetUser.connections.filter(
      (id) => id.toString() !== currentUser._id.toString()
    );

    await currentUser.save();
    await targetUser.save();

    res.json({ success: true, message: "Disconnected successfully" });
  } catch (error) {
    console.error("❌ Disconnect Error:", error);
    res.status(500).json({ success: false, message: "Error disconnecting" });
  }
};

module.exports = {
  sendRequestController,
  acceptRequestController,
  rejectRequestController,
  GetStudentBatchController,
  disconnectController,
};
