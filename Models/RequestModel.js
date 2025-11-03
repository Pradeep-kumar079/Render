const mongoose = require("mongoose");

const RequestSchema = new mongoose.Schema({
  from: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "UserModel",
    required: true,
  },
  to: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "UserModel",
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "connected", "rejected"],
    default: "pending",
  },
  token: {
    type: String,
    required: true,
    unique: true,
  },
}, { timestamps: true });

module.exports = mongoose.model("Request", RequestSchema);
