import express from 'express';
import School from '../models/School.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Get all schools
router.get('/', async (req, res) => {
  try {
    const schools = await School.find().populate('created_by');
    res.json(schools);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get school by ID
router.get('/:id', async (req, res) => {
  try {
    const school = await School.findById(req.params.id).populate('created_by');
    if (!school) {
      return res.status(404).json({ message: 'School not found' });
    }
    res.json(school);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create school (Admin only)
router.post('/', authenticate, authorize('super_admin', 'admin'), async (req, res) => {
  try {
    const school = new School({
      ...req.body,
      created_by: req.userId,
    });
    await school.save();
    await school.populate('created_by');
    res.status(201).json(school);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update school
router.put('/:id', authenticate, authorize('super_admin', 'admin'), async (req, res) => {
  try {
    const school = await School.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updated_at: new Date() },
      { new: true, runValidators: true }
    ).populate('created_by');

    if (!school) {
      return res.status(404).json({ message: 'School not found' });
    }

    res.json(school);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete school
router.delete('/:id', authenticate, authorize('super_admin'), async (req, res) => {
  try {
    const school = await School.findByIdAndDelete(req.params.id);
    if (!school) {
      return res.status(404).json({ message: 'School not found' });
    }
    res.json({ message: 'School deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
