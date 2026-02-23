import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  question_text: {
    type: String,
    required: true,
  },
  question_type: {
    type: String,
    enum: ['mcq', 'short_answer', 'essay', 'true_false'],
    default: 'mcq',
  },
  options: [String], // For MCQ
  correct_answer: String,
  marks: {
    type: Number,
    default: 1,
  },
  order: Number,
});

const quizSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Quiz title is required'],
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
  questions: [questionSchema],
  total_marks: {
    type: Number,
    default: 0,
  },
  passing_marks: {
    type: Number,
    default: 0,
  },
  duration_minutes: {
    type: Number,
    default: 30,
  },
  shuffle_questions: {
    type: Boolean,
    default: true,
  },
  show_answers_after_submit: {
    type: Boolean,
    default: true,
  },
  is_published: {
    type: Boolean,
    default: true,
  },
  attempts_allowed: {
    type: Number,
    default: 1,
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

export default mongoose.model('Quiz', quizSchema);
