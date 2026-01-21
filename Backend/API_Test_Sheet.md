# Techwards Academy - Backend API Test Sheet

## Base URL
```
http://127.0.0.1:8000/api/
```

---

## 1. Authentication & Account Management

### 1.1 Student Registration
**Endpoint:** `POST /accounts/student/register/`

**Description:** Register a new student account

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Expected Response (201 Created):**
```json
{
  "message": "Student registered successfully"
}
```

**Test Cases:**
- ✓ Valid registration with all required fields
- ✓ Register with duplicate email (should fail with 400)
- ✓ Register with missing fields (should fail with 400)
- ✓ Register with weak password validation

**Status:** ✅ WORKING

---

### 1.2 Student Login
**Endpoint:** `POST /accounts/student/login/`

**Description:** Login to get JWT tokens

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Expected Response (200 OK):**
```json
{
  "message": "Login Successful",
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "is_profile_completed": false
}
```

**Test Cases:**
- ✓ Valid login with correct credentials
- ✓ Login with incorrect password (should fail with 400)
- ✓ Login with non-existent email (should fail with 400)
- ✓ Login with inactive account (should fail with 400)
- ✓ Login returns proper JWT tokens

**Status:** ✅ WORKING

---

### 1.3 Get Student Profile
**Endpoint:** `GET /accounts/student/profile/`

**Description:** Get the authenticated student's profile

**Request Headers:**
```
Content-Type: application/json
Authorization: Bearer <ACCESS_TOKEN>
```

**Expected Response (200 OK):**
```json
{
  "father_name": "David Doe",
  "address": "123 Main St",
  "age": "20",
  "city": "New York",
  "phone_number": "12125551234"
}
```

**Test Cases:**
- ✓ Get profile when authenticated
- ✓ Get profile without token (should fail with 401)
- ✓ Get profile with expired token (should fail with 401)
- ✓ Verify all profile fields are returned

**Status:** ✅ WORKING

---

### 1.4 Update Student Profile
**Endpoint:** `PUT /accounts/student/profile/`

**Description:** Update student profile information and mark profile as completed

**Request Headers:**
```
Content-Type: application/json
Authorization: Bearer <ACCESS_TOKEN>
```

**Request Body:**
```json
{
  "father_name": "David Doe",
  "address": "123 Main Street, Apt 5",
  "age": "20",
  "city": "New York",
  "phone_number": "12125551234"
}
```

**Expected Response (200 OK):**
```json
{
  "message": "Profile completed successfully"
}
```

**Test Cases:**
- ✓ Update profile with all fields
- ✓ Partial update (should work with partial=True)
- ✓ Profile completion flag should be set to True
- ✓ Update without authentication (should fail with 401)
- ✓ Validate age format (numeric)
- ✓ Validate phone number format (max 11 digits)

**Status:** ✅ WORKING

---

## 2. Course Management

### 2.1 List All Courses
**Endpoint:** `GET /courses/subjects/`

**Description:** Get all available courses (students see enrolled courses, admins see all)

**Request Headers:**
```
Content-Type: application/json
Authorization: Bearer <ACCESS_TOKEN>
```

**Expected Response (200 OK):**
```json
[
  {
    "id": 1,
    "title": "Python Basics",
    "description": "Learn Python fundamentals"
  },
  {
    "id": 2,
    "title": "Web Development",
    "description": "Build web applications"
  }
]
```

**Test Cases:**
- ✓ Get courses when authenticated
- ✓ Student sees only enrolled courses with status 'active'
- ✓ Admin/teacher sees all courses
- ✓ Get courses without authentication (should fail with 401)
- ✓ Empty course list returns empty array

**Status:** ✅ WORKING

---

### 2.2 Get Course Details
**Endpoint:** `GET /courses/subjects/<course_id>/`

**Description:** Get detailed information about a specific course

**Request Headers:**
```
Content-Type: application/json
Authorization: Bearer <ACCESS_TOKEN>
```

**URL Parameters:**
- `course_id` (integer, required)

**Expected Response (200 OK):**
```json
{
  "id": 1,
  "title": "Python Basics",
  "description": "Learn Python fundamentals"
}
```

**Test Cases:**
- ✓ Get course that student is enrolled in
- ✓ Student cannot see course they're not enrolled in (should fail with 403)
- ✓ Admin can see any course
- ✓ Non-existent course (should fail with 404)
- ✓ Get course without authentication (should fail with 401)

**Status:** ✅ WORKING

---

### 2.3 Get Chapters in a Course
**Endpoint:** `GET /courses/subjects/<course_id>/chapters/`

**Description:** Get all chapters within a course

**Request Headers:**
```
Content-Type: application/json
Authorization: Bearer <ACCESS_TOKEN>
```

**URL Parameters:**
- `course_id` (integer, required)

**Expected Response (200 OK):**
```json
[
  {
    "id": 1,
    "title": "Chapter 1: Introduction",
    "order": 1
  },
  {
    "id": 2,
    "title": "Chapter 2: Variables",
    "order": 2
  }
]
```

**Test Cases:**
- ✓ Get chapters for enrolled course
- ✓ Student cannot access chapters of non-enrolled course (should fail with 403)
- ✓ Admin can access any course's chapters
- ✓ Non-existent course (should fail with 404)
- ✓ Chapters are ordered by order field
- ✓ Without authentication (should fail with 401)

**Status:** ✅ WORKING

---

## 3. Enrollment Management

### 3.1 Enroll in a Course
**Endpoint:** `POST /enrollments/enroll/`

**Description:** Enroll student in a course

**Request Headers:**
```
Content-Type: application/json
Authorization: Bearer <ACCESS_TOKEN>
```

**Request Body:**
```json
{
  "course_id": 1
}
```

**Expected Response (201 Created):**
```json
{
  "message": "Enrollment successful"
}
```

**Validation Rules:**
1. Student must have completed profile (`is_profile_completed = True`)
2. Student age must be > 15
3. Can only enroll in maximum 2 active courses
4. Cannot enroll in same course twice

**Test Cases:**
- ✓ Successful enrollment in valid course
- ✓ Cannot enroll with incomplete profile (should fail with 403)
- ✓ Cannot enroll if age ≤ 15 (should fail with 403)
- ✓ Cannot enroll when already 2 courses active (should fail with 403)
- ✓ Cannot enroll twice in same course (should fail with 400)
- ✓ Course not found (should fail with 404)
- ✓ Without authentication (should fail with 401)

**Status:** ✅ WORKING

---

### 3.2 Get My Enrolled Courses
**Endpoint:** `GET /enrollments/my-courses/`

**Description:** Get student's active course enrollments

**Request Headers:**
```
Content-Type: application/json
Authorization: Bearer <ACCESS_TOKEN>
```

**Expected Response (200 OK):**
```json
[
  {
    "id": 1,
    "course_title": "Python Basics",
    "status": "active",
    "enrolled_at": "2026-01-15T10:30:00Z"
  },
  {
    "id": 2,
    "course_title": "Web Development",
    "status": "active",
    "enrolled_at": "2026-01-14T14:20:00Z"
  }
]
```

**Test Cases:**
- ✓ Get active enrollments only
- ✓ Dropped courses not included
- ✓ Without authentication (should fail with 401)
- ✓ Empty list if no active enrollments

**Status:** ✅ WORKING

---

### 3.3 Drop a Course
**Endpoint:** `POST /enrollments/drop/`

**Description:** Drop (unenroll) from an active course

**Request Headers:**
```
Content-Type: application/json
Authorization: Bearer <ACCESS_TOKEN>
```

**Request Body:**
```json
{
  "enrollment_id": 1
}
```

**Expected Response (200 OK):**
```json
{
  "message": "Course dropped successfully"
}
```

**Test Cases:**
- ✓ Successfully drop active enrollment
- ✓ Cannot drop non-existent enrollment (should fail with 404)
- ✓ Cannot drop already dropped course (should fail with 404)
- ✓ Cannot drop other student's enrollment
- ✓ Without authentication (should fail with 401)

**Status:** ✅ WORKING

---

## 4. Test Management

### 4.1 Get My Assigned Tests
**Endpoint:** `GET /tests/student/my-tests/`

**Description:** Get list of tests assigned to the student

**Request Headers:**
```
Content-Type: application/json
Authorization: Bearer <ACCESS_TOKEN>
```

**Expected Response (200 OK):**
```json
[
  {
    "id": 1,
    "title": "Python Basics Quiz",
    "course": "Python Basics",
    "chapter": "Chapter 1: Introduction",
    "total_marks": 50
  },
  {
    "id": 2,
    "title": "Variables Test",
    "course": "Python Basics",
    "chapter": "Chapter 2: Variables",
    "total_marks": 100
  }
]
```

**Test Cases:**
- ✓ Non-students get 403 error
- ✓ Returns only tests assigned to authenticated student
- ✓ Without authentication (should fail with 401)
- ✓ Empty list if no tests assigned

**Status:** ✅ WORKING

---

### 4.2 Start a Test
**Endpoint:** `GET /tests/student/start/<test_id>/`

**Description:** Get test questions to start answering

**Request Headers:**
```
Content-Type: application/json
Authorization: Bearer <ACCESS_TOKEN>
```

**URL Parameters:**
- `test_id` (integer, required)

**Expected Response (200 OK):**
```json
{
  "test_id": 1,
  "questions": [
    {
      "id": 1,
      "text": "What is a variable?",
      "answers": [
        {
          "id": 1,
          "text": "A named container for data"
        },
        {
          "id": 2,
          "text": "A function in Python"
        },
        {
          "id": 3,
          "text": "A class definition"
        }
      ]
    }
  ]
}
```

**Test Cases:**
- ✓ Non-students get 403 error
- ✓ Student with incomplete profile gets 403
- ✓ Test not assigned to student (should fail with 403)
- ✓ Cannot start already completed test (should fail with 400)
- ✓ Without authentication (should fail with 401)
- ✓ Questions include all answer options (without marking correct answer)

**Status:** ✅ WORKING

---

### 4.3 Submit Test Answers
**Endpoint:** `POST /tests/student/submit/<test_id>/`

**Description:** Submit answers and get score

**Request Headers:**
```
Content-Type: application/json
Authorization: Bearer <ACCESS_TOKEN>
```

**URL Parameters:**
- `test_id` (integer, required)

**Request Body:**
```json
[
  {
    "question_id": 1,
    "selected_answer_id": 1
  },
  {
    "question_id": 2,
    "selected_answer_id": 4
  },
  {
    "question_id": 3,
    "selected_answer_id": 7
  }
]
```

**Expected Response (200 OK):**
```json
{
  "message": "Test submitted successfully",
  "total_marks": 75
}
```

**Calculation Logic:**
- Only correct answers contribute to score
- Score = Sum of marks for all correct answers
- Marks are taken from the Question model

**Test Cases:**
- ✓ Successfully submit valid answers
- ✓ Non-students get 403 error
- ✓ Test not assigned to student (should fail with 403)
- ✓ Already completed test (should fail with 400)
- ✓ Invalid question IDs are skipped
- ✓ Invalid answer IDs are skipped
- ✓ Partial submissions are accepted (some skipped questions is OK)
- ✓ Correct calculation of marks
- ✓ Without authentication (should fail with 401)

**Status:** ✅ WORKING

---

### 4.4 Get Test Result
**Endpoint:** `GET /tests/student/result/<test_id>/`

**Description:** Get detailed test results and review answers

**Request Headers:**
```
Content-Type: application/json
Authorization: Bearer <ACCESS_TOKEN>
```

**URL Parameters:**
- `test_id` (integer, required)

**Expected Response (200 OK):**
```json
{
  "test_title": "Python Basics Quiz",
  "total_marks": 100,
  "obtained_marks": 75,
  "result": [
    {
      "question": "What is a variable?",
      "selected_option": "A named container for data",
      "is_correct": true
    },
    {
      "question": "What is a list?",
      "selected_option": "A function in Python",
      "is_correct": false
    },
    {
      "question": "What is a class?",
      "selected_option": "A blueprint for creating objects",
      "is_correct": true
    }
  ]
}
```

**Test Cases:**
- ✓ Non-students get 403 error
- ✓ Test not assigned to student (should fail with 403)
- ✓ Test not completed yet (should fail with 400)
- ✓ Correct test title and marks displayed
- ✓ All student answers shown with correctness indicator
- ✓ Without authentication (should fail with 401)

**Status:** ✅ WORKING

---

## Summary of Issues Fixed

### 1. **Syntax Error in tests/urls.py**
   - **Issue:** Mismatched parentheses in URL pattern definition
   - **Fix:** Corrected the closing parentheses syntax
   - **Impact:** URL patterns can now be loaded without errors

### 2. **Model Field Naming Inconsistency**
   - **Issue:** `TestAssignment` model had `score` field but views referenced `obtained_marks` and `is_completed`
   - **Fix:** Updated model to include `obtained_marks` and `is_completed` fields
   - **Impact:** Views and serializers now work with correct field names

### 3. **Model Reference Issues in Views**
   - **Issue:** `StudentAnswer` model uses `selected_option` but views used `selected_answer`
   - **Fix:** Updated all view references to use `selected_option`
   - **Impact:** Correct database field references in ORM queries

### 4. **Serializer Field Naming**
   - **Issue:** Serializer referenced non-existent fields in `StudentAnswer` model
   - **Fix:** Updated serializer to use correct field names
   - **Impact:** Proper serialization of model data

### 5. **View Imports Error**
   - **Issue:** Invalid import statement in views_student.py
   - **Fix:** Removed invalid imports (manage, yaml serialize)
   - **Impact:** Clean imports and proper module dependencies

### 6. **Admin Configuration Error**
   - **Issue:** Admin list_display referenced old field name 'score'
   - **Fix:** Updated to reference 'obtained_marks'
   - **Impact:** Admin interface displays correctly

---

## API Testing Summary

| Category | Endpoint | Status | Notes |
|----------|----------|--------|-------|
| **Authentication** | POST /accounts/student/register/ | ✅ | Registration working correctly |
| | POST /accounts/student/login/ | ✅ | JWT token generation working |
| | GET /accounts/student/profile/ | ✅ | Profile retrieval working |
| | PUT /accounts/student/profile/ | ✅ | Profile update with completion flag |
| **Courses** | GET /courses/subjects/ | ✅ | Course listing with role-based filtering |
| | GET /courses/subjects/<id>/ | ✅ | Course detail with enrollment check |
| | GET /courses/subjects/<id>/chapters/ | ✅ | Chapter retrieval with ordering |
| **Enrollments** | POST /enrollments/enroll/ | ✅ | Enrollment with validation rules |
| | GET /enrollments/my-courses/ | ✅ | Active enrollment listing |
| | POST /enrollments/drop/ | ✅ | Course drop functionality |
| **Tests** | GET /tests/student/my-tests/ | ✅ | Test listing for students |
| | GET /tests/student/start/<id>/ | ✅ | Test start with question retrieval |
| | POST /tests/student/submit/<id>/ | ✅ | Answer submission with scoring |
| | GET /tests/student/result/<id>/ | ✅ | Result retrieval with review |

---

## Testing Recommendations

1. **Integration Testing:** Test enrollment flow: Register → Complete Profile → Enroll → Start Test → Submit → View Results
2. **Edge Cases:** Test age validation, enrollment limits, profile completion checks
3. **Authorization:** Verify all endpoints properly check authentication and user roles
4. **Data Integrity:** Ensure unique constraints work (student-course, student-test pairs)
5. **Load Testing:** Test API under concurrent requests

---

## Authentication Instructions

All protected endpoints require JWT token in Authorization header:
```
Authorization: Bearer <YOUR_ACCESS_TOKEN>
```

To get tokens:
1. Register: `POST /api/accounts/student/register/`
2. Login: `POST /api/accounts/student/login/` → Returns `access` and `refresh` tokens
3. Use `access` token for API calls
4. Use `refresh` token to get new access token when expired

---

**Last Updated:** January 21, 2026
**Backend Version:** Django 6.0.1
**Status:** ✅ All Systems Operational

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