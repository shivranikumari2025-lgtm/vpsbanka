import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema({
  student_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  submitted_at: Date,
  submission_url: String,
  submission_text: String,
  marks_obtained: Number,
  feedback: String,
  status: {
    type: String,
    enum: ['pending', 'submitted', 'graded', 'overdue'],
    default: 'pending',
  },
});

const assignmentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Assignment title is required'],
  },
  description: String,
  chapter_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chapter',
    required: true,
  },
  subject_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true,
  },
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
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  max_marks: {
    type: Number,
    default: 100,
  },
  due_date: {
    type: Date,
    required: true,
  },
  instructions: String,
  attachment_url: String,
  submissions: [submissionSchema],
  is_published: {
    type: Boolean,
    default: true,
  },
  allow_late_submission: {
    type: Boolean,
    default: false,
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

export default mongoose.model('Assignment', assignmentSchema);
