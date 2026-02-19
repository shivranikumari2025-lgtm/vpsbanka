import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  Plus, ChevronDown, ChevronRight, BookOpen, FileText,
  Trash2, Edit, Eye, Upload, FolderOpen, Video, ClipboardList,
  FileQuestion, BookMarked, GraduationCap, X, Check
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

const SUBJECT_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

// Inline edit modal for subjects
const AddSubjectModal: React.FC<{ classId: string; onClose: () => void; onSuccess: () => void }> = ({ classId, onClose, onSuccess }) => {
  const { profile } = useAuth();
  const [name, setName] = useState('');
  const [color, setColor] = useState(SUBJECT_COLORS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    if (!name.trim()) { setError('Subject name required'); return; }
    setLoading(true);
    const { error: err } = await supabase.from('subjects').insert({
      class_id: classId, name: name.trim(), color,
      teacher_id: profile?.user_id || null,
    });
    if (err) { setError(err.message); setLoading(false); return; }
    onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-card rounded-2xl shadow-xl border border-border w-full max-w-sm">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h3 className="font-bold">Add Subject</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          {error && <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}
          <div>
            <label className="text-sm font-semibold mb-1.5 block">Subject Name *</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Mathematics"
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm" />
          </div>
          <div>
            <label className="text-sm font-semibold mb-1.5 block">Color</label>
            <div className="flex gap-2 flex-wrap">
              {SUBJECT_COLORS.map(c => (
                <button key={c} onClick={() => setColor(c)}
                  className={cn('w-7 h-7 rounded-full border-2 transition-transform hover:scale-110', color === c ? 'border-foreground' : 'border-transparent')}
                  style={{ background: c }} />
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-3 p-5 border-t border-border">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border font-medium text-sm hover:bg-muted transition-colors">Cancel</button>
          <button onClick={handleCreate} disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-gradient-blue text-white font-medium text-sm hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
            {loading ? 'Adding...' : 'Add Subject'}
          </button>
        </div>
      </div>
    </div>
  );
};

const AddChapterModal: React.FC<{ subjectId: string; onClose: () => void; onSuccess: () => void }> = ({ subjectId, onClose, onSuccess }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    if (!name.trim()) { setError('Chapter name required'); return; }
    setLoading(true);
    const { error: err } = await supabase.from('chapters').insert({
      subject_id: subjectId, name: name.trim(), description: description.trim() || null,
    });
    if (err) { setError(err.message); setLoading(false); return; }
    onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-card rounded-2xl shadow-xl border border-border w-full max-w-sm">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h3 className="font-bold">Add Chapter</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          {error && <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}
          <div>
            <label className="text-sm font-semibold mb-1.5 block">Chapter Name *</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Chapter 1: Real Numbers"
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm" />
          </div>
          <div>
            <label className="text-sm font-semibold mb-1.5 block">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief description..." rows={2}
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm resize-none" />
          </div>
        </div>
        <div className="flex gap-3 p-5 border-t border-border">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border font-medium text-sm hover:bg-muted transition-colors">Cancel</button>
          <button onClick={handleCreate} disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-gradient-green text-white font-medium text-sm hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
            {loading ? 'Adding...' : 'Add Chapter'}
          </button>
        </div>
      </div>
    </div>
  );
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
  const [addSubjectModal, setAddSubjectModal] = useState<{ open: boolean; classId?: string }>({ open: false });
  const [addChapterModal, setAddChapterModal] = useState<{ open: boolean; subjectId?: string }>({ open: false });

  const canEdit = profile?.role === 'admin' || profile?.role === 'super_admin' || profile?.role === 'teacher';

  const fetchAll = async () => {
    const [clsRes, subRes, chpRes, matRes] = await Promise.all([
      supabase.from('classes').select('*').eq('is_active', true).order('grade_level'),
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

  useEffect(() => {
    fetchAll();
    // Realtime subscriptions for all tables
    const channel = supabase
      .channel('classes-page-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'classes' }, fetchAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subjects' }, fetchAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chapters' }, fetchAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'materials' }, fetchAll)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const toggle = (set: Set<string>, id: string) => {
    const n = new Set(set);
    n.has(id) ? n.delete(id) : n.add(id);
    return n;
  };

  const deleteMaterial = async (id: string) => {
    if (!confirm('Delete this material?')) return;
    await supabase.from('materials').update({ is_active: false }).eq('id', id);
  };

  const deleteClass = async (id: string) => {
    if (!confirm('Archive this class?')) return;
    await supabase.from('classes').update({ is_active: false }).eq('id', id);
  };

  const deleteSubject = async (id: string) => {
    if (!confirm('Delete this subject?')) return;
    await supabase.from('subjects').delete().eq('id', id);
  };

  const deleteChapter = async (id: string) => {
    if (!confirm('Delete this chapter?')) return;
    await supabase.from('chapters').delete().eq('id', id);
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
          <h1 className="text-2xl font-bold">{profile?.role === 'student' ? 'My Classes' : 'Classes & Content'}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {classes.length} classes · {subjects.length} subjects · {chapters.length} chapters
          </p>
        </div>
        {canEdit && (
          <button onClick={() => setCreateClassModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-blue text-white rounded-xl font-medium text-sm shadow-glow-blue hover:opacity-90 transition-all">
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
              <div className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors">
                <button onClick={() => setExpandedClasses(toggle(expandedClasses, cls.id))} className="flex items-center gap-4 flex-1 text-left min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-gradient-blue flex items-center justify-center flex-shrink-0">
                    <GraduationCap className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold">{cls.name}</h3>
                    <p className="text-sm text-muted-foreground">{cls.description || 'No description'} · {classSubjects.length} subjects</p>
                  </div>
                  {isClassOpen ? <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" /> : <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />}
                </button>
                {canEdit && (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => setAddSubjectModal({ open: true, classId: cls.id })}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-emerald-600 hover:bg-emerald-50 transition-colors">
                      <Plus className="w-3 h-3" /> Subject
                    </button>
                    <button onClick={() => deleteClass(cls.id)}
                      className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Subjects */}
              {isClassOpen && (
                <div className="border-t border-border">
                  {classSubjects.length === 0 ? (
                    <div className="p-4 pl-8 text-muted-foreground text-sm flex items-center gap-3">
                      <span>No subjects yet.</span>
                      {canEdit && (
                        <button onClick={() => setAddSubjectModal({ open: true, classId: cls.id })}
                          className="text-primary hover:underline font-medium flex items-center gap-1">
                          <Plus className="w-3.5 h-3.5" /> Add one
                        </button>
                      )}
                    </div>
                  ) : (
                    classSubjects.map((sub) => {
                      const subChapters = chapters.filter(c => c.subject_id === sub.id);
                      const isSubOpen = expandedSubjects.has(sub.id);

                      return (
                        <div key={sub.id} className="border-b border-border last:border-0">
                          <div className="flex items-center gap-3 p-3 pl-8 hover:bg-muted/20 transition-colors">
                            <button onClick={() => setExpandedSubjects(toggle(expandedSubjects, sub.id))} className="flex items-center gap-3 flex-1 text-left min-w-0">
                              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: sub.color }} />
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm">{sub.name}</p>
                                <p className="text-xs text-muted-foreground">{subChapters.length} chapters</p>
                              </div>
                              {isSubOpen ? <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" /> : <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
                            </button>
                            {canEdit && (
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <button onClick={() => setAddChapterModal({ open: true, subjectId: sub.id })}
                                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-blue-600 hover:bg-blue-50 transition-colors">
                                  <Plus className="w-3 h-3" /> Chapter
                                </button>
                                <button onClick={() => deleteSubject(sub.id)}
                                  className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition-colors">
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Chapters */}
                          {isSubOpen && (
                            <div>
                              {subChapters.length === 0 ? (
                                <div className="pl-14 p-3 text-xs text-muted-foreground flex items-center gap-2">
                                  <span>No chapters yet.</span>
                                  {canEdit && (
                                    <button onClick={() => setAddChapterModal({ open: true, subjectId: sub.id })}
                                      className="text-primary hover:underline flex items-center gap-1">
                                      <Plus className="w-3 h-3" /> Add chapter
                                    </button>
                                  )}
                                </div>
                              ) : (
                                subChapters.map((chp) => {
                                  const chpMaterials = materials.filter(m => m.chapter_id === chp.id);
                                  const isChpOpen = expandedChapters.has(chp.id);

                                  return (
                                    <div key={chp.id} className="border-t border-border/50">
                                      <div className="flex items-center gap-3 p-3 pl-14 hover:bg-muted/20 transition-colors">
                                        <button onClick={() => setExpandedChapters(toggle(expandedChapters, chp.id))} className="flex items-center gap-3 flex-1 text-left min-w-0">
                                          <FolderOpen className="w-4 h-4 text-amber-500 flex-shrink-0" />
                                          <div className="flex-1 min-w-0">
                                            <p className="font-medium text-sm">{chp.name}</p>
                                            <p className="text-xs text-muted-foreground">{chpMaterials.length} materials</p>
                                          </div>
                                          {isChpOpen ? <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" /> : <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
                                        </button>
                                        {canEdit && (
                                          <div className="flex items-center gap-1 flex-shrink-0">
                                            <button onClick={() => setUploadModal({ open: true, chapterId: chp.id })}
                                              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-primary hover:bg-primary/10 transition-colors">
                                              <Upload className="w-3 h-3" /> Upload
                                            </button>
                                            <button onClick={() => deleteChapter(chp.id)}
                                              className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition-colors">
                                              <Trash2 className="w-3 h-3" />
                                            </button>
                                          </div>
                                        )}
                                      </div>

                                      {/* Materials */}
                                      {isChpOpen && (
                                        <div className="pl-16 pr-4 pb-3 space-y-2">
                                          {chpMaterials.length === 0 ? (
                                            <div className="py-2 flex items-center gap-2">
                                              <p className="text-xs text-muted-foreground">No materials yet.</p>
                                              {canEdit && (
                                                <button onClick={() => setUploadModal({ open: true, chapterId: chp.id })}
                                                  className="text-xs text-primary hover:underline flex items-center gap-1">
                                                  <Upload className="w-3 h-3" /> Upload now
                                                </button>
                                              )}
                                            </div>
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
                                                      <button onClick={() => setPdfModal({ open: true, material: mat })}
                                                        className="p-1.5 rounded-lg hover:bg-primary/10 text-primary transition-colors">
                                                        <Eye className="w-3.5 h-3.5" />
                                                      </button>
                                                    )}
                                                    {canEdit && (
                                                      <button onClick={() => deleteMaterial(mat.id)}
                                                        className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors">
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
                                })
                              )}
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
            <p className="font-semibold">No classes yet</p>
            <p className="text-muted-foreground text-sm mt-1">
              {canEdit ? 'Click "Add Class" to create your first class' : 'Your teacher will add classes soon'}
            </p>
          </div>
        )}
      </div>

      {/* Modals */}
      {uploadModal.open && (
        <ContentUploadModal
          chapterId={uploadModal.chapterId!}
          onClose={() => setUploadModal({ open: false })}
          onSuccess={() => setUploadModal({ open: false })}
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
          onSuccess={() => setCreateClassModal(false)}
        />
      )}
      {addSubjectModal.open && (
        <AddSubjectModal
          classId={addSubjectModal.classId!}
          onClose={() => setAddSubjectModal({ open: false })}
          onSuccess={() => setAddSubjectModal({ open: false })}
        />
      )}
      {addChapterModal.open && (
        <AddChapterModal
          subjectId={addChapterModal.subjectId!}
          onClose={() => setAddChapterModal({ open: false })}
          onSuccess={() => setAddChapterModal({ open: false })}
        />
      )}
    </div>
  );
};

export default ClassesPage;
