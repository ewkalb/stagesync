// components/LogoutButton.tsx
'use client';

import { createBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createBrowserClient();
    const { error } = await supabase.auth.signOut();
    if (!error) {
      router.push('/login');
    }
  };

  return (
    <Button onClick={handleLogout} variant="outline">
      Log Out
    </Button>
  );
}