import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { School, BookOpen, Users, GraduationCap, FileText, Plus, X, Trash2 } from 'lucide-react';

interface SchoolItem {
  id: string; name: string; code: string; description?: string;
  address?: string; city?: string; state?: string; country?: string;
  phone?: string; email?: string; is_active: boolean; created_at: string;
}

const SchoolsPage = () => {
  const { user } = useAuth();
  const [schools, setSchools] = useState<SchoolItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', code: '', description: '', address: '', city: '', state: '', country: '', phone: '', email: '' });
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');
  const [stats, setStats] = useState<Record<string, { teachers: number; students: number; classes: number }>>({});

  const isDeveloper = user?.role === 'developer';

  const fetchSchools = async () => {
    try {
      const { data } = await supabase.from('schools').select('*').order('created_at', { ascending: false });
      setSchools((data as SchoolItem[]) || []);

      // Fetch stats per school
      if (data && data.length > 0) {
        const statsMap: Record<string, { teachers: number; students: number; classes: number }> = {};
        await Promise.all(data.map(async (school: any) => {
          const [{ count: tCount }, { count: sCount }, { count: cCount }] = await Promise.all([
            supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('school_id', school.id).eq('role', 'teacher'),
            supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('school_id', school.id).eq('role', 'student'),
            supabase.from('classes').select('*', { count: 'exact', head: true }).eq('school_id', school.id),
          ]);
          statsMap[school.id] = { teachers: tCount || 0, students: sCount || 0, classes: cCount || 0 };
        }));
        setStats(statsMap);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSchools(); }, []);

  const handleAddSchool = async () => {
    if (!form.name.trim()) { setAddError('School name is required'); return; }
    setAdding(true); setAddError('');
    try {
      const code = form.code.trim() || form.name.trim().toUpperCase().replace(/\s+/g, '-').slice(0, 10) + '-' + Math.random().toString(36).slice(2, 6).toUpperCase();
      const { error } = await supabase.from('schools').insert({
        name: form.name.trim(), code, description: form.description || null,
        address: form.address || null, city: form.city || null, state: form.state || null,
        country: form.country || null, phone: form.phone || null, email: form.email || null,
        created_by: user?.user_id,
      } as any);
      if (error) throw error;
      setShowAdd(false);
      setForm({ name: '', code: '', description: '', address: '', city: '', state: '', country: '', phone: '', email: '' });
      fetchSchools();
    } catch (error: any) {
      setAddError(error.message || 'Failed to create school');
    } finally {
      setAdding(false);
    }
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
          <h1 className="text-2xl font-bold">Schools Management</h1>
          <p className="text-muted-foreground text-sm mt-1">{schools.length} registered schools</p>
        </div>
        {isDeveloper && (
          <button onClick={() => { setShowAdd(true); setAddError(''); }}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-blue text-white rounded-xl font-medium text-sm shadow-glow-blue hover:opacity-90 transition-all">
            <Plus className="w-4 h-4" /> Add School
          </button>
        )}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {schools.map(school => {
          const s = stats[school.id] || { teachers: 0, students: 0, classes: 0 };
          return (
            <div key={school.id} className="bg-card rounded-2xl border border-border shadow-card p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-blue flex items-center justify-center">
                  <School className="w-6 h-6 text-white" />
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${school.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {school.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <h3 className="font-bold text-sm mb-1">{school.name}</h3>
              <p className="text-xs text-muted-foreground mb-1">Code: <span className="font-mono font-medium text-foreground">{school.code}</span></p>
              {school.city && <p className="text-xs text-muted-foreground">{school.city}{school.state ? `, ${school.state}` : ''}</p>}
              <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-border">
                <div className="text-center">
                  <p className="text-lg font-bold">{s.classes}</p>
                  <p className="text-[10px] text-muted-foreground">Classes</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold">{s.teachers}</p>
                  <p className="text-[10px] text-muted-foreground">Teachers</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold">{s.students}</p>
                  <p className="text-[10px] text-muted-foreground">Students</p>
                </div>
              </div>
            </div>
          );
        })}
        {schools.length === 0 && (
          <div className="col-span-full bg-card rounded-2xl border border-border shadow-card p-12 text-center">
            <School className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-30" />
            <p className="text-muted-foreground">No schools registered yet</p>
            {isDeveloper && <p className="text-xs text-muted-foreground mt-1">Click "Add School" to create your first school</p>}
          </div>
        )}
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-card rounded-2xl shadow-xl border border-border w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-card">
              <h2 className="text-lg font-bold">Register New School</h2>
              <button onClick={() => setShowAdd(false)} className="p-2 rounded-xl hover:bg-muted"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              {addError && <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{addError}</div>}
              <div>
                <label className="text-sm font-semibold mb-1.5 block">School Name *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Springfield High School"
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm" />
              </div>
              <div>
                <label className="text-sm font-semibold mb-1.5 block">School Code (auto-generated if empty)</label>
                <input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} placeholder="e.g. SPR-HIGH-2024"
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm font-mono" />
              </div>
              <div>
                <label className="text-sm font-semibold mb-1.5 block">Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Brief description..." rows={2}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-semibold mb-1.5 block">City</label>
                  <input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} placeholder="City"
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm" />
                </div>
                <div>
                  <label className="text-sm font-semibold mb-1.5 block">State</label>
                  <input value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} placeholder="State"
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm" />
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold mb-1.5 block">Email</label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="school@example.com"
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm" />
              </div>
              <div>
                <label className="text-sm font-semibold mb-1.5 block">Phone</label>
                <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+91 XXXXXXXXXX"
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm" />
              </div>
            </div>
            <div className="flex gap-3 p-6 border-t border-border">
              <button onClick={() => setShowAdd(false)} className="flex-1 py-2.5 rounded-xl border border-border font-medium text-sm hover:bg-muted">Cancel</button>
              <button onClick={handleAddSchool} disabled={adding}
                className="flex-1 py-2.5 rounded-xl bg-gradient-blue text-white font-medium text-sm hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
                {adding ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Plus className="w-4 h-4" />}
                {adding ? 'Creating...' : 'Register School'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SchoolsPage;
