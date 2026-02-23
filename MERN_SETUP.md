# VPS Banka - MERN Stack Setup Guide

This application has been converted to a full MERN (MongoDB, Express, React, Node.js) stack, completely removing Supabase.

## Project Structure

```
vpsbanka/
├── server/                      # Node.js Express Backend
│   ├── src/
│   │   ├── server.js           # Main server file
│   │   ├── models/             # MongoDB schemas
│   │   │   ├── User.js
│   │   │   ├── School.js
│   │   │   ├── Class.js
│   │   │   ├── Exam.js
│   │   │   └── Content.js
│   │   ├── routes/             # API routes
│   │   │   ├── auth.js
│   │   │   ├── users.js
│   │   │   ├── schools.js
│   │   │   ├── classes.js
│   │   │   └── exams.js
│   │   └── middleware/         # Authentication & Error handling
│   │       ├── auth.js
│   │       └── errorHandler.js
│   ├── .env.local              # Server environment variables
│   ├── .env.example            # Example configuration
│   └── package.json
│
└── src/                         # React Frontend
    ├── contexts/               # Auth context (JWT-based)
    ├── lib/
    │   └── api.ts             # API client for MongoDB API
    ├── pages/
    ├── components/
    └── ...
```

## Technology Stack

### Backend
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB ODM
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing
- **CORS** - Cross-origin requests

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **React Router** - Routing

## Getting Started

### 1. Install Dependencies

**Backend:**
```bash
cd server
npm install
```

**Frontend:**
```bash
npm install
```

### 2. Environment Setup

**Server (.env.local):**
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://alok85820018_db_user:Z05WSo1bGLeEIdjI@cluster0.z0g5y75.mongodb.net/?appName=Cluster0
JWT_SECRET=your_jwt_secret_key_change_this_in_production
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:5173
```

**Frontend (.env.local):**
```env
VITE_MONGODB_URI=mongodb+srv://alok85820018_db_user:Z05WSo1bGLeEIdjI@cluster0.z0g5y75.mongodb.net/?appName=Cluster0
VITE_API_URL=http://localhost:5000/api
```

### 3. Running the Application

**Start Backend (Port 5000):**
```bash
cd server
npm run dev
```

**Start Frontend (Port 5173):**
```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Demo Credentials

These users need to be created in MongoDB:

```
Super Admin:
  Email: superadmin@schoollms.com
  Password: SuperAdmin@123

School Admin:
  Email: admin@schoollms.com
  Password: Admin@123

Teacher:
  Email: teacher@schoollms.com
  Password: Teacher@123

Student:
  Email: student@schoollms.com
  Password: Student@123
```

### Creating Demo Users via API

You can create users using the registration endpoint:

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "superadmin@schoollms.com",
    "password": "SuperAdmin@123",
    "full_name": "Super Administrator",
    "role": "super_admin"
  }'
```

Or use a script to seed demo users.

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user (requires token)
- `POST /api/auth/logout` - User logout

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Schools
- `GET /api/schools` - Get all schools
- `POST /api/schools` - Create school
- `GET /api/schools/:id` - Get school by ID
- `PUT /api/schools/:id` - Update school
- `DELETE /api/schools/:id` - Delete school

### Classes
- `GET /api/classes` - Get all classes
- `POST /api/classes` - Create class
- `GET /api/classes/:id` - Get class by ID
- `PUT /api/classes/:id` - Update class
- `DELETE /api/classes/:id` - Delete class

### Exams
- `GET /api/exams` - Get all exams
- `POST /api/exams` - Create exam
- `GET /api/exams/:id` - Get exam by ID
- `PUT /api/exams/:id` - Update exam
- `DELETE /api/exams/:id` - Delete exam

## Authentication Flow

1. User enters credentials on login page
2. Frontend sends POST request to `/api/auth/login`
3. Backend validates credentials against MongoDB
4. Backend generates JWT token
5. Frontend stores token in localStorage
6. All subsequent API calls include token in Authorization header
7. Backend middleware verifies token on protected routes

## Running in Production

### Frontend Build
```bash
npm run build
npm run preview
```

### Backend
```bash
NODE_ENV=production npm start
```

## Removed Features

The following Supabase-specific features have been removed:
- ❌ Supabase client SDK
- ❌ Row-Level Security (RLS) policies
- ❌ Supabase real-time subscriptions
- ❌ Supabase authentication
- ❌ Supabase edge functions

They are replaced with:
- ✅ MongoDB database
- ✅ Standard authorization middleware
- ✅ RESTful API with JWT tokens
- ✅ Node.js/Express backend

## Database Models

All data is stored in MongoDB with the following models:

### User
```javascript
{
  email: string (unique)
  password: string (hashed)
  full_name: string
  role: 'super_admin' | 'admin' | 'teacher' | 'student'
  avatar_url: string
  school_id: ObjectId
  is_active: boolean
  last_login: Date
  created_at: Date
  updated_at: Date
}
```

### School
```javascript
{
  name: string
  code: string (unique)
  description: string
  principal_name: string
  principal_email: string
  phone: string
  address: string
  city: string
  state: string
  is_active: boolean
  created_by: ObjectId (User)
  created_at: Date
  updated_at: Date
}
```

### Class
```javascript
{
  name: string
  code: string
  subject: string
  school_id: ObjectId (School)
  teacher_id: ObjectId (User)
  grade_level: string
  capacity: number
  is_active: boolean
  students: [ObjectId] (User[])
  created_at: Date
  updated_at: Date
}
```

### Exam
```javascript
{
  title: string
  description: string
  class_id: ObjectId (Class)
  school_id: ObjectId (School)
  exam_date: Date
  total_marks: number
  passing_marks: number
  exam_type: 'quiz' | 'midterm' | 'final' | 'assignment'
  status: 'draft' | 'published' | 'in_progress' | 'completed'
  created_by: ObjectId (User)
  results: [{
    student_id: ObjectId (User)
    marks_obtained: number
    percentage: number
    status: string
  }]
  created_at: Date
  updated_at: Date
}
```

## Development Notes

- All endpoints require proper CORS headers configured
- JWT tokens expire in 7 days (configurable via JWT_EXPIRE)
- Passwords are hashed using bcryptjs before storing in MongoDB
- All timestamps are in UTC
- The frontend auto-redirects to login on token expiration

## Troubleshooting

**Backend won't start:**
- Check MongoDB connection string in `.env.local`
- Ensure port 5000 is not in use
- Verify Node.js version (v16+)

**Frontend can't connect to backend:**
- Check that backend is running on port 5000
- Verify VITE_API_URL in frontend `.env.local`
- Check browser console for CORS errors

**Login fails:**
- Verify user exists in MongoDB
- Check password is correct
- Ensure server is running with correct environment variables

## Security Considerations

- ⚠️ Change JWT_SECRET in production
- ⚠️ Use HTTPS in production
- ⚠️ Set secure CORS origins in production
- ⚠️ Implement rate limiting for login attempts
- ⚠️ Use environment variables for sensitive data

## Building for Production

```bash
# Frontend build
npm run build

# Backend - ensure environment variables are set
NODE_ENV=production npm start
```

---

**Project fully converted to MERN stack - All Supabase dependencies removed! 🎉**
