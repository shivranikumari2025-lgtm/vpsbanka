import express from 'express';
import Class from '../models/Class.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Get all classes
router.get('/', async (req, res) => {
  try {
    const classes = await Class.find()
      .populate('school_id')
      .populate('teacher_id')
      .populate('students');
    res.json(classes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get class by ID
router.get('/:id', async (req, res) => {
  try {
    const classData = await Class.findById(req.params.id)
      .populate('school_id')
      .populate('teacher_id')
      .populate('students');
    if (!classData) {
      return res.status(404).json({ message: 'Class not found' });
    }
    res.json(classData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create class
router.post('/', authenticate, authorize('super_admin', 'admin', 'teacher'), async (req, res) => {
  try {
    const classData = new Class({
      ...req.body,
    });
    await classData.save();
    await classData.populate(['school_id', 'teacher_id', 'students']);
    res.status(201).json(classData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update class
router.put('/:id', authenticate, authorize('super_admin', 'admin', 'teacher'), async (req, res) => {
  try {
    const classData = await Class.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updated_at: new Date() },
      { new: true, runValidators: true }
    ).populate(['school_id', 'teacher_id', 'students']);

    if (!classData) {
      return res.status(404).json({ message: 'Class not found' });
    }

    res.json(classData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete class
router.delete('/:id', authenticate, authorize('super_admin', 'admin'), async (req, res) => {
  try {
    const classData = await Class.findByIdAndDelete(req.params.id);
    if (!classData) {
      return res.status(404).json({ message: 'Class not found' });
    }
    res.json({ message: 'Class deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
