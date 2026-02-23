import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api';
import { BarChart3, BookOpen, Users, FileText, TrendingUp, PlayCircle, ClipboardList, Star, Clock, ChevronRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Link } from 'react-router-dom';

interface Stats {
  classes: number;
  subjects: number;
  chapters: number;
  materials: number;
  teachers: number;
  students: number;
  exams: number;
  liveSessions: number;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

const AdminDashboard: React.FC<{ stats: Stats; subjectData: any[]; recentMaterials: any[] }> = ({ stats, subjectData, recentMaterials }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[
        { label: 'Total Classes', value: stats.classes, icon: BookOpen, gradient: 'bg-gradient-blue' },
        { label: 'Subjects', value: stats.subjects, icon: FileText, gradient: 'bg-gradient-green' },
        { label: 'Teachers', value: stats.teachers, icon: Users, gradient: 'bg-gradient-purple' },
        { label: 'Students', value: stats.students, icon: Users, gradient: 'bg-gradient-amber' },
      ].map((s) => (
        <div key={s.label} className="stat-card">
          <div className={`w-12 h-12 rounded-xl ${s.gradient} flex items-center justify-center mb-4`}>
            <s.icon className="w-6 h-6 text-white" />
          </div>
          <p className="text-2xl font-bold text-foreground">{s.value}</p>
          <p className="text-sm text-muted-foreground mt-0.5">{s.label}</p>
        </div>
      ))}
    </div>

    <div className="grid lg:grid-cols-2 gap-6">
      <div className="stat-card">
        <h3 className="font-semibold text-foreground mb-4">Content by Subject</h3>
        {subjectData.length > 0 ? (
          <>
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
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[idx % COLORS.length] }} />
                  <span className="text-xs text-muted-foreground">{s.name}: {s.value}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="text-muted-foreground text-sm text-center py-8">No subjects yet</p>
        )}
      </div>

      <div className="stat-card">
        <h3 className="font-semibold text-foreground mb-4">Recent Uploads</h3>
        {recentMaterials.length > 0 ? (
          <div className="space-y-3">
            {recentMaterials.map((m, i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted transition-colors">
                <div className="w-8 h-8 rounded-lg bg-gradient-blue flex items-center justify-center">
                  <FileText className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{m.title}</p>
                  <p className="text-xs text-muted-foreground capitalize">{m.type?.replace('_', ' ')}</p>
                </div>
                <p className="text-xs text-muted-foreground">{new Date(m.created_at).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm text-center py-8">No materials uploaded yet</p>
        )}
      </div>
    </div>
  </div>
);

const TeacherDashboard: React.FC<{ stats: Stats }> = ({ stats }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[
        { label: 'My Subjects', value: stats.subjects, icon: BookOpen, gradient: 'bg-gradient-blue' },
        { label: 'Chapters', value: stats.chapters, icon: FileText, gradient: 'bg-gradient-green' },
        { label: 'Materials', value: stats.materials, icon: BarChart3, gradient: 'bg-gradient-amber' },
        { label: 'Exams Created', value: stats.exams, icon: ClipboardList, gradient: 'bg-gradient-purple' },
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
        <h3 className="font-semibold mb-4">Quick Stats</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-muted/30">
            <p className="text-2xl font-bold">{stats.students}</p>
            <p className="text-xs text-muted-foreground">Total Students</p>
          </div>
          <div className="p-4 rounded-xl bg-muted/30">
            <p className="text-2xl font-bold">{stats.liveSessions}</p>
            <p className="text-xs text-muted-foreground">Live Sessions</p>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const StudentDashboard: React.FC<{ stats: Stats; activeSession: any }> = ({ stats, activeSession }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[
        { label: 'My Subjects', value: stats.subjects, icon: BookOpen, gradient: 'bg-gradient-blue' },
        { label: 'Chapters', value: stats.chapters, icon: FileText, gradient: 'bg-gradient-green' },
        { label: 'Materials', value: stats.materials, icon: BarChart3, gradient: 'bg-gradient-amber' },
        { label: 'Exams Available', value: stats.exams, icon: ClipboardList, gradient: 'bg-gradient-purple' },
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

    <div className="stat-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Live Class Status</h3>
        <Link to="/live-class" className="text-primary text-sm font-medium flex items-center gap-1 hover:underline">
          Go to Class <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
      {activeSession ? (
        <div className="flex items-center gap-4 p-4 rounded-xl bg-green-50 border border-green-200">
          <div className="pulse-dot" />
          <div>
            <p className="font-semibold text-green-800">{activeSession.title}</p>
            <p className="text-green-600 text-sm">Live class in progress — join now!</p>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/30 border border-border">
          <div className="w-3 h-3 rounded-full bg-muted-foreground/30" />
          <p className="text-muted-foreground text-sm">No live class active right now</p>
        </div>
      )}
    </div>
  </div>
);

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({ classes: 0, subjects: 0, chapters: 0, materials: 0, teachers: 0, students: 0, exams: 0, liveSessions: 0 });
  const [loading, setLoading] = useState(true);
  const [subjectData, setSubjectData] = useState<any[]>([]);
  const [recentMaterials, setRecentMaterials] = useState<any[]>([]);
  const [activeSession, setActiveSession] = useState<any>(null);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [cls, teach, stud, exams] = await Promise.all([
          apiClient.getClasses(),
          apiClient.getUsersByRole('teacher'),
          apiClient.getUsersByRole('student'),
          apiClient.getExams(),
        ]);

        // Handle different response formats
        const classesArray = Array.isArray(cls) ? cls : cls.classes || [];
        const teachersArray = Array.isArray(teach) ? teach : teach.users || [];
        const studentsArray = Array.isArray(stud) ? stud : stud.users || [];
        const examsArray = Array.isArray(exams) ? exams : exams.exams || [];

        setStats({
          classes: classesArray.length,
          subjects: 0,
          chapters: 0,
          materials: 0,
          teachers: teachersArray.length,
          students: studentsArray.length,
          exams: examsArray.length,
          liveSessions: 0,
        });

        setSubjectData([]);
        setRecentMaterials([]);
        setActiveSession(null);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        // Set default stats if fetching fails
        setStats({
          classes: 0,
          subjects: 0,
          chapters: 0,
          materials: 0,
          teachers: 0,
          students: 0,
          exams: 0,
          liveSessions: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
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
          <h1 className="text-2xl font-bold" style={{fontFamily:'Poppins,sans-serif'}}>{user?.full_name} 👋</h1>
          <p className="text-blue-200 mt-1 text-sm">
            Welcome to EduCloud LMS — {user?.role === 'student' ? 'Continue learning today!' : 'Manage your classroom efficiently.'}
          </p>
        </div>
      </div>

      {/* Role-based Dashboard */}
      {(user?.role === 'super_admin' || user?.role === 'admin') && <AdminDashboard stats={stats} subjectData={subjectData} recentMaterials={recentMaterials} />}
      {user?.role === 'teacher' && <TeacherDashboard stats={stats} />}
      {user?.role === 'student' && <StudentDashboard stats={stats} activeSession={activeSession} />}
    </div>
  );
};

export default Dashboard;
