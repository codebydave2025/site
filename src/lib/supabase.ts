import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

let supabaseInstance: any;

try {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase credentials missing.');
    supabaseInstance = {
      from: () => ({
        select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: { message: 'Missing credentials', code: 'PGRST116' } }) }) }),
        upsert: () => Promise.resolve({ error: { message: 'Missing credentials' } })
      })
    };
  } else {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  }
} catch (e) {
  console.error('Supabase initialization failed:', e);
  supabaseInstance = {
    from: () => ({
      select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: e }) }) }),
      upsert: () => Promise.resolve({ error: e })
    })
  };
}

export const supabase = supabaseInstance;
