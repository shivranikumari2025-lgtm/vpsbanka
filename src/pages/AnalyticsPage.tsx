import React, { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import { BarChart3, TrendingUp, BookOpen, Users, FileText, Trophy } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

const AnalyticsPage = () => {
  const [stats, setStats] = useState({ classes: 0, subjects: 0, chapters: 0, materials: 0, teachers: 0, students: 0 });
  const [subjectData, setSubjectData] = useState<any[]>([]);
  const [materialTypeData, setMaterialTypeData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [clsRes, teachRes, studRes] = await Promise.all([
          apiClient.getClasses(),
          apiClient.getUsersByRole('teacher'),
          apiClient.getUsersByRole('student'),
        ]);

        setStats({
          classes: clsRes.classes?.length ?? 0,
          subjects: 0,
          chapters: 0,
          materials: 0,
          teachers: teachRes.users?.length ?? 0,
          students: studRes.users?.length ?? 0,
        });

        setSubjectData([]);
        setMaterialTypeData([]);
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
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
          { label: 'Total Students', value: stats.students, icon: Users, gradient: 'bg-gradient-amber' },
          { label: 'Total Teachers', value: stats.teachers, icon: BookOpen, gradient: 'bg-gradient-green' },
          { label: 'Active Classes', value: stats.classes, icon: BarChart3, gradient: 'bg-gradient-blue' },
          { label: 'Total Subjects', value: stats.subjects, icon: FileText, gradient: 'bg-gradient-purple' },
          { label: 'Chapters', value: stats.chapters, icon: TrendingUp, gradient: 'bg-gradient-red' },
          { label: 'Materials', value: stats.materials, icon: Trophy, gradient: 'bg-gradient-amber' },
        ].map((s) => (
          <div key={s.label} className="stat-card">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-10 h-10 rounded-xl ${s.gradient} flex items-center justify-center`}>
                <s.icon className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-sm text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="stat-card">
          <h3 className="font-semibold mb-4">Chapters per Subject</h3>
          {subjectData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={subjectData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px' }} />
                <Bar dataKey="value" name="Chapters" fill="hsl(var(--primary))" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-muted-foreground text-sm text-center py-12">No subjects created yet</p>
          )}
        </div>

        <div className="stat-card">
          <h3 className="font-semibold mb-4">Content Type Distribution</h3>
          {materialTypeData.length > 0 ? (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={180} height={180}>
                <PieChart>
                  <Pie data={materialTypeData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                    {materialTypeData.map((_, idx) => (
                      <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 flex-1">
                {materialTypeData.map((s, idx) => (
                  <div key={s.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: COLORS[idx % COLORS.length] }} />
                      <span className="text-xs text-muted-foreground capitalize truncate max-w-[100px]">{s.name}</span>
                    </div>
                    <span className="text-xs font-semibold">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm text-center py-12">No materials uploaded yet</p>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="bg-card rounded-2xl border border-border shadow-card p-6">
        <h3 className="font-semibold mb-4">Platform Summary</h3>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { label: 'Total Content Items', value: stats.materials, desc: 'Across all subjects', color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Active Users', value: stats.teachers + stats.students, desc: 'Teachers + Students', color: 'text-green-600', bg: 'bg-green-50' },
            { label: 'Coverage', value: `${stats.subjects > 0 ? Math.round((stats.chapters / Math.max(stats.subjects, 1))) : 0} avg`, desc: 'Chapters per subject', color: 'text-purple-600', bg: 'bg-purple-50' },
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
