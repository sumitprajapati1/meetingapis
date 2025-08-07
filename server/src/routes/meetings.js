const express = require('express');
const jwt = require('jsonwebtoken');
const Meeting = require('../models/Meeting');
const User = require("../models/Users");
const { sendEmail } = require('../utils/email');
const router = express.Router();

// Middleware to verify JWT
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization').replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);
    next();
  } catch (error) {
    res.status(401).json({ message: 'Please authenticate' });
  }
};

// Create meeting
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, startTime, endTime, participants, reminders } = req.body;
    
    const meeting = new Meeting({
      title,
      description,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      organizer: req.user._id,
      participants,
      reminders
    });
    
    await meeting.save();
    
    // Send email invites
    await sendEmail({
      to: participants,
      subject: `Invitation: ${title}`,
      text: `You've been invited to a meeting: ${title}\n\nDescription: ${description}\n\nTime: ${startTime} to ${endTime}`
    });
    
    res.status(201).json(meeting);
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong' });
  }
});

// Get user's meetings
router.get('/', auth, async (req, res) => {
  try {
    const meetings = await Meeting.find({
      $or: [
        { organizer: req.user._id },
        { participants: req.user.email }
      ]
    }).sort({ startTime: 1 });
    
    res.json(meetings);
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong' });
  }
});

// Get meeting statistics using aggregation
router.get('/stats', auth, async (req, res) => {
  try {
    const stats = await Meeting.aggregate([
      {
        $match: {
          $or: [
            { organizer: req.user._id },
            { participants: req.user.email }
          ]
        }
      },
      {
        $group: {
          _id: null,
          totalMeetings: { $sum: 1 },
          totalParticipants: { $sum: { $size: "$participants" } },
          avgParticipants: { $avg: { $size: "$participants" } },
          totalDuration: {
            $sum: {
              $divide: [
                { $subtract: ["$endTime", "$startTime"] },
                1000 * 60 * 60 // Convert to hours
              ]
            }
          },
          avgDuration: {
            $avg: {
              $divide: [
                { $subtract: ["$endTime", "$startTime"] },
                1000 * 60 * 60 // Convert to hours
              ]
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          totalMeetings: 1,
          totalParticipants: 1,
          avgParticipants: { $round: ["$avgParticipants", 2] },
          totalDuration: { $round: ["$totalDuration", 2] },
          avgDuration: { $round: ["$avgDuration", 2] }
        }
      }
    ]);

    res.json(stats[0] || {
      totalMeetings: 0,
      totalParticipants: 0,
      avgParticipants: 0,
      totalDuration: 0,
      avgDuration: 0
    });
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong' });
  }
});



module.exports = router;