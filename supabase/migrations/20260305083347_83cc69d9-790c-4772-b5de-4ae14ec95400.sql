
-- Fix ALL RLS policies: change from RESTRICTIVE to PERMISSIVE

-- CLASSES
DROP POLICY IF EXISTS "Manage classes by school" ON public.classes;
DROP POLICY IF EXISTS "View classes by school" ON public.classes;

CREATE POLICY "View classes by school" ON public.classes
FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'developer'::app_role) OR (school_id = get_user_school_id(auth.uid())));

CREATE POLICY "Manage classes by school" ON public.classes
FOR ALL TO authenticated
USING (has_role(auth.uid(), 'developer'::app_role) OR ((school_id = get_user_school_id(auth.uid())) AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'teacher'::app_role))))
WITH CHECK (has_role(auth.uid(), 'developer'::app_role) OR ((school_id = get_user_school_id(auth.uid())) AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'teacher'::app_role))));

-- CHAPTERS
DROP POLICY IF EXISTS "Manage chapters by school" ON public.chapters;
DROP POLICY IF EXISTS "View chapters by school" ON public.chapters;

CREATE POLICY "View chapters by school" ON public.chapters
FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'developer'::app_role) OR (school_id = get_user_school_id(auth.uid())));

CREATE POLICY "Manage chapters by school" ON public.chapters
FOR ALL TO authenticated
USING (has_role(auth.uid(), 'developer'::app_role) OR ((school_id = get_user_school_id(auth.uid())) AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'teacher'::app_role))))
WITH CHECK (has_role(auth.uid(), 'developer'::app_role) OR ((school_id = get_user_school_id(auth.uid())) AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'teacher'::app_role))));

-- SUBJECTS
DROP POLICY IF EXISTS "Manage subjects by school" ON public.subjects;
DROP POLICY IF EXISTS "View subjects by school" ON public.subjects;

CREATE POLICY "View subjects by school" ON public.subjects
FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'developer'::app_role) OR (school_id = get_user_school_id(auth.uid())));

CREATE POLICY "Manage subjects by school" ON public.subjects
FOR ALL TO authenticated
USING (has_role(auth.uid(), 'developer'::app_role) OR ((school_id = get_user_school_id(auth.uid())) AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'teacher'::app_role))))
WITH CHECK (has_role(auth.uid(), 'developer'::app_role) OR ((school_id = get_user_school_id(auth.uid())) AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'teacher'::app_role))));

-- MATERIALS
DROP POLICY IF EXISTS "Manage materials by school" ON public.materials;
DROP POLICY IF EXISTS "View materials by school" ON public.materials;

CREATE POLICY "View materials by school" ON public.materials
FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'developer'::app_role) OR (school_id = get_user_school_id(auth.uid())));

CREATE POLICY "Manage materials by school" ON public.materials
FOR ALL TO authenticated
USING (has_role(auth.uid(), 'developer'::app_role) OR ((school_id = get_user_school_id(auth.uid())) AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'teacher'::app_role))))
WITH CHECK (has_role(auth.uid(), 'developer'::app_role) OR ((school_id = get_user_school_id(auth.uid())) AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'teacher'::app_role))));

-- EXAMS
DROP POLICY IF EXISTS "Manage exams by school" ON public.exams;
DROP POLICY IF EXISTS "View exams by school" ON public.exams;

CREATE POLICY "View exams by school" ON public.exams
FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'developer'::app_role) OR (school_id = get_user_school_id(auth.uid())));

CREATE POLICY "Manage exams by school" ON public.exams
FOR ALL TO authenticated
USING (has_role(auth.uid(), 'developer'::app_role) OR ((school_id = get_user_school_id(auth.uid())) AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'teacher'::app_role))))
WITH CHECK (has_role(auth.uid(), 'developer'::app_role) OR ((school_id = get_user_school_id(auth.uid())) AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'teacher'::app_role))));

-- QUESTIONS
DROP POLICY IF EXISTS "Manage questions by school" ON public.questions;
DROP POLICY IF EXISTS "View questions by school" ON public.questions;

CREATE POLICY "View questions by school" ON public.questions
FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'developer'::app_role) OR (school_id = get_user_school_id(auth.uid())));

CREATE POLICY "Manage questions by school" ON public.questions
FOR ALL TO authenticated
USING (has_role(auth.uid(), 'developer'::app_role) OR ((school_id = get_user_school_id(auth.uid())) AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'teacher'::app_role))))
WITH CHECK (has_role(auth.uid(), 'developer'::app_role) OR ((school_id = get_user_school_id(auth.uid())) AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'teacher'::app_role))));

-- EXAM_RESULTS
DROP POLICY IF EXISTS "Submit exam results by school" ON public.exam_results;
DROP POLICY IF EXISTS "View exam results by school" ON public.exam_results;

CREATE POLICY "Submit exam results by school" ON public.exam_results
FOR INSERT TO authenticated
WITH CHECK ((student_id = auth.uid()) AND (school_id = get_user_school_id(auth.uid())));

CREATE POLICY "View exam results by school" ON public.exam_results
FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'developer'::app_role) OR ((school_id = get_user_school_id(auth.uid())) AND ((student_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'teacher'::app_role))));

-- LIVE_SESSIONS
DROP POLICY IF EXISTS "Manage live sessions by school" ON public.live_sessions;
DROP POLICY IF EXISTS "View live sessions by school" ON public.live_sessions;

CREATE POLICY "View live sessions by school" ON public.live_sessions
FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'developer'::app_role) OR (school_id = get_user_school_id(auth.uid())));

CREATE POLICY "Manage live sessions by school" ON public.live_sessions
FOR ALL TO authenticated
USING (has_role(auth.uid(), 'developer'::app_role) OR ((school_id = get_user_school_id(auth.uid())) AND ((teacher_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role))))
WITH CHECK (has_role(auth.uid(), 'developer'::app_role) OR ((school_id = get_user_school_id(auth.uid())) AND ((teacher_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role))));

-- SCHEDULES
DROP POLICY IF EXISTS "Manage schedules by school" ON public.schedules;
DROP POLICY IF EXISTS "View schedules by school" ON public.schedules;

CREATE POLICY "View schedules by school" ON public.schedules
FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'developer'::app_role) OR (school_id = get_user_school_id(auth.uid())));

CREATE POLICY "Manage schedules by school" ON public.schedules
FOR ALL TO authenticated
USING (has_role(auth.uid(), 'developer'::app_role) OR ((school_id = get_user_school_id(auth.uid())) AND ((teacher_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role))))
WITH CHECK (has_role(auth.uid(), 'developer'::app_role) OR ((school_id = get_user_school_id(auth.uid())) AND ((teacher_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role))));

-- PROFILES
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "View profiles by school or developer" ON public.profiles;
DROP POLICY IF EXISTS "Insert own profile" ON public.profiles;

CREATE POLICY "View profiles by school or developer" ON public.profiles
FOR SELECT TO authenticated
USING ((user_id = auth.uid()) OR has_role(auth.uid(), 'developer'::app_role) OR (school_id = get_user_school_id(auth.uid())));

CREATE POLICY "Users can update their own profile" ON public.profiles
FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Insert own profile" ON public.profiles
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- SCHOOLS
DROP POLICY IF EXISTS "Developers can manage all schools" ON public.schools;
DROP POLICY IF EXISTS "Users can view their own school" ON public.schools;

CREATE POLICY "Developers can manage all schools" ON public.schools
FOR ALL TO authenticated
USING (has_role(auth.uid(), 'developer'::app_role))
WITH CHECK (has_role(auth.uid(), 'developer'::app_role));

CREATE POLICY "Users can view their own school" ON public.schools
FOR SELECT TO authenticated
USING (id = get_user_school_id(auth.uid()));

-- USER_ROLES
DROP POLICY IF EXISTS "Users can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins and developers can manage roles" ON public.user_roles;

CREATE POLICY "Users can view all roles" ON public.user_roles
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Admins and developers can manage roles" ON public.user_roles
FOR ALL TO authenticated
USING (has_role(auth.uid(), 'developer'::app_role) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'developer'::app_role) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));
