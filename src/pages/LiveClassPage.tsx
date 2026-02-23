import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  PlayCircle, StopCircle, Users, Video, BookOpen, Clock, Wifi,
  ChevronLeft, ChevronRight, Pen, Eraser, MousePointer, Trash2,
  Maximize2, Minimize2, ZoomIn, ZoomOut, Highlighter,
  MessageSquare, Award, BarChart3, FileText
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

type Tool = 'pointer' | 'pen' | 'eraser' | 'highlighter';
const COLORS = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#000000'];

interface Annotation {
  tool: 'pen' | 'eraser' | 'highlighter';
  points: { x: number; y: number }[];
  color: string;
  width: number;
}

interface MaterialItem {
  id: string;
  title: string;
  file_url?: string;
  file_type?: string;
  type: string;
}

const LiveClassPage = () => {
  const { user } = useAuth();
  const pdfCanvasRef = useRef<HTMLCanvasElement>(null);
  const annotCanvasRef = useRef<HTMLCanvasElement>(null);
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
  const [zoom, setZoom] = useState(100);
  const [reactions, setReactions] = useState<{type: string; id: number}[]>([]);
  const [poll, setPoll] = useState<{question: string; options: string[]; votes: number[]} | null>(null);
  const [showPollCreate, setShowPollCreate] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [selectedVote, setSelectedVote] = useState<number | null>(null);
  const [chatMessages, setChatMessages] = useState<{text: string; sender: string; time: string}[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [showChat, setShowChat] = useState(false);

  // PDF state
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [pdfLoading, setPdfLoading] = useState(false);

  // Materials selection
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialItem | null>(null);
  const [showMaterialPicker, setShowMaterialPicker] = useState(false);

  // Real student count
  const [studentCount, setStudentCount] = useState(0);

  const isTeacher = user?.role === 'teacher' || user?.role === 'admin' || user?.role === 'super_admin';

  useEffect(() => {
    fetchActiveSessions();
    fetchMaterials();
    fetchStudentCount();
    const interval = setInterval(fetchActiveSessions, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchActiveSessions = async () => {
    try {
      // Mock: fetch live sessions from API
      // const { sessions } = await apiClient.request('/live-sessions');
      // setActiveSession(sessions?.[0] || null);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      setLoading(false);
    }
  };

  const fetchMaterials = async () => {
    try {
      const { materials: data } = await apiClient.request('/materials');
      setMaterials(data || []);
    } catch (error) {
      console.error('Error fetching materials:', error);
    }
  };

  const fetchStudentCount = async () => {
    try {
      const { users } = await apiClient.getUsersByRole('student');
      setStudentCount(users?.length ?? 0);
    } catch (error) {
      console.error('Error fetching student count:', error);
    }
  };

  const startClass = async () => {
    setStarting(true);
    try {
      // Mock: start live session
      // const result = await apiClient.request('/live-sessions', {
      //   method: 'POST',
      //   body: JSON.stringify({ title: 'Live Class Session', status: 'active' })
      // });
      // setActiveSession(result.session);
      // For now, just open the smartboard with mock data
      setActiveSession({ id: 'mock-' + Date.now(), title: 'Live Class Session' });
      setSmartBoardOpen(true);
    } catch (error) {
      console.error('Error starting class:', error);
    } finally {
      setStarting(false);
    }
  };

  const endClass = async () => {
    if (!activeSession) return;
    try {
      // Mock: end live session
      // await apiClient.request(`/live-sessions/${activeSession.id}`, {
      //   method: 'PUT',
      //   body: JSON.stringify({ status: 'ended' })
      // });
      setActiveSession(null);
      setSmartBoardOpen(false);
      setPdfDoc(null);
      setSelectedMaterial(null);
    } catch (error) {
      console.error('Error ending class:', error);
    }
  };

  // Load PDF when material selected
  useEffect(() => {
    if (!selectedMaterial?.file_url) return;
    const isPDF = selectedMaterial.file_type?.includes('pdf') || selectedMaterial.file_url?.endsWith('.pdf');
    if (!isPDF) return;

    setPdfLoading(true);
    pdfjsLib.getDocument({ url: selectedMaterial.file_url }).promise.then(doc => {
      setPdfDoc(doc);
      setTotalPages(doc.numPages);
      setCurrentPage(1);
      setPdfLoading(false);
    }).catch(() => setPdfLoading(false));
  }, [selectedMaterial]);

  // Render PDF page
  useEffect(() => {
    if (!pdfDoc || !pdfCanvasRef.current) return;
    const render = async () => {
      const page = await pdfDoc.getPage(currentPage);
      const scale = (zoom / 100) * 1.5;
      const viewport = page.getViewport({ scale });
      const canvas = pdfCanvasRef.current!;
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await page.render({ canvasContext: canvas.getContext('2d')!, viewport }).promise;
      if (annotCanvasRef.current) {
        annotCanvasRef.current.width = viewport.width;
        annotCanvasRef.current.height = viewport.height;
        drawAllAnnotations();
      }
    };
    render();
  }, [pdfDoc, currentPage, zoom]);

  const drawAllAnnotations = useCallback(() => {
    const canvas = annotCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    annotations.forEach(ann => {
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
  }, [annotations]);

  useEffect(() => { drawAllAnnotations(); }, [drawAllAnnotations]);

  const getPos = (e: React.MouseEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  };

  const startDraw = (e: React.MouseEvent) => {
    if (tool === 'pointer' || !isTeacher || !annotCanvasRef.current) return;
    const pos = getPos(e, annotCanvasRef.current);
    const ann: Annotation = { tool: tool as Annotation['tool'], points: [pos], color, width: lineWidth };
    setCurrentAnnotation(ann);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent) => {
    if (!isDrawing || !currentAnnotation || !annotCanvasRef.current) return;
    const pos = getPos(e, annotCanvasRef.current);
    const updated = { ...currentAnnotation, points: [...currentAnnotation.points, pos] };
    setCurrentAnnotation(updated);
    const ctx = annotCanvasRef.current.getContext('2d')!;
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
    if (annotCanvasRef.current) {
      const ctx = annotCanvasRef.current.getContext('2d')!;
      ctx.clearRect(0, 0, annotCanvasRef.current.width, annotCanvasRef.current.height);
    }
  };

  const changePage = async (p: number) => {
    setCurrentPage(p);
    setAnnotations([]);
    if (activeSession) {
      try {
        // Mock: update page in live session
        // await apiClient.request(`/live-sessions/${activeSession.id}`, {
        //   method: 'PUT',
        //   body: JSON.stringify({ currentPage: p })
        // });
      } catch (error) {
        console.error('Error updating page:', error);
      }
    }
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
      sender: user?.full_name || 'User',
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
    const hasPDF = !!pdfDoc;
    const isImage = selectedMaterial?.file_type?.startsWith('image/');

    return (
      <div className={cn('fixed z-50 bg-slate-950 flex flex-col', fullscreen ? 'inset-0' : 'inset-2 rounded-2xl overflow-hidden')}>
        {/* Top Bar */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-red-500/20 border border-red-500/40 rounded-full px-3 py-1">
              <div className="pulse-dot w-1.5 h-1.5" />
              <span className="text-red-400 text-xs font-bold">LIVE</span>
            </div>
            <span className="text-white font-semibold text-sm hidden sm:block truncate max-w-[200px]">
              {selectedMaterial?.title || activeSession.title}
            </span>
          </div>

          {/* Page Navigation */}
          {hasPDF && (
            <div className="flex items-center gap-2">
              <button onClick={() => changePage(Math.max(1, currentPage - 1))} disabled={currentPage <= 1}
                className="p-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20 disabled:opacity-30 transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-white text-sm font-medium px-2">{currentPage}/{totalPages}</span>
              <button onClick={() => changePage(Math.min(totalPages, currentPage + 1))} disabled={currentPage >= totalPages}
                className="p-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20 disabled:opacity-30 transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full">
              <Users className="w-3.5 h-3.5 text-white" />
              <span className="text-white text-xs font-semibold">{studentCount}</span>
            </div>
            {isTeacher && (
              <button onClick={() => setShowMaterialPicker(true)} className="p-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors" title="Select Material">
                <FileText className="w-4 h-4" />
              </button>
            )}
            <button onClick={() => setShowChat(!showChat)} className={cn('p-1.5 rounded-lg transition-colors', showChat ? 'bg-primary text-white' : 'bg-white/10 text-white hover:bg-white/20')}>
              <MessageSquare className="w-4 h-4" />
            </button>
            <button onClick={() => setZoom(z => Math.min(200, z + 20))} className="p-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors">
              <ZoomIn className="w-4 h-4" />
            </button>
            <button onClick={() => setZoom(z => Math.max(50, z - 20))} className="p-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors">
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
          <div className="flex-1 overflow-auto bg-slate-700 relative flex items-center justify-center p-4">
            {/* Floating Reactions */}
            {reactions.map(r => (
              <div key={r.id} className="absolute bottom-20 animate-bounce text-3xl pointer-events-none z-20"
                style={{ left: `${Math.random() * 80 + 10}%` }}>
                {r.type}
              </div>
            ))}

            {!selectedMaterial ? (
              <div className="text-center text-white/60">
                <FileText className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium mb-2">No material selected</p>
                {isTeacher ? (
                  <button onClick={() => setShowMaterialPicker(true)}
                    className="px-6 py-3 rounded-xl bg-primary text-white font-semibold hover:opacity-90 transition-all">
                    Select a Document
                  </button>
                ) : (
                  <p className="text-sm">Waiting for teacher to load content...</p>
                )}
              </div>
            ) : pdfLoading ? (
              <div className="flex flex-col items-center gap-4 text-white">
                <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin" />
                <p className="text-sm">Loading document...</p>
              </div>
            ) : hasPDF ? (
              <div className="relative inline-block">
                <canvas ref={pdfCanvasRef} className="shadow-xl rounded" style={{ display: 'block', maxWidth: '100%', maxHeight: '100%' }} />
                <canvas
                  ref={annotCanvasRef}
                  className={cn('absolute inset-0 w-full h-full rounded',
                    isTeacher && tool !== 'pointer' ? 'cursor-crosshair' : 'cursor-default',
                    !isTeacher ? 'pointer-events-none' : ''
                  )}
                  style={{ width: '100%', height: '100%' }}
                  onMouseDown={startDraw}
                  onMouseMove={draw}
                  onMouseUp={stopDraw}
                  onMouseLeave={stopDraw}
                />
              </div>
            ) : isImage ? (
              <img src={selectedMaterial.file_url} alt={selectedMaterial.title} className="max-h-[80vh] object-contain rounded shadow-xl" />
            ) : (
              <div className="bg-white rounded-xl p-12 text-center">
                <div className="text-6xl mb-4">📄</div>
                <p className="text-xl font-bold text-gray-800">{selectedMaterial.title}</p>
                <p className="text-gray-500 mt-2">{selectedMaterial.type}</p>
              </div>
            )}

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

            {/* Material Picker Modal */}
            {showMaterialPicker && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-30">
                <div className="bg-slate-800 rounded-2xl border border-white/20 p-6 w-96 max-h-[70vh] overflow-y-auto">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white font-bold">Select Material</h3>
                    <button onClick={() => setShowMaterialPicker(false)} className="text-white/40 hover:text-white">✕</button>
                  </div>
                  {materials.length === 0 ? (
                    <p className="text-white/50 text-sm text-center py-4">No materials uploaded yet. Upload content in Classes page first.</p>
                  ) : (
                    <div className="space-y-2">
                      {materials.map(m => (
                        <button key={m.id} onClick={() => { setSelectedMaterial(m); setShowMaterialPicker(false); setAnnotations([]); setCurrentPage(1); setPdfDoc(null); }}
                          className="w-full text-left p-3 rounded-xl border border-white/10 hover:border-white/30 transition-all flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                            <FileText className="w-4 h-4 text-white/60" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-white text-sm font-medium truncate">{m.title}</p>
                            <p className="text-white/40 text-xs capitalize">{m.type.replace('_', ' ')}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
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
                <span className="font-semibold">{studentCount} students</span>
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
          { icon: Wifi, label: 'Real-time Sync', desc: 'Content syncs instantly to all students', color: 'bg-gradient-blue' },
          { icon: BookOpen, label: 'Smart Board', desc: 'Pen, highlighter & eraser tools', color: 'bg-gradient-purple' },
          { icon: Users, label: 'Live Reactions', desc: 'Students react with emojis in real-time', color: 'bg-gradient-green' },
          { icon: BarChart3, label: 'Live Polls', desc: 'Create instant polls to check understanding', color: 'bg-gradient-amber' },
          { icon: MessageSquare, label: 'Class Chat', desc: 'Real-time chat during class', color: 'bg-gradient-red' },
          { icon: Award, label: 'PDF Navigation', desc: 'Navigate multi-page PDFs during live class', color: 'bg-gradient-blue' },
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
