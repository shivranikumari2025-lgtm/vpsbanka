import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    select: false,
  },
  full_name: {
    type: String,
    required: [true, 'Full name is required'],
  },
  role: {
    type: String,
    enum: ['super_admin', 'admin', 'teacher', 'student'],
    default: 'student',
  },
  avatar_url: String,
  is_demo: {
    type: Boolean,
    default: false,
  },
  school_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
  },
  phone: String,
  address: String,
  city: String,
  state: String,
  zip_code: String,
  date_of_birth: Date,
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
  },
  is_active: {
    type: Boolean,
    default: true,
  },
  last_login: Date,
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Hide password on toJSON
userSchema.methods.toJSON = function() {
  const { password, ...user } = this.toObject();
  return user;
};

export default mongoose.model('User', userSchema);
