import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  PlayCircle, StopCircle, Users, ChevronLeft, ChevronRight, Pen, Eraser, MousePointer, Trash2,
  Maximize2, Minimize2, ZoomIn, ZoomOut, Highlighter, MessageSquare, FileText
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

type Tool = 'pointer' | 'pen' | 'eraser' | 'highlighter';
const COLORS = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#000000'];

interface Annotation { tool: 'pen' | 'eraser' | 'highlighter'; points: { x: number; y: number }[]; color: string; width: number; }
interface MaterialItem { id: string; title: string; file_url?: string; file_type?: string; type: string; }

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
  const [chatMessages, setChatMessages] = useState<{text: string; sender: string; time: string}[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialItem | null>(null);
  const [showMaterialPicker, setShowMaterialPicker] = useState(false);
  const [studentCount, setStudentCount] = useState(0);

  const isTeacher = user?.role === 'teacher' || user?.role === 'admin' || user?.role === 'super_admin';

  useEffect(() => {
    const init = async () => {
      try {
        const [{ data: sessions }, { data: mats }, { data: students }] = await Promise.all([
          supabase.from('live_sessions').select('*').eq('status', 'active').limit(1),
          supabase.from('materials').select('id, title, file_url, file_type, type'),
          supabase.from('user_roles').select('*').eq('role', 'student'),
        ]);
        if (sessions?.[0]) { setActiveSession(sessions[0]); setSmartBoardOpen(true); }
        setMaterials((mats as MaterialItem[]) || []);
        setStudentCount(students?.length || 0);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    init();
  }, []);

  const startClass = async () => {
    setStarting(true);
    const { data, error } = await supabase.from('live_sessions').insert({
      title: 'Live Class Session', teacher_id: user?.user_id, status: 'active', started_at: new Date().toISOString(),
    } as any).select().single();
    if (!error && data) { setActiveSession(data); setSmartBoardOpen(true); }
    setStarting(false);
  };

  const endClass = async () => {
    if (!activeSession) return;
    await supabase.from('live_sessions').update({ status: 'ended', ended_at: new Date().toISOString() } as any).eq('id', activeSession.id);
    setActiveSession(null); setSmartBoardOpen(false); setPdfDoc(null); setSelectedMaterial(null);
  };

  useEffect(() => {
    if (!selectedMaterial?.file_url) return;
    const isPDF = selectedMaterial.file_type?.includes('pdf') || selectedMaterial.file_url?.endsWith('.pdf');
    if (!isPDF) return;
    pdfjsLib.getDocument({ url: selectedMaterial.file_url }).promise.then(doc => {
      setPdfDoc(doc); setTotalPages(doc.numPages); setCurrentPage(1);
    }).catch(() => {});
  }, [selectedMaterial]);

  useEffect(() => {
    if (!pdfDoc || !pdfCanvasRef.current) return;
    const render = async () => {
      const page = await pdfDoc.getPage(currentPage);
      const scale = (zoom / 100) * 1.5;
      const viewport = page.getViewport({ scale });
      const canvas = pdfCanvasRef.current!;
      canvas.width = viewport.width; canvas.height = viewport.height;
      await page.render({ canvasContext: canvas.getContext('2d')!, viewport }).promise;
      if (annotCanvasRef.current) {
        annotCanvasRef.current.width = viewport.width; annotCanvasRef.current.height = viewport.height;
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
      if (ann.tool === 'eraser') { ctx.globalCompositeOperation = 'destination-out'; ctx.lineWidth = ann.width * 5; }
      else if (ann.tool === 'highlighter') { ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 0.35; ctx.lineWidth = ann.width * 6; }
      else { ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; ctx.lineWidth = ann.width; }
      ctx.strokeStyle = ann.tool === 'eraser' ? '#000' : ann.color;
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.moveTo(ann.points[0].x, ann.points[0].y);
      ann.points.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
      ctx.stroke(); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    });
  }, [annotations]);

  useEffect(() => { drawAllAnnotations(); }, [drawAllAnnotations]);

  const getPos = (e: React.MouseEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    return { x: (e.clientX - rect.left) * (canvas.width / rect.width), y: (e.clientY - rect.top) * (canvas.height / rect.height) };
  };

  const startDraw = (e: React.MouseEvent) => {
    if (tool === 'pointer' || !isTeacher || !annotCanvasRef.current) return;
    const pos = getPos(e, annotCanvasRef.current);
    setCurrentAnnotation({ tool: tool as Annotation['tool'], points: [pos], color, width: lineWidth });
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
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.moveTo(pts[pts.length - 2].x, pts[pts.length - 2].y);
      ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
      ctx.stroke(); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    }
  };

  const stopDraw = () => {
    if (!isDrawing || !currentAnnotation) return;
    setAnnotations(prev => [...prev, currentAnnotation]);
    setCurrentAnnotation(null); setIsDrawing(false);
  };

  const clearCanvas = () => {
    setAnnotations([]);
    if (annotCanvasRef.current) {
      const ctx = annotCanvasRef.current.getContext('2d')!;
      ctx.clearRect(0, 0, annotCanvasRef.current.width, annotCanvasRef.current.height);
    }
  };

  const changePage = (p: number) => { setCurrentPage(p); setAnnotations([]); };

  const sendChatMessage = () => {
    if (!chatInput.trim()) return;
    setChatMessages(prev => [...prev, { text: chatInput, sender: user?.full_name || 'User', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    setChatInput('');
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (smartBoardOpen && activeSession) {
    const hasPDF = !!pdfDoc;
    return (
      <div className={cn('fixed z-50 bg-slate-950 flex flex-col', fullscreen ? 'inset-0' : 'inset-2 rounded-2xl overflow-hidden')}>
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-red-500/20 border border-red-500/40 rounded-full px-3 py-1">
              <div className="pulse-dot w-1.5 h-1.5" /><span className="text-red-400 text-xs font-bold">LIVE</span>
            </div>
            <span className="text-white font-semibold text-sm hidden sm:block truncate max-w-[200px]">{selectedMaterial?.title || activeSession.title}</span>
          </div>
          {hasPDF && (
            <div className="flex items-center gap-2">
              <button onClick={() => changePage(Math.max(1, currentPage - 1))} disabled={currentPage <= 1} className="p-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20 disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
              <span className="text-white text-sm font-medium px-2">{currentPage}/{totalPages}</span>
              <button onClick={() => changePage(Math.min(totalPages, currentPage + 1))} disabled={currentPage >= totalPages} className="p-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20 disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
            </div>
          )}
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full">
              <Users className="w-3.5 h-3.5 text-white" /><span className="text-white text-xs font-semibold">{studentCount}</span>
            </div>
            {isTeacher && <button onClick={() => setShowMaterialPicker(true)} className="p-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20" title="Select Material"><FileText className="w-4 h-4" /></button>}
            <button onClick={() => setShowChat(!showChat)} className={cn('p-1.5 rounded-lg transition-colors', showChat ? 'bg-primary text-white' : 'bg-white/10 text-white hover:bg-white/20')}><MessageSquare className="w-4 h-4" /></button>
            <button onClick={() => setZoom(z => Math.min(200, z + 20))} className="p-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20"><ZoomIn className="w-4 h-4" /></button>
            <button onClick={() => setZoom(z => Math.max(50, z - 20))} className="p-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20"><ZoomOut className="w-4 h-4" /></button>
            <button onClick={() => setFullscreen(!fullscreen)} className="p-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20">
              {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            {isTeacher && <button onClick={endClass} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 text-xs font-semibold"><StopCircle className="w-3.5 h-3.5" /> End</button>}
            <button onClick={() => setSmartBoardOpen(false)} className="p-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20">✕</button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {isTeacher && (
            <div className="flex flex-col items-center gap-2 p-2 bg-slate-800 border-r border-white/10 w-12 flex-shrink-0">
              {([{ t: 'pointer', icon: MousePointer }, { t: 'pen', icon: Pen }, { t: 'highlighter', icon: Highlighter }, { t: 'eraser', icon: Eraser }] as const).map(({ t, icon: Icon }) => (
                <button key={t} onClick={() => setTool(t)} className={cn('p-2 rounded-lg transition-all', tool === t ? 'bg-primary text-white' : 'bg-white/10 text-white/60 hover:bg-white/20')}>
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
              <button onClick={clearCanvas} className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          )}

          <div className="flex-1 overflow-auto flex items-center justify-center bg-slate-950 relative">
            {hasPDF ? (
              <div className="relative">
                <canvas ref={pdfCanvasRef} className="max-w-full" />
                <canvas ref={annotCanvasRef} className="absolute inset-0 max-w-full"
                  style={{ cursor: tool === 'pointer' ? 'default' : tool === 'eraser' ? 'cell' : 'crosshair' }}
                  onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw} />
              </div>
            ) : (
              <div className="text-center text-white/50 p-8">
                <FileText className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium mb-2">No material selected</p>
                {isTeacher && <button onClick={() => setShowMaterialPicker(true)} className="px-4 py-2 bg-primary rounded-xl text-white text-sm font-medium hover:opacity-90">Select Material</button>}
              </div>
            )}
          </div>

          {showChat && (
            <div className="w-72 bg-slate-900 border-l border-white/10 flex flex-col flex-shrink-0">
              <div className="p-3 border-b border-white/10"><h3 className="text-white font-semibold text-sm">Live Chat</h3></div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {chatMessages.map((m, i) => (
                  <div key={i} className="bg-white/5 rounded-lg p-2">
                    <p className="text-white/70 text-xs font-medium">{m.sender} <span className="text-white/30">{m.time}</span></p>
                    <p className="text-white text-sm">{m.text}</p>
                  </div>
                ))}
                {chatMessages.length === 0 && <p className="text-white/30 text-xs text-center py-4">No messages yet</p>}
              </div>
              <div className="p-3 border-t border-white/10 flex gap-2">
                <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendChatMessage()}
                  placeholder="Type a message..." className="flex-1 px-3 py-2 bg-white/10 rounded-lg text-white text-sm placeholder-white/30 focus:outline-none" />
                <button onClick={sendChatMessage} className="px-3 py-2 bg-primary rounded-lg text-white text-xs font-medium">Send</button>
              </div>
            </div>
          )}
        </div>

        {showMaterialPicker && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60">
            <div className="bg-card rounded-2xl shadow-xl border border-border w-full max-w-md max-h-[60vh] overflow-y-auto">
              <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-card">
                <h3 className="font-bold">Select Material</h3>
                <button onClick={() => setShowMaterialPicker(false)} className="p-1.5 rounded-lg hover:bg-muted">✕</button>
              </div>
              <div className="p-4 space-y-2">
                {materials.filter(m => m.file_url).map(m => (
                  <button key={m.id} onClick={() => { setSelectedMaterial(m); setShowMaterialPicker(false); }}
                    className={cn('w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all',
                      selectedMaterial?.id === m.id ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50')}>
                    <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{m.title}</p>
                      <p className="text-xs text-muted-foreground capitalize">{m.type?.replace('_', ' ')}</p>
                    </div>
                  </button>
                ))}
                {materials.filter(m => m.file_url).length === 0 && (
                  <p className="text-center text-muted-foreground text-sm py-8">No materials with files uploaded yet</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Live Class</h1>
        <p className="text-muted-foreground text-sm mt-1">{isTeacher ? 'Start a live teaching session' : 'Join an active class'}</p>
      </div>

      {isTeacher ? (
        <div className="bg-gradient-hero rounded-2xl p-8 text-white text-center">
          <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
            <PlayCircle className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Smart Board Teaching</h2>
          <p className="text-blue-200 mb-6 max-w-md mx-auto">Open your smart board with PDF viewer, annotation tools, and real-time student engagement features.</p>
          <button onClick={startClass} disabled={starting}
            className="px-8 py-3 bg-white text-blue-600 rounded-xl font-bold text-lg hover:bg-white/90 transition-all disabled:opacity-50 shadow-lg">
            {starting ? 'Starting...' : '🚀 Start Live Class'}
          </button>
        </div>
      ) : (
        <div className="stat-card p-8 text-center">
          {activeSession ? (
            <div>
              <div className="pulse-dot mx-auto mb-4" />
              <h2 className="text-xl font-bold text-green-700 mb-2">Live Class Active!</h2>
              <p className="text-muted-foreground mb-4">{activeSession.title}</p>
              <button onClick={() => setSmartBoardOpen(true)} className="px-6 py-2.5 bg-gradient-blue text-white rounded-xl font-medium hover:opacity-90">Join Class</button>
            </div>
          ) : (
            <div>
              <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mx-auto mb-4">
                <PlayCircle className="w-8 h-8 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-bold mb-2">No Active Class</h2>
              <p className="text-muted-foreground text-sm">Waiting for your teacher to start a live session...</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LiveClassPage;
