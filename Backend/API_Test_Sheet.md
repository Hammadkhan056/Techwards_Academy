# API Test Sheet for Techwards Academy Backend

## Base URL
http://127.0.0.1:8000

## 1. Student Registration API
**Endpoint:** `POST /api/accounts/student/register/`

**Headers:**
- Content-Type: application/json

**Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Expected Response (201 Created):**
```json
{
  "message": "Student registered successfully"
}
```

## 2. Student Login API
**Endpoint:** `POST /api/accounts/student/login/`

**Headers:**
- Content-Type: application/json

**Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Expected Response (200 OK):**
```json
{
  "message": "Login Successful",
  "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "is_profile_completed": false
}
```

## 3. Student Profile API (GET)
**Endpoint:** `GET /api/accounts/student/profile/`

**Headers:**
- Authorization: Bearer <access_token_from_login>
- Content-Type: application/json

**Expected Response (200 OK):**
```json
{
  "father_name": null,
  "address": null,
  "age": null,
  "city": null,
  "phone_number": null
}
```

## 4. Student Profile API (PUT)
**Endpoint:** `PUT /api/accounts/student/profile/`

**Headers:**
- Authorization: Bearer <access_token_from_login>
- Content-Type: application/json

**Body:**
```json
{
  "father_name": "Father Name",
  "address": "123 Main St",
  "age": "25",
  "city": "City Name",
  "phone_number": "1234567890"
}
```

**Expected Response (200 OK):**
```json
{
  "message": " Profile completed successfully"
}
```

## Notes
- Ensure the Django server is running: `python manage.py runserver`
- Make sure PostgreSQL is running and the database exists
- All migrations are applied: `python manage.py migrate`
- For authenticated endpoints, use the access token from login
- If you get 401 Unauthorized, check the token
- If you get 400 Bad Request, check the request body format