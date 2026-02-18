import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { BarChart3, BookOpen, Users, FileText, TrendingUp, PlayCircle, ClipboardList, Star, Clock, ChevronRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Link } from 'react-router-dom';

interface Stats {
  classes: number;
  subjects: number;
  chapters: number;
  materials: number;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

const activityData = [
  { day: 'Mon', uploads: 4, views: 24 },
  { day: 'Tue', uploads: 7, views: 38 },
  { day: 'Wed', uploads: 3, views: 19 },
  { day: 'Thu', uploads: 9, views: 52 },
  { day: 'Fri', uploads: 6, views: 41 },
  { day: 'Sat', uploads: 2, views: 15 },
  { day: 'Sun', uploads: 1, views: 8 },
];

const subjectData = [
  { name: 'Math', value: 30 },
  { name: 'Science', value: 25 },
  { name: 'English', value: 20 },
  { name: 'Social', value: 15 },
  { name: 'Other', value: 10 },
];

const AdminDashboard: React.FC<{ stats: Stats }> = ({ stats }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[
        { label: 'Total Classes', value: stats.classes, icon: BookOpen, gradient: 'bg-gradient-blue', change: '+2 this month' },
        { label: 'Subjects', value: stats.subjects, icon: FileText, gradient: 'bg-gradient-green', change: '+5 this month' },
        { label: 'Chapters', value: stats.chapters, icon: BarChart3, gradient: 'bg-gradient-amber', change: '+12 this week' },
        { label: 'Materials', value: stats.materials, icon: TrendingUp, gradient: 'bg-gradient-purple', change: '+8 today' },
      ].map((s) => (
        <div key={s.label} className="stat-card">
          <div className={`w-12 h-12 rounded-xl ${s.gradient} flex items-center justify-center mb-4`}>
            <s.icon className="w-6 h-6 text-white" />
          </div>
          <p className="text-2xl font-bold text-foreground">{s.value}</p>
          <p className="text-sm text-muted-foreground mt-0.5">{s.label}</p>
          <p className="text-xs text-green-600 mt-2 font-medium">{s.change}</p>
        </div>
      ))}
    </div>

    <div className="grid lg:grid-cols-2 gap-6">
      <div className="stat-card">
        <h3 className="font-semibold text-foreground mb-4">Weekly Activity</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={activityData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="day" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
            <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
            <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px' }} />
            <Bar dataKey="uploads" fill="hsl(var(--primary))" radius={[4,4,0,0]} />
            <Bar dataKey="views" fill="hsl(var(--accent))" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="stat-card">
        <h3 className="font-semibold text-foreground mb-4">Content by Subject</h3>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie data={subjectData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
              {subjectData.map((_, idx) => (
                <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px' }} />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex flex-wrap gap-2 mt-2">
          {subjectData.map((s, idx) => (
            <div key={s.name} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[idx] }} />
              <span className="text-xs text-muted-foreground">{s.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const TeacherDashboard: React.FC<{ stats: Stats; profile: any }> = ({ stats, profile }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[
        { label: 'My Subjects', value: stats.subjects, icon: BookOpen, gradient: 'bg-gradient-blue' },
        { label: 'Chapters', value: stats.chapters, icon: FileText, gradient: 'bg-gradient-green' },
        { label: 'Materials', value: stats.materials, icon: BarChart3, gradient: 'bg-gradient-amber' },
        { label: 'Exams Created', value: 5, icon: ClipboardList, gradient: 'bg-gradient-purple' },
      ].map((s) => (
        <div key={s.label} className="stat-card">
          <div className={`w-12 h-12 rounded-xl ${s.gradient} flex items-center justify-center mb-4`}>
            <s.icon className="w-6 h-6 text-white" />
          </div>
          <p className="text-2xl font-bold">{s.value}</p>
          <p className="text-sm text-muted-foreground mt-0.5">{s.label}</p>
        </div>
      ))}
    </div>

    <div className="grid lg:grid-cols-3 gap-4">
      <Link to="/live-class" className="stat-card bg-gradient-hero text-white cursor-pointer hover:opacity-90 lg:col-span-1 flex flex-col items-center justify-center py-8 gap-3">
        <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
          <PlayCircle className="w-8 h-8" />
        </div>
        <p className="text-xl font-bold">Start Live Class</p>
        <p className="text-white/70 text-sm text-center">Open smart board & teach students live</p>
      </Link>

      <div className="stat-card lg:col-span-2">
        <h3 className="font-semibold mb-4">Upload Activity</h3>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={activityData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="day" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px' }} />
            <Line type="monotone" dataKey="uploads" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: 'hsl(var(--primary))' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  </div>
);

const StudentDashboard: React.FC<{ stats: Stats }> = ({ stats }) => {
  const progressData = [
    { subject: 'Math', progress: 72, color: '#3B82F6' },
    { subject: 'Science', progress: 58, color: '#10B981' },
    { subject: 'English', progress: 85, color: '#F59E0B' },
    { subject: 'Social', progress: 45, color: '#8B5CF6' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'My Subjects', value: stats.subjects, icon: BookOpen, gradient: 'bg-gradient-blue' },
          { label: 'Chapters', value: stats.chapters, icon: FileText, gradient: 'bg-gradient-green' },
          { label: 'Exams Taken', value: 3, icon: ClipboardList, gradient: 'bg-gradient-amber' },
          { label: 'Avg. Score', value: '78%', icon: Star, gradient: 'bg-gradient-purple' },
        ].map((s) => (
          <div key={s.label} className="stat-card">
            <div className={`w-12 h-12 rounded-xl ${s.gradient} flex items-center justify-center mb-4`}>
              <s.icon className="w-6 h-6 text-white" />
            </div>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-sm text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="stat-card">
          <h3 className="font-semibold mb-4">My Progress by Subject</h3>
          <div className="space-y-4">
            {progressData.map((p) => (
              <div key={p.subject}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="font-medium">{p.subject}</span>
                  <span className="text-muted-foreground">{p.progress}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${p.progress}%`, background: p.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="stat-card">
          <h3 className="font-semibold mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {[
              { icon: '📄', text: 'Viewed Chapter 2 - Polynomials', time: '2h ago' },
              { icon: '📝', text: 'Completed Exam Practice', time: '5h ago' },
              { icon: '🎥', text: 'Watched video lecture', time: 'Yesterday' },
              { icon: '📚', text: 'Downloaded notes for Chapter 1', time: '2 days ago' },
            ].map((a, i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted transition-colors">
                <span className="text-lg">{a.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{a.text}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {a.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="stat-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Live Class Status</h3>
          <Link to="/live-class" className="text-primary text-sm font-medium flex items-center gap-1 hover:underline">
            Join Now <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="flex items-center gap-4 p-4 rounded-xl bg-green-50 border border-green-200">
          <div className="pulse-dot" />
          <div>
            <p className="font-semibold text-green-800">Mathematics - Chapter 2</p>
            <p className="text-green-600 text-sm">Teacher John is teaching now • 24 students attending</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const { profile } = useAuth();
  const [stats, setStats] = useState<Stats>({ classes: 0, subjects: 0, chapters: 0, materials: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const [cls, sub, chp, mat] = await Promise.all([
        supabase.from('classes').select('*', { count: 'exact', head: true }),
        supabase.from('subjects').select('*', { count: 'exact', head: true }),
        supabase.from('chapters').select('*', { count: 'exact', head: true }),
        supabase.from('materials').select('*', { count: 'exact', head: true }),
      ]);
      setStats({
        classes: cls.count ?? 0,
        subjects: sub.count ?? 0,
        chapters: chp.count ?? 0,
        materials: mat.count ?? 0,
      });
      setLoading(false);
    };
    fetchStats();
  }, []);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-hero rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-full opacity-10">
          <div className="w-64 h-64 rounded-full border-4 border-white absolute -top-8 -right-8" />
          <div className="w-40 h-40 rounded-full border-4 border-white absolute top-8 right-16" />
        </div>
        <div className="relative z-10">
          <p className="text-blue-200 text-sm font-medium mb-1">{greeting()},</p>
          <h1 className="text-2xl font-bold" style={{fontFamily:'Poppins,sans-serif'}}>{profile?.full_name} 👋</h1>
          <p className="text-blue-200 mt-1 text-sm">
            Welcome to EduCloud LMS — {profile?.role === 'student' ? 'Continue learning today!' : 'Manage your classroom efficiently.'}
          </p>
        </div>
      </div>

      {/* Role-based Dashboard */}
      {(profile?.role === 'super_admin' || profile?.role === 'admin') && <AdminDashboard stats={stats} />}
      {profile?.role === 'teacher' && <TeacherDashboard stats={stats} profile={profile} />}
      {profile?.role === 'student' && <StudentDashboard stats={stats} />}
    </div>
  );
};

export default Dashboard;
