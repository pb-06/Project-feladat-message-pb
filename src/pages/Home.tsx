import { RedirectToSignIn, SignedIn, UserButton } from '@neondatabase/neon-js/auth/react/ui';
import { useState, useEffect } from 'react';
import { authClient } from '../lib/auth';
import { Mail, Send, Inbox, Trash2 } from 'lucide-react';

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

interface User {
  id: string;
  email: string;
  full_name?: string;
}

// INBOX TAB
function InboxTab({ userId }: { userId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<User | null>(null);
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

  const searchUsers = async (q: string) => {
    if (q.length < 2) {
      setUsers([]);
      return;
    }
    try {
      const result = await apiRequest(`/users/search?q=${encodeURIComponent(q)}`, userId);
      setUsers(result.data || []);
    } catch (err) {
      setUsers([]);
    }
  };

  const sendMessage = async () => {
    if (!selected || !content.trim()) {
      alert('Válassz címzettet és írj üzenetet!');
      return;
    }

    setSending(true);
    try {
      await apiRequest('/messages', userId, {
        method: 'POST',
        body: JSON.stringify({
          receiver_email: selected.email,
          subject,
          content,
        }),
      });
      alert('✅ Üzenet elküldve!');
      setSubject('');
      setContent('');
      setSelected(null);
      setSearch('');
      setShowForm(false);
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
      <div className="flex justify-between mb-6">
        <h2 className="text-2xl font-bold">Beérkezett üzenetek</h2>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          + Új üzenet
        </button>
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 text-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Új üzenet</h3>

            <div className="mb-4">
              <label className="block text-sm font-semibold mb-2">Címzett</label>
              {selected ? (
                <div className="bg-blue-50 p-3 rounded flex justify-between">
                  <div>
                    <div className="font-semibold">{selected.full_name || selected.email}</div>
                    <div className="text-xs text-gray-600">{selected.email}</div>
                  </div>
                  <button
                    onClick={() => {
                      setSelected(null);
                      setSearch('');
                      setUsers([]);
                    }}
                    className="text-red-500 hover:text-red-700"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      searchUsers(e.target.value);
                    }}
                    placeholder="Keress..."
                    className="w-full px-3 py-2 border rounded"
                  />
                  {users.length > 0 && (
                    <div className="absolute w-full mt-1 bg-gray-800 text-white border rounded shadow-lg max-h-40 overflow-y-auto z-10">
                      {users.map((u) => (
                        <button
                          key={u.id}
                          onClick={() => {
                            setSelected(u);
                            setSearch('');
                            setUsers([]);
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-gray-100 border-b"
                        >
                          <div className="font-semibold">{u.full_name || u.email}</div>
                          <div className="text-xs text-gray-600">{u.email}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold mb-2">Tárgy (opcionális)</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Tárgy..."
                className="w-full px-3 py-2 border rounded"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold mb-2">Üzenet</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Írj üzenetet..."
                rows={5}
                className="w-full px-3 py-2 border rounded"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={sendMessage}
                disabled={sending || !selected || !content.trim()}
                className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {sending ? 'Küldés...' : 'Küldés'}
              </button>
              <button
                onClick={() => {
                  setShowForm(false);
                  setSelected(null);
                  setSearch('');
                  setSubject('');
                  setContent('');
                  setUsers([]);
                }}
                className="flex-1 bg-gray-300 text-gray-800 py-2 rounded hover:bg-gray-400"
              >
                Mégsem
              </button>
            </div>
          </div>
        </div>
      )}

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
              className={`bg-gray-800 rounded-lg shadow p-4 border-l-4 ${
                msg.is_read ? 'border-gray-300' : 'border-blue-500'
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
      <h2 className="text-2xl font-bold mb-6">Elküldött üzenetek</h2>
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

// MAIN
export function Home() {
  const [tab, setTab] = useState<'inbox' | 'sent'>('inbox');
  const [userId, setUserId] = useState('');
  const [synced, setSynced] = useState(false);
  const [showSeed, setShowSeed] = useState(false);
  const [seedLoading, setSeedLoading] = useState(false);

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

  const seed = async () => {
    setSeedLoading(true);
    try {
      const res = await fetch('/api/seed/demo', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      alert('✅ ' + data.usersCreated + ' felhasználó és ' + data.messagesCreated + ' üzenet létrehozva!');
      setShowSeed(false);
    } catch (err: any) {
      alert('Hiba: ' + err.message);
    } finally {
      setSeedLoading(false);
    }
  };

  return (
    <>
      <SignedIn>
        <div className="min-h-screen bg-black">
          <header className="bg-gray-600 shadow sticky top-0 z-20">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Mail className="text-blue-600" size={28} />
                <h1 className="text-2xl font-bold text-gray-900">Üzenetküldő</h1>
              </div>
              <div className="flex items-center gap-4">
                {!showSeed && userId && (
                  <button
                    onClick={() => setShowSeed(true)}
                    className="text-sm bg-yellow-100 text-yellow-800 px-3 py-1 rounded hover:bg-yellow-200"
                  >
                    🌱 Demo
                  </button>
                )}
                <UserButton />
              </div>
            </div>
            <div className="border-t">
              <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex">
                <button
                  onClick={() => setTab('inbox')}
                  className={`px-4 py-3 border-b-2 font-semibold ${
                    tab === 'inbox' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-600'
                  }`}
                >
                  📬 Beérkezett
                </button>
                <button
                  onClick={() => setTab('sent')}
                  className={`px-4 py-3 border-b-2 font-semibold ${
                    tab === 'sent' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-600'
                  }`}
                >
                  📤 Elküldött
                </button>
              </div>
            </div>
          </header>

          <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {showSeed && (
              <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-bold text-yellow-900 mb-2">🌱 Demo adatok feltöltése</h3>
                <p className="text-sm text-yellow-800 mb-3">4 felhasználó és 6 üzenet létrehozása</p>
                <div className="flex gap-2">
                  <button
                    onClick={seed}
                    disabled={seedLoading}
                    className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 disabled:opacity-50"
                  >
                    {seedLoading ? '⏳' : '✅'} Feltöltés
                  </button>
                  <button
                    onClick={() => setShowSeed(false)}
                    className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
                  >
                    Mégsem
                  </button>
                </div>
              </div>
            )}

            {!userId ? (
              <div className="text-center py-20 text-gray-600">⏳ Betöltés...</div>
            ) : (
              <>
                {tab === 'inbox' && <InboxTab userId={userId} />}
                {tab === 'sent' && <SentTab userId={userId} />}
              </>
            )}
          </main>
        </div>
      </SignedIn>
      <RedirectToSignIn />
    </>
  );
}
