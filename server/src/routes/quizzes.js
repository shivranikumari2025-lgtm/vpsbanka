import express from 'express';
import Quiz from '../models/Quiz.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Get all quizzes
router.get('/', authenticate, async (req, res) => {
  try {
    const quizzes = await Quiz.find()
      .populate('chapter_id')
      .populate('subject_id')
      .populate('class_id')
      .populate('school_id')
      .populate('created_by');
    res.json(quizzes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get quiz by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id)
      .populate('chapter_id')
      .populate('subject_id')
      .populate('class_id')
      .populate('school_id')
      .populate('created_by');
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }
    res.json(quiz);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create quiz (Teachers & Admins)
router.post('/', authenticate, authorize('admin', 'super_admin', 'teacher'), async (req, res) => {
  try {
    const { title, description, chapter_id, subject_id, class_id, school_id, questions, total_marks, passing_marks, duration_minutes } = req.body;

    if (!title || !chapter_id) {
      return res.status(400).json({ message: 'Title and chapter_id are required' });
    }

    const quiz = new Quiz({
      title,
      description,
      chapter_id,
      subject_id,
      class_id,
      school_id,
      created_by: req.userId,
      questions: questions || [],
      total_marks: total_marks || 0,
      passing_marks: passing_marks || 0,
      duration_minutes: duration_minutes || 30,
    });

    await quiz.save();
    await quiz.populate(['chapter_id', 'subject_id', 'class_id', 'school_id', 'created_by']);
    
    res.status(201).json(quiz);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update quiz
router.put('/:id', authenticate, async (req, res) => {
  try {
    const quiz = await Quiz.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updated_at: new Date() },
      { new: true, runValidators: true }
    ).populate(['chapter_id', 'subject_id', 'class_id', 'school_id', 'created_by']);

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    res.json(quiz);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete quiz (Admins & Creator)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    if (quiz.created_by.toString() !== req.userId && req.userRole !== 'admin' && req.userRole !== 'super_admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await Quiz.findByIdAndDelete(req.params.id);
    res.json({ message: 'Quiz deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get quizzes by chapter
router.get('/chapter/:chapterId', authenticate, async (req, res) => {
  try {
    const quizzes = await Quiz.find({ chapter_id: req.params.chapterId, is_published: true })
      .populate('created_by');
    res.json(quizzes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add question to quiz
router.post('/:quizId/questions', authenticate, authorize('teacher', 'admin', 'super_admin'), async (req, res) => {
  try {
    const { question_text, question_type, options, correct_answer, marks } = req.body;
    
    const quiz = await Quiz.findById(req.params.quizId);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    quiz.questions.push({
      question_text,
      question_type,
      options,
      correct_answer,
      marks: marks || 1,
      order: quiz.questions.length,
    });

    await quiz.save();
    res.json(quiz);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete question from quiz
router.delete('/:quizId/questions/:questionIndex', authenticate, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.quizId);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    quiz.questions.splice(req.params.questionIndex, 1);
    await quiz.save();
    
    res.json(quiz);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
