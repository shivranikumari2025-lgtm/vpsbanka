# School Assignment & Instant Data Updates Guide

## How School Assignment Works

### Overview
Every user in the EduCloud LMS system belongs to a **school**. The `school_id` is a critical field in your user profile that determines:
- Which classes you can create and manage
- Which students you can see and assign
- Which content/materials are available to you
- Your access level within the system

### School ID Flow

#### 1. **Super Admin Initial Setup** (First Time)
```
Super Admin Created → No School Assigned Initially
↓
Super Admin must go to Schools page and create a school
↓
Super Admin manually assigns their own school_id in database OR
Creates school and gets assigned by system
```

#### 2. **Admin/Teacher User Creation**
When you create a new user (teacher, student, admin), they:
- **Are automatically assigned your school** at creation time
- This happens through the `school_id` parameter passed during registration
- If you (the creator) don't have a school_id, they won't be assigned one either

```
Admin/Teacher (with school_id=ABC) creates new user
  ↓
New user receives school_id=ABC automatically
  ↓
New user can immediately access content in that school
```

#### 3. **Manual School Assignment** (For users created without school)
If a user is created without a school_id:
- They will see "No school assigned" error when trying to create classes
- A Super Admin must manually assign their school in the database:
  ```javascript
  // Backend admin would run:
  db.users.updateOne(
    { email: "user@school.com" },
    { $set: { school_id: ObjectId("...") } }
  )
  ```

### Checking Your School Assignment

**In the UI:**
- Go to **User Management** page
- Look for your user in the list
- If you can see your `school_id` in the user record, you're assigned
- If it's empty/null, contact Super Admin

**Check Your Status:**
```
✅ School assigned → Can create classes immediately
❌ No school assigned → Error when creating classes (see warning in modal)
```

### Demo Users and School Assignment

All 4 demo users are pre-assigned to the same school:
```
Demo Users → All in School: "Demo School" (created automatically)
           → Can immediately create classes and content
           → Can see all demo data (examples, lessons, students)
```

---

## How Instant Data Updates Work

### The Problem (Before Fix)
❌ **Old behavior:**
- Create a class → Navigate away and back → Finally see the new class
- Add a student → Have to logout and login → New student appears
- Upload content → 5-second delay before showing
- Had to use polling (check every 5 seconds) for all data

### The Solution (After Fix)
✅ **New behavior:**
- Create a class → Instantly displayed on page
- Add a student → Immediately visible in list
- Delete material → Removed from list instantly
- Upload content → Shows up right away

### How It Works

#### 1. **Immediate Refetch on Mutation**
When you perform an action (create/update/delete), the system:
```
User Action (e.g., "Create Class")
  ↓
Send data to backend API
  ↓
API returns success
  ↓ [OLD: Wait 5 seconds]
  ↓ [NEW: Trigger refetch immediately]
  ↓
Refetch all data from server
  ↓
Update UI with new data
  ↓
Show the changes instantly
```

#### 2. **Affected Pages**

**Classes Page:**
- ✅ Create Class → Instantly shows new class
- ✅ Add Subject → Immediately visible under class
- ✅ Add Chapter → Right away in subject list
- ✅ Upload Material → Shows in chapter materials
- ✅ Delete Material → Removed instantly

**Users Page:**
- ✅ Create User → Instantly added to list
- ✅ Filter/Search → Works with new users immediately
- ✅ Role-specific views → Updated instantly

**Dashboard:**
- ✅ Stats refresh instantly after changes
- ✅ Recent activity updated immediately

#### 3. **Polling Backup**
Even with instant refetch, the system maintains a **5-second polling interval** as a backup:
- If instant refetch fails, polling catches it
- Ensures eventual consistency
- Prevents data from being out of sync

### Code Pattern

**Before (5-second polling only):**
```typescript
const handleCreateClass = async () => {
  await apiClient.createClass(data);
  // Next refresh happens after 5 seconds from polling interval
};

useEffect(() => {
  const interval = setInterval(fetchAll, 5000); // Every 5 seconds
  return () => clearInterval(interval);
}, []);
```

**After (Instant refetch + polling backup):**
```typescript
const handleCreateClass = async () => {
  await apiClient.createClass(data);
  // Immediately refetch data
  await fetchAll();
};

useEffect(() => {
  fetchAll(); // Initial load
  // Keep polling as backup
  const interval = setInterval(fetchAll, 5000); // Every 5 seconds
  return () => clearInterval(interval);
}, []);

{createClassModal && (
  <CreateClassModal
    onSuccess={() => {
      setCreateClassModal(false);
      fetchAll(); // Refetch immediately after success
    }}
  />
)}
```

---

## Complete User Lifecycle

### 1. **User Registration**
```
User signs up via Login page
  ↓
POST /api/auth/register
  ↓
System checks:
  - Email format valid? ✓
  - Password 6+ chars? ✓
  - Email unique? ✓
  ↓
Create user document with:
  - email
  - password_hash (bcrypted)
  - full_name
  - role (student/teacher/admin/super_admin)
  - school_id (if provided during signup)
  ↓
Generate JWT token (7-day expiration)
  ↓
Return token and user data
```

### 2. **User Login**
```
User enters email/password on Login page
  ↓
POST /api/auth/login
  ↓
Compare password with bcrypt hash
  ↓
✅ Match → Generate JWT token, return user profile
❌ No match → Return "Invalid credentials"
```

### 3. **Getting User Profile**
```
On page load / every 5 seconds:
GET /api/auth/me (requires Authorization header with JWT)
  ↓
Middleware validates JWT token
  ↓
Return full user object including:
  - _id (MongoDB ID)
  - email
  - full_name  
  - role
  - school_id (with full school details if assigned)
  - avatar_url
  - last_login
  - is_demo (true for demo accounts)
```

---

## Troubleshooting

### Issue: "No school assigned" when creating class

**Cause:** Your user account doesn't have a `school_id`

**Solution A - Super Admin:**
1. Go to User Management
2. Create new admin/teacher WITH your school selected
3. OR manually update their school_id in database

**Solution B - Regular Admin/Teacher:**
1. Contact your Super Admin
2. Ask them to assign your school: your_email@school.com
3. Super Admin goes to database and runs update
4. You logout and login again
5. Now your profile will have school_id

### Issue: Data not updating after 10 seconds

**Cause:** Instant refetch failed AND polling didn't run yet

**Solution:**
1. Manual: Refresh the page (F5)
2. Or wait max 5 seconds for polling to catch up
3. Check browser console for API errors
4. Verify backend is responding: `curl http://localhost:5000/api/health`

### Issue: Two different data views on same page

**Cause:** One user logged in multiple tabs, different views

**Solution:** 
- Reload both tabs
- Close all tabs and login fresh
- Clear browser cache (developer tools → Clear cache)

### Issue: Can't create user without school but I'm admin

**Cause:** Your admin account has no school_id

**Message:** "No school assigned" warning appears in modal

**Solution:**
1. Ask Super Admin to assign your school first
2. Logout and login again  
3. Refresh page to load updated profile
4. Now school_id will be populated
5. Creating users will auto-assign them to your school

---

## Architecture Deep Dive

### Data Structure

```javascript
// User Document in MongoDB
{
  _id: ObjectId("123..."),
  email: "teacher@school.com",
  password: "$2a$10$...", // bcrypted
  full_name: "John Smith",
  role: "teacher", // or admin, student, super_admin
  school_id: ObjectId("456..."), // Reference to School document
  is_demo: false,
  created_at: Date(),
  last_login: Date(),
  is_active: true,
  // Optional fields:
  phone: "123-456-7890",
  address: "123 Main St",
  avatar_url: "https://..."
}

// School Document
{
  _id: ObjectId("456..."),
  name: "ABC Public School",
  description: "...",
  address: "School Address",
  city: "City Name",
  state: "State",
  principal: "Principal Name",
  established_year: 2020
}

// Class Document
{
  _id: ObjectId("789..."),
  name: "Class 10-A",
  school_id: ObjectId("456..."), // Which school
  teacher_id: ObjectId("123..."), // Teacher reference
  grade_level: 10,
  description: "...",
  students: [ObjectId(...), ObjectId(...), ...] // Array of student IDs
}
```

### API Endpoints for School/User Operations

```
// User Management
GET    /api/users                    - Get all users (admin only)
GET    /api/users/:id                - Get single user
POST   /api/auth/register            - Create new user (pass school_id here)
PUT    /api/users/:id                - Update user (can update school_id)
DELETE /api/users/:id                - Delete user (super_admin only)
GET    /api/users/role/:role         - Get users by role

// Schools
GET    /api/schools                  - Get all schools
GET    /api/schools/:id              - Get school details
POST   /api/schools                  - Create school (super_admin only)
PUT    /api/schools/:id              - Update school details
```

---

## Testing the Fixes

### Test 1: School Assignment Works
```bash
1. Login as SUPER_ADMIN
2. Go to User Management
3. Click "Add User"
4. Should see ✅ message: "Users will be assigned to your school automatically"
5. Create a test user
6. User appears instantly in the list
7. Open that user's detail
8. Verify school_id is populated

Expected: ✅ User has your school_id automatically
```

### Test 2: Instant Data Updates
```bash
1. Login as TEACHER or ADMIN
2. Go to Classes page
3. Click "Create Class"
4. Fill in details, click Create
5. Wait 0-1 seconds

Expected: ✅ New class appears instantly (not after 5 seconds)
```

### Test 3: No Key Prop Warning
```bash
1. Open Developer Tools (F12)
2. Go to Console tab
3. Go to Users page
4. Look for warning about "key prop"

Expected: ✅ No warnings about missing keys on list items
```

---

## Summary

| Feature | Before | After |
|---------|--------|-------|
| **School Assignment** | Manual, error-prone | Automatic at user creation |
| **Data Refresh Speed** | 5+ seconds | Instant (< 1 second) |
| **Key Warnings** | Yes, list items had id/\_id mismatch | No, using \_id properly |
| **User Experience** | Create class, wait, navigate away, come back, see it | Create class, instantly appears |
| **Polling Fallback** | Only method | Backup safety net |
| **API Calls** | Every 5 seconds | On demand + polling |

---

## Still Need Help?

Check these first:
1. Are you logged in? `localhost:5173` should redirect to login if not
2. Does backend respond? `curl http://localhost:5000/api/health`
3. Open browser DevTools → Network tab → check for failed API calls
4. Check browser console for JavaScript errors
5. Check browser storage → look for JWT token in localStorage

