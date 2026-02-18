import { supabase } from "@/integrations/supabase/client";

export { supabase };

export const seedDemoUsers = async () => {
  const { data, error } = await supabase.functions.invoke('seed-demo-users');
  return { data, error };
};
