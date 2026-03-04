import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Sparkles, Loader2, ChevronDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface QuestionDraft {
  question_text: string; option_a: string; option_b: string;
  option_c: string; option_d: string; correct_answer: string; marks: number;
}

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

const CreateExamModal: React.FC<Props> = ({ onClose, onCreated }) => {
  const { user } = useAuth();
  const [step, setStep] = useState<'details' | 'questions'>('details');
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [chapters, setChapters] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedChapter, setSelectedChapter] = useState('');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState(30);
  const [passPct, setPassPct] = useState(40);
  const [questions, setQuestions] = useState<QuestionDraft[]>([]);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [aiCount, setAiCount] = useState(10);
  const [aiDifficulty, setAiDifficulty] = useState('medium');

  // Load classes
  useEffect(() => {
    supabase.from('classes').select('*').order('grade_level').then(({ data }) => setClasses(data || []));
  }, []);

  // Load subjects when class selected
  useEffect(() => {
    if (!selectedClass) { setSubjects([]); return; }
    supabase.from('subjects').select('*').eq('class_id', selectedClass).then(({ data }) => setSubjects(data || []));
    setSelectedSubject(''); setSelectedChapter(''); setChapters([]);
  }, [selectedClass]);

  // Load chapters when subject selected
  useEffect(() => {
    if (!selectedSubject) { setChapters([]); return; }
    supabase.from('chapters').select('*').eq('subject_id', selectedSubject).order('order_index').then(({ data }) => setChapters(data || []));
    setSelectedChapter('');
  }, [selectedSubject]);

  const addBlankQuestion = () => {
    setQuestions(prev => [...prev, {
      question_text: '', option_a: '', option_b: '', option_c: '', option_d: '',
      correct_answer: 'A', marks: 1,
    }]);
  };

  const updateQuestion = (idx: number, field: string, value: any) => {
    setQuestions(prev => prev.map((q, i) => i === idx ? { ...q, [field]: value } : q));
  };

  const removeQuestion = (idx: number) => {
    setQuestions(prev => prev.filter((_, i) => i !== idx));
  };

  const generateAIQuestions = async () => {
    const subjectName = subjects.find(s => s.id === selectedSubject)?.name;
    const chapterName = chapters.find(c => c.id === selectedChapter)?.name;
    const className = classes.find(c => c.id === selectedClass)?.name;

    if (!subjectName || !chapterName) {
      toast.error('Please select subject and chapter first');
      return;
    }

    setGenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          subject_name: subjectName,
          chapter_name: chapterName,
          class_name: className,
          num_questions: aiCount,
          difficulty: aiDifficulty,
        }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const aiQuestions: QuestionDraft[] = data.questions.map((q: any) => ({
        question_text: q.question_text,
        option_a: q.option_a,
        option_b: q.option_b,
        option_c: q.option_c,
        option_d: q.option_d,
        correct_answer: q.correct_answer,
        marks: q.marks || 1,
      }));

      setQuestions(prev => [...prev, ...aiQuestions]);
      toast.success(`Generated ${aiQuestions.length} questions!`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate questions');
    } finally {
      setGenerating(false);
    }
  };

  const totalMarks = questions.reduce((a, q) => a + q.marks, 0);

  const handleSave = async () => {
    if (!title || !selectedChapter) { toast.error('Fill in all exam details'); return; }
    if (questions.length === 0) { toast.error('Add at least one question'); return; }

    const incomplete = questions.some(q => !q.question_text || !q.option_a || !q.option_b || !q.option_c || !q.option_d);
    if (incomplete) { toast.error('Complete all question fields'); return; }

    setSaving(true);
    try {
      const { data: exam, error: examError } = await supabase.from('exams').insert({
        title,
        description,
        chapter_id: selectedChapter,
        duration_minutes: duration,
        total_marks: totalMarks,
        pass_marks: Math.ceil(totalMarks * passPct / 100),
        created_by: user?.user_id,
        school_id: user?.school_id || null,
      }).select().single();

      if (examError) throw examError;

      const questionInserts = questions.map((q, i) => ({
        exam_id: exam.id,
        question_text: q.question_text,
        option_a: q.option_a,
        option_b: q.option_b,
        option_c: q.option_c,
        option_d: q.option_d,
        correct_answer: q.correct_answer,
        marks: q.marks,
        order_index: i + 1,
        school_id: user?.school_id || null,
      }));

      const { error: qError } = await supabase.from('questions').insert(questionInserts);
      if (qError) throw qError;

      toast.success('Exam created successfully!');
      onCreated();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create exam');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-card rounded-2xl border border-border shadow-xl w-full max-w-4xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-xl font-bold">Create Exam</h2>
            <p className="text-sm text-muted-foreground">{step === 'details' ? 'Set up exam details' : `${questions.length} questions · ${totalMarks} marks`}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-xl transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6">
          {step === 'details' ? (
            <div className="space-y-5">
              {/* Class → Subject → Chapter selectors */}
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Class *</label>
                  <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none">
                    <option value="">Select Class</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Subject *</label>
                  <select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)} disabled={!selectedClass}
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none disabled:opacity-50">
                    <option value="">Select Subject</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Chapter *</label>
                  <select value={selectedChapter} onChange={e => setSelectedChapter(e.target.value)} disabled={!selectedSubject}
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none disabled:opacity-50">
                    <option value="">Select Chapter</option>
                    {chapters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">Exam Title *</label>
                <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., Chapter 1 - Unit Test"
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">Description</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="Optional description..."
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none" />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Duration (minutes)</label>
                  <input type="number" value={duration} onChange={e => setDuration(Number(e.target.value))} min={5} max={180}
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Pass Percentage (%)</label>
                  <input type="number" value={passPct} onChange={e => setPassPct(Number(e.target.value))} min={1} max={100}
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
                </div>
              </div>

              <div className="flex justify-end">
                <button onClick={() => setStep('questions')} disabled={!selectedChapter || !title}
                  className="px-6 py-2.5 rounded-xl bg-gradient-blue text-white font-semibold text-sm hover:opacity-90 transition-all disabled:opacity-40">
                  Next: Add Questions →
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {/* AI Generate section */}
              <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-xl border border-primary/20 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-sm">AI Question Generator</h3>
                </div>
                <div className="flex flex-wrap items-end gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Questions</label>
                    <input type="number" value={aiCount} onChange={e => setAiCount(Number(e.target.value))} min={1} max={50}
                      className="w-20 px-3 py-2 rounded-lg border border-border bg-background text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Difficulty</label>
                    <select value={aiDifficulty} onChange={e => setAiDifficulty(e.target.value)}
                      className="px-3 py-2 rounded-lg border border-border bg-background text-sm">
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                  <button onClick={generateAIQuestions} disabled={generating}
                    className="flex items-center gap-2 px-5 py-2 rounded-lg bg-gradient-hero text-white text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-60">
                    {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    {generating ? 'Generating...' : 'Generate with AI'}
                  </button>
                </div>
              </div>

              {/* Manual Questions */}
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm">Questions ({questions.length})</h3>
                <button onClick={addBlankQuestion} className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-muted transition-colors">
                  <Plus className="w-3.5 h-3.5" /> Add Manually
                </button>
              </div>

              {questions.length === 0 && (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  <p>No questions yet. Use AI to generate or add manually.</p>
                </div>
              )}

              <div className="space-y-4 max-h-[50vh] overflow-y-auto custom-scroll pr-1">
                {questions.map((q, i) => (
                  <div key={i} className="bg-muted/20 border border-border rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-primary">Q{i + 1}</span>
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-muted-foreground">Marks:</label>
                        <input type="number" value={q.marks} onChange={e => updateQuestion(i, 'marks', Number(e.target.value))} min={1} max={10}
                          className="w-14 px-2 py-1 rounded-lg border border-border bg-background text-xs text-center" />
                        <button onClick={() => removeQuestion(i)} className="p-1 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                    <textarea value={q.question_text} onChange={e => updateQuestion(i, 'question_text', e.target.value)} rows={2}
                      placeholder="Enter question text..." className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm mb-3 resize-none outline-none focus:ring-1 focus:ring-primary/30" />
                    <div className="grid sm:grid-cols-2 gap-2 mb-3">
                      {(['A', 'B', 'C', 'D'] as const).map(opt => {
                        const field = `option_${opt.toLowerCase()}` as keyof QuestionDraft;
                        return (
                          <div key={opt} className="flex items-center gap-2">
                            <button onClick={() => updateQuestion(i, 'correct_answer', opt)}
                              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                                q.correct_answer === opt ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground border border-border'
                              }`}>{opt}</button>
                            <input value={q[field] as string} onChange={e => updateQuestion(i, field, e.target.value)}
                              placeholder={`Option ${opt}`} className="flex-1 px-3 py-1.5 rounded-lg border border-border bg-background text-xs outline-none focus:ring-1 focus:ring-primary/30" />
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-[10px] text-muted-foreground">Click letter circle to set correct answer • Current: <span className="font-bold text-green-600">{q.correct_answer}</span></p>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <button onClick={() => setStep('details')} className="px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors">
                  ← Back
                </button>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">{questions.length} questions · {totalMarks} marks</span>
                  <button onClick={handleSave} disabled={saving || questions.length === 0}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-blue text-white font-semibold text-sm hover:opacity-90 transition-all disabled:opacity-40">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    {saving ? 'Saving...' : 'Create Exam'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateExamModal;
