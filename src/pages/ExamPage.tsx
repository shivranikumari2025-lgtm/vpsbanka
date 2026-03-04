import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import ExamList from '@/components/exam/ExamList';
import CreateExamModal from '@/components/exam/CreateExamModal';
import TakeExam from '@/components/exam/TakeExam';
import ExamResult from '@/components/exam/ExamResult';

export interface ExamData {
  id: string; title: string; description: string | null; duration_minutes: number;
  total_marks: number; pass_marks: number; chapter_id: string; is_active: boolean;
  created_at: string; created_by: string | null; school_id: string | null;
}

export interface QuestionData {
  id: string; exam_id: string; question_text: string;
  option_a: string; option_b: string; option_c: string; option_d: string;
  correct_answer: string; marks: number; order_index: number;
}

const ExamPage = () => {
  const { user } = useAuth();
  const [exams, setExams] = useState<ExamData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeExam, setActiveExam] = useState<ExamData | null>(null);
  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const [currentIdx, setCurrentIdx] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);

  const canManage = user?.role === 'teacher' || user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'developer';

  const fetchExams = useCallback(async () => {
    try {
      const { data } = await supabase.from('exams').select('*').order('created_at', { ascending: false });
      setExams((data as ExamData[]) || []);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchExams(); }, [fetchExams]);

  const startExam = async (exam: ExamData) => {
    const { data: qs } = await supabase.from('questions').select('*').eq('exam_id', exam.id).order('order_index');
    if (!qs || qs.length === 0) { toast.error('No questions found for this exam'); return; }
    setQuestions(qs as QuestionData[]);
    setActiveExam(exam);
    setAnswers({});
    setFlagged(new Set());
    setCurrentIdx(0);
    setSubmitted(false);
    setTimeLeft(exam.duration_minutes * 60);
  };

  const handleSubmit = useCallback(async () => {
    if (!activeExam || submitted) return;
    let s = 0;
    questions.forEach(q => { if (answers[q.id] === q.correct_answer) s += q.marks; });
    setScore(s);
    setSubmitted(true);

    // Save result
    if (user) {
      await supabase.from('exam_results').insert({
        exam_id: activeExam.id,
        student_id: user.user_id,
        score: s,
        total_marks: activeExam.total_marks,
        answers: answers as any,
        school_id: user.school_id || null,
      });
    }
  }, [activeExam, answers, questions, submitted, user]);

  // Timer
  useEffect(() => {
    if (!activeExam || submitted) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(timer); handleSubmit(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [activeExam, submitted, handleSubmit]);

  const resetExam = () => {
    setActiveExam(null); setQuestions([]); setAnswers({}); setFlagged(new Set());
    setCurrentIdx(0); setSubmitted(false); setScore(0); setTimeLeft(0);
  };

  if (activeExam && submitted) {
    return <ExamResult exam={activeExam} score={score} questions={questions} answers={answers} onBack={resetExam} />;
  }

  if (activeExam && questions.length > 0) {
    return (
      <TakeExam
        exam={activeExam}
        questions={questions}
        answers={answers}
        setAnswers={setAnswers}
        flagged={flagged}
        setFlagged={setFlagged}
        currentIdx={currentIdx}
        setCurrentIdx={setCurrentIdx}
        timeLeft={timeLeft}
        onSubmit={handleSubmit}
      />
    );
  }

  return (
    <>
      <ExamList
        exams={exams}
        loading={loading}
        canManage={canManage}
        onStartExam={startExam}
        onCreateExam={() => setShowCreateModal(true)}
      />
      {showCreateModal && (
        <CreateExamModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => { setShowCreateModal(false); fetchExams(); }}
        />
      )}
    </>
  );
};

export default ExamPage;
