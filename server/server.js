require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// Database connection
mongoose.connect(process.env.MONGODB_URI).then(() => {
    console.log("Connected to MongoDB");
}).catch((err) => {
    console.log(err);
});

// Models
const User = require('./src/models/Users');
const Meeting = require('./src/models/Meeting');

// Routes
const authRoutes = require('./src/routes/auth');
const meetingRoutes = require('./src/routes/meetings');

app.use('/api/auth', authRoutes);
app.use('/api/meetings', meetingRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));