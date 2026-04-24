# Radhe Salt Backend

A production-ready Node.js Express backend project with MongoDB, JWT authentication, and modern best practices.

## 🚀 Project Structure

```
radhe-salt-backend/
├── src/
│   ├── index.js                 # Server entry point
│   ├── app.js                   # Express app configuration
│   ├── constants.js             # Application constants
│   ├── controllers/
│   │   └── user.controller.js   # User business logic
│   ├── models/
│   │   └── user.model.js        # Mongoose User schema
│   ├── routes/
│   │   └── user.route.js        # User API routes
│   ├── middlewares/
│   │   ├── auth.middleware.js   # JWT authentication
│   │   ├── errorHandler.js      # Global error handling
│   │   └── multer.middleware.js # File upload configuration
│   ├── db/
│   │   └── index.js             # MongoDB connection
│   └── utils/
│       ├── ApiError.js          # Custom error class
│       ├── ApiResponse.js       # Standardized response class
│       ├── asyncHandler.js      # Async error wrapper
│       └── cloudinary.js        # Cloudinary integration
├── uploads/                     # Temporary file storage
├── package.json                 # Dependencies
├── .env                         # Environment variables
└── .gitignore                   # Git ignore rules
```

## 📦 Tech Stack

- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (jsonwebtoken)
- **File Uploads**: Multer
- **Cloud Storage**: Cloudinary
- **Password Hashing**: Bcrypt
- **Environment**: dotenv
- **Dev Tools**: Nodemon, Prettier

## 📋 Prerequisites

- Node.js v14+ (currently using v25.9.0)
- npm v6+
- MongoDB running locally or connection string

## 🔧 Installation

1. **Clone or navigate to the project**
   ```bash
   cd /Users/rohitlokhande/Desktop/radheSaltBackend
   ```

2. **Dependencies are already installed**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   Edit `.env` file with your settings:
   ```env
   PORT=8000
   MONGODB_URI=mongodb://localhost:27017
   JWT_SECRET=your_secure_secret_key
   JWT_EXPIRE=1d
   CORS_ORIGIN=*
   NODE_ENV=development
   
   # Optional: Cloudinary credentials
   CLOUDINARY_NAME=your_name
   CLOUDINARY_API_KEY=your_key
   CLOUDINARY_API_SECRET=your_secret
   ```

## ▶️ Running the Server

**Development mode** (with auto-reload):
```bash
npm run dev
```

**Production mode**:
```bash
npm start
```

Server will run on `http://localhost:8000`

## 📡 API Endpoints

### User Routes (`/api/v1/user`)

- **POST /register** - Register a new user
  ```json
  {
    "username": "john_doe",
    "email": "john@example.com",
    "fullName": "John Doe",
    "password": "secure_password"
  }
  ```

- **POST /login** - Login user
  ```json
  {
    "email": "john@example.com",
    "password": "secure_password"
  }
  ```

- **POST /logout** - Logout user (requires JWT token)
  - Header: `Authorization: Bearer <accessToken>`

### Health Check

- **GET /api/v1/health** - Check server status

## 🔐 Security Features

- ✅ JWT token-based authentication
- ✅ Password hashing with bcrypt
- ✅ CORS enabled
- ✅ Input validation
- ✅ Error handling middleware
- ✅ Environment variables for sensitive data

## 🛠️ Utility Classes

### ApiResponse
Standardized response format for all successful API responses.
```javascript
new ApiResponse(statusCode, data, message)
```

### ApiError
Custom error class for consistent error formatting.
```javascript
throw new ApiError(statusCode, message, errors, stack)
```

### asyncHandler
Wrapper for route handlers to catch async/await errors automatically.
```javascript
router.post("/route", asyncHandler(async (req, res) => { ... }))
```

## 📁 Adding New Features

### 1. Create a Model
`src/models/yourmodel.model.js`
```javascript
import mongoose from "mongoose";

const schema = new mongoose.Schema({ ... });
export const YourModel = mongoose.model("YourModel", schema);
```

### 2. Create a Controller
`src/controllers/yourmodel.controller.js`
```javascript
import { asyncHandler } from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";

export const yourFunction = asyncHandler(async (req, res) => {
  // Your logic here
  return res.status(200).json(new ApiResponse(200, data, "Success"));
});
```

### 3. Create a Route
`src/routes/yourmodel.route.js`
```javascript
import { Router } from "express";
import { yourFunction } from "../controllers/yourmodel.controller.js";

const router = Router();
router.route("/endpoint").post(yourFunction);

export default router;
```

### 4. Mount Route in app.js
```javascript
import yourRoute from "./routes/yourmodel.route.js";
app.use("/api/v1/yourmodel", yourRoute);
```

## 🧪 Testing

Run tests with:
```bash
npm test
```

## 🐛 Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running: `mongod`
- Check `MONGODB_URI` in `.env`

### Port Already in Use
```bash
lsof -i :8000  # Find process
kill -9 <PID>  # Kill process
```

### npm Audit Vulnerabilities
```bash
npm audit fix
npm audit fix --force
```

## 📝 Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| PORT | Server port | 8000 |
| MONGODB_URI | MongoDB connection string | mongodb://localhost:27017 |
| JWT_SECRET | JWT signing secret | your_secret_key |
| JWT_EXPIRE | JWT expiration time | 1d |
| CORS_ORIGIN | Allowed origins for CORS | * |
| NODE_ENV | Environment | development |
| CLOUDINARY_NAME | Cloudinary account name | (optional) |
| CLOUDINARY_API_KEY | Cloudinary API key | (optional) |
| CLOUDINARY_API_SECRET | Cloudinary API secret | (optional) |

## 📚 Resources

- [Express.js Documentation](https://expressjs.com/)
- [Mongoose Documentation](https://mongoosejs.com/)
- [JWT Documentation](https://jwt.io/)
- [Cloudinary Documentation](https://cloudinary.com/documentation)

## 📄 License

ISC

---

**Created**: April 24, 2026  
**Node Version**: v25.9.0  
**npm Version**: v11.12.1
