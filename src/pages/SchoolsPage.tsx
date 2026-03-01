import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { School, BookOpen, Users, GraduationCap, FileText } from 'lucide-react';

const SchoolsPage = () => {
  const [stats, setStats] = useState({ classes: 0, subjects: 0, teachers: 0, students: 0, materials: 0 });
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<any[]>([]);
  const [recentMaterials, setRecentMaterials] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [
          { data: cls }, { data: teachRoles }, { data: studRoles },
          { count: subCount }, { count: matCount },
          { data: mats },
        ] = await Promise.all([
          supabase.from('classes').select('*'),
          supabase.from('user_roles').select('*').eq('role', 'teacher'),
          supabase.from('user_roles').select('*').eq('role', 'student'),
          supabase.from('subjects').select('*', { count: 'exact', head: true }),
          supabase.from('materials').select('*', { count: 'exact', head: true }),
          supabase.from('materials').select('*').order('created_at', { ascending: false }).limit(5),
        ]);

        setStats({
          classes: cls?.length || 0,
          subjects: subCount || 0,
          teachers: teachRoles?.length || 0,
          students: studRoles?.length || 0,
          materials: matCount || 0,
        });
        setClasses(cls || []);
        setRecentMaterials(mats || []);
      } catch (error) {
        console.error('Error fetching data:', error);
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
        <h1 className="text-2xl font-bold">Schools Overview</h1>
        <p className="text-muted-foreground text-sm mt-1">Platform-wide school management</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Active Classes', value: stats.classes, icon: GraduationCap, gradient: 'bg-gradient-blue' },
          { label: 'Subjects', value: stats.subjects, icon: BookOpen, gradient: 'bg-gradient-green' },
          { label: 'Teachers', value: stats.teachers, icon: Users, gradient: 'bg-gradient-purple' },
          { label: 'Students', value: stats.students, icon: GraduationCap, gradient: 'bg-gradient-amber' },
          { label: 'Materials', value: stats.materials, icon: FileText, gradient: 'bg-gradient-red' },
        ].map(s => (
          <div key={s.label} className="stat-card p-4">
            <div className={`w-10 h-10 rounded-xl ${s.gradient} flex items-center justify-center mb-3`}>
              <s.icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-2xl border border-border shadow-card">
          <div className="p-6 border-b border-border"><h2 className="font-bold text-lg">Active Classes</h2></div>
          <div className="divide-y divide-border">
            {classes.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <School className="w-10 h-10 mx-auto mb-2 opacity-30" /><p>No classes yet</p>
              </div>
            ) : classes.map(cls => (
              <div key={cls.id} className="flex items-center gap-4 p-4 hover:bg-muted/20 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-gradient-blue flex items-center justify-center flex-shrink-0">
                  <GraduationCap className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{cls.name}</p>
                  <p className="text-xs text-muted-foreground">{cls.description || 'No description'}</p>
                </div>
                {cls.grade_level && <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">Grade {cls.grade_level}</span>}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border shadow-card">
          <div className="p-6 border-b border-border"><h2 className="font-bold text-lg">Recent Uploads</h2></div>
          <div className="divide-y divide-border">
            {recentMaterials.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" /><p>No recent activity</p>
              </div>
            ) : recentMaterials.map((item, i) => (
              <div key={i} className="flex items-center gap-4 p-4 hover:bg-muted/20 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-gradient-amber flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{item.title}</p>
                  <p className="text-xs text-muted-foreground capitalize">{item.type?.replace('_', ' ')}</p>
                </div>
                <p className="text-xs text-muted-foreground flex-shrink-0">{new Date(item.created_at).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-gradient-hero rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold mb-1">Platform Health</h2>
            <p className="text-blue-200 text-sm">All systems operational</p>
          </div>
          <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full">
            <div className="pulse-dot" /><span className="font-semibold text-sm">Live</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SchoolsPage;
