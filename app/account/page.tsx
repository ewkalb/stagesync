// app/account/page.tsx
'use client';
export const dynamic = 'force-dynamic'; // Skip prerender

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';

export default function Account() {
  const [username, setUsername] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [tempUsername, setTempUsername] = useState('');
  const [incomingRequests, setIncomingRequests] = useState<any[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<any[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const router = useRouter();

  useEffect(() => {
    const supabase = createBrowserClient();

    async function fetchData() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      const { data: profile, error: profileError } = await supabase.from('profiles').select('username').eq('id', session.user.id).single();
      if (profileError) {
        toast.error('Failed to load profile: ' + profileError.message);
        console.error('Profile fetch error:', profileError);
        return;
      }
      setUsername(profile?.username || '');
      setTempUsername(profile?.username || '');

      // Incoming requests (pending)
      const { data: incomingData, error: incomingError } = await supabase
        .from('friend_requests')
        .select('*')
        .eq('requestee_id', session.user.id)
        .eq('status', 'pending');

      if (incomingError) {
        toast.error('Failed to load incoming requests: ' + incomingError.message);
        console.error('Incoming fetch error:', incomingError);
      } else {
        setIncomingRequests(incomingData || []);
      }

      // Outgoing requests (pending)
      const { data: outgoingData, error: outgoingError } = await supabase
        .from('friend_requests')
        .select('*')
        .eq('requester_id', session.user.id)
        .eq('status', 'pending');

      if (outgoingError) {
        toast.error('Failed to load outgoing requests: ' + outgoingError.message);
        console.error('Outgoing fetch error:', outgoingError);
      } else {
        setOutgoingRequests(outgoingData || []);
      }

      // Friends (accepted)
      const { data: fromFriends, error: fromError } = await supabase
        .from('friend_requests')
        .select('*')
        .eq('requester_id', session.user.id)
        .eq('status', 'accepted');

      const { data: toFriends, error: toError } = await supabase
        .from('friend_requests')
        .select('*')
        .eq('requestee_id', session.user.id)
        .eq('status', 'accepted');

      if (fromError || toError) {
        toast.error('Failed to load friends: ' + (fromError || toError)?.message);
        console.error('Friends fetch error:', fromError || toError);
      } else {
        setFriends([...(fromFriends || []), ...(toFriends || [])]);
      }
    }
    fetchData();
  }, [router]);

  const saveUsername = async () => {
    const supabase = createBrowserClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { error } = await supabase.from('profiles').update({ username: tempUsername }).eq('id', session.user.id);
    if (error) toast.error(error.message);
    else {
      setUsername(tempUsername);
      toast.success('Username updated');
      setIsEditing(false);
    }
  };

  const searchUsers = async () => {
    const supabase = createBrowserClient();
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .ilike('username', `%${searchTerm}%`);

    if (error) {
      toast.error('Search failed: ' + error.message);
    } else {
      setSearchResults(data || []);
    }
  };

  const sendRequest = async (toUserId: string) => {
    const supabase = createBrowserClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { error } = await supabase.from('friend_requests').insert({
      requester_id: session.user.id,
      requestee_id: toUserId,
      status: 'pending'
    });
    if (error) toast.error(error.message);
    else toast.success('Request sent');
  };

  const acceptRequest = async (requestId: string) => {
    const supabase = createBrowserClient();
    const { error } = await supabase
      .from('friend_requests')
      .update({ status: 'accepted' })
      .eq('id', requestId);

    if (error) toast.error(error.message);
    else toast.success('Accepted');
  };

  const logout = async () => {
    const supabase = createBrowserClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6">
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white">Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label className="text-white">Username</Label>
            {isEditing ? (
              <div className="flex gap-4">
                <Input value={tempUsername} onChange={(e) => setTempUsername(e.target.value)} className="bg-zinc-800 text-white border-zinc-700" />
                <Button onClick={saveUsername} className="bg-white text-black hover:bg-zinc-200">Save</Button>
              </div>
            ) : (
              <p className="text-zinc-300">{username}</p>
            )}
            <Button onClick={() => setIsEditing(true)} className="mt-2 border-white hover:bg-white hover:text-black">Edit</Button>
          </div>
          <div>
            <Label className="text-white">Friends</Label>
            <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search users" className="bg-zinc-800 text-white border-zinc-700" />
            <Button onClick={searchUsers} className="mt-2 bg-white text-black hover:bg-zinc-200">Search</Button>
            {searchResults.map((u, idx) => (
              <div key={idx} className="text-zinc-300 mt-2">
                {u.username} <Button onClick={() => sendRequest(u.id)} size="sm" className="bg-white text-black hover:bg-zinc-200">Request</Button>
              </div>
            ))}
            <p className="text-zinc-300 mt-4">Incoming: {incomingRequests.length}</p>
            <p className="text-zinc-300">Outgoing: {outgoingRequests.length}</p>
            <p className="text-zinc-300">Friends: {friends.length}</p>
          </div>
          <Button onClick={logout} className="bg-red-900 hover:bg-red-800">Logout</Button>
        </CardContent>
      </Card>
    </div>
  );
}