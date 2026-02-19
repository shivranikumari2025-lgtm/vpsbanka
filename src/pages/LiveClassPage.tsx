import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  PlayCircle, StopCircle, Users, Video, BookOpen, Clock, Wifi,
  ChevronLeft, ChevronRight, Pen, Eraser, MousePointer, Trash2,
  Maximize2, Minimize2, ZoomIn, ZoomOut, Hand, Highlighter,
  MessageSquare, Award, PauseCircle, SkipForward, Volume2,
  BarChart3, ThumbsUp, HelpCircle, AlertCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

type Tool = 'pointer' | 'pen' | 'eraser' | 'highlighter' | 'laser';
const COLORS = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#000000'];

interface Annotation {
  tool: 'pen' | 'eraser' | 'highlighter' | 'laser';
  points: { x: number; y: number }[];
  color: string;
  width: number;
}

const DEMO_SLIDES = [
  { title: 'Introduction to Polynomials', content: 'A polynomial is an expression consisting of variables (also called indeterminates) and coefficients. Example: 3x² + 2x - 5', bg: 'from-blue-500 to-indigo-600' },
  { title: 'Types of Polynomials', content: 'Monomial: 5x | Binomial: 3x + 2 | Trinomial: x² + 2x + 1 | Polynomial: Multiple terms', bg: 'from-emerald-500 to-teal-600' },
  { title: 'Degree of a Polynomial', content: 'The degree is the highest power of the variable. Example: 4x³ + 2x - 7 → Degree = 3', bg: 'from-amber-500 to-orange-600' },
  { title: 'Addition of Polynomials', content: 'Add like terms: (3x² + 2x) + (x² - x + 5) = 4x² + x + 5', bg: 'from-purple-500 to-violet-600' },
  { title: 'Factorization', content: 'x² - 5x + 6 = (x - 2)(x - 3). Factor by splitting the middle term!', bg: 'from-pink-500 to-rose-600' },
];

const LiveClassPage = () => {
  const { profile } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeSession, setActiveSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [smartBoardOpen, setSmartBoardOpen] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [tool, setTool] = useState<Tool>('pointer');
  const [color, setColor] = useState('#EF4444');
  const [lineWidth, setLineWidth] = useState(3);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentAnnotation, setCurrentAnnotation] = useState<Annotation | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [zoom, setZoom] = useState(100);
  const [studentCount] = useState(Math.floor(Math.random() * 22) + 5);
  const [reactions, setReactions] = useState<{type: string; id: number}[]>([]);
  const [poll, setPoll] = useState<{question: string; options: string[]; votes: number[]} | null>(null);
  const [showPollCreate, setShowPollCreate] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [selectedVote, setSelectedVote] = useState<number | null>(null);
  const [chatMessages, setChatMessages] = useState<{text: string; sender: string; time: string}[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [showStudentPanel, setShowStudentPanel] = useState(false);

  const isTeacher = profile?.role === 'teacher' || profile?.role === 'admin' || profile?.role === 'super_admin';

  useEffect(() => {
    fetchActiveSessions();
    const channel = supabase
      .channel('live-sessions-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'live_sessions' }, () => fetchActiveSessions())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchActiveSessions = async () => {
    const { data } = await supabase
      .from('live_sessions')
      .select('*')
      .in('status', ['waiting', 'active'])
      .order('created_at', { ascending: false })
      .limit(1);
    setActiveSession(data?.[0] || null);
    setLoading(false);
  };

  const startClass = async () => {
    setStarting(true);
    const { data, error } = await supabase.from('live_sessions').insert({
      teacher_id: profile!.user_id,
      title: 'Mathematics - Chapter 2: Polynomials',
      status: 'active',
      started_at: new Date().toISOString(),
      current_page: 0,
    }).select().single();
    if (!error && data) { setActiveSession(data); setSmartBoardOpen(true); }
    setStarting(false);
  };

  const endClass = async () => {
    if (!activeSession) return;
    await supabase.from('live_sessions').update({ status: 'ended', ended_at: new Date().toISOString() }).eq('id', activeSession.id);
    setActiveSession(null);
    setSmartBoardOpen(false);
  };

  const changeSlide = async (idx: number) => {
    setCurrentSlide(idx);
    setAnnotations([]);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d')!;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    if (activeSession) {
      await supabase.from('live_sessions').update({ current_page: idx }).eq('id', activeSession.id);
    }
  };

  // Drawing
  const drawAllAnnotations = useCallback((canvas: HTMLCanvasElement, anns: Annotation[]) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    anns.forEach(ann => {
      if (ann.points.length < 2) return;
      ctx.beginPath();
      if (ann.tool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineWidth = ann.width * 5;
      } else if (ann.tool === 'highlighter') {
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 0.35;
        ctx.lineWidth = ann.width * 6;
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;
        ctx.lineWidth = ann.width;
      }
      ctx.strokeStyle = ann.tool === 'eraser' ? '#000' : ann.color;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.moveTo(ann.points[0].x, ann.points[0].y);
      ann.points.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    });
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    drawAllAnnotations(canvas, annotations);
  }, [annotations, drawAllAnnotations]);

  const getPos = (e: React.MouseEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDraw = (e: React.MouseEvent) => {
    if (tool === 'pointer' || !isTeacher) return;
    const canvas = canvasRef.current!;
    const pos = getPos(e, canvas);
    const ann: Annotation = { tool: tool as Annotation['tool'], points: [pos], color, width: lineWidth };
    setCurrentAnnotation(ann);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent) => {
    if (!isDrawing || !currentAnnotation || !canvasRef.current) return;
    const pos = getPos(e, canvasRef.current);
    const updated = { ...currentAnnotation, points: [...currentAnnotation.points, pos] };
    setCurrentAnnotation(updated);
    const ctx = canvasRef.current.getContext('2d')!;
    const pts = updated.points;
    if (pts.length >= 2) {
      ctx.beginPath();
      if (updated.tool === 'highlighter') { ctx.globalAlpha = 0.35; ctx.lineWidth = updated.width * 6; }
      else if (updated.tool === 'eraser') { ctx.globalCompositeOperation = 'destination-out'; ctx.lineWidth = updated.width * 5; }
      else { ctx.globalAlpha = 1; ctx.lineWidth = updated.width; }
      ctx.strokeStyle = updated.tool === 'eraser' ? '#000' : updated.color;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.moveTo(pts[pts.length - 2].x, pts[pts.length - 2].y);
      ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }
  };

  const stopDraw = () => {
    if (!isDrawing || !currentAnnotation) return;
    setAnnotations(prev => [...prev, currentAnnotation]);
    setCurrentAnnotation(null);
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    setAnnotations([]);
    const canvas = canvasRef.current;
    if (canvas) { const ctx = canvas.getContext('2d')!; ctx.clearRect(0, 0, canvas.width, canvas.height); }
  };

  const addReaction = (type: string) => {
    const id = Date.now();
    setReactions(prev => [...prev, { type, id }]);
    setTimeout(() => setReactions(prev => prev.filter(r => r.id !== id)), 3000);
  };

  const sendChatMessage = () => {
    if (!chatInput.trim()) return;
    setChatMessages(prev => [...prev, {
      text: chatInput,
      sender: profile?.full_name || 'User',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);
    setChatInput('');
  };

  const createPoll = () => {
    if (!pollQuestion.trim() || pollOptions.filter(o => o.trim()).length < 2) return;
    setPoll({ question: pollQuestion, options: pollOptions.filter(o => o.trim()), votes: pollOptions.filter(o => o.trim()).map(() => 0) });
    setShowPollCreate(false);
    setPollQuestion('');
    setPollOptions(['', '']);
  };

  const voteOnPoll = (idx: number) => {
    if (selectedVote !== null || isTeacher) return;
    setSelectedVote(idx);
    setPoll(prev => prev ? { ...prev, votes: prev.votes.map((v, i) => i === idx ? v + 1 : v) } : null);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  // Smart Board View
  if (smartBoardOpen && activeSession) {
    const slide = DEMO_SLIDES[currentSlide];
    return (
      <div className={cn('fixed z-50 bg-slate-950 flex flex-col', fullscreen ? 'inset-0' : 'inset-2 rounded-2xl overflow-hidden')}>
        {/* Top Bar */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-red-500/20 border border-red-500/40 rounded-full px-3 py-1">
              <div className="pulse-dot w-1.5 h-1.5" />
              <span className="text-red-400 text-xs font-bold">LIVE</span>
            </div>
            <span className="text-white font-semibold text-sm hidden sm:block">{activeSession.title}</span>
          </div>

          {/* Slide Navigation */}
          <div className="flex items-center gap-2">
            <button onClick={() => changeSlide(Math.max(0, currentSlide - 1))} disabled={currentSlide === 0}
              className="p-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20 disabled:opacity-30 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-white text-sm font-medium px-2">Slide {currentSlide + 1}/{DEMO_SLIDES.length}</span>
            <button onClick={() => changeSlide(Math.min(DEMO_SLIDES.length - 1, currentSlide + 1))} disabled={currentSlide >= DEMO_SLIDES.length - 1}
              className="p-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20 disabled:opacity-30 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full">
              <Users className="w-3.5 h-3.5 text-white" />
              <span className="text-white text-xs font-semibold">{studentCount}</span>
            </div>
            <button onClick={() => setShowChat(!showChat)} className={cn('p-1.5 rounded-lg transition-colors', showChat ? 'bg-primary text-white' : 'bg-white/10 text-white hover:bg-white/20')}>
              <MessageSquare className="w-4 h-4" />
            </button>
            <button onClick={() => setShowStudentPanel(!showStudentPanel)} className={cn('p-1.5 rounded-lg transition-colors', showStudentPanel ? 'bg-primary text-white' : 'bg-white/10 text-white hover:bg-white/20')}>
              <Users className="w-4 h-4" />
            </button>
            <button onClick={() => setZoom(z => Math.min(150, z + 10))} className="p-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors">
              <ZoomIn className="w-4 h-4" />
            </button>
            <button onClick={() => setZoom(z => Math.max(60, z - 10))} className="p-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors">
              <ZoomOut className="w-4 h-4" />
            </button>
            <button onClick={() => setFullscreen(!fullscreen)} className="p-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors">
              {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            {isTeacher && (
              <button onClick={endClass} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors text-xs font-semibold">
                <StopCircle className="w-3.5 h-3.5" /> End
              </button>
            )}
            <button onClick={() => setSmartBoardOpen(false)} className="p-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors">
              ✕
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Toolbar (Teacher only) */}
          {isTeacher && (
            <div className="flex flex-col items-center gap-2 p-2 bg-slate-800 border-r border-white/10 w-12 flex-shrink-0">
              {([
                { t: 'pointer', icon: MousePointer, tip: 'Pointer' },
                { t: 'pen', icon: Pen, tip: 'Pen' },
                { t: 'highlighter', icon: Highlighter, tip: 'Highlighter' },
                { t: 'eraser', icon: Eraser, tip: 'Eraser' },
                { t: 'laser', icon: Hand, tip: 'Laser Pointer' },
              ] as const).map(({ t, icon: Icon, tip }) => (
                <button key={t} onClick={() => setTool(t)} title={tip}
                  className={cn('p-2 rounded-lg transition-all', tool === t ? 'bg-primary text-white' : 'bg-white/10 text-white/60 hover:bg-white/20')}>
                  <Icon className="w-3.5 h-3.5" />
                </button>
              ))}
              <div className="w-full h-px bg-white/10 my-1" />
              {COLORS.map(c => (
                <button key={c} onClick={() => { setColor(c); setTool('pen'); }}
                  className={cn('w-5 h-5 rounded-full border-2 transition-transform hover:scale-110 flex-shrink-0', color === c && tool !== 'eraser' ? 'border-white' : 'border-transparent')}
                  style={{ background: c }} />
              ))}
              <div className="w-full h-px bg-white/10 my-1" />
              {[2, 4, 7].map(w => (
                <button key={w} onClick={() => setLineWidth(w)}
                  className={cn('w-8 flex items-center justify-center py-1 rounded', lineWidth === w ? 'bg-white/20' : 'hover:bg-white/10')}>
                  <div className="rounded-full bg-white flex-shrink-0" style={{ width: w + 4, height: w }} />
                </button>
              ))}
              <div className="w-full h-px bg-white/10 my-1" />
              <button onClick={clearCanvas} title="Clear" className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setShowPollCreate(true)} title="Create Poll"
                className="p-2 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-colors mt-auto">
                <BarChart3 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Main Content */}
          <div className="flex-1 overflow-auto bg-slate-700 relative flex items-center justify-center">
            {/* Floating Reactions */}
            {reactions.map(r => (
              <div key={r.id} className="absolute bottom-20 animate-bounce text-3xl pointer-events-none z-20"
                style={{ left: `${Math.random() * 80 + 10}%` }}>
                {r.type}
              </div>
            ))}

            <div className="relative" style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'center center' }}>
              {/* Slide */}
              <div className={`w-[800px] h-[500px] bg-gradient-to-br ${slide.bg} flex flex-col items-center justify-center p-12 rounded-xl relative select-none`}>
                <h2 className="text-4xl font-bold text-white text-center mb-6" style={{fontFamily:'Poppins,sans-serif'}}>{slide.title}</h2>
                <p className="text-white/90 text-lg text-center leading-relaxed">{slide.content}</p>
                <div className="absolute bottom-4 right-4 flex gap-2">
                  {DEMO_SLIDES.map((_, i) => (
                    <button key={i} onClick={() => isTeacher && changeSlide(i)}
                      className={cn('w-2 h-2 rounded-full transition-all', i === currentSlide ? 'bg-white' : 'bg-white/40')} />
                  ))}
                </div>
              </div>

              {/* Canvas */}
              <canvas
                ref={canvasRef}
                className={cn('absolute inset-0 w-full h-full rounded-xl',
                  isTeacher && tool !== 'pointer' ? 'cursor-crosshair' : tool === 'pointer' ? 'cursor-default' : 'cursor-default',
                  !isTeacher ? 'pointer-events-none' : ''
                )}
                onMouseDown={startDraw}
                onMouseMove={draw}
                onMouseUp={stopDraw}
                onMouseLeave={stopDraw}
              />
            </div>

            {/* Active Poll Display */}
            {poll && (
              <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-72 bg-slate-800/95 rounded-xl border border-white/20 p-4 z-10">
                <div className="flex items-center gap-2 mb-3">
                  <BarChart3 className="w-4 h-4 text-purple-400" />
                  <span className="text-white text-sm font-semibold">Live Poll</span>
                  {isTeacher && (
                    <button onClick={() => setPoll(null)} className="ml-auto text-white/40 hover:text-white">✕</button>
                  )}
                </div>
                <p className="text-white/90 text-sm mb-3">{poll.question}</p>
                <div className="space-y-2">
                  {poll.options.map((opt, i) => {
                    const total = poll.votes.reduce((a, b) => a + b, 0);
                    const pct = total > 0 ? Math.round((poll.votes[i] / total) * 100) : 0;
                    return (
                      <button key={i} onClick={() => voteOnPoll(i)} disabled={selectedVote !== null || isTeacher}
                        className={cn('w-full text-left rounded-lg p-2.5 border text-sm transition-all relative overflow-hidden',
                          selectedVote === i ? 'border-primary text-white' : 'border-white/20 text-white/80 hover:border-white/40 disabled:cursor-default')}>
                        <div className="absolute inset-0 rounded-lg transition-all" style={{ width: `${pct}%`, background: 'hsl(var(--primary) / 0.3)' }} />
                        <div className="relative flex items-center justify-between">
                          <span>{opt}</span>
                          {selectedVote !== null && <span className="font-semibold">{pct}%</span>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Chat Panel */}
          {showChat && (
            <div className="w-64 bg-slate-800 border-l border-white/10 flex flex-col flex-shrink-0">
              <div className="p-3 border-b border-white/10">
                <p className="text-white text-sm font-semibold">Class Chat</p>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {chatMessages.map((msg, i) => (
                  <div key={i} className="text-xs">
                    <span className="text-blue-300 font-semibold">{msg.sender}:</span>
                    <span className="text-white/80 ml-1">{msg.text}</span>
                    <span className="text-white/30 ml-1">{msg.time}</span>
                  </div>
                ))}
                {chatMessages.length === 0 && <p className="text-white/30 text-xs text-center mt-4">No messages yet</p>}
              </div>
              <div className="p-3 border-t border-white/10 flex gap-2">
                <input
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendChatMessage()}
                  placeholder="Type a message..."
                  className="flex-1 bg-white/10 text-white text-xs px-3 py-2 rounded-lg border border-white/20 focus:outline-none placeholder:text-white/30"
                />
                <button onClick={sendChatMessage} className="p-2 rounded-lg bg-primary text-white">
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Students Panel */}
          {showStudentPanel && (
            <div className="w-52 bg-slate-800 border-l border-white/10 flex flex-col flex-shrink-0">
              <div className="p-3 border-b border-white/10">
                <p className="text-white text-sm font-semibold">{studentCount} Students</p>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {Array.from({ length: studentCount }, (_, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/5">
                    <div className="w-6 h-6 rounded-full bg-gradient-amber flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {String.fromCharCode(65 + (i % 26))}
                    </div>
                    <span className="text-white/80 text-xs truncate">Student {i + 1}</span>
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 ml-auto flex-shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Bar (Student reactions) */}
        {!isTeacher && (
          <div className="flex items-center justify-center gap-3 p-3 bg-slate-900 border-t border-white/10 flex-shrink-0">
            <p className="text-white/50 text-xs mr-2">React:</p>
            {['👏', '❓', '👍', '💡', '😮', '✋'].map(emoji => (
              <button key={emoji} onClick={() => addReaction(emoji)}
                className="text-xl hover:scale-125 transition-transform active:scale-95">
                {emoji}
              </button>
            ))}
          </div>
        )}

        {/* Teacher poll create modal */}
        {showPollCreate && isTeacher && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-30">
            <div className="bg-slate-800 rounded-2xl border border-white/20 p-6 w-80">
              <h3 className="text-white font-bold mb-4">Create Live Poll</h3>
              <input value={pollQuestion} onChange={e => setPollQuestion(e.target.value)}
                placeholder="Poll question..."
                className="w-full bg-white/10 text-white text-sm px-3 py-2 rounded-lg border border-white/20 focus:outline-none mb-3 placeholder:text-white/40" />
              {pollOptions.map((opt, i) => (
                <div key={i} className="flex gap-2 mb-2">
                  <input value={opt} onChange={e => setPollOptions(prev => prev.map((o, j) => j === i ? e.target.value : o))}
                    placeholder={`Option ${i + 1}`}
                    className="flex-1 bg-white/10 text-white text-sm px-3 py-2 rounded-lg border border-white/20 focus:outline-none placeholder:text-white/40" />
                  {pollOptions.length > 2 && (
                    <button onClick={() => setPollOptions(prev => prev.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-300">✕</button>
                  )}
                </div>
              ))}
              {pollOptions.length < 4 && (
                <button onClick={() => setPollOptions(prev => [...prev, ''])} className="text-blue-400 text-sm hover:text-blue-300 mb-3">+ Add option</button>
              )}
              <div className="flex gap-2 mt-2">
                <button onClick={() => setShowPollCreate(false)} className="flex-1 py-2 rounded-lg bg-white/10 text-white text-sm hover:bg-white/20 transition-colors">Cancel</button>
                <button onClick={createPoll} className="flex-1 py-2 rounded-lg bg-primary text-white text-sm hover:opacity-90 transition-all">Launch Poll</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Main Page (lobby)
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Live Classroom</h1>
        <p className="text-muted-foreground text-sm mt-1">Real-time teaching and interactive learning</p>
      </div>

      {activeSession ? (
        <div className="bg-card rounded-2xl border border-green-200 shadow-card overflow-hidden">
          <div className="bg-gradient-green p-6 text-white">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="pulse-dot" />
                <div>
                  <p className="font-bold text-lg">{activeSession.title}</p>
                  <p className="text-green-100 text-sm">Live class in progress</p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-full">
                <Users className="w-4 h-4" />
                <span className="font-semibold">{studentCount} attending</span>
              </div>
            </div>
          </div>
          <div className="p-6 flex flex-col sm:flex-row gap-3">
            <button onClick={() => setSmartBoardOpen(true)}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-blue text-white font-semibold hover:opacity-90 transition-all">
              <BookOpen className="w-5 h-5" />
              {isTeacher ? 'Open Smart Board' : 'Join Live Class'}
            </button>
            {isTeacher && (
              <button onClick={endClass}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-red-200 text-red-600 font-semibold hover:bg-red-50 transition-all">
                <StopCircle className="w-5 h-5" /> End Class
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border shadow-card p-8 text-center">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <Video className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="font-bold text-xl mb-2">No Active Class</h3>
          <p className="text-muted-foreground text-sm mb-6">
            {isTeacher ? 'Start a live class to teach students in real-time' : 'Waiting for your teacher to start a live class'}
          </p>
          {isTeacher && (
            <button onClick={startClass} disabled={starting}
              className="flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-hero text-white font-bold shadow-glow-blue hover:opacity-90 transition-all disabled:opacity-50 mx-auto">
              {starting ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <PlayCircle className="w-5 h-5" />}
              {starting ? 'Starting...' : 'Start Live Class'}
            </button>
          )}
        </div>
      )}

      {/* Features Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { icon: Wifi, label: 'Real-time Sync', desc: 'Slide & annotation changes sync instantly', color: 'bg-gradient-blue' },
          { icon: BookOpen, label: 'Smart Board', desc: 'Pen, highlighter, pointer & eraser tools', color: 'bg-gradient-purple' },
          { icon: Users, label: 'Live Reactions', desc: 'Students react with emojis in real-time', color: 'bg-gradient-green' },
          { icon: BarChart3, label: 'Live Polls', desc: 'Create instant polls to check understanding', color: 'bg-gradient-amber' },
          { icon: MessageSquare, label: 'Class Chat', desc: 'Real-time chat between teacher & students', color: 'bg-gradient-red' },
          { icon: Award, label: 'Slide Navigation', desc: 'Navigate slides during live class', color: 'bg-gradient-blue' },
        ].map((f) => (
          <div key={f.label} className="stat-card flex items-start gap-4">
            <div className={`w-10 h-10 rounded-xl ${f.color} flex items-center justify-center flex-shrink-0`}>
              <f.icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-sm">{f.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LiveClassPage;
