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

// Get upcoming meetings with participant count using aggregation
router.get('/upcoming', auth, async (req, res) => {
  try {
    const upcomingMeetings = await Meeting.aggregate([
      {
        $match: {
          $and: [
            {
              $or: [
                { organizer: req.user._id },
                { participants: req.user.email }
              ]
            },
            {
              startTime: { $gte: new Date() }
            }
          ]
        }
      },
      {
        $addFields: {
          participantCount: { $size: "$participants" },
          reminderCount: { $size: "$reminders" },
          daysUntilMeeting: {
            $ceil: {
              $divide: [
                { $subtract: ["$startTime", new Date()] },
                1000 * 60 * 60 * 24
              ]
            }
          }
        }
      },
      {
        $sort: { startTime: 1 }
      },
      {
        $project: {
          _id: 1,
          title: 1,
          description: 1,
          startTime: 1,
          endTime: 1,
          participants: 1,
          participantCount: 1,
          reminderCount: 1,
          daysUntilMeeting: 1
        }
      }
    ]);

    res.json(upcomingMeetings);
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong' });
  }
});

// Get participant analytics using aggregation
router.get('/participant-analytics', auth, async (req, res) => {
  try {
    const participantAnalytics = await Meeting.aggregate([
      {
        $match: {
          organizer: req.user._id
        }
      },
      {
        $unwind: "$participants"
      },
      {
        $group: {
          _id: "$participants",
          meetingCount: { $sum: 1 },
          totalDuration: {
            $sum: {
              $divide: [
                { $subtract: ["$endTime", "$startTime"] },
                1000 * 60 * 60 // Convert to hours
              ]
            }
          }
        }
      },
      {
        $addFields: {
          avgDuration: {
            $round: [
              { $divide: ["$totalDuration", "$meetingCount"] },
              2
            ]
          }
        }
      },
      {
        $sort: { meetingCount: -1 }
      },
      {
        $project: {
          _id: 0,
          participant: "$_id",
          meetingCount: 1,
          totalDuration: { $round: ["$totalDuration", 2] },
          avgDuration: 1
        }
      }
    ]);

    res.json(participantAnalytics);
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong' });
  }
});

// Get monthly meeting trends using aggregation
router.get('/monthly-trends', auth, async (req, res) => {
  try {
    const monthlyTrends = await Meeting.aggregate([
      {
        $match: {
          $or: [
            { organizer: req.user._id },
            { participants: req.user.email }
          ]
        }
      },
      {
        $addFields: {
          year: { $year: "$startTime" },
          month: { $month: "$startTime" },
          monthName: {
            $switch: {
              branches: [
                { case: { $eq: [{ $month: "$startTime" }, 1] }, then: "January" },
                { case: { $eq: [{ $month: "$startTime" }, 2] }, then: "February" },
                { case: { $eq: [{ $month: "$startTime" }, 3] }, then: "March" },
                { case: { $eq: [{ $month: "$startTime" }, 4] }, then: "April" },
                { case: { $eq: [{ $month: "$startTime" }, 5] }, then: "May" },
                { case: { $eq: [{ $month: "$startTime" }, 6] }, then: "June" },
                { case: { $eq: [{ $month: "$startTime" }, 7] }, then: "July" },
                { case: { $eq: [{ $month: "$startTime" }, 8] }, then: "August" },
                { case: { $eq: [{ $month: "$startTime" }, 9] }, then: "September" },
                { case: { $eq: [{ $month: "$startTime" }, 10] }, then: "October" },
                { case: { $eq: [{ $month: "$startTime" }, 11] }, then: "November" },
                { case: { $eq: [{ $month: "$startTime" }, 12] }, then: "December" }
              ],
              default: "Unknown"
            }
          }
        }
      },
      {
        $group: {
          _id: {
            year: "$year",
            month: "$month",
            monthName: "$monthName"
          },
          meetingCount: { $sum: 1 },
          totalParticipants: { $sum: { $size: "$participants" } },
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
        $sort: { "_id.year": 1, "_id.month": 1 }
      },
      {
        $project: {
          _id: 0,
          year: "$_id.year",
          month: "$_id.month",
          monthName: "$_id.monthName",
          meetingCount: 1,
          totalParticipants: 1,
          avgDuration: { $round: ["$avgDuration", 2] }
        }
      }
    ]);

    res.json(monthlyTrends);
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong' });
  }
});

module.exports = router;