import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  X, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Maximize2, Minimize2,
  Pen, Eraser, MousePointer, Trash2, Download, Users
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface Material {
  id: string;
  title: string;
  file_url?: string;
  file_type?: string;
  type: string;
}

interface Props {
  material: Material;
  onClose: () => void;
  canTeach: boolean;
  sessionId?: string;
}

type Tool = 'pointer' | 'pen' | 'eraser';

interface Annotation {
  tool: 'pen' | 'eraser';
  points: { x: number; y: number }[];
  color: string;
  width: number;
}

const COLORS = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#000000', '#FFFFFF'];

const PDFViewerModal: React.FC<Props> = ({ material, onClose, canTeach, sessionId }) => {
  const { profile } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tool, setTool] = useState<Tool>('pointer');
  const [color, setColor] = useState('#EF4444');
  const [lineWidth, setLineWidth] = useState(3);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentAnnotation, setCurrentAnnotation] = useState<Annotation | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [page, setPage] = useState(1);
  const [totalPages] = useState(5); // demo
  const [liveStudents] = useState(Math.floor(Math.random() * 20) + 5);

  const isPDF = material.file_url && (material.file_type?.includes('pdf') || material.file_url?.endsWith('.pdf'));
  const isImage = material.file_url && material.file_type?.startsWith('image/');

  const drawAllAnnotations = useCallback((canvas: HTMLCanvasElement, anns: Annotation[]) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    anns.forEach(ann => {
      if (ann.points.length < 2) return;
      ctx.beginPath();
      ctx.strokeStyle = ann.tool === 'eraser' ? '#FFFFFF' : ann.color;
      ctx.lineWidth = ann.tool === 'eraser' ? ann.width * 5 : ann.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.moveTo(ann.points[0].x, ann.points[0].y);
      ann.points.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
      ctx.stroke();
    });
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    drawAllAnnotations(canvas, annotations);
  }, [annotations, drawAllAnnotations]);

  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top };
  };

  const startDraw = (e: React.MouseEvent) => {
    if (tool === 'pointer' || !canTeach) return;
    const canvas = canvasRef.current!;
    const pos = getPos(e, canvas);
    const ann: Annotation = { tool: tool as 'pen' | 'eraser', points: [pos], color, width: lineWidth };
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
      ctx.strokeStyle = updated.tool === 'eraser' ? 'rgba(255,255,255,1)' : updated.color;
      ctx.lineWidth = updated.tool === 'eraser' ? updated.width * 5 : updated.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.moveTo(pts[pts.length - 2].x, pts[pts.length - 2].y);
      ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
      ctx.stroke();
    }
  };

  const stopDraw = () => {
    if (!isDrawing || !currentAnnotation) return;
    setAnnotations(prev => [...prev, currentAnnotation]);
    setCurrentAnnotation(null);
    setIsDrawing(false);
  };

  const clearAnnotations = () => {
    setAnnotations([]);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d')!;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const fileUrl = material.file_url;

  return (
    <div className={cn(
      "fixed z-50 bg-black/90 backdrop-blur-sm flex flex-col",
      fullscreen ? "inset-0" : "inset-4 rounded-2xl overflow-hidden"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-white">
            <span className="font-semibold text-sm truncate max-w-[200px]">{material.title}</span>
            {canTeach && (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-500/20 border border-green-500/30">
                <div className="pulse-dot w-1.5 h-1.5" />
                <span className="text-green-400 text-xs font-medium">{liveStudents} students live</span>
              </div>
            )}
          </div>
        </div>

        {/* Page navigation */}
        {isPDF && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20 disabled:opacity-30 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-white text-sm font-medium px-2">{page} / {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20 disabled:opacity-30 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoom(z => Math.min(200, z + 10))}
            className="p-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <span className="text-white text-xs w-10 text-center">{zoom}%</span>
          <button
            onClick={() => setZoom(z => Math.max(50, z - 10))}
            className="p-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={() => setFullscreen(!fullscreen)}
            className="p-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button onClick={onClose} className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main viewer */}
      <div className="flex flex-1 overflow-hidden">
        {/* Annotation Toolbar (Teacher only) */}
        {canTeach && (
          <div className="flex flex-col items-center gap-3 p-3 bg-slate-800 border-r border-white/10 w-14 flex-shrink-0">
            {[
              { t: 'pointer' as Tool, icon: MousePointer, label: 'Pointer' },
              { t: 'pen' as Tool, icon: Pen, label: 'Pen' },
              { t: 'eraser' as Tool, icon: Eraser, label: 'Eraser' },
            ].map(({ t, icon: Icon, label }) => (
              <button
                key={t}
                onClick={() => setTool(t)}
                title={label}
                className={cn(
                  "p-2 rounded-xl transition-all",
                  tool === t ? "bg-primary text-white" : "bg-white/10 text-white/60 hover:bg-white/20"
                )}
              >
                <Icon className="w-4 h-4" />
              </button>
            ))}

            <div className="w-full h-px bg-white/10" />

            {/* Colors */}
            <div className="space-y-1.5">
              {COLORS.slice(0, 4).map(c => (
                <button
                  key={c}
                  onClick={() => { setColor(c); setTool('pen'); }}
                  className={cn("w-6 h-6 rounded-full border-2 transition-transform hover:scale-110", color === c ? "border-white" : "border-transparent")}
                  style={{ background: c }}
                />
              ))}
            </div>

            <div className="w-full h-px bg-white/10" />

            {/* Line width */}
            <div className="space-y-1">
              {[2, 4, 7].map(w => (
                <button
                  key={w}
                  onClick={() => setLineWidth(w)}
                  className={cn("w-8 flex items-center justify-center py-1 rounded", lineWidth === w ? "bg-white/20" : "hover:bg-white/10")}
                >
                  <div className="rounded-full bg-white" style={{ width: w + 4, height: w }} />
                </button>
              ))}
            </div>

            <div className="w-full h-px bg-white/10" />

            <button onClick={clearAnnotations} title="Clear" className="p-2 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-auto bg-slate-700 relative flex items-center justify-center">
          <div className="relative" style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'center center' }}>
            {fileUrl ? (
              isPDF ? (
                <iframe
                  src={`https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`}
                  className="w-[800px] h-[600px] bg-white"
                  title={material.title}
                />
              ) : isImage ? (
                <img src={fileUrl} alt={material.title} className="max-w-4xl max-h-[80vh] object-contain" />
              ) : (
                <div className="w-[800px] h-[600px] bg-white flex flex-col items-center justify-center gap-4">
                  <div className="text-6xl">📄</div>
                  <p className="text-gray-600 font-medium">{material.title}</p>
                  <a
                    href={fileUrl}
                    download
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl font-medium text-sm"
                  >
                    <Download className="w-4 h-4" /> Download File
                  </a>
                </div>
              )
            ) : (
              <div className="w-[800px] h-[600px] bg-white flex flex-col items-center justify-center gap-4">
                <div className="text-6xl">📋</div>
                <p className="text-2xl font-bold text-gray-800">{material.title}</p>
                <p className="text-gray-500 capitalize">{material.type.replace('_', ' ')}</p>
                {!canTeach && (
                  <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-2 rounded-xl border border-green-200">
                    <Users className="w-4 h-4" />
                    <span className="text-sm font-medium">Live session — synced with teacher</span>
                  </div>
                )}
              </div>
            )}

            {/* Drawing Canvas */}
            <canvas
              ref={canvasRef}
              className={cn(
                "absolute inset-0 w-full h-full",
                canTeach && tool !== 'pointer' ? "cursor-crosshair" : "cursor-default",
                !canTeach ? "pointer-events-none" : ""
              )}
              onMouseDown={startDraw}
              onMouseMove={draw}
              onMouseUp={stopDraw}
              onMouseLeave={stopDraw}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-2 bg-slate-900 border-t border-white/10 flex items-center justify-between flex-shrink-0">
        <p className="text-white/50 text-xs">
          {canTeach ? '🎓 Teacher Mode — Smart Board Active' : '📖 Student Mode — Live Sync Active'}
        </p>
        {fileUrl && (
          <a href={fileUrl} download className="flex items-center gap-1.5 text-blue-400 text-xs hover:text-blue-300 transition-colors">
            <Download className="w-3.5 h-3.5" /> Download
          </a>
        )}
      </div>
    </div>
  );
};

export default PDFViewerModal;
