import mongoose from 'mongoose';

const examSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Exam title is required'],
  },
  description: String,
  class_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true,
  },
  school_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true,
  },
  subject: String,
  exam_date: Date,
  start_time: String,
  end_time: String,
  duration_minutes: Number,
  total_marks: Number,
  passing_marks: Number,
  exam_type: {
    type: String,
    enum: ['quiz', 'midterm', 'final', 'assignment'],
    default: 'quiz',
  },
  instructions: String,
  status: {
    type: String,
    enum: ['draft', 'published', 'in_progress', 'completed'],
    default: 'draft',
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  results: [{
    student_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    marks_obtained: Number,
    percentage: Number,
    status: {
      type: String,
      enum: ['not_started', 'in_progress', 'submitted', 'graded'],
    },
    submitted_at: Date,
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

export default mongoose.model('Exam', examSchema);
