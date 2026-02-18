import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  Plus, ChevronDown, ChevronRight, BookOpen, FileText,
  Trash2, Edit, Eye, Upload, FolderOpen, Video, ClipboardList,
  FileQuestion, BookMarked, GraduationCap, MoreVertical
} from 'lucide-react';
import { cn } from '@/lib/utils';
import ContentUploadModal from '@/components/ContentUploadModal';
import PDFViewerModal from '@/components/PDFViewerModal';
import CreateClassModal from '@/components/CreateClassModal';

interface Class { id: string; name: string; description: string; grade_level: number; }
interface Subject { id: string; class_id: string; name: string; description: string; color: string; }
interface Chapter { id: string; subject_id: string; name: string; description: string; order_index: number; }
interface Material { id: string; chapter_id: string; title: string; type: string; file_url?: string; file_type?: string; }

const TYPE_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  theory: { label: 'Theory', icon: BookOpen, color: 'badge-theory' },
  question_bank: { label: 'Question Bank', icon: FileQuestion, color: 'badge-question_bank' },
  exam_practice: { label: 'Exam Practice', icon: ClipboardList, color: 'badge-exam_practice' },
  assignment: { label: 'Assignment', icon: FileText, color: 'badge-assignment' },
  notes: { label: 'Notes', icon: BookMarked, color: 'badge-notes' },
  video: { label: 'Video', icon: Video, color: 'badge-video' },
};

const ClassesPage = () => {
  const { profile } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedClasses, setExpandedClasses] = useState<Set<string>>(new Set());
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set());
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
  const [uploadModal, setUploadModal] = useState<{ open: boolean; chapterId?: string }>({ open: false });
  const [pdfModal, setPdfModal] = useState<{ open: boolean; material?: Material }>({ open: false });
  const [createClassModal, setCreateClassModal] = useState(false);

  const canEdit = profile?.role === 'admin' || profile?.role === 'super_admin' || profile?.role === 'teacher';

  const fetchAll = async () => {
    setLoading(true);
    const [clsRes, subRes, chpRes, matRes] = await Promise.all([
      supabase.from('classes').select('*').order('grade_level'),
      supabase.from('subjects').select('*'),
      supabase.from('chapters').select('*').order('order_index'),
      supabase.from('materials').select('*').eq('is_active', true),
    ]);
    setClasses(clsRes.data || []);
    setSubjects(subRes.data || []);
    setChapters(chpRes.data || []);
    setMaterials(matRes.data || []);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const toggleClass = (id: string) => {
    setExpandedClasses(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };
  const toggleSubject = (id: string) => {
    setExpandedSubjects(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };
  const toggleChapter = (id: string) => {
    setExpandedChapters(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const deleteMaterial = async (id: string) => {
    if (!confirm('Are you sure you want to delete this material?')) return;
    await supabase.from('materials').update({ is_active: false }).eq('id', id);
    setMaterials(prev => prev.filter(m => m.id !== id));
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{fontFamily:'Poppins,sans-serif'}}>
            {profile?.role === 'student' ? 'My Classes' : 'Classes & Content'}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {classes.length} classes · {subjects.length} subjects · {chapters.length} chapters
          </p>
        </div>
        {canEdit && (
          <button
            onClick={() => setCreateClassModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-blue text-white rounded-xl font-medium text-sm shadow-glow-blue hover:opacity-90 transition-all"
          >
            <Plus className="w-4 h-4" /> Add Class
          </button>
        )}
      </div>

      <div className="space-y-3">
        {classes.map((cls) => {
          const classSubjects = subjects.filter(s => s.class_id === cls.id);
          const isClassOpen = expandedClasses.has(cls.id);

          return (
            <div key={cls.id} className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
              {/* Class Header */}
              <button
                onClick={() => toggleClass(cls.id)}
                className="w-full flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors text-left"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-blue flex items-center justify-center flex-shrink-0">
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-foreground">{cls.name}</h3>
                  <p className="text-sm text-muted-foreground">{cls.description} · {classSubjects.length} subjects</p>
                </div>
                {isClassOpen ? <ChevronDown className="w-5 h-5 text-muted-foreground" /> : <ChevronRight className="w-5 h-5 text-muted-foreground" />}
              </button>

              {/* Subjects */}
              {isClassOpen && (
                <div className="border-t border-border">
                  {classSubjects.length === 0 ? (
                    <p className="text-muted-foreground text-sm p-4 pl-8">No subjects yet.</p>
                  ) : (
                    classSubjects.map((sub) => {
                      const subChapters = chapters.filter(c => c.subject_id === sub.id);
                      const isSubOpen = expandedSubjects.has(sub.id);

                      return (
                        <div key={sub.id} className="border-b border-border last:border-0">
                          <button
                            onClick={() => toggleSubject(sub.id)}
                            className="w-full flex items-center gap-3 p-3 pl-8 hover:bg-muted/30 transition-colors text-left"
                          >
                            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: sub.color }} />
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-foreground text-sm">{sub.name}</p>
                              <p className="text-xs text-muted-foreground">{subChapters.length} chapters</p>
                            </div>
                            {isSubOpen ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                          </button>

                          {/* Chapters */}
                          {isSubOpen && (
                            <div>
                              {subChapters.map((chp) => {
                                const chpMaterials = materials.filter(m => m.chapter_id === chp.id);
                                const isChpOpen = expandedChapters.has(chp.id);

                                return (
                                  <div key={chp.id} className="border-t border-border/50">
                                    <button
                                      onClick={() => toggleChapter(chp.id)}
                                      className="w-full flex items-center gap-3 p-3 pl-14 hover:bg-muted/20 transition-colors text-left"
                                    >
                                      <FolderOpen className="w-4 h-4 text-amber-500 flex-shrink-0" />
                                      <div className="flex-1 min-w-0">
                                        <p className="font-medium text-foreground text-sm">{chp.name}</p>
                                        <p className="text-xs text-muted-foreground">{chpMaterials.length} materials</p>
                                      </div>
                                      {canEdit && (
                                        <button
                                          onClick={(e) => { e.stopPropagation(); setUploadModal({ open: true, chapterId: chp.id }); }}
                                          className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
                                        >
                                          <Upload className="w-3 h-3" /> Upload
                                        </button>
                                      )}
                                      {isChpOpen ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                                    </button>

                                    {/* Materials */}
                                    {isChpOpen && (
                                      <div className="pl-16 pr-4 pb-3 space-y-2">
                                        {chpMaterials.length === 0 ? (
                                          <p className="text-xs text-muted-foreground py-2">No materials uploaded yet.</p>
                                        ) : (
                                          chpMaterials.map((mat) => {
                                            const typeConf = TYPE_CONFIG[mat.type] || TYPE_CONFIG.theory;
                                            return (
                                              <div key={mat.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/30 border border-border/50 hover:border-border transition-all group">
                                                <div className="w-8 h-8 rounded-lg bg-card flex items-center justify-center border border-border">
                                                  <typeConf.icon className="w-4 h-4 text-muted-foreground" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                  <p className="text-sm font-medium truncate">{mat.title}</p>
                                                  <span className={cn("inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border", typeConf.color)}>
                                                    {typeConf.label}
                                                  </span>
                                                </div>
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                  {mat.file_url && (
                                                    <button
                                                      onClick={() => setPdfModal({ open: true, material: mat })}
                                                      className="p-1.5 rounded-lg hover:bg-primary/10 text-primary transition-colors"
                                                    >
                                                      <Eye className="w-3.5 h-3.5" />
                                                    </button>
                                                  )}
                                                  {canEdit && (
                                                    <button
                                                      onClick={() => deleteMaterial(mat.id)}
                                                      className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                                                    >
                                                      <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                  )}
                                                </div>
                                              </div>
                                            );
                                          })
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          );
        })}

        {classes.length === 0 && (
          <div className="text-center py-16 bg-card rounded-2xl border border-border">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="font-semibold text-foreground">No classes yet</p>
            <p className="text-muted-foreground text-sm mt-1">Add your first class to get started</p>
          </div>
        )}
      </div>

      {uploadModal.open && (
        <ContentUploadModal
          chapterId={uploadModal.chapterId!}
          onClose={() => setUploadModal({ open: false })}
          onSuccess={() => { setUploadModal({ open: false }); fetchAll(); }}
        />
      )}
      {pdfModal.open && pdfModal.material && (
        <PDFViewerModal
          material={pdfModal.material}
          onClose={() => setPdfModal({ open: false })}
          canTeach={canEdit}
        />
      )}
      {createClassModal && (
        <CreateClassModal
          onClose={() => setCreateClassModal(false)}
          onSuccess={() => { setCreateClassModal(false); fetchAll(); }}
        />
      )}
    </div>
  );
};

export default ClassesPage;
