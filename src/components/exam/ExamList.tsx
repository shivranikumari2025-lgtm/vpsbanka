import React from 'react';
import { ClipboardList, Timer, BookOpen, Plus, Loader2 } from 'lucide-react';
import type { ExamData } from '@/pages/ExamPage';

interface Props {
  exams: ExamData[];
  loading: boolean;
  canManage: boolean;
  onStartExam: (exam: ExamData) => void;
  onCreateExam: () => void;
}

const ExamList: React.FC<Props> = ({ exams, loading, canManage, onStartExam, onCreateExam }) => {
  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Exams & Tests</h1>
          <p className="text-muted-foreground text-sm mt-1">Chapter-wise MCQ exams with auto-evaluation</p>
        </div>
        {canManage && (
          <button onClick={onCreateExam} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-blue text-white rounded-xl font-medium text-sm shadow-glow-blue hover:opacity-90 transition-all">
            <Plus className="w-4 h-4" /> Create Exam
          </button>
        )}
      </div>

      {exams.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center shadow-card">
          <ClipboardList className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="font-semibold text-lg mb-2">No Exams Yet</h3>
          <p className="text-muted-foreground text-sm">
            {canManage ? 'Create your first exam to get started.' : 'No exams are available yet.'}
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {exams.map(exam => (
            <div key={exam.id} className="bg-card rounded-2xl border border-border shadow-card p-5 flex flex-col">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-purple flex items-center justify-center">
                  <ClipboardList className="w-6 h-6 text-white" />
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${exam.is_active ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'}`}>
                  {exam.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <h3 className="font-bold text-sm mb-1 line-clamp-2">{exam.title}</h3>
              {exam.description && <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{exam.description}</p>}
              <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4 mt-auto">
                <span className="flex items-center gap-1"><Timer className="w-3.5 h-3.5" />{exam.duration_minutes} min</span>
                <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" />{exam.total_marks} marks</span>
                <span>Pass: {exam.pass_marks}</span>
              </div>
              <button onClick={() => onStartExam(exam)}
                className="w-full py-2.5 rounded-xl bg-gradient-blue text-white text-sm font-semibold hover:opacity-90 transition-all">
                Start Exam
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ExamList;
