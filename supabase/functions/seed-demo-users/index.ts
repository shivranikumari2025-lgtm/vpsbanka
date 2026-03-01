import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DEMO_USERS = [
  {
    email: 'superadmin@schoollms.com',
    password: 'SuperAdmin@123',
    full_name: 'Super Administrator',
    role: 'super_admin' as const,
  },
  {
    email: 'admin@schoollms.com',
    password: 'Admin@123',
    full_name: 'School Administrator',
    role: 'admin' as const,
  },
  {
    email: 'teacher@schoollms.com',
    password: 'Teacher@123',
    full_name: 'John Teacher',
    role: 'teacher' as const,
  },
  {
    email: 'student@schoollms.com',
    password: 'Student@123',
    full_name: 'Jane Student',
    role: 'student' as const,
  },
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const results = [];

    for (const user of DEMO_USERS) {
      // Check if user already exists
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
      const existingUser = existingUsers?.users?.find(u => u.email === user.email);

      let userId: string;

      if (existingUser) {
        userId = existingUser.id;
        results.push({ email: user.email, action: 'already_exists', id: userId });
      } else {
        // Create user
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: user.email,
          password: user.password,
          email_confirm: true,
          user_metadata: { full_name: user.full_name, role: user.role },
        });

        if (createError) {
          results.push({ email: user.email, action: 'error', error: createError.message });
          continue;
        }

        userId = newUser.user!.id;
        results.push({ email: user.email, action: 'created', id: userId });
      }

      // Upsert profile
      await supabaseAdmin.from('profiles').upsert({
        user_id: userId,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        is_demo: true,
      }, { onConflict: 'user_id' });

      // Upsert user_roles
      await supabaseAdmin.from('user_roles').upsert({
        user_id: userId,
        role: user.role,
      }, { onConflict: 'user_id,role' });
    }

    // Seed demo data - classes, subjects, chapters
    const { data: existingClasses } = await supabaseAdmin.from('classes').select('id').limit(1);
    
    if (!existingClasses || existingClasses.length === 0) {
      // Get admin user id
      const { data: adminProfile } = await supabaseAdmin
        .from('profiles')
        .select('user_id')
        .eq('email', 'admin@schoollms.com')
        .single();
      
      const adminId = adminProfile?.user_id;

      // Create classes
      const classData = [
        { name: 'Class 9', description: 'Secondary School - Grade 9', grade_level: 9, created_by: adminId },
        { name: 'Class 10', description: 'Secondary School - Grade 10', grade_level: 10, created_by: adminId },
        { name: 'Class 11', description: 'Senior Secondary - Grade 11', grade_level: 11, created_by: adminId },
        { name: 'Class 12', description: 'Senior Secondary - Grade 12', grade_level: 12, created_by: adminId },
      ];

      const { data: classes } = await supabaseAdmin.from('classes').insert(classData).select();

      if (classes && classes.length > 0) {
        // Get teacher id
        const { data: teacherProfile } = await supabaseAdmin
          .from('profiles')
          .select('user_id')
          .eq('email', 'teacher@schoollms.com')
          .single();
        
        const teacherId = teacherProfile?.user_id;

        const subjectColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
        const subjectData = [
          { class_id: classes[0].id, name: 'Mathematics', description: 'Algebra, Geometry & Calculus', teacher_id: teacherId, color: subjectColors[0] },
          { class_id: classes[0].id, name: 'Science', description: 'Physics, Chemistry & Biology', teacher_id: teacherId, color: subjectColors[1] },
          { class_id: classes[0].id, name: 'English', description: 'Literature & Grammar', teacher_id: teacherId, color: subjectColors[2] },
          { class_id: classes[0].id, name: 'Social Studies', description: 'History, Geography & Civics', teacher_id: teacherId, color: subjectColors[3] },
          { class_id: classes[1].id, name: 'Mathematics', description: 'Advanced Algebra & Trigonometry', teacher_id: teacherId, color: subjectColors[0] },
          { class_id: classes[1].id, name: 'Physics', description: 'Mechanics, Optics & Electricity', teacher_id: teacherId, color: subjectColors[4] },
        ];

        const { data: subjects } = await supabaseAdmin.from('subjects').insert(subjectData).select();

        if (subjects && subjects.length > 0) {
          const chapterData = [
            { subject_id: subjects[0].id, name: 'Real Numbers', description: 'Introduction to real number system', order_index: 1 },
            { subject_id: subjects[0].id, name: 'Polynomials', description: 'Zeroes and coefficients of polynomials', order_index: 2 },
            { subject_id: subjects[0].id, name: 'Linear Equations', description: 'Pair of linear equations in two variables', order_index: 3 },
            { subject_id: subjects[1].id, name: 'Matter in Our Surroundings', description: 'States and properties of matter', order_index: 1 },
            { subject_id: subjects[1].id, name: 'Atoms and Molecules', description: 'Atomic structure and molecular theory', order_index: 2 },
            { subject_id: subjects[2].id, name: 'Literature Reader', description: 'Prose and poetry comprehension', order_index: 1 },
            { subject_id: subjects[2].id, name: 'Grammar & Writing', description: 'Advanced grammar and composition', order_index: 2 },
          ];

          await supabaseAdmin.from('chapters').insert(chapterData);
        }
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
