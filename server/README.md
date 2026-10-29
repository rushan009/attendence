# Smart School Attendance System - Backend (Phase 1A)

Backend implementation for Phase 1A of the Smart School Attendance System (Nepal school context).

## Tech Stack
- **Runtime & Framework**: Node.js (ES Modules), Express
- **Database**: MongoDB Atlas with Mongoose ODM
- **Authentication**: JWT stored in an `httpOnly` cookie (`sameSite: "lax"`, `secure` in production)
- **Security**:
  - `bcrypt` hashing for 4-digit PINs (10 rounds)
  - `express-rate-limit`: 10 requests per 15 minutes per IP on `/login` and `/register`
  - 5 failed login lockout (locks phone for 15 minutes)
  - Strict JSON body size limits (10kb)
  - Selective projection (`pinHash` never returned)
  - Restricted CORS to `FRONTEND_URL` with credentials support
- **Validation**: Zod schema validation middleware
- **Error Handling**: Centralized handler for Zod, Mongo duplicate keys (E11000), and generic exceptions

---

## Directory Structure

```text
server/
  src/
    config/
      db.config.js             # MongoDB connection configuration
    models/
      User.model.js            # User schema with roles, lockout, and status
      Class.model.js           # Class schema reference
    controllers/
      authController.controller.js # Controller logic for register, login, logout, me
      admin.controller.js       # Admin teacher approval and class assignment
    routes/
      auth.routes.js           # Express router mounting auth endpoints with rate limiting
      admin.routes.js          # Admin-only teacher and class management routes
    middleware/
      auth.middleware.js       # JWT verification & approval status check
      roles.middleware.js      # RBAC role check middleware
      validate.middleware.js   # Generic Zod validation middleware
      errorHandler.middleware.js # Centralized error handler
    app.js                     # Express app setup and middleware pipeline
  scripts/
    seedAdmin.js               # CLI and env-based admin seeding script
  server.js                    # Entry point connecting DB and starting HTTP server
  .env.example                 # Sample environment variables
  package.json                 # Dependencies and npm scripts
  README.md                    # Setup, seed, and test documentation
```

---

## Environment Variables

Copy `.env.example` to `.env` inside the `server/` directory:

```bash
cp .env.example .env
```

| Variable | Description | Default |
|---|---|---|
| `PORT` | Port for the Express server | `5000` |
| `MONGODB_URI` | MongoDB Atlas or local connection string | - |
| `JWT_SECRET` | Secret key for signing JWT tokens | - |
| `COOKIE_NAME` | Name of the auth cookie | `token` |
| `NODE_ENV` | Environment (`development` or `production`) | `development` |
| `FRONTEND_URL` | Allowed origin for CORS | `http://localhost:5173` |
| `ADMIN_PHONE` | Default phone for admin seed | `9816995484` |
| `ADMIN_PIN` | Default PIN for admin seed | `1234` |
| `ADMIN_NAME` | Default name for admin seed | `Super Admin` |

---

## Installation & Running

### 1. Install Dependencies
```bash
cd server
npm install
```

### 2. Run Seed Script (Admin Creation)
The seed script will only create an admin if no admin exists:

Using CLI arguments:
```bash
node scripts/seedAdmin.js 9816995484 1234 "School Principal"
```

Using environment variables:
```bash
npm run seed:admin
```

### 3. Start Development Server
```bash
npm run dev
```

### 4. Start Production Server
```bash
npm start
```

---

## API Endpoints (Base URL: `/api/auth`)

### 1. Register Teacher
- **Method**: `POST`
- **Path**: `/api/auth/register`
- **Rate Limit**: 10 requests / 15 minutes / IP
- **Body**:
  ```json
  {
    "name": "Ram Bahadur",
    "phone": "9812345678",
    "pin": "1234"
  }
  ```
- Public registration always creates a pending teacher with no class assignment.
  Class assignment is performed later by an authenticated administrator.
- **Responses**:
  - `201 Created`: `{ "success": true, "message": "Registration submitted. Wait for admin approval." }`
  - `400 Bad Request`: Validation error (Zod field issues)
  - `409 Conflict`: `{ "success": false, "message": "Phone number already registered" }`

### 2. Login
- **Method**: `POST`
- **Path**: `/api/auth/login`
- **Rate Limit**: 10 requests / 15 minutes / IP
- **Body**:
  ```json
  {
    "phone": "9812345678",
    "pin": "1234"
  }
  ```
- **Responses**:
  - `200 OK`: Sets httpOnly cookie and returns:
    ```json
    {
      "success": true,
      "user": {
        "id": "...",
        "name": "Ram Bahadur",
        "phone": "9812345678",
        "role": "teacher",
        "class": null
      }
    }
    ```
  - `401 Unauthorized`: `{ "success": false, "message": "Invalid phone or PIN" }`
  - `403 Forbidden` (Pending): `{ "success": false, "message": "Account pending approval" }`
  - `403 Forbidden` (Rejected): `{ "success": false, "message": "Account rejected" }`
  - `423 Locked`: `{ "success": false, "message": "Account is temporarily locked due to 5 failed attempts. Please try again in 15 minute(s)." }`

### 3. Logout
- **Method**: `POST`
- **Path**: `/api/auth/logout`
- **Response**:
  - `200 OK`: Clears httpOnly cookie: `{ "success": true, "message": "Logged out successfully" }`

### 4. Get Current User ("Me")
- **Method**: `GET`
- **Path**: `/api/auth/me`
- **Headers**: Cookie containing the JWT token
- **Responses**:
  - `200 OK`: Current user profile (class populated, `pinHash` never included)
  - `401 Unauthorized`: Token missing or invalid
  - `403 Forbidden`: Account not approved

## Admin Teacher Management (Base URL: `/api/admin`)

All endpoints below require the authenticated administrator's httpOnly cookie.

### List teachers
- `GET /api/admin/teachers`
- Optional status filter: `GET /api/admin/teachers?status=pending`
- Returns teacher records with their populated class assignment.

### List classes
- `GET /api/admin/classes`
- Returns the existing class records for the assignment dropdown.

### Approve or reject a teacher
- `PATCH /api/admin/teachers/:teacherId/status`
- Body: `{ "status": "approved" }` or `{ "status": "rejected" }`

### Assign or remove a teacher's class
- `PATCH /api/admin/teachers/:teacherId/class`
- Body: `{ "classId": "<existing-class-id>" }` or `{ "classId": null }`
- Only approved teachers can be assigned to a class.
- A class cannot be assigned to more than one teacher.

---

## Testing with cURL

### Register:
```bash
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name": "Hari Sharma", "phone": "9800000001", "pin": "5678"}'
```

### Login (Admin):
```bash
curl -i -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone": "9816995484", "pin": "1234"}' \
  -c cookies.txt
```

### Me (Authenticated):
```bash
curl -X GET http://localhost:5001/api/auth/me \
  -b cookies.txt
```

### Logout:
```bash
curl -i -X POST http://localhost:5001/api/auth/logout \
  -b cookies.txt
```
