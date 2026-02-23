import mongoose from 'mongoose';

const classSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Class name is required'],
  },
  description: String,
  code: String,
  subject: String,
  school_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true,
  },
  teacher_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  schedule: {
    day: String,
    start_time: String,
    end_time: String,
  },
  capacity: Number,
  is_active: {
    type: Boolean,
    default: true,
  },
  image_url: String,
  grade_level: String,
  academic_year: String,
  students: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model('Class', classSchema);
