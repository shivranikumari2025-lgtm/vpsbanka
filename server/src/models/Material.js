import mongoose from 'mongoose';

const materialSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Material title is required'],
  },
  description: String,
  type: {
    type: String,
    enum: ['theory', 'notes', 'question_bank', 'exam_practice', 'assignment', 'video', 'pdf', 'document'],
    default: 'theory',
  },
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
  uploaded_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  file_url: String,
  file_name: String,
  file_type: String,
  file_size: Number,
  thumbnail_url: String,
  duration_minutes: Number,
  views_count: {
    type: Number,
    default: 0,
  },
  downloads_count: {
    type: Number,
    default: 0,
  },
  is_published: {
    type: Boolean,
    default: true,
  },
  order: {
    type: Number,
    default: 0,
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

export default mongoose.model('Material', materialSchema);
