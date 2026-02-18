import React, { useState, useEffect } from 'react';
import { PlayCircle, StopCircle, Users, Video, BookOpen, Clock, Wifi, WifiOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import PDFViewerModal from '@/components/PDFViewerModal';

const LiveClassPage = () => {
  const { profile } = useAuth();
  const [activeSession, setActiveSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [showViewer, setShowViewer] = useState(false);
  const [studentCount] = useState(Math.floor(Math.random() * 25) + 3);

  const isTeacher = profile?.role === 'teacher' || profile?.role === 'admin' || profile?.role === 'super_admin';

  useEffect(() => {
    fetchActiveSessions();
    // Realtime subscription
    const channel = supabase
      .channel('live-sessions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'live_sessions' }, () => {
        fetchActiveSessions();
      })
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
    }).select().single();

    if (!error && data) {
      setActiveSession(data);
      setShowViewer(true);
    }
    setStarting(false);
  };

  const endClass = async () => {
    if (!activeSession) return;
    await supabase.from('live_sessions')
      .update({ status: 'ended', ended_at: new Date().toISOString() })
      .eq('id', activeSession.id);
    setActiveSession(null);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{fontFamily:'Poppins,sans-serif'}}>Live Classroom</h1>
        <p className="text-muted-foreground text-sm mt-1">Real-time teaching and learning</p>
      </div>

      {/* Session Status Card */}
      {activeSession ? (
        <div className="bg-card rounded-2xl border border-green-200 shadow-card overflow-hidden">
          <div className="bg-gradient-green p-6 text-white">
            <div className="flex items-center justify-between">
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
            <button
              onClick={() => setShowViewer(true)}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-blue text-white font-semibold hover:opacity-90 transition-all"
            >
              <BookOpen className="w-5 h-5" />
              {isTeacher ? 'Open Smart Board' : 'Join Live Class'}
            </button>
            {isTeacher && (
              <button
                onClick={endClass}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-red-200 text-red-600 font-semibold hover:bg-red-50 transition-all"
              >
                <StopCircle className="w-5 h-5" />
                End Class
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
            <button
              onClick={startClass}
              disabled={starting}
              className="flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-hero text-white font-bold shadow-glow-blue hover:opacity-90 transition-all disabled:opacity-50 mx-auto"
            >
              {starting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <PlayCircle className="w-5 h-5" />
              )}
              {starting ? 'Starting...' : 'Start Live Class'}
            </button>
          )}
        </div>
      )}

      {/* Features Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { icon: Wifi, label: 'Real-time Sync', desc: 'Page changes sync instantly to all students', color: 'bg-gradient-blue' },
          { icon: BookOpen, label: 'Smart Board', desc: 'Draw, annotate and highlight PDFs live', color: 'bg-gradient-purple' },
          { icon: Users, label: 'Multi-Student', desc: 'Up to 100 students can join simultaneously', color: 'bg-gradient-green' },
          { icon: Clock, label: 'Session Recording', desc: 'All sessions logged with timestamps', color: 'bg-gradient-amber' },
          { icon: Video, label: 'Content Sharing', desc: 'Share any uploaded material in real-time', color: 'bg-gradient-red' },
          { icon: WifiOff, label: 'Offline Support', desc: 'Students can catch up on missed sessions', color: 'bg-gradient-blue' },
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

      {showViewer && (
        <PDFViewerModal
          material={{ id: 'demo', title: activeSession?.title || 'Live Lesson', type: 'theory' }}
          onClose={() => setShowViewer(false)}
          canTeach={isTeacher}
          sessionId={activeSession?.id}
        />
      )}
    </div>
  );
};

export default LiveClassPage;
