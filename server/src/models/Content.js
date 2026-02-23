import mongoose from 'mongoose';

const contentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Content title is required'],
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
  type: {
    type: String,
    enum: ['pdf', 'video', 'document', 'image', 'link'],
    default: 'pdf',
  },
  file_url: String,
  file_size: Number,
  thumbnail_url: String,
  uploaded_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  is_published: {
    type: Boolean,
    default: false,
  },
  order: Number,
  duration_minutes: Number,
  views_count: {
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

export default mongoose.model('Content', contentSchema);
