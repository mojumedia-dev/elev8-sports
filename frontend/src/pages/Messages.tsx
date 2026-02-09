import { useState, useEffect, FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../hooks/useApi';
import { api } from '../utils/api';
import Card from '../components/Card';

export default function Messages() {
  const { token, user } = useAuth();
  const { data: teams } = useApi<any[]>('/teams');
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingMsgs, setLoadingMsgs] = useState(false);

  useEffect(() => {
    if (selectedTeam && token) {
      setLoadingMsgs(true);
      api<any[]>(`/messages/team/${selectedTeam}`, { token })
        .then(setMessages)
        .catch(() => {})
        .finally(() => setLoadingMsgs(false));
    }
  }, [selectedTeam, token]);

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedTeam) return;
    const msg = await api<any>('/messages', { method: 'POST', body: { content: newMessage, teamId: selectedTeam }, token: token! });
    setMessages([...messages, msg]);
    setNewMessage('');
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-secondary">Messages</h1>
        <p className="text-gray-500 mt-1">Team chat and direct messages.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <h2 className="text-sm font-semibold text-gray-500 uppercase mb-3">Team Channels</h2>
            {teams?.length === 0 ? (
              <p className="text-gray-400 text-sm">No teams yet.</p>
            ) : (
              <div className="space-y-1">
                {teams?.map((team: any) => (
                  <button key={team.id} onClick={() => setSelectedTeam(team.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${
                      selectedTeam === team.id ? 'bg-primary text-white' : 'hover:bg-slate text-secondary'
                    }`}>
                    # {team.name}
                  </button>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="lg:col-span-3">
          <Card className="h-[600px] flex flex-col">
            {!selectedTeam ? (
              <div className="flex-1 flex items-center justify-center text-gray-400">
                <p>Select a team channel to start chatting</p>
              </div>
            ) : (
              <>
                <div className="border-b border-gray-100 pb-3 mb-3">
                  <h2 className="font-semibold text-secondary">
                    # {teams?.find((t: any) => t.id === selectedTeam)?.name}
                  </h2>
                </div>
                <div className="flex-1 overflow-y-auto space-y-3 mb-3">
                  {loadingMsgs ? (
                    <p className="text-gray-400 text-center">Loading...</p>
                  ) : messages.length === 0 ? (
                    <p className="text-gray-400 text-center py-8">No messages yet. Start the conversation!</p>
                  ) : (
                    messages.map((msg: any) => (
                      <div key={msg.id} className={`flex ${msg.senderId === user?.id ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] px-4 py-2 rounded-2xl ${
                          msg.senderId === user?.id ? 'bg-primary text-white' : 'bg-slate text-secondary'
                        }`}>
                          {msg.senderId !== user?.id && (
                            <p className="text-xs font-medium mb-1 opacity-70">{msg.sender?.firstName} {msg.sender?.lastName}</p>
                          )}
                          <p className="text-sm">{msg.content}</p>
                          <p className="text-xs opacity-50 mt-1">{new Date(msg.createdAt).toLocaleTimeString()}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <form onSubmit={handleSend} className="flex gap-2">
                  <input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type a message..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none" />
                  <button type="submit" className="px-6 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg font-medium transition">Send</button>
                </form>
              </>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
