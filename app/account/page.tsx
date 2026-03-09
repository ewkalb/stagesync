// app/account/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Navbar from '@/components/Navbar';

export default function AccountPage() {
  const [username, setUsername] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [tempUsername, setTempUsername] = useState('');
  const [loading, setLoading] = useState(true);

  const [incomingRequests, setIncomingRequests] = useState<any[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<any[]>([]);
  const [friends, setFriends] = useState<any[]>([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const supabase = createClient();

  const loadProfile = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return setLoading(false);

    const { data } = await supabase.from('profiles').select('username').eq('id', user.id).single();
    setUsername(data?.username || '');
    setTempUsername(data?.username || '');
    setLoading(false);
  };

  const fetchAll = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 1. Get raw requests
    const { data: incomingData } = await supabase
      .from('friend_requests')
      .select('id, requester_id, status')
      .eq('requestee_id', user.id)
      .eq('status', 'pending');

    const { data: outgoingData } = await supabase
      .from('friend_requests')
      .select('id, requestee_id, status')
      .eq('requester_id', user.id)
      .eq('status', 'pending');

    const { data: acceptedData } = await supabase
      .from('friend_requests')
      .select('id, requester_id, requestee_id')
      .eq('status', 'accepted')
      .or(`requester_id.eq.${user.id},requestee_id.eq.${user.id}`);

    // 2. Collect all user IDs we need usernames for
    const userIds = new Set<string>();
    incomingData?.forEach(r => userIds.add(r.requester_id));
    outgoingData?.forEach(r => userIds.add(r.requestee_id));
    acceptedData?.forEach(r => {
      userIds.add(r.requester_id);
      userIds.add(r.requestee_id);
    });

    // 3. Fetch usernames once
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('id, username')
      .in('id', Array.from(userIds));

    const usernameMap = new Map(profilesData?.map(p => [p.id, p.username]) || []);

    // 4. Map with real usernames
    const incoming = (incomingData || []).map(r => ({
      ...r,
      username: usernameMap.get(r.requester_id) || r.requester_id
    }));

    const outgoing = (outgoingData || []).map(r => ({
      ...r,
      username: usernameMap.get(r.requestee_id) || r.requestee_id
    }));

    const friendsList = (acceptedData || []).map(r => ({
      id: r.id,
      username: usernameMap.get(user.id === r.requester_id ? r.requestee_id : r.requester_id) || 'Unknown'
    }));

    setIncomingRequests(incoming);
    setOutgoingRequests(outgoing);
    setFriends(friendsList);
  };

  useEffect(() => {
    loadProfile();
    fetchAll();
  }, []);

  const startEditing = () => {
    setTempUsername(username);
    setIsEditing(true);
  };

  const saveUsername = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('profiles').update({ username: tempUsername }).eq('id', user.id);
    if (error) toast.error(error.message);
    else {
      setUsername(tempUsername);
      toast.success('Public username saved!');
      setIsEditing(false);
    }
  };

  const cancelEditing = () => {
    setTempUsername(username);
    setIsEditing(false);
  };

  const searchUsers = async () => {
    if (!searchTerm) return;
    const { data } = await supabase
      .from('profiles')
      .select('id, username')
      .ilike('username', `%${searchTerm}%`)
      .limit(5);
    setSearchResults(data || []);
  };

  const sendRequest = async (requesteeId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('friend_requests').insert({ requester_id: user.id, requestee_id: requesteeId });
    if (error) toast.error(error.message);
    else {
      toast.success('Friend request sent!');
      fetchAll();
    }
  };

  const acceptRequest = async (requestId: string) => {
    const { error } = await supabase.from('friend_requests').update({ status: 'accepted' }).eq('id', requestId);
    if (error) toast.error(error.message);
    else {
      toast.success('Friend request accepted!');
      fetchAll();
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  return (
    <>
      <Navbar />
      <div className="container mx-auto p-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Account Settings</CardTitle>
            <CardDescription>Public username + manage friends</CardDescription>
          </CardHeader>
          <CardContent className="space-y-10">
            {/* Public Username */}
            <div>
              <Label className="text-base">Public Username</Label>
              <p className="text-sm text-muted-foreground mb-3">This is how your friends will see you</p>

              {loading ? (
                <p>Loading...</p>
              ) : isEditing ? (
                <div className="flex gap-3">
                  <Input value={tempUsername} onChange={(e) => setTempUsername(e.target.value)} className="flex-1" />
                  <Button onClick={saveUsername}>Save</Button>
                  <Button variant="outline" onClick={cancelEditing}>Cancel</Button>
                </div>
              ) : (
                <div className="flex items-center gap-4 bg-muted/50 p-4 rounded-xl">
                  <div className="text-2xl font-mono">@{username || 'not-set'}</div>
                  <Button onClick={startEditing} variant="outline" size="sm">Change</Button>
                </div>
              )}
            </div>

            {/* Friends Management */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <Label className="text-base">Friends</Label>
                <Button variant="outline" size="sm" onClick={fetchAll}>Refresh</Button>
              </div>
              <p className="text-sm text-muted-foreground mb-3">Send and manage friend requests</p>

              <div className="flex gap-2">
                <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search username" />
                <Button onClick={searchUsers}>Search</Button>
              </div>

              {searchResults.length > 0 && (
                <div className="mt-4 space-y-2">
                  {searchResults.map(u => (
                    <div key={u.id} className="flex justify-between items-center p-3 bg-muted rounded">
                      <span>@{u.username}</span>
                      <Button size="sm" onClick={() => sendRequest(u.id)}>Send Request</Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Incoming Requests */}
              {incomingRequests.length > 0 && (
                <div className="mt-8">
                  <div className="text-sm font-medium mb-2">Incoming Requests</div>
                  {incomingRequests.map(r => (
                    <div key={r.id} className="flex justify-between items-center p-3 bg-muted rounded mt-2">
                      <span>Request from @{r.username}</span>
                      <Button size="sm" onClick={() => acceptRequest(r.id)}>Accept</Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Outgoing Requests */}
              {outgoingRequests.length > 0 && (
                <div className="mt-8">
                  <div className="text-sm font-medium mb-2">Pending Requests Sent</div>
                  {outgoingRequests.map(r => (
                    <div key={r.id} className="p-3 border rounded mt-2">
                      Waiting for @{r.username}
                    </div>
                  ))}
                </div>
              )}

              {/* Accepted Friends */}
              <div className="mt-8">
                <div className="text-sm font-medium mb-2">Your Friends ({friends.length})</div>
                {friends.length === 0 ? (
                  <p className="text-muted-foreground">No friends yet</p>
                ) : (
                  friends.map(f => (
                    <div key={f.id} className="p-3 border rounded mt-2">
                      @{f.username}
                    </div>
                  ))
                )}
              </div>
            </div>

            <Button onClick={logout} variant="destructive" className="w-full">
              Logout
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}