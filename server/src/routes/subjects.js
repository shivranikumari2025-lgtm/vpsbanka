import express from 'express';
import Subject from '../models/Subject.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Get all subjects
router.get('/', authenticate, async (req, res) => {
  try {
    const subjects = await Subject.find()
      .populate('class_id')
      .populate('school_id')
      .populate('teacher_id');
    res.json(subjects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get subject by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id)
      .populate('class_id')
      .populate('school_id')
      .populate('teacher_id');
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }
    res.json(subject);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create subject (Teachers & Admins)
router.post('/', authenticate, authorize('admin', 'super_admin', 'teacher'), async (req, res) => {
  try {
    const { name, code, description, class_id, school_id, teacher_id } = req.body;

    if (!name || !code || !class_id) {
      return res.status(400).json({ message: 'Name, code, and class_id are required' });
    }

    const subject = new Subject({
      name,
      code,
      description,
      class_id,
      school_id,
      teacher_id: teacher_id || req.userId,
    });

    await subject.save();
    await subject.populate(['class_id', 'school_id', 'teacher_id']);
    
    res.status(201).json(subject);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update subject
router.put('/:id', authenticate, async (req, res) => {
  try {
    const subject = await Subject.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updated_at: new Date() },
      { new: true, runValidators: true }
    ).populate(['class_id', 'school_id', 'teacher_id']);

    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    res.json(subject);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete subject (Admins only)
router.delete('/:id', authenticate, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const subject = await Subject.findByIdAndDelete(req.params.id);
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }
    res.json({ message: 'Subject deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get subjects by class
router.get('/class/:classId', authenticate, async (req, res) => {
  try {
    const subjects = await Subject.find({ class_id: req.params.classId })
      .populate('teacher_id');
    res.json(subjects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
