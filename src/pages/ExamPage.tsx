import React, { useEffect, useState } from 'react';
import { ClipboardList, Timer, CheckCircle2, XCircle, Trophy, Plus, BookOpen } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Question {
  id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  marks: number;
}

interface Exam {
  id: string; title: string; description: string; duration_minutes: number;
  total_marks: number; pass_marks: number; chapter_id: string;
}

const DEMO_QUESTIONS = [
  { id: '1', question_text: 'What is the value of π (pi)?', option_a: '3.14159', option_b: '2.71828', option_c: '1.41421', option_d: '0.57721', correct_answer: 'A', marks: 2 },
  { id: '2', question_text: 'Which is the largest planet in our solar system?', option_a: 'Saturn', option_b: 'Neptune', option_c: 'Jupiter', option_d: 'Uranus', correct_answer: 'C', marks: 2 },
  { id: '3', question_text: 'What is the chemical symbol for water?', option_a: 'WA', option_b: 'W', option_c: 'H2O', option_d: 'HO2', correct_answer: 'C', marks: 2 },
  { id: '4', question_text: 'How many sides does a hexagon have?', option_a: '5', option_b: '6', option_c: '7', option_d: '8', correct_answer: 'B', marks: 2 },
  { id: '5', question_text: 'Who wrote "Romeo and Juliet"?', option_a: 'Charles Dickens', option_b: 'Jane Austen', option_c: 'Mark Twain', option_d: 'William Shakespeare', correct_answer: 'D', marks: 2 },
];

const ExamPage = () => {
  const { user } = useAuth();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeExam, setActiveExam] = useState<Exam | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [score, setScore] = useState(0);

  const isTeacher = user?.role === 'teacher' || user?.role === 'admin' || user?.role === 'super_admin';

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const { data } = await supabase.from('exams').select('*');
        setExams((data as Exam[]) || []);
      } catch (error) {
        console.error('Failed to fetch exams:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchExams();
  }, []);

  useEffect(() => {
    if (!activeExam || submitted) return;
    setTimeLeft(activeExam.duration_minutes * 60);
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(timer); handleSubmit(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [activeExam]);

  const handleSubmit = () => {
    let s = 0;
    DEMO_QUESTIONS.forEach(q => { if (answers[q.id] === q.correct_answer) s += q.marks; });
    setScore(s); setSubmitted(true);
  };

  const formatTime = (secs: number) => `${Math.floor(secs/60).toString().padStart(2,'0')}:${(secs%60).toString().padStart(2,'0')}`;
  const totalMarks = DEMO_QUESTIONS.reduce((acc, q) => acc + q.marks, 0);

  if (activeExam) {
    if (submitted) {
      const pct = Math.round((score / totalMarks) * 100);
      const passed = score >= (activeExam.pass_marks || 40);
      return (
        <div className="max-w-lg mx-auto">
          <div className={`bg-card rounded-2xl border shadow-card-lg p-8 text-center ${passed ? 'border-green-200' : 'border-red-200'}`}>
            <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 ${passed ? 'bg-green-100' : 'bg-red-100'}`}>
              {passed ? <Trophy className="w-12 h-12 text-green-600" /> : <XCircle className="w-12 h-12 text-red-500" />}
            </div>
            <h2 className="text-2xl font-bold mb-2">{passed ? '🎉 Excellent!' : 'Keep Practicing'}</h2>
            <p className="text-muted-foreground mb-6">{activeExam.title}</p>
            <div className="grid grid-cols-3 gap-4 mb-8">
              {[{ label: 'Score', value: `${score}/${totalMarks}` }, { label: 'Percentage', value: `${pct}%` }, { label: 'Result', value: passed ? 'PASS' : 'FAIL' }].map(s => (
                <div key={s.label} className={`p-4 rounded-xl ${passed ? 'bg-green-50' : 'bg-red-50'}`}>
                  <p className={`text-2xl font-bold ${passed ? 'text-green-700' : 'text-red-600'}`}>{s.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
                </div>
              ))}
            </div>
            <button onClick={() => { setActiveExam(null); setAnswers({}); setSubmitted(false); }}
              className="w-full py-3 rounded-xl bg-gradient-blue text-white font-semibold hover:opacity-90 transition-all">Back to Exams</button>
          </div>
        </div>
      );
    }

    const opts = ['A', 'B', 'C', 'D'] as const;
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex items-center justify-between bg-card rounded-2xl border border-border p-4 shadow-card">
          <div><h2 className="font-bold">{activeExam.title}</h2><p className="text-sm text-muted-foreground">{DEMO_QUESTIONS.length} questions · {totalMarks} marks</p></div>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-lg ${timeLeft < 60 ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-700'}`}>
            <Timer className="w-5 h-5" />{formatTime(timeLeft)}
          </div>
        </div>
        {DEMO_QUESTIONS.map((q, i) => {
          const optLabels = { A: q.option_a, B: q.option_b, C: q.option_c, D: q.option_d };
          return (
            <div key={q.id} className="bg-card rounded-2xl border border-border p-5 shadow-card">
              <p className="font-semibold mb-4 text-sm">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-bold mr-2">{i+1}</span>
                {q.question_text}<span className="text-muted-foreground font-normal ml-2">({q.marks} marks)</span>
              </p>
              <div className="grid sm:grid-cols-2 gap-2">
                {opts.map(opt => (
                  <button key={opt} onClick={() => setAnswers(prev => ({ ...prev, [q.id]: opt }))}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-sm text-left transition-all ${answers[q.id] === opt ? 'border-primary bg-primary/10 text-primary font-semibold' : 'border-border hover:border-primary/50 hover:bg-muted'}`}>
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${answers[q.id] === opt ? 'bg-primary text-white' : 'bg-muted'}`}>{opt}</span>
                    {optLabels[opt]}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
        <button onClick={handleSubmit} className="w-full py-3.5 rounded-xl bg-gradient-hero text-white font-bold text-lg shadow-glow-blue hover:opacity-90 transition-all">
          Submit Exam ({Object.keys(answers).length}/{DEMO_QUESTIONS.length} answered)
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Exams & Practice</h1><p className="text-muted-foreground text-sm mt-1">Chapter-wise MCQ exams with auto-evaluation</p></div>
        {isTeacher && <button className="flex items-center gap-2 px-4 py-2 bg-gradient-blue text-white rounded-xl font-medium text-sm shadow-glow-blue hover:opacity-90 transition-all"><Plus className="w-4 h-4" /> Create Exam</button>}
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[{ title: 'Mathematics - Real Numbers', duration: 30, questions: 5, marks: 10, chapter: 'Real Numbers', difficulty: 'Easy' },
          { title: 'Science - Matter & Properties', duration: 45, questions: 10, marks: 20, chapter: 'Matter', difficulty: 'Medium' },
          { title: 'English - Literature Quiz', duration: 20, questions: 5, marks: 10, chapter: 'Literature', difficulty: 'Easy' },
        ].map((exam, i) => (
          <div key={i} className="bg-card rounded-2xl border border-border shadow-card p-5">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-purple flex items-center justify-center"><ClipboardList className="w-6 h-6 text-white" /></div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${exam.difficulty === 'Easy' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{exam.difficulty}</span>
            </div>
            <h3 className="font-bold text-sm mb-1">{exam.title}</h3>
            <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
              <span><Timer className="w-3.5 h-3.5 inline mr-1" />{exam.duration} min</span>
              <span><BookOpen className="w-3.5 h-3.5 inline mr-1" />{exam.questions} Qs</span>
            </div>
            <button onClick={() => setActiveExam({ id: `demo-${i}`, title: exam.title, description: '', duration_minutes: exam.duration, total_marks: exam.marks, pass_marks: Math.floor(exam.marks * 0.4), chapter_id: '' })}
              className="w-full py-2 rounded-xl bg-gradient-blue text-white text-sm font-semibold hover:opacity-90 transition-all">Start Exam</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExamPage;
