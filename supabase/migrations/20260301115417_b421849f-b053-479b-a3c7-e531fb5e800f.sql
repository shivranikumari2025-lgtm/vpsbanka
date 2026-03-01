
CREATE TABLE public.schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  type text NOT NULL DEFAULT 'class',
  scheduled_at timestamptz NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 60,
  meeting_link text,
  color text DEFAULT '#3B82F6',
  teacher_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view schedules"
  ON public.schedules FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Teachers can manage their schedules"
  ON public.schedules FOR ALL TO authenticated
  USING (
    teacher_id = auth.uid() 
    OR has_role(auth.uid(), 'admin'::app_role) 
    OR has_role(auth.uid(), 'super_admin'::app_role)
  );

ALTER PUBLICATION supabase_realtime ADD TABLE public.schedules;
