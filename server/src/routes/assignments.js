import express from 'express';
import Assignment from '../models/Assignment.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Get all assignments
router.get('/', authenticate, async (req, res) => {
  try {
    const assignments = await Assignment.find()
      .populate('chapter_id')
      .populate('subject_id')
      .populate('class_id')
      .populate('school_id')
      .populate('created_by');
    res.json(assignments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get assignment by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate('chapter_id')
      .populate('subject_id')
      .populate('class_id')
      .populate('school_id')
      .populate('created_by');
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }
    res.json(assignment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create assignment (Teachers & Admins)
router.post('/', authenticate, authorize('admin', 'super_admin', 'teacher'), async (req, res) => {
  try {
    const { title, description, chapter_id, subject_id, class_id, school_id, max_marks, due_date, instructions, attachment_url } = req.body;

    if (!title || !chapter_id || !due_date) {
      return res.status(400).json({ message: 'Title, chapter_id, and due_date are required' });
    }

    const assignment = new Assignment({
      title,
      description,
      chapter_id,
      subject_id,
      class_id,
      school_id,
      created_by: req.userId,
      max_marks: max_marks || 100,
      due_date,
      instructions,
      attachment_url,
    });

    await assignment.save();
    await assignment.populate(['chapter_id', 'subject_id', 'class_id', 'school_id', 'created_by']);
    
    res.status(201).json(assignment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update assignment
router.put('/:id', authenticate, async (req, res) => {
  try {
    const assignment = await Assignment.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updated_at: new Date() },
      { new: true, runValidators: true }
    ).populate(['chapter_id', 'subject_id', 'class_id', 'school_id', 'created_by']);

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    res.json(assignment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete assignment (Admins & Creator)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    if (assignment.created_by.toString() !== req.userId && req.userRole !== 'admin' && req.userRole !== 'super_admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await Assignment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Assignment deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get assignments by chapter
router.get('/chapter/:chapterId', authenticate, async (req, res) => {
  try {
    const assignments = await Assignment.find({ chapter_id: req.params.chapterId, is_published: true })
      .populate('created_by');
    res.json(assignments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Submit assignment (Students)
router.post('/:assignmentId/submit', authenticate, authorize('student'), async (req, res) => {
  try {
    const { submission_url, submission_text } = req.body;
    
    const assignment = await Assignment.findById(req.params.assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Check if student already submitted
    const existingSubmission = assignment.submissions.find(s => s.student_id.toString() === req.userId);
    
    if (existingSubmission) {
      // Update existing submission
      existingSubmission.submission_url = submission_url;
      existingSubmission.submission_text = submission_text;
      existingSubmission.submitted_at = new Date();
      existingSubmission.status = 'submitted';
    } else {
      // Add new submission
      assignment.submissions.push({
        student_id: req.userId,
        submission_url,
        submission_text,
        submitted_at: new Date(),
        status: 'submitted',
      });
    }

    await assignment.save();
    res.json(assignment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Grade assignment (Teachers & Admins)
router.post('/:assignmentId/grade/:studentId', authenticate, authorize('teacher', 'admin', 'super_admin'), async (req, res) => {
  try {
    const { marks_obtained, feedback } = req.body;
    
    const assignment = await Assignment.findById(req.params.assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    const submission = assignment.submissions.find(s => s.student_id.toString() === req.params.studentId);
    
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    submission.marks_obtained = marks_obtained;
    submission.feedback = feedback;
    submission.status = 'graded';

    await assignment.save();
    res.json(assignment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
