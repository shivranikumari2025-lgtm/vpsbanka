import express from 'express';
import Exam from '../models/Exam.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Get all exams
router.get('/', async (req, res) => {
  try {
    const exams = await Exam.find()
      .populate('class_id')
      .populate('school_id')
      .populate('created_by')
      .populate('results.student_id');
    res.json(exams);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get exam by ID
router.get('/:id', async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id)
      .populate('class_id')
      .populate('school_id')
      .populate('created_by')
      .populate('results.student_id');
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }
    res.json(exam);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create exam
router.post('/', authenticate, authorize('super_admin', 'admin', 'teacher'), async (req, res) => {
  try {
    const exam = new Exam({
      ...req.body,
      created_by: req.userId,
    });
    await exam.save();
    await exam.populate(['class_id', 'school_id', 'created_by']);
    res.status(201).json(exam);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update exam
router.put('/:id', authenticate, authorize('super_admin', 'admin', 'teacher'), async (req, res) => {
  try {
    const exam = await Exam.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updated_at: new Date() },
      { new: true, runValidators: true }
    ).populate(['class_id', 'school_id', 'created_by']);

    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    res.json(exam);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete exam
router.delete('/:id', authenticate, authorize('super_admin', 'admin'), async (req, res) => {
  try {
    const exam = await Exam.findByIdAndDelete(req.params.id);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }
    res.json({ message: 'Exam deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
