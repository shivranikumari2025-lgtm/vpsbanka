import express from 'express';
import Chapter from '../models/Chapter.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Get all chapters
router.get('/', authenticate, async (req, res) => {
  try {
    const chapters = await Chapter.find()
      .populate('subject_id')
      .populate('class_id')
      .populate('school_id')
      .populate('teacher_id');
    res.json(chapters);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get chapter by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const chapter = await Chapter.findById(req.params.id)
      .populate('subject_id')
      .populate('class_id')
      .populate('school_id')
      .populate('teacher_id');
    if (!chapter) {
      return res.status(404).json({ message: 'Chapter not found' });
    }
    res.json(chapter);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create chapter (Teachers & Admins)
router.post('/', authenticate, authorize('admin', 'super_admin', 'teacher'), async (req, res) => {
  try {
    const { name, chapter_number, description, subject_id, class_id, school_id, teacher_id } = req.body;

    if (!name || !chapter_number || !subject_id) {
      return res.status(400).json({ message: 'Name, chapter_number, and subject_id are required' });
    }

    const chapter = new Chapter({
      name,
      chapter_number,
      description,
      subject_id,
      class_id,
      school_id,
      teacher_id: teacher_id || req.userId,
    });

    await chapter.save();
    await chapter.populate(['subject_id', 'class_id', 'school_id', 'teacher_id']);
    
    res.status(201).json(chapter);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update chapter
router.put('/:id', authenticate, async (req, res) => {
  try {
    const chapter = await Chapter.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updated_at: new Date() },
      { new: true, runValidators: true }
    ).populate(['subject_id', 'class_id', 'school_id', 'teacher_id']);

    if (!chapter) {
      return res.status(404).json({ message: 'Chapter not found' });
    }

    res.json(chapter);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete chapter (Admins only)
router.delete('/:id', authenticate, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const chapter = await Chapter.findByIdAndDelete(req.params.id);
    if (!chapter) {
      return res.status(404).json({ message: 'Chapter not found' });
    }
    res.json({ message: 'Chapter deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get chapters by subject
router.get('/subject/:subjectId', authenticate, async (req, res) => {
  try {
    const chapters = await Chapter.find({ subject_id: req.params.subjectId })
      .populate('teacher_id')
      .sort('chapter_number');
    res.json(chapters);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
