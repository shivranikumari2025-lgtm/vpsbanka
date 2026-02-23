import express from 'express';
import Material from '../models/Material.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Get all materials
router.get('/', authenticate, async (req, res) => {
  try {
    const materials = await Material.find()
      .populate('chapter_id')
      .populate('subject_id')
      .populate('class_id')
      .populate('school_id')
      .populate('uploaded_by');
    res.json(materials);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get material by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const material = await Material.findByIdAndUpdate(
      req.params.id,
      { $inc: { views_count: 1 } },
      { new: true }
    ).populate(['chapter_id', 'subject_id', 'class_id', 'school_id', 'uploaded_by']);
    
    if (!material) {
      return res.status(404).json({ message: 'Material not found' });
    }
    res.json(material);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create material (Teachers & Admins)
router.post('/', authenticate, authorize('admin', 'super_admin', 'teacher'), async (req, res) => {
  try {
    const { title, description, type, chapter_id, subject_id, class_id, school_id, file_url, file_name, file_type, file_size, duration_minutes } = req.body;

    if (!title || !chapter_id) {
      return res.status(400).json({ message: 'Title and chapter_id are required' });
    }

    const material = new Material({
      title,
      description,
      type: type || 'theory',
      chapter_id,
      subject_id,
      class_id,
      school_id,
      uploaded_by: req.userId,
      file_url,
      file_name,
      file_type,
      file_size,
      duration_minutes,
    });

    await material.save();
    await material.populate(['chapter_id', 'subject_id', 'class_id', 'school_id', 'uploaded_by']);
    
    res.status(201).json(material);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update material
router.put('/:id', authenticate, async (req, res) => {
  try {
    const material = await Material.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updated_at: new Date() },
      { new: true, runValidators: true }
    ).populate(['chapter_id', 'subject_id', 'class_id', 'school_id', 'uploaded_by']);

    if (!material) {
      return res.status(404).json({ message: 'Material not found' });
    }

    res.json(material);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete material (Admins & Uploader)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);
    
    if (!material) {
      return res.status(404).json({ message: 'Material not found' });
    }

    // Only allow deletion by uploader or admin
    if (material.uploaded_by.toString() !== req.userId && req.userRole !== 'admin' && req.userRole !== 'super_admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await Material.findByIdAndDelete(req.params.id);
    res.json({ message: 'Material deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get materials by chapter
router.get('/chapter/:chapterId', authenticate, async (req, res) => {
  try {
    const materials = await Material.find({ chapter_id: req.params.chapterId, is_published: true })
      .populate('uploaded_by')
      .sort({ order: 1 });
    res.json(materials);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get materials by type
router.get('/type/:type', authenticate, async (req, res) => {
  try {
    const materials = await Material.find({ type: req.params.type, is_published: true })
      .populate('uploaded_by');
    res.json(materials);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Increment download count
router.post('/:id/download', authenticate, async (req, res) => {
  try {
    const material = await Material.findByIdAndUpdate(
      req.params.id,
      { $inc: { downloads_count: 1 } },
      { new: true }
    );
    res.json(material);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
