import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { BarChart3, TrendingUp, BookOpen, Users, FileText, Trophy } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, Legend
} from 'recharts';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

const weeklyData = [
  { day: 'Mon', uploads: 4, students: 24, sessions: 2 },
  { day: 'Tue', uploads: 7, students: 38, sessions: 3 },
  { day: 'Wed', uploads: 3, students: 19, sessions: 1 },
  { day: 'Thu', uploads: 9, students: 52, sessions: 4 },
  { day: 'Fri', uploads: 6, students: 41, sessions: 3 },
  { day: 'Sat', uploads: 2, students: 15, sessions: 1 },
  { day: 'Sun', uploads: 1, students: 8, sessions: 0 },
];

const monthlyData = [
  { month: 'Sep', enrolled: 120, active: 98 },
  { month: 'Oct', enrolled: 145, active: 112 },
  { month: 'Nov', enrolled: 160, active: 130 },
  { month: 'Dec', enrolled: 155, active: 120 },
  { month: 'Jan', enrolled: 180, active: 155 },
  { month: 'Feb', enrolled: 195, active: 170 },
];

const AnalyticsPage = () => {
  const { profile } = useAuth();
  const [stats, setStats] = useState({ classes: 0, subjects: 0, chapters: 0, materials: 0, teachers: 0, students: 0 });
  const [subjectData, setSubjectData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [cls, sub, chp, mat, teach, stud] = await Promise.all([
        supabase.from('classes').select('*', { count: 'exact', head: true }),
        supabase.from('subjects').select('name'),
        supabase.from('chapters').select('*', { count: 'exact', head: true }),
        supabase.from('materials').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'teacher'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
      ]);
      setStats({
        classes: cls.count ?? 0,
        subjects: sub.data?.length ?? 0,
        chapters: chp.count ?? 0,
        materials: mat.count ?? 0,
        teachers: teach.count ?? 0,
        students: stud.count ?? 0,
      });
      // Create subject distribution data
      const subjectPie = (sub.data || []).slice(0, 6).map((s, i) => ({
        name: s.name,
        value: Math.floor(Math.random() * 30) + 10,
      }));
      setSubjectData(subjectPie.length > 0 ? subjectPie : [
        { name: 'Mathematics', value: 30 },
        { name: 'Science', value: 25 },
        { name: 'English', value: 20 },
        { name: 'Social Studies', value: 15 },
        { name: 'Arts', value: 10 },
      ]);
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Platform performance & insights</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { label: 'Total Students', value: stats.students, icon: Users, gradient: 'bg-gradient-amber', change: '+12%' },
          { label: 'Total Teachers', value: stats.teachers, icon: BookOpen, gradient: 'bg-gradient-green', change: '+5%' },
          { label: 'Active Classes', value: stats.classes, icon: BarChart3, gradient: 'bg-gradient-blue', change: '+8%' },
          { label: 'Total Subjects', value: stats.subjects, icon: FileText, gradient: 'bg-gradient-purple', change: '+15%' },
          { label: 'Chapters', value: stats.chapters, icon: TrendingUp, gradient: 'bg-gradient-red', change: '+20%' },
          { label: 'Materials', value: stats.materials, icon: Trophy, gradient: 'bg-gradient-amber', change: '+33%' },
        ].map((s) => (
          <div key={s.label} className="stat-card">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-10 h-10 rounded-xl ${s.gradient} flex items-center justify-center`}>
                <s.icon className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">{s.change}</span>
            </div>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-sm text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="stat-card">
          <h3 className="font-semibold mb-4">Weekly Activity</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px' }} />
              <Legend />
              <Bar dataKey="uploads" name="Uploads" fill="hsl(var(--primary))" radius={[4,4,0,0]} />
              <Bar dataKey="sessions" name="Live Sessions" fill="hsl(var(--accent))" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="stat-card">
          <h3 className="font-semibold mb-4">Content by Subject</h3>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width={180} height={180}>
              <PieChart>
                <Pie data={subjectData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                  {subjectData.map((_, idx) => (
                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 flex-1">
              {subjectData.map((s, idx) => (
                <div key={s.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ background: COLORS[idx % COLORS.length] }} />
                    <span className="text-xs text-muted-foreground truncate max-w-[100px]">{s.name}</span>
                  </div>
                  <span className="text-xs font-semibold">{s.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="stat-card">
          <h3 className="font-semibold mb-4">Student Enrollment Trend</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="colorEnrolled" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px' }} />
              <Legend />
              <Area type="monotone" dataKey="enrolled" name="Enrolled" stroke="hsl(var(--primary))" fill="url(#colorEnrolled)" strokeWidth={2} />
              <Area type="monotone" dataKey="active" name="Active" stroke="hsl(var(--accent))" fill="url(#colorActive)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="stat-card">
          <h3 className="font-semibold mb-4">Daily Active Students</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px' }} />
              <Line type="monotone" dataKey="students" name="Students" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ fill: 'hsl(var(--primary))', r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Performing Summary */}
      <div className="bg-card rounded-2xl border border-border shadow-card p-6">
        <h3 className="font-semibold mb-4">Performance Summary</h3>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { label: 'Avg. Exam Score', value: '76%', desc: 'Across all classes', color: 'text-green-600', bg: 'bg-green-50' },
            { label: 'Content Completion', value: '68%', desc: 'Materials viewed', color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Live Class Attendance', value: '84%', desc: 'Average attendance rate', color: 'text-purple-600', bg: 'bg-purple-50' },
          ].map((item) => (
            <div key={item.label} className={`${item.bg} rounded-xl p-4`}>
              <p className={`text-3xl font-bold ${item.color}`}>{item.value}</p>
              <p className="font-semibold text-sm mt-1">{item.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
