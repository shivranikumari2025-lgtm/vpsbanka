import React from 'react';
import { Trophy, XCircle, CheckCircle2, ChevronRight } from 'lucide-react';
import type { ExamData, QuestionData } from '@/pages/ExamPage';

interface Props {
  exam: ExamData;
  score: number;
  questions: QuestionData[];
  answers: Record<string, string>;
  onBack: () => void;
}

const ExamResult: React.FC<Props> = ({ exam, score, questions, answers, onBack }) => {
  const totalMarks = questions.reduce((a, q) => a + q.marks, 0);
  const pct = Math.round((score / totalMarks) * 100);
  const passed = score >= exam.pass_marks;
  const correct = questions.filter(q => answers[q.id] === q.correct_answer).length;
  const wrong = questions.filter(q => answers[q.id] && answers[q.id] !== q.correct_answer).length;
  const unanswered = questions.filter(q => !answers[q.id]).length;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Result card */}
      <div className={`bg-card rounded-2xl border shadow-card-lg p-8 text-center ${passed ? 'border-green-200' : 'border-red-200'}`}>
        <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 ${passed ? 'bg-green-100' : 'bg-red-100'}`}>
          {passed ? <Trophy className="w-12 h-12 text-green-600" /> : <XCircle className="w-12 h-12 text-red-500" />}
        </div>
        <h2 className="text-2xl font-bold mb-1">{passed ? '🎉 Congratulations!' : 'Keep Practicing!'}</h2>
        <p className="text-muted-foreground mb-6">{exam.title}</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[
            { label: 'Score', value: `${score}/${totalMarks}`, color: passed ? 'text-green-700' : 'text-red-600' },
            { label: 'Percentage', value: `${pct}%`, color: passed ? 'text-green-700' : 'text-red-600' },
            { label: 'Correct', value: `${correct}`, color: 'text-green-700' },
            { label: 'Wrong', value: `${wrong}`, color: 'text-red-600' },
          ].map(s => (
            <div key={s.label} className="p-4 rounded-xl bg-muted/30">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </div>
          ))}
        </div>
        {unanswered > 0 && <p className="text-sm text-muted-foreground mb-4">{unanswered} question(s) left unanswered</p>}
        <button onClick={onBack} className="px-8 py-3 rounded-xl bg-gradient-blue text-white font-semibold hover:opacity-90 transition-all">
          Back to Exams
        </button>
      </div>

      {/* Answer review */}
      <div className="bg-card rounded-2xl border border-border shadow-card p-6">
        <h3 className="font-semibold text-lg mb-4">Answer Review</h3>
        <div className="space-y-4">
          {questions.map((q, i) => {
            const userAns = answers[q.id];
            const isCorrect = userAns === q.correct_answer;
            const optMap: Record<string, string> = { A: q.option_a, B: q.option_b, C: q.option_c, D: q.option_d };
            return (
              <div key={q.id} className={`p-4 rounded-xl border ${isCorrect ? 'border-green-200 bg-green-50/50' : userAns ? 'border-red-200 bg-red-50/50' : 'border-border bg-muted/20'}`}>
                <p className="text-sm font-medium mb-2">
                  <span className="font-bold text-muted-foreground mr-2">Q{i + 1}.</span>
                  {q.question_text}
                  <span className="ml-2 text-xs text-muted-foreground">({q.marks} mark{q.marks > 1 ? 's' : ''})</span>
                </p>
                <div className="grid sm:grid-cols-2 gap-1.5 text-xs">
                  {(['A', 'B', 'C', 'D'] as const).map(opt => (
                    <div key={opt} className={`px-3 py-1.5 rounded-lg flex items-center gap-2 ${
                      opt === q.correct_answer ? 'bg-green-100 text-green-800 font-semibold' :
                      opt === userAns && opt !== q.correct_answer ? 'bg-red-100 text-red-800' :
                      'bg-muted/30'
                    }`}>
                      <span className="font-bold">{opt}.</span> {optMap[opt]}
                      {opt === q.correct_answer && <CheckCircle2 className="w-3.5 h-3.5 text-green-600 ml-auto" />}
                      {opt === userAns && opt !== q.correct_answer && <XCircle className="w-3.5 h-3.5 text-red-500 ml-auto" />}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ExamResult;
