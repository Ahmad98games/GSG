import { createClient } from '@supabase/supabase-js';

// placeholders for now, as requested
const supabaseUrl = 'https://zgxmvwxzjmpmesqliwxl.supabase.co';
const supabaseAnonKey = 'sb_publishable_cGJQMAam_R4JU3X4IEIrkQ_EPeSsQIt';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
