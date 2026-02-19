import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Users, Plus, Trash2, Search, Mail, Shield, GraduationCap, BookOpen, UserCheck, X, Eye, EyeOff } from 'lucide-react';

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  role: string;
  is_demo: boolean;
  created_at: string;
}

interface AddUserForm {
  full_name: string;
  email: string;
  password: string;
  role: string;
}

const ROLE_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  super_admin: { label: 'Super Admin', color: 'bg-purple-100 text-purple-700 border-purple-200', icon: Shield },
  admin: { label: 'School Admin', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Shield },
  teacher: { label: 'Teacher', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: BookOpen },
  student: { label: 'Student', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: GraduationCap },
};

const UsersPage = () => {
  const { profile } = useAuth();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<AddUserForm>({ full_name: '', email: '', password: '', role: 'student' });
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');
  const [addSuccess, setAddSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const myRole = profile?.role || 'student';

  // Determine which roles this user can create
  const creatableRoles: Record<string, string[]> = {
    super_admin: ['admin', 'teacher', 'student'],
    admin: ['teacher', 'student'],
    teacher: ['student'],
  };
  const canCreate = creatableRoles[myRole] || [];

  // Determine which roles to show
  const visibleRoles: Record<string, string[]> = {
    super_admin: ['super_admin', 'admin', 'teacher', 'student'],
    admin: ['teacher', 'student'],
    teacher: ['student'],
  };
  const showRoles = visibleRoles[myRole] || [];

  const fetchUsers = async () => {
    setLoading(true);
    const roles = (showRoles.length > 0 ? showRoles : ['student']) as ('super_admin' | 'admin' | 'teacher' | 'student')[];
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .in('role', roles)
      .order('created_at', { ascending: false });
    setUsers(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
    // Realtime subscription
    const channel = supabase
      .channel('profiles-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => fetchUsers())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleAddUser = async () => {
    if (!form.full_name.trim() || !form.email.trim() || !form.password.trim()) {
      setAddError('All fields are required');
      return;
    }
    if (form.password.length < 6) {
      setAddError('Password must be at least 6 characters');
      return;
    }
    setAdding(true);
    setAddError('');
    setAddSuccess('');

    const { data, error } = await supabase.functions.invoke('create-user', {
      body: { ...form },
    });

    if (error || data?.error) {
      setAddError(data?.error || error?.message || 'Failed to create user');
    } else {
      setAddSuccess(`✅ ${form.full_name} created successfully! They can login with ${form.email}`);
      setForm({ full_name: '', email: '', password: '', role: 'student' });
      fetchUsers();
    }
    setAdding(false);
  };

  const filteredUsers = users.filter(u => {
    const matchSearch = u.full_name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === 'all' || u.role === filterRole;
    return matchSearch && matchRole;
  });

  const roleCounts = users.reduce((acc, u) => {
    acc[u.role] = (acc[u.role] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-muted-foreground text-sm mt-1">{users.length} total users</p>
        </div>
        {canCreate.length > 0 && (
          <button
            onClick={() => { setShowAdd(true); setAddError(''); setAddSuccess(''); }}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-blue text-white rounded-xl font-medium text-sm shadow-glow-blue hover:opacity-90 transition-all"
          >
            <Plus className="w-4 h-4" /> Add User
          </button>
        )}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(roleCounts).map(([role, count]) => {
          const cfg = ROLE_CONFIG[role];
          if (!cfg) return null;
          return (
            <div key={role} className="stat-card flex items-center gap-3 p-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                role === 'super_admin' ? 'bg-gradient-purple' :
                role === 'admin' ? 'bg-gradient-blue' :
                role === 'teacher' ? 'bg-gradient-green' : 'bg-gradient-amber'
              }`}>
                <cfg.icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xl font-bold">{count}</p>
                <p className="text-xs text-muted-foreground">{cfg.label}s</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
          />
        </div>
        <select
          value={filterRole}
          onChange={e => setFilterRole(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
        >
          <option value="all">All Roles</option>
          {showRoles.map(r => <option key={r} value={r}>{ROLE_CONFIG[r]?.label || r}</option>)}
        </select>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">User</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Role</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Joined</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredUsers.map(user => {
                  const cfg = ROLE_CONFIG[user.role] || ROLE_CONFIG.student;
                  return (
                    <tr key={user.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                            user.role === 'super_admin' ? 'bg-gradient-purple' :
                            user.role === 'admin' ? 'bg-gradient-blue' :
                            user.role === 'teacher' ? 'bg-gradient-green' : 'bg-gradient-amber'
                          }`}>
                            {user.full_name[0]?.toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-sm">{user.full_name}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Mail className="w-3 h-3" />{user.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.color}`}>
                          <cfg.icon className="w-3 h-3" />
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          user.is_demo ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-green-100 text-green-700 border border-green-200'
                        }`}>
                          {user.is_demo ? '🔒 Demo' : '✅ Active'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                      <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>No users found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-card rounded-2xl shadow-xl border border-border w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-blue flex items-center justify-center">
                  <UserCheck className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-lg font-bold">Add New User</h2>
              </div>
              <button onClick={() => setShowAdd(false)} className="p-2 rounded-xl hover:bg-muted transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {addError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{addError}</div>
              )}
              {addSuccess && (
                <div className="p-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm">{addSuccess}</div>
              )}

              <div>
                <label className="text-sm font-semibold mb-1.5 block">Full Name *</label>
                <input
                  value={form.full_name}
                  onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                  placeholder="e.g. John Smith"
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                />
              </div>

              <div>
                <label className="text-sm font-semibold mb-1.5 block">Email (Login ID) *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="e.g. john@school.com"
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                />
              </div>

              <div>
                <label className="text-sm font-semibold mb-1.5 block">Password *</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    placeholder="Min 6 characters"
                    className="w-full px-4 py-2.5 pr-10 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold mb-1.5 block">Role *</label>
                <select
                  value={form.role}
                  onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                >
                  {canCreate.map(r => (
                    <option key={r} value={r}>{ROLE_CONFIG[r]?.label || r}</option>
                  ))}
                </select>
              </div>

              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-xs">
                💡 Share the email and password with the user so they can login to EduCloud LMS.
              </div>
            </div>

            <div className="flex gap-3 p-6 border-t border-border">
              <button onClick={() => setShowAdd(false)} className="flex-1 py-2.5 rounded-xl border border-border font-medium text-sm hover:bg-muted transition-colors">
                Cancel
              </button>
              <button
                onClick={handleAddUser}
                disabled={adding}
                className="flex-1 py-2.5 rounded-xl bg-gradient-blue text-white font-medium text-sm hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {adding ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Plus className="w-4 h-4" />}
                {adding ? 'Creating...' : 'Create User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;
