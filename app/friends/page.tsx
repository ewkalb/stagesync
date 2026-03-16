// app/friends/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type Friend = {
  id: string;
  username: string;
  // Other fields
};

export default function Friends() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Friend[]>([]);
  const router = useRouter();
  const supabase = createBrowserClient();

  useEffect(() => {
    async function fetchFriends() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      // Fetch mutual friends query (your logic, e.g., from friend_requests where accepted)
      const { data } = await supabase.from('friend_requests').select('*'); // Adjust
      setFriends(data || []);
    }
    fetchFriends();
  }, [router, supabase]);

  const handleSearch = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .ilike('username', `%${search}%`);

    setSearchResults(data || []);
  };

  const sendRequest = async (toUserId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('friend_requests').insert({
      from_user: user.id,
      to_user: toUserId,
    });
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6">
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle>Friends</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex gap-4">
            <Input placeholder="Search users" value={search} onChange={(e) => setSearch(e.target.value)} />
            <Button onClick={handleSearch}>Search</Button>
          </div>
          {/* Render search results with Send Request buttons */}
          {/* Render current friends list */}
        </CardContent>
      </Card>
    </div>
  );
}