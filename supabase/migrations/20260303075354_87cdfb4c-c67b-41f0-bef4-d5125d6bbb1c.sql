
-- 1. Create schools table first (no policies yet)
CREATE TABLE IF NOT EXISTS public.schools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text UNIQUE,
  description text,
  address text,
  city text,
  state text,
  country text,
  phone text,
  email text,
  logo_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;

-- 2. Add school_id columns to all tables
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS school_id uuid REFERENCES public.schools(id);
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS school_id uuid REFERENCES public.schools(id);
ALTER TABLE public.schedules ADD COLUMN IF NOT EXISTS school_id uuid REFERENCES public.schools(id);
ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS school_id uuid REFERENCES public.schools(id);
ALTER TABLE public.live_sessions ADD COLUMN IF NOT EXISTS school_id uuid REFERENCES public.schools(id);
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS school_id uuid REFERENCES public.schools(id);
ALTER TABLE public.materials ADD COLUMN IF NOT EXISTS school_id uuid REFERENCES public.schools(id);
ALTER TABLE public.chapters ADD COLUMN IF NOT EXISTS school_id uuid REFERENCES public.schools(id);
ALTER TABLE public.exam_results ADD COLUMN IF NOT EXISTS school_id uuid REFERENCES public.schools(id);
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS school_id uuid REFERENCES public.schools(id);

-- 3. Helper function
CREATE OR REPLACE FUNCTION public.get_user_school_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT school_id FROM public.profiles WHERE user_id = _user_id LIMIT 1
$$;

-- 4. Schools RLS
CREATE POLICY "Developers can manage all schools" ON public.schools
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'developer'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'developer'::app_role));

CREATE POLICY "Users can view their own school" ON public.schools
  FOR SELECT TO authenticated
  USING (id = public.get_user_school_id(auth.uid()));

-- 5. School-scoped RLS for all tables

DROP POLICY IF EXISTS "Admin can manage classes" ON public.classes;
DROP POLICY IF EXISTS "Anyone authenticated can view classes" ON public.classes;
CREATE POLICY "Manage classes by school" ON public.classes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'developer'::app_role) OR (school_id = public.get_user_school_id(auth.uid()) AND (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role) OR public.has_role(auth.uid(), 'teacher'::app_role))))
  WITH CHECK (public.has_role(auth.uid(), 'developer'::app_role) OR (school_id = public.get_user_school_id(auth.uid()) AND (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role) OR public.has_role(auth.uid(), 'teacher'::app_role))));
CREATE POLICY "View classes by school" ON public.classes FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'developer'::app_role) OR school_id = public.get_user_school_id(auth.uid()));

DROP POLICY IF EXISTS "Admin and teacher can manage subjects" ON public.subjects;
DROP POLICY IF EXISTS "Anyone authenticated can view subjects" ON public.subjects;
CREATE POLICY "Manage subjects by school" ON public.subjects FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'developer'::app_role) OR (school_id = public.get_user_school_id(auth.uid()) AND (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role) OR public.has_role(auth.uid(), 'teacher'::app_role))));
CREATE POLICY "View subjects by school" ON public.subjects FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'developer'::app_role) OR school_id = public.get_user_school_id(auth.uid()));

DROP POLICY IF EXISTS "Admin and teacher can manage chapters" ON public.chapters;
DROP POLICY IF EXISTS "Anyone authenticated can view chapters" ON public.chapters;
CREATE POLICY "Manage chapters by school" ON public.chapters FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'developer'::app_role) OR (school_id = public.get_user_school_id(auth.uid()) AND (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role) OR public.has_role(auth.uid(), 'teacher'::app_role))));
CREATE POLICY "View chapters by school" ON public.chapters FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'developer'::app_role) OR school_id = public.get_user_school_id(auth.uid()));

DROP POLICY IF EXISTS "Admin and teacher can manage materials" ON public.materials;
DROP POLICY IF EXISTS "Anyone authenticated can view materials" ON public.materials;
CREATE POLICY "Manage materials by school" ON public.materials FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'developer'::app_role) OR (school_id = public.get_user_school_id(auth.uid()) AND (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role) OR public.has_role(auth.uid(), 'teacher'::app_role))));
CREATE POLICY "View materials by school" ON public.materials FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'developer'::app_role) OR school_id = public.get_user_school_id(auth.uid()));

DROP POLICY IF EXISTS "Anyone authenticated can view schedules" ON public.schedules;
DROP POLICY IF EXISTS "Teachers can manage their schedules" ON public.schedules;
CREATE POLICY "Manage schedules by school" ON public.schedules FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'developer'::app_role) OR (school_id = public.get_user_school_id(auth.uid()) AND (teacher_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role))));
CREATE POLICY "View schedules by school" ON public.schedules FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'developer'::app_role) OR school_id = public.get_user_school_id(auth.uid()));

DROP POLICY IF EXISTS "Admin and teacher can manage exams" ON public.exams;
DROP POLICY IF EXISTS "Anyone authenticated can view exams" ON public.exams;
CREATE POLICY "Manage exams by school" ON public.exams FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'developer'::app_role) OR (school_id = public.get_user_school_id(auth.uid()) AND (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role) OR public.has_role(auth.uid(), 'teacher'::app_role))));
CREATE POLICY "View exams by school" ON public.exams FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'developer'::app_role) OR school_id = public.get_user_school_id(auth.uid()));

DROP POLICY IF EXISTS "Admin and teacher can manage questions" ON public.questions;
DROP POLICY IF EXISTS "Anyone authenticated can view questions" ON public.questions;
CREATE POLICY "Manage questions by school" ON public.questions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'developer'::app_role) OR (school_id = public.get_user_school_id(auth.uid()) AND (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role) OR public.has_role(auth.uid(), 'teacher'::app_role))));
CREATE POLICY "View questions by school" ON public.questions FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'developer'::app_role) OR school_id = public.get_user_school_id(auth.uid()));

DROP POLICY IF EXISTS "Students can submit results" ON public.exam_results;
DROP POLICY IF EXISTS "Students can view their own results" ON public.exam_results;
CREATE POLICY "Submit exam results by school" ON public.exam_results FOR INSERT TO authenticated
  WITH CHECK (student_id = auth.uid() AND school_id = public.get_user_school_id(auth.uid()));
CREATE POLICY "View exam results by school" ON public.exam_results FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'developer'::app_role) OR (school_id = public.get_user_school_id(auth.uid()) AND (student_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role) OR public.has_role(auth.uid(), 'teacher'::app_role))));

DROP POLICY IF EXISTS "Anyone authenticated can view live sessions" ON public.live_sessions;
DROP POLICY IF EXISTS "Teachers can manage live sessions" ON public.live_sessions;
CREATE POLICY "Manage live sessions by school" ON public.live_sessions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'developer'::app_role) OR (school_id = public.get_user_school_id(auth.uid()) AND (teacher_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role))));
CREATE POLICY "View live sessions by school" ON public.live_sessions FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'developer'::app_role) OR school_id = public.get_user_school_id(auth.uid()));

DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Insert profile" ON public.profiles;
CREATE POLICY "View profiles by school or developer" ON public.profiles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'developer'::app_role) OR school_id = public.get_user_school_id(auth.uid()));
CREATE POLICY "Insert own profile" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
CREATE POLICY "Admins and developers can manage roles" ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'developer'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role));

ALTER PUBLICATION supabase_realtime ADD TABLE public.schools;
