import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://kurskcpgnakqribnabkb.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1cnNrY3BnbmFrcXJpYm5hYmtiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0NDMzNjUsImV4cCI6MjA4NzAxOTM2NX0.0L997t9shyOoByvyg7I9ip8hGNOlmvEjtehohqe1IyE";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
