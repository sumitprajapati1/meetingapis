const Meeting = require('../models/Meeting');
const { sendEmail } = require('../utils/email');

const checkReminders = async () => {
  try {
    const now = new Date();
    const meetings = await Meeting.find({
      'reminders.sent': false,
      startTime: { $gt: now }
    });
    
    for (const meeting of meetings) {
      for (const reminder of meeting.reminders) {
        if (!reminder.sent) {
          let reminderTime;
          const timeInMs = reminder.timeBefore * 
            (reminder.unit === 'minutes' ? 60000 : 
             reminder.unit === 'hours' ? 3600000 : 
             reminder.unit === 'days' ? 86400000 : 0);
          
          reminderTime = new Date(meeting.startTime.getTime() - timeInMs);
          
          if (now >= reminderTime) {
            // Send reminder
            await sendEmail({
              to: meeting.participants,
              subject: `Reminder: ${meeting.title}`,
              text: `Reminder: ${meeting.title} is scheduled for ${meeting.startTime}`
            });
            
            // Mark as sent
            reminder.sent = true;
            await meeting.save();
          }
        }
      }
    }
  } catch (error) {
    console.error('Error checking reminders:', error);
  }
};

// Run every minute
setInterval(checkReminders, 60000);

module.exports = { checkReminders };