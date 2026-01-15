import { RedirectToSignIn, SignedIn, UserButton } from '@neondatabase/neon-js/auth/react/ui';
import { useState, useEffect } from 'react';
import { authClient } from '../lib/auth';
import { Mail, Send, Inbox, Trash2, X, Search, MessageSquare } from 'lucide-react';

// API helper function
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

// Message type
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
  read_at?: string;
}

// User type
interface User {
  id: string;
  email: string;
  full_name?: string;
}

// Inbox komponens
function MessagesTab({ userId }: { userId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    try {
      const result = await apiRequest('/messages/inbox', userId);
      setMessages(result.data || []);
    } catch (err) {
      console.error('Load messages error:', err);
      alert('Hiba az üzenetek betöltése közben');
    } finally {
      setLoading(false);
    }
  };

  const deleteMessage = async (id: number) => {
    if (!confirm('Biztosan törölni szeretnéd ezt az üzenetet?')) return;

    try {
      await apiRequest(`/messages?id=${id}`, userId, { method: 'DELETE' });
      setMessages(messages.filter(m => m.id !== id));
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Betöltés...</div>;
  }

  return (
    <div className="space-y-3">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Beérkezett üzenetek</h2>
      
      {messages.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Inbox className="mx-auto text-gray-400 mb-4" size={64} />
          <p className="text-gray-600 text-lg">Nincs még üzeneted</p>
        </div>
      ) : (
        messages.map((msg) => (
          <div
            key={msg.id}
            className={`bg-white rounded-lg shadow hover:shadow-md transition p-4 ${
              !msg.is_read ? 'border-l-4 border-blue-500' : ''
            }`}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-gray-800">
                    {msg.sender_name || msg.sender_email}
                  </span>
                  {!msg.is_read && (
                    <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                      Új
                    </span>
                  )}
                </div>

                {msg.subject && (
                  <h3 className="font-medium text-gray-700 mb-1">{msg.subject}</h3>
                )}

                <p className="text-gray-600 text-sm mb-2">
                  {msg.content}
                </p>

                <p className="text-xs text-gray-500">
                  {new Date(msg.sent_at).toLocaleString('hu-HU')}
                </p>
              </div>

              <button
                onClick={() => deleteMessage(msg.id)}
                className="ml-4 text-red-500 hover:text-red-700 p-2"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// Send Message komponens
function SendMessageTab({ userId }: { userId: string }) {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (searchTerm.length > 1) {
      searchUsers();
    } else {
      setUsers([]);
    }
  }, [searchTerm]);

  const searchUsers = async () => {
    try {
      const result = await apiRequest(`/users/search?q=${searchTerm}`, userId);
      setUsers(result.data || []);
    } catch (err) {
      console.error('Search error:', err);
    }
  };

  const handleSubmit = async () => {
    if (!selectedUser) {
      alert('Válassz címzettet!');
      return;
    }

    if (!content.trim()) {
      alert('Az üzenet nem lehet üres!');
      return;
    }

    try {
      await apiRequest('/messages', userId, {
        method: 'POST',
        body: JSON.stringify({
          receiver_email: selectedUser.email,
          subject,
          content,
        }),
      });

      setSuccess(true);
      setSubject('');
      setContent('');
      setSelectedUser(null);
      setSearchTerm('');

      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Új üzenet</h2>

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
          Üzenet sikeresen elküldve!
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Címzett
          </label>

          {selectedUser ? (
            <div className="flex items-center justify-between bg-blue-50 p-3 rounded-lg">
              <div>
                <div className="font-medium text-blue-900">
                  {selectedUser.full_name || selectedUser.email}
                </div>
                <div className="text-sm text-blue-700">{selectedUser.email}</div>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-blue-600 hover:text-blue-800"
              >
                <X size={20} />
              </button>
            </div>
          ) : (
            <div className="relative">
              <div className="flex items-center">
                <Search className="absolute left-3 text-gray-400" size={20} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Keress email vagy név alapján..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {users.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {users.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => {
                        setSelectedUser(u);
                        setSearchTerm('');
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b last:border-b-0"
                    >
                      <div className="font-medium text-gray-900">
                        {u.full_name || 'Névtelen'}
                      </div>
                      <div className="text-sm text-gray-500">{u.email}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tárgy (opcionális)
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Tárgy..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Üzenet *
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Írd ide az üzeneted..."
            rows={8}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <button
          onClick={handleSubmit}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2"
        >
          <Send size={20} />
          Küldés
        </button>
      </div>
    </div>
  );
}

// Sent Messages komponens
function SentMessagesTab({ userId }: { userId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    try {
      const result = await apiRequest('/messages/sent', userId);
      setMessages(result.data || []);
    } catch (err) {
      console.error('Load sent messages error:', err);
      alert('Hiba az üzenetek betöltése közben');
    } finally {
      setLoading(false);
    }
  };

  const deleteMessage = async (id: number) => {
    if (!confirm('Biztosan törölni szeretnéd ezt az üzenetet?')) return;

    try {
      await apiRequest(`/messages?id=${id}`, userId, { method: 'DELETE' });
      setMessages(messages.filter(m => m.id !== id));
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Betöltés...</div>;
  }

  return (
    <div className="space-y-3">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Elküldött üzenetek</h2>

      {messages.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Send className="mx-auto text-gray-400 mb-4" size={64} />
          <p className="text-gray-600 text-lg">Még nem küldtél üzenetet</p>
        </div>
      ) : (
        messages.map((msg) => (
          <div key={msg.id} className="bg-white rounded-lg shadow hover:shadow-md transition p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm text-gray-500">Címzett:</span>
                  <span className="font-semibold text-gray-800">
                    {msg.receiver_name || msg.receiver_email}
                  </span>
                  {msg.is_read && (
                    <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">
                      Elolvasva
                    </span>
                  )}
                </div>

                {msg.subject && (
                  <h3 className="font-medium text-gray-700 mb-1">{msg.subject}</h3>
                )}

                <p className="text-gray-600 text-sm mb-2">
                  {msg.content}
                </p>

                <p className="text-xs text-gray-500">
                  {new Date(msg.sent_at).toLocaleString('hu-HU')}
                </p>
              </div>

              <button
                onClick={() => deleteMessage(msg.id)}
                className="ml-4 text-red-500 hover:text-red-700 p-2"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// Main Home komponens
export function Home() {
  const [activeTab, setActiveTab] = useState<'inbox' | 'send' | 'sent'>('inbox');
  const [synced, setSynced] = useState(false);
  const [userId, setUserId] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
  const [userName, setUserName] = useState<string>('');

  useEffect(() => {
    // User adatok lekérése az authClient-ből
    const loadUser = async () => {
      try {
        const session = await authClient.getSession();
        console.log('Session:', session);
        
        // Az authClient.getSession() { data: { user: {...} }} struktúrát ad vissza
        const user = (session?.data as any)?.user;
        if (user?.id) {
          setUserId(user.id);
          setUserEmail(user.email || '');
          setUserName(user.name || '');
        }
      } catch (err) {
        console.error('Load user error:', err);
      }
    };

    loadUser();
  }, []);

  useEffect(() => {
    // Felhasználó szinkronizálása az adatbázisba
    const syncUser = async () => {
      if (userId && !synced) {
        try {
          await apiRequest('/users/sync', userId, {
            method: 'POST',
            body: JSON.stringify({
              userId: userId,
              email: userEmail || userId,
              full_name: userName,
            }),
          });
          setSynced(true);
        } catch (err) {
          console.error('User sync error:', err);
        }
      }
    };

    syncUser();
  }, [userId, synced, userEmail, userName]);

  const tabs = [
    { id: 'inbox' as const, label: 'Beérkezett', icon: Inbox },
    { id: 'send' as const, label: 'Új üzenet', icon: MessageSquare },
    { id: 'sent' as const, label: 'Elküldött', icon: Send },
  ];

  return (
    <>
      <SignedIn>
        <div className="min-h-screen bg-gray-50">
          {/* Header */}
          <header className="bg-white shadow-sm sticky top-0 z-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-600 p-2 rounded-lg">
                    <Mail className="text-white" size={24} />
                  </div>
                  <h1 className="text-xl font-bold text-gray-900">Üzenetküldő</h1>
                </div>

                <UserButton />
              </div>
            </div>

            {/* Tabs */}
            <div className="border-t border-gray-200">
              <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-3 border-b-2 transition ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                    }`}
                  >
                    <tab.icon size={18} />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </header>

          {/* Main content */}
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {!userId ? (
              <div className="text-center py-12">Betöltés...</div>
            ) : (
              <>
                {activeTab === 'inbox' && <MessagesTab userId={userId} />}
                {activeTab === 'send' && <SendMessageTab userId={userId} />}
                {activeTab === 'sent' && <SentMessagesTab userId={userId} />}
              </>
            )}
          </main>
        </div>
      </SignedIn>
      <RedirectToSignIn />
    </>
  );
}