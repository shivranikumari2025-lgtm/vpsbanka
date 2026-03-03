import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar, Plus, Clock, BookOpen, Users, Video, Trophy, ChevronLeft, ChevronRight, X, Link as LinkIcon, Trash2 } from 'lucide-react';

interface Schedule {
  id: string; title: string; description?: string; scheduled_at: string;
  duration_minutes: number; type: string; meeting_link?: string; color: string; teacher_id: string;
}

const TYPE_CONFIG: Record<string, { label: string; icon: React.ElementType; gradient: string; color: string }> = {
  class: { label: 'Live Class', icon: Video, gradient: 'bg-gradient-blue', color: '#3B82F6' },
  meeting: { label: 'Meeting', icon: Users, gradient: 'bg-gradient-green', color: '#10B981' },
  exam: { label: 'Exam', icon: BookOpen, gradient: 'bg-gradient-red', color: '#EF4444' },
  challenge: { label: 'Team Challenge', icon: Trophy, gradient: 'bg-gradient-amber', color: '#F59E0B' },
};

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const CalendarPage = () => {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', type: 'class', meeting_link: '', date: '', time: '09:00', duration_minutes: 60 });
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');

  // Teachers, admins, and developers can schedule events
  const canSchedule = user?.role === 'teacher' || user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'developer';

  const fetchSchedules = async () => {
    try {
      const { data } = await supabase.from('schedules').select('*').order('scheduled_at', { ascending: true });
      setSchedules((data as Schedule[]) || []);
    } catch (error) {
      console.error('Error fetching schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
    const channel = supabase.channel('schedules-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'schedules' }, () => fetchSchedules())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear(); const month = date.getMonth();
    return { firstDay: new Date(year, month, 1).getDay(), daysInMonth: new Date(year, month + 1, 0).getDate() };
  };

  const { firstDay, daysInMonth } = getDaysInMonth(currentDate);

  const getSchedulesForDay = (day: number) => schedules.filter(s => {
    const d = new Date(s.scheduled_at);
    return d.getFullYear() === currentDate.getFullYear() && d.getMonth() === currentDate.getMonth() && d.getDate() === day;
  });

  const handleAddSchedule = async () => {
    if (!form.title.trim() || !form.date || !form.time) { setAddError('Title, date and time are required'); return; }
    setAdding(true); setAddError('');
    try {
      const scheduled_at = new Date(`${form.date}T${form.time}`).toISOString();
      const cfg = TYPE_CONFIG[form.type];
      const { error } = await supabase.from('schedules').insert({
        title: form.title, description: form.description || null, type: form.type,
        scheduled_at, duration_minutes: form.duration_minutes, meeting_link: form.meeting_link || null,
        color: cfg?.color || '#3B82F6', teacher_id: user?.user_id,
        school_id: (user as any)?.school_id || null,
      } as any);
      if (error) throw error;
      setShowAdd(false);
      setForm({ title: '', description: '', type: 'class', meeting_link: '', date: '', time: '09:00', duration_minutes: 60 });
    } catch (error: any) {
      setAddError(error.message || 'Failed to add event');
    } finally {
      setAdding(false);
    }
  };

  const deleteSchedule = async (id: string) => {
    if (!confirm('Delete this event?')) return;
    await supabase.from('schedules').delete().eq('id', id);
  };

  const upcomingSchedules = schedules.filter(s => new Date(s.scheduled_at) >= new Date()).slice(0, 5);
  const selectedDaySchedules = selectedDate ? schedules.filter(s => {
    const d = new Date(s.scheduled_at);
    return d.getFullYear() === selectedDate.getFullYear() && d.getMonth() === selectedDate.getMonth() && d.getDate() === selectedDate.getDate();
  }) : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Calendar & Schedule</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {user?.role === 'student' ? 'View your class schedule and events' : 'Manage classes, meetings & challenges'}
          </p>
        </div>
        {canSchedule && (
          <button onClick={() => { setShowAdd(true); setAddError(''); }}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-blue text-white rounded-xl font-medium text-sm shadow-glow-blue hover:opacity-90 transition-all">
            <Plus className="w-4 h-4" /> Schedule Event
          </button>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card rounded-2xl border border-border shadow-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-bold text-xl">{MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}</h2>
            <div className="flex gap-2">
              <button onClick={() => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() - 1))} className="p-2 rounded-xl hover:bg-muted transition-colors"><ChevronLeft className="w-4 h-4" /></button>
              <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1.5 rounded-xl text-sm font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors">Today</button>
              <button onClick={() => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + 1))} className="p-2 rounded-xl hover:bg-muted transition-colors"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>

          <div className="grid grid-cols-7 mb-2">
            {DAYS.map(d => <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-2">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
              const daySchedules = getSchedulesForDay(day);
              const today = new Date();
              const isToday = today.getDate() === day && today.getMonth() === currentDate.getMonth() && today.getFullYear() === currentDate.getFullYear();
              const isSelected = selectedDate?.getDate() === day && selectedDate?.getMonth() === currentDate.getMonth();
              const hasEvents = daySchedules.length > 0;
              return (
                <button key={day} onClick={() => setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day))}
                  className={`relative min-h-[60px] p-1.5 rounded-xl text-left transition-all border ${
                    isSelected ? 'border-primary bg-primary/10' :
                    hasEvents ? 'border-primary/30 bg-primary/5' :
                    isToday ? 'border-primary/20 bg-primary/5' :
                    'border-transparent hover:border-border hover:bg-muted/30'
                  }`}>
                  <span className={`text-xs font-semibold w-6 h-6 rounded-full flex items-center justify-center ${isToday ? 'bg-primary text-white' : ''}`}>{day}</span>
                  <div className="space-y-0.5 mt-1">
                    {daySchedules.slice(0, 2).map((s, i) => (
                      <div key={i} className="text-[9px] rounded px-1 text-white truncate" style={{ backgroundColor: s.color }}>{s.title}</div>
                    ))}
                    {daySchedules.length > 2 && <div className="text-[9px] text-muted-foreground">+{daySchedules.length - 2} more</div>}
                  </div>
                </button>
              );
            })}
          </div>

          {selectedDate && selectedDaySchedules.length > 0 && (
            <div className="mt-6 border-t border-border pt-4">
              <h3 className="font-semibold text-sm mb-3">{selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</h3>
              <div className="space-y-2">
                {selectedDaySchedules.map(s => {
                  const cfg = TYPE_CONFIG[s.type] || TYPE_CONFIG.class;
                  return (
                    <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/50">
                      <div className={`w-8 h-8 rounded-lg ${cfg.gradient} flex items-center justify-center flex-shrink-0`}><cfg.icon className="w-4 h-4 text-white" /></div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{s.title}</p>
                        <p className="text-xs text-muted-foreground">{new Date(s.scheduled_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} · {s.duration_minutes} min</p>
                        {s.meeting_link && <a href={s.meeting_link} target="_blank" rel="noopener noreferrer" className="text-xs text-primary flex items-center gap-1 mt-0.5 hover:underline"><LinkIcon className="w-3 h-3" /> Join Link</a>}
                        {s.description && <p className="text-xs text-muted-foreground mt-0.5">{s.description}</p>}
                      </div>
                      {canSchedule && <button onClick={() => deleteSchedule(s.id)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-card rounded-2xl border border-border shadow-card p-5">
            <h2 className="font-bold mb-4 flex items-center gap-2"><Clock className="w-4 h-4 text-primary" /> Upcoming Events</h2>
            {loading ? (
              <div className="flex justify-center py-6"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
            ) : upcomingSchedules.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Calendar className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No upcoming events</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingSchedules.map(s => {
                  const cfg = TYPE_CONFIG[s.type] || TYPE_CONFIG.class;
                  const dt = new Date(s.scheduled_at);
                  return (
                    <div key={s.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-muted/30 transition-colors border border-border/50">
                      <div className={`w-9 h-9 rounded-xl ${cfg.gradient} flex items-center justify-center flex-shrink-0`}><cfg.icon className="w-4 h-4 text-white" /></div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{s.title}</p>
                        <p className="text-xs text-muted-foreground">{dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at {dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
                        {s.meeting_link && <a href={s.meeting_link} target="_blank" rel="noopener noreferrer" className="text-xs text-primary flex items-center gap-1 mt-1 hover:underline"><LinkIcon className="w-3 h-3" /> Join Link</a>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <div className="bg-card rounded-2xl border border-border shadow-card p-5">
            <h2 className="font-bold mb-3 text-sm">Event Types</h2>
            <div className="space-y-2">
              {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
                <div key={key} className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-lg ${cfg.gradient} flex items-center justify-center`}><cfg.icon className="w-3.5 h-3.5 text-white" /></div>
                  <span className="text-sm">{cfg.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-card rounded-2xl shadow-xl border border-border w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-card">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-blue flex items-center justify-center"><Calendar className="w-5 h-5 text-white" /></div>
                <h2 className="text-lg font-bold">Schedule Event</h2>
              </div>
              <button onClick={() => setShowAdd(false)} className="p-2 rounded-xl hover:bg-muted transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              {addError && <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{addError}</div>}
              <div>
                <label className="text-sm font-semibold mb-2 block">Event Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
                    <button key={key} onClick={() => setForm(f => ({ ...f, type: key }))}
                      className={`flex items-center gap-2 p-3 rounded-xl border text-sm transition-all ${form.type === key ? 'border-primary bg-primary/10 text-primary font-semibold' : 'border-border hover:border-primary/50'}`}>
                      <div className={`w-6 h-6 rounded-lg ${cfg.gradient} flex items-center justify-center`}><cfg.icon className="w-3.5 h-3.5 text-white" /></div>
                      {cfg.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold mb-1.5 block">Title *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Math Live Class"
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm" />
              </div>
              <div>
                <label className="text-sm font-semibold mb-1.5 block">Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Brief description..." rows={2}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-semibold mb-1.5 block">Date *</label>
                  <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm" />
                </div>
                <div>
                  <label className="text-sm font-semibold mb-1.5 block">Time *</label>
                  <input type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm" />
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold mb-1.5 block">Duration (minutes)</label>
                <select value={form.duration_minutes} onChange={e => setForm(f => ({ ...f, duration_minutes: parseInt(e.target.value) }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm">
                  {[30, 45, 60, 90, 120].map(d => <option key={d} value={d}>{d} minutes</option>)}
                </select>
              </div>
              {(form.type === 'class' || form.type === 'meeting') && (
                <div>
                  <label className="text-sm font-semibold mb-1.5 block">Meeting Link (optional)</label>
                  <input value={form.meeting_link} onChange={e => setForm(f => ({ ...f, meeting_link: e.target.value }))} placeholder="https://meet.google.com/..."
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm" />
                </div>
              )}
            </div>
            <div className="flex gap-3 p-6 border-t border-border">
              <button onClick={() => setShowAdd(false)} className="flex-1 py-2.5 rounded-xl border border-border font-medium text-sm hover:bg-muted transition-colors">Cancel</button>
              <button onClick={handleAddSchedule} disabled={adding}
                className="flex-1 py-2.5 rounded-xl bg-gradient-blue text-white font-medium text-sm hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {adding ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Plus className="w-4 h-4" />}
                {adding ? 'Scheduling...' : 'Schedule'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarPage;
