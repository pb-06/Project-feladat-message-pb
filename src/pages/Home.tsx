import { RedirectToSignIn, SignedIn, UserButton } from '@neondatabase/neon-js/auth/react/ui';
import { useState, useEffect } from 'react';
import { authClient } from '../lib/auth';
import { Mail, Send, Inbox, Trash2, X, Search } from 'lucide-react';

// API helper function
async function apiRequest(endpoint: string, userId: string, options: any = {}) {
  try {
    const url = `/api${endpoint}`;
    console.log(`📤 API Request: ${options.method || 'GET'} ${url}`, { userId, endpoint });
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
        ...options.headers,
      },
    });

    const result = await response.json();
    console.log(`📥 API Response:`, { status: response.status, data: result });

    if (!response.ok) {
      const errorMsg = result.error || result.message || 'Hiba történt';
      console.error(`❌ API Error: ${response.status} - ${errorMsg}`);
      throw new Error(errorMsg);
    }

    return result;
  } catch (error: any) {
    console.error(`🔴 API Request Failed:`, error);
    throw error;
  }
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
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    try {
      console.log('📬 Loading inbox messages...');
      const result = await apiRequest('/messages/inbox', userId);
      console.log('📬 Inbox loaded:', result.data);
      setMessages(result.data || []);
    } catch (err: any) {
      console.error('❌ Load messages error:', err);
      alert(`Hiba az üzenetek betöltése közben: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async () => {
    if (searchTerm.length < 2) {
      setUsers([]);
      return;
    }
    try {
      console.log('🔍 Searching users:', searchTerm);
      const result = await apiRequest(`/users/search?q=${encodeURIComponent(searchTerm)}`, userId);
      console.log('🔍 Search results:', result.data);
      setUsers(result.data || []);
    } catch (err: any) {
      console.error('❌ Search error:', err);
      setUsers([]);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedUser) {
      alert('Válassz címzettet!');
      return;
    }

    if (!content.trim()) {
      alert('Az üzenet nem lehet üres!');
      return;
    }

    setSending(true);
    try {
      console.log('📨 Sending message to:', selectedUser.email);
      await apiRequest('/messages', userId, {
        method: 'POST',
        body: JSON.stringify({
          receiver_email: selectedUser.email,
          subject,
          content,
        }),
      });
      
      console.log('✅ Message sent successfully');
      alert('✅ Üzenet sikeresen elküldve!');
      
      // Reset forma
      setSubject('');
      setContent('');
      setSelectedUser(null);
      setSearchTerm('');
      setShowNewMessage(false);
      
      // Üzenetek újratöltése
      loadMessages();
    } catch (err: any) {
      console.error('❌ Send message error:', err);
      alert(`Hiba az üzenet küldésekor: ${err.message}`);
    } finally {
      setSending(false);
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
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800">Beérkezett üzenetek</h2>
        <button
          onClick={() => setShowNewMessage(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 font-semibold"
        >
          <Send size={18} />
          + Új üzenet
        </button>
      </div>
      
      {/* Új üzenet modal */}
      {showNewMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">Új üzenet</h3>
              <button
                onClick={() => {
                  setShowNewMessage(false);
                  setSelectedUser(null);
                  setSearchTerm('');
                  setSubject('');
                  setContent('');
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            {/* Címzett kiválasztás */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Címzett *
              </label>

              {selectedUser ? (
                <div className="flex items-center justify-between bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <div>
                    <div className="font-medium text-blue-900">
                      {selectedUser.full_name || selectedUser.email}
                    </div>
                    <div className="text-xs text-blue-700">{selectedUser.email}</div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedUser(null);
                      setSearchTerm('');
                      setUsers([]);
                    }}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <X size={18} />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <div className="flex items-center">
                    <Search className="absolute left-3 text-gray-400" size={18} />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        if (e.target.value.length > 1) {
                          searchUsers();
                        }
                      }}
                      placeholder="Keress email vagy név..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>

                  {users.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                      {users.map((u) => (
                        <button
                          key={u.id}
                          onClick={() => {
                            setSelectedUser(u);
                            setSearchTerm('');
                            setUsers([]);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-gray-50 border-b last:border-b-0 text-sm"
                        >
                          <div className="font-medium text-gray-900">
                            {u.full_name || 'Névtelen'}
                          </div>
                          <div className="text-xs text-gray-500">{u.email}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Tárgy */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tárgy (opcionális)
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Üzenet tárgy..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>

            {/* Üzenet */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Üzenet *
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Írd ide az üzenetét..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>

            {/* Gombók */}
            <div className="flex gap-2 pt-4">
              <button
                onClick={handleSendMessage}
                disabled={sending || !selectedUser || !content.trim()}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
              >
                {sending ? 'Küldés...' : (
                  <>
                    <Send size={16} />
                    Küldés
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setShowNewMessage(false);
                  setSelectedUser(null);
                  setSearchTerm('');
                  setSubject('');
                  setContent('');
                }}
                className="flex-1 bg-gray-300 text-gray-800 py-2 rounded-lg font-semibold hover:bg-gray-400 text-sm"
              >
                Mégse
              </button>
            </div>
          </div>
        </div>
      )}
      
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

// Sent Messages komponens
function SentMessagesTab({ userId }: { userId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    try {
      console.log('📤 Loading sent messages...');
      const result = await apiRequest('/messages/sent', userId);
      console.log('📤 Sent messages loaded:', result.data);
      setMessages(result.data || []);
    } catch (err: any) {
      console.error('❌ Load sent messages error:', err);
      alert(`Hiba az üzenetek betöltése közben: ${err.message}`);
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
  const [showSeedBtn, setShowSeedBtn] = useState(false);
  const [seedLoading, setSeedLoading] = useState(false);

  useEffect(() => {
    // User adatok lekérése az authClient-ből
    const loadUser = async () => {
      try {
        console.log('👤 Loading user data...');
        const session = await authClient.getSession();
        console.log('✅ Session received:', session);
        
        // Az authClient.getSession() { data: { user: {...} }} struktúrát ad vissza
        const user = (session?.data as any)?.user;
        console.log('👤 User object:', user);
        
        if (user?.id) {
          console.log('✅ User ID found:', user.id);
          setUserId(user.id);
          setUserEmail(user.email || '');
          setUserName(user.name || '');
        } else {
          console.warn('⚠️ No user ID found in session');
        }
      } catch (err) {
        console.error('❌ Load user error:', err);
      }
    };

    loadUser();
  }, []);

  useEffect(() => {
    // Felhasználó szinkronizálása az adatbázisba
    const syncUser = async () => {
      if (userId && !synced) {
        try {
          console.log('🔄 Syncing user to database...', { userId, userEmail, userName });
          const result = await apiRequest('/users/sync', userId, {
            method: 'POST',
            body: JSON.stringify({
              userId: userId,
              email: userEmail || userId,
              full_name: userName,
            }),
          });
          console.log('✅ User synced successfully:', result);
          setSynced(true);
        } catch (err: any) {
          console.error('❌ User sync error:', err);
        }
      }
    };

    syncUser();
  }, [userId, synced, userEmail, userName]);

  const seedDatabase = async () => {
    setSeedLoading(true);
    try {
      console.log('🌱 Starting database seed...');
      const response = await fetch('/api/seed/demo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      console.log('✅ Seed result:', result);

      if (!response.ok) {
        alert(`Hiba: ${result.error}`);
        return;
      }

      alert(`✅ ${result.message}\n\n${result.usersCreated} felhasználó és ${result.messagesCreated} üzenet létrehozva!`);
      setShowSeedBtn(false);
    } catch (err: any) {
      console.error('❌ Seed error:', err);
      alert(`Seed hiba: ${err.message}`);
    } finally {
      setSeedLoading(false);
    }
  };

  const tabs = [
    { id: 'inbox' as const, label: 'Beérkezett', icon: Inbox },
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

                <div className="flex items-center gap-4">
                  {!showSeedBtn && userId && (
                    <button
                      onClick={() => setShowSeedBtn(true)}
                      className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded hover:bg-yellow-200"
                    >
                      🌱 Demo adatok
                    </button>
                  )}
                  <UserButton />
                </div>
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
            {showSeedBtn && (
              <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h3 className="font-semibold text-yellow-900 mb-2">🌱 Adatbázis feltöltése</h3>
                <p className="text-sm text-yellow-800 mb-3">
                  Szeretnéd feltölteni az adatbázist demo adatokkal? Ez 4 felhasználót és 6 üzenetet hoz létre.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={seedDatabase}
                    disabled={seedLoading}
                    className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 disabled:opacity-50"
                  >
                    {seedLoading ? 'Betöltés...' : '✅ Igen, töltsd fel'}
                  </button>
                  <button
                    onClick={() => setShowSeedBtn(false)}
                    className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
                  >
                    ❌ Mégse
                  </button>
                </div>
              </div>
            )}

            {!userId ? (
              <div className="text-center py-12">Betöltés...</div>
            ) : (
              <>
                {activeTab === 'inbox' && <MessagesTab userId={userId} />}
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