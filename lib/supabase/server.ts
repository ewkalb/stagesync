// lib/supabase/server.ts
import { createClient as supabaseCreateClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export const createClient = async () => {
  const cookieStore = await cookies();

  return supabaseCreateClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        storage: {
          getItem: (key) => cookieStore.get(key)?.value,
          setItem: (key, value) => cookieStore.set(key, value),
          removeItem: (key) => cookieStore.delete(key),
        },
        flowType: 'pkce',
      },
    }
  );
};