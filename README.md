# Meeting Reminders API

A RESTful API for managing meeting reminders .

## Table of Contents
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [API Endpoints](#api-endpoints)
  - [Authentication](#authentication)
  - [Meetings](#meetings)
- [Testing with Postman](#testing-with-postman)

## Features

- 🔐 JWT-based authentication
- 📅 Meeting creation and management
- 📧 Email notifications for meeting invitations

## Tech Stack

- **Backend:** Node.js, Express.js
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** JWT (JSON Web Tokens)
- **Email:** Nodemailer
- **Password Hashing:** bcryptjs
- **CORS:** Enabled for cross-origin requests

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   cd server
   npm install
   ```
3. Set up environment variables (see below)
4. Start the server:
   ```bash
   npm start
   ```

## Environment Variables

Create a `.env` file in the server directory:

```env
MONGODB_URI=mongodb://localhost:27017/meeting-reminders
JWT_SECRET=your-secret-key-here
PORT=3000
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-email-password
```

## API Endpoints

### Authentication

#### 1. User Registration
**Endpoint:** `POST /api/auth/signup`

Creates a new user account with encrypted password.

```bash
curl -X POST https://meetingapis.onrender.com/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }'
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

#### 2. User Login
**Endpoint:** `POST /api/auth/login`

Authenticates user and returns JWT token.

```bash
curl -X POST https://meetingapis.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

### Meetings

#### 3. Create Meeting
**Endpoint:** `POST /api/meetings`

Creates a new meeting and sends email invitations to participants.

```bash
curl -X POST https://meetingapis.onrender.com/api/meetings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "Team Standup",
    "description": "Daily team standup meeting",
    "startTime": "2024-01-15T10:00:00.000Z",
    "endTime": "2024-01-15T10:30:00.000Z",
    "participants": ["jane@example.com", "bob@example.com"],
    "reminders": [
      {
        "timeBefore": 15,
        "unit": "minutes"
      },
      {
        "timeBefore": 1,
        "unit": "hours"
      }
    ]
  }'
```

**Response:**
```json
{
  "_id": "507f1f77bcf86cd799439012",
  "title": "Team Standup",
  "description": "Daily team standup meeting",
  "startTime": "2024-01-15T10:00:00.000Z",
  "endTime": "2024-01-15T10:30:00.000Z",
  "organizer": "507f1f77bcf86cd799439011",
  "participants": ["jane@example.com", "bob@example.com"],
  "reminders": [
    {
      "timeBefore": 15,
      "unit": "minutes",
      "sent": false
    },
    {
      "timeBefore": 1,
      "unit": "hours",
      "sent": false
    }
  ],
  "createdAt": "2024-01-10T08:00:00.000Z"
}
```

#### 4. Get User's Meetings
**Endpoint:** `GET /api/meetings`

Retrieves all meetings where the user is either organizer or participant.

```bash
curl -X GET https://meetingapis.onrender.com/api/meetings \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
[
  {
    "_id": "507f1f77bcf86cd799439012",
    "title": "Team Standup",
    "description": "Daily team standup meeting",
    "startTime": "2024-01-15T10:00:00.000Z",
    "endTime": "2024-01-15T10:30:00.000Z",
    "organizer": "507f1f77bcf86cd799439011",
    "participants": ["jane@example.com", "bob@example.com"],
    "reminders": [...],
    "createdAt": "2024-01-10T08:00:00.000Z"
  }
]
```

### Analytics & Aggregation

#### 5. Meeting Statistics
**Endpoint:** `GET /api/meetings/stats`

Provides comprehensive statistics about user's meetings using MongoDB aggregation.

```bash
curl -X GET https://meetingapis.onrender.com/api/meetings/stats \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "totalMeetings": 15,
  "totalParticipants": 45,
  "avgParticipants": 3.0,
  "totalDuration": 22.5,
  "avgDuration": 1.5
}
```


## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
