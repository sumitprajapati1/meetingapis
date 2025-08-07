const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema({
  timeBefore: Number,
  unit: String, // minutes, hours, days
  sent: { type: Boolean, default: false }
});

const meetingSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  participants: [{ type: String }], // Array of emails
  reminders: [reminderSchema],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Meeting', meetingSchema);