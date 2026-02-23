# Setting Up Demo Users in Supabase

The demo user creation function requires Supabase Functions to be deployed. For now, follow these steps to manually create demo users:

## Demo User Credentials

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

## Steps to Create Demo Users

### 1. Go to Supabase Dashboard
- Visit: https://app.supabase.com/
- Click on your project: **prwwdxkmuoynlwwzotnu**

### 2. Navigate to Authentication
- Click **Authentication** in the left sidebar
- Click **Users**

### 3. Create Each Demo User
Click **"Invite"** button and add each user:

**User 1: Super Admin**
- Email: `superadmin@schoollms.com`
- Password: `SuperAdmin@123`
- Click **Send invite** or **Create user**

**User 2: School Admin**
- Email: `admin@schoollms.com`
- Password: `Admin@123`

**User 3: Teacher**
- Email: `teacher@schoollms.com`
- Password: `Teacher@123`

**User 4: Student**
- Email: `student@schoollms.com`
- Password: `Student@123`

### 4. Create User Profiles
The app automatically creates profiles. After signing in, users will have profiles with their respective roles.

## Alternative: Seed Demo Users via Edge Function (Advanced)

To deploy the seeding function:

```bash
# Install Supabase CLI globally
npm install -g supabase

# Link your project
supabase link --project-ref prwwdxkmuoynlwwzotnu

# Get your access token from: https://app.supabase.com/account/tokens
# Set it as environment variable
export SUPABASE_ACCESS_TOKEN=your_token

# Deploy the function
supabase functions deploy seed-demo-users

# You can then call it from the app
```

## Testing the Application

Once you've created the demo users:

1. Open http://localhost:8080/
2. Click on any demo user card to auto-fill credentials
3. Click **Sign In**
4. You'll be logged in to the EduCloud LMS dashboard

## Troubleshooting

**If login fails:**
- Verify the email exactly matches what you created in Supabase
- Check that the password is correct
- Make sure the user exists in the Supabase **Authentication > Users** tab

**If profile doesn't appear:**
- The profile is created automatically on first login
- Check the `profiles` table in Supabase SQL Editor under **Tables**

**To view/edit profiles:**
1. Go to Supabase Dashboard
2. Click **SQL Editor**
3. Click **profiles** table
4. Add/edit user role: `super_admin`, `admin`, `teacher`, or `student`
