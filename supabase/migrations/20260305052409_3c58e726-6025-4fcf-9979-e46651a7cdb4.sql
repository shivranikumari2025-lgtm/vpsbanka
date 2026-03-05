
-- Add class_id to profiles for student-class association
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS class_id uuid REFERENCES public.classes(id) ON DELETE SET NULL;

-- Update RLS: students can only see exams for their class
-- First, we need exams to link to class via chapter → subject → class chain
-- Exams already link through chapter_id → chapters → subject_id → subjects → class_id
-- So students filter exams by matching their class_id through the join chain
