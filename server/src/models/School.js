import mongoose from 'mongoose';

const schoolSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'School name is required'],
  },
  description: String,
  code: {
    type: String,
    unique: true,
    sparse: true,
  },
  principal_name: String,
  principal_email: String,
  principal_phone: String,
  address: String,
  city: String,
  state: String,
  zip_code: String,
  country: String,
  website: String,
  phone: String,
  email: String,
  logo_url: String,
  banner_url: String,
  established_year: Number,
  total_students: Number,
  total_teachers: Number,
  is_active: {
    type: Boolean,
    default: true,
  },
  is_demo: {
    type: Boolean,
    default: false,
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model('School', schoolSchema);
