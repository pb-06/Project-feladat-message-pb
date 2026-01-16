import { useState, useEffect } from 'react';

import { RedirectToSignIn, SignedIn, UserButton } from '@neondatabase/neon-js/auth/react/ui';
import { authClient } from '../lib/auth';

import { Mail, Send, Inbox, Trash2 } from 'lucide-react';

import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';


// API helper
async function apiRequest(endpoint: string, userId: string, options: any = {}) {
  const response = await fetch(`/api${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': userId,
      ...options.headers,
    },
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || 'Hiba történt');
  }
  return result;
}

interface Message {
  id: number;
  sender_id: string;
  receiver_id: string;
  sender_email?: string;
  sender_name?: string;
  receiver_email?: string;
  receiver_name?: string;
  subject?: string;
  content: string;
  is_read: boolean;
  sent_at: string;
}

// INBOX TAB
function InboxTab({ userId }: { userId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  const [cimzett, setCimzett] = useState('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    try {
      const result = await apiRequest('/messages/inbox', userId);
      setMessages(result.data || []);
    } catch (err: any) {
      alert('Hiba: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!cimzett || !content.trim()) {
      alert('Válassz címzettet és írj üzenetet!');
      return;
    }

    setSending(true);
    try {
      await apiRequest('/messages', userId, {
        method: 'POST',
        body: JSON.stringify({
          receiver_email: cimzett,
          subject,
          content,
        }),
      });
      alert('✅ Üzenet elküldve!');
      setSubject('');
      setContent('');
      setCimzett('');
      await loadMessages();
    } catch (err: any) {
      alert('Hiba: ' + err.message);
    } finally {
      setSending(false);
    }
  };

  const deleteMsg = async (id: number) => {
    if (!confirm('Törlöd?')) return;
    try {
      await apiRequest(`/messages?id=${id}`, userId, { method: 'DELETE' });
      setMessages(messages.filter(m => m.id !== id));
    } catch (err: any) {
      alert('Hiba: ' + err.message);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-600">Betöltés...</div>;
  }

  return (
    <div>
      <div className="flex justify-between mb-12">
        <h2 className="text-2xl font-bold">Beérkezett üzenetek</h2>

        <Dialog>
          <DialogTrigger>
            <Button size={'lg'} className='font-bold'>+ Új üzenet</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Új üzenet</DialogTitle>
              <DialogDescription>Küldj üzenetet valakinek</DialogDescription>
            </DialogHeader>

            <div className="grid gap-4">
              <div className="grid gap-4">
                <Label htmlFor="cimzett">Címzett</Label>
                <Input type='text' id="cimzett" name="cimzett" placeholder='Keress valakit...' onChange={(e) => setCimzett(e.target.value)} />
              </div>
              <div className="grid gap-4">
                <Label htmlFor="targy">Tárgy (opcionális)</Label>
                <Input type="text" id="targy" name="targy" placeholder="Tárgy..." value={subject} onChange={(e) => setSubject(e.target.value)} />
              </div>
              <div className="grid gap-4">
                <Label htmlFor="uzenet">Üzenet</Label>
                <Textarea id="uzenet" name="uzenet" placeholder="Írj üzenetet..." rows={5} value={content} onChange={(e) => setContent(e.target.value)} />
              </div>
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button
                  variant="outline"
                  onClick={() => {
                    setCimzett('');
                    setSubject('');
                    setContent('');
                  }}
                >
                  Mégsem
                </Button>
              </DialogClose>
              <Button
                type="submit"
                onClick={sendMessage}
                disabled={sending || !cimzett || !content.trim()}
              >
                Küldés
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Messages */}
      {messages.length === 0 ? (
        <div className="bg-gray-800 rounded-lg shadow p-12 text-center">
          <Inbox className="mx-auto text-gray-400 mb-4" size={48} />
          <p className="text-gray-600">Nincs üzeneted</p>
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`bg-gray-800 rounded-lg shadow p-4 border-l-4 ${msg.is_read ? 'border-gray-300' : 'border-blue-500'
                }`}
            >
              <div className="flex justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold">{msg.sender_name || msg.sender_email}</span>
                    {!msg.is_read && <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded">ÚJ</span>}
                  </div>
                  {msg.subject && <h4 className="font-semibold mb-1">{msg.subject}</h4>}
                  <p className="text-gray-700 text-sm mb-2">{msg.content}</p>
                  <p className="text-xs text-gray-500">{new Date(msg.sent_at).toLocaleString('hu-HU')}</p>
                </div>
                <button
                  onClick={() => deleteMsg(msg.id)}
                  className="text-red-500 hover:text-red-700 p-2"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// SENT TAB
function SentTab({ userId }: { userId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    try {
      const result = await apiRequest('/messages/sent', userId);
      setMessages(result.data || []);
    } catch (err: any) {
      alert('Hiba: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteMsg = async (id: number) => {
    if (!confirm('Törlöd?')) return;
    try {
      await apiRequest(`/messages?id=${id}`, userId, { method: 'DELETE' });
      setMessages(messages.filter(m => m.id !== id));
    } catch (err: any) {
      alert('Hiba: ' + err.message);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-600">Betöltés...</div>;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 mt-32">Elküldött üzenetek</h2>
      {messages.length === 0 ? (
        <div className="bg-gray-600 rounded-lg shadow p-12 text-center">
          <Send className="mx-auto text-gray-400 mb-4" size={48} />
          <p className="text-white">Még nem küldtél üzenetet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map((msg) => (
            <div key={msg.id} className="bg-gray-400 rounded-lg shadow p-4 border-l-4 border-green-400">
              <div className="flex justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-gray-600">➡️</span>
                    <span className="font-bold">{msg.receiver_name || msg.receiver_email}</span>
                    {msg.is_read && <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded">✓ ELOLVASVA</span>}
                  </div>
                  {msg.subject && <h4 className="font-semibold mb-1">{msg.subject}</h4>}
                  <p className="text-gray-700 text-sm mb-2">{msg.content}</p>
                  <p className="text-xs text-gray-500">{new Date(msg.sent_at).toLocaleString('hu-HU')}</p>
                </div>
                <button
                  onClick={() => deleteMsg(msg.id)}
                  className="text-red-500 hover:text-red-700 p-2"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function Home() {
  const [userId, setUserId] = useState('');
  const [synced, setSynced] = useState(false);

  {/* Load user ID on mount */ }
  useEffect(() => {
    const loadUser = async () => {
      try {
        const session = await authClient.getSession();
        const user = (session?.data as any)?.user;
        if (user?.id) {
          setUserId(user.id);
        }
      } catch (err) {
        console.error(err);
      }
    };
    loadUser();
  }, []);

  {/* Sync user */ }
  useEffect(() => {
    const syncUser = async () => {
      if (userId && !synced) {
        try {
          await apiRequest('/users/sync', userId, {
            method: 'POST',
            body: JSON.stringify({ userId, email: userId, full_name: '' }),
          });
          setSynced(true);
        } catch (err) {
          console.error(err);
        }
      }
    };
    syncUser();
  }, [userId, synced]);

  return (
    <>
      <SignedIn>
        <div className='container mx-auto px-4 sm:px-6 lg:px-8'>
          {/* Navbar */}
          <nav className='flex justify-between items-center h-32'>
            <div className='flex items-center gap-2'>
              <Mail className="text-blue-600" size={28} />
              <h1 className="text-2xl font-bold">Üzenetküldő</h1>
            </div>

            <UserButton />
          </nav>

          {/* Tabs */}
          <Tabs defaultValue="inbox">
            <TabsList className='w-full h-12'>
              <TabsTrigger value="inbox">Bejövő üzenetek</TabsTrigger>
              <TabsTrigger value="sent">Elküldött üzenetek</TabsTrigger>
            </TabsList>
            <TabsContent value="inbox"><InboxTab userId={userId} /></TabsContent>
            <TabsContent value="sent"><SentTab userId={userId} /></TabsContent>
          </Tabs>
        </div>
      </SignedIn>
      <RedirectToSignIn />
    </>
  );
}