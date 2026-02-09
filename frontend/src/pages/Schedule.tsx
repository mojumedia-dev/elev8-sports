import { useState, FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../hooks/useApi';
import { api } from '../utils/api';
import Card from '../components/Card';

export default function Schedule() {
  const { token, user } = useAuth();
  const { data: events, refetch } = useApi<any[]>('/events');
  const { data: teams } = useApi<any[]>('/teams');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', type: 'PRACTICE', startTime: '', endTime: '', location: '', teamId: '', description: '' });

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    await api('/events', { method: 'POST', body: form, token: token! });
    setForm({ title: '', type: 'PRACTICE', startTime: '', endTime: '', location: '', teamId: '', description: '' });
    setShowCreate(false);
    refetch();
  };

  const handleRsvp = async (eventId: string, status: string) => {
    await api('/rsvps', { method: 'POST', body: { eventId, status }, token: token! });
    refetch();
  };

  const now = new Date();
  const upcoming = events?.filter((e: any) => new Date(e.startTime) >= now) || [];
  const past = events?.filter((e: any) => new Date(e.startTime) < now) || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-secondary">Schedule</h1>
          <p className="text-gray-500 mt-1">View and manage all events.</p>
        </div>
        {user?.role !== 'PARENT' && (
          <button onClick={() => setShowCreate(!showCreate)}
            className="px-5 py-2.5 bg-primary hover:bg-primary-dark text-white font-medium rounded-lg transition">
            + Create Event
          </button>
        )}
      </div>

      {showCreate && (
        <Card className="mb-6">
          <h2 className="text-lg font-semibold mb-4">Create Event</h2>
          <form onSubmit={handleCreate} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input placeholder="Event Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none" />
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none">
                <option value="PRACTICE">Practice</option>
                <option value="GAME">Game</option>
                <option value="TRYOUT">Tryout</option>
              </select>
              <select value={form.teamId} onChange={(e) => setForm({ ...form, teamId: e.target.value })} required
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none">
                <option value="">Select Team</option>
                {teams?.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              <input placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none" />
              <input type="datetime-local" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} required
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none" />
              <input type="datetime-local" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none" />
            </div>
            <textarea placeholder="Description (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none" rows={2} />
            <div className="flex gap-2">
              <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium">Create Event</button>
              <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 bg-gray-200 rounded-lg text-sm">Cancel</button>
            </div>
          </form>
        </Card>
      )}

      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-secondary mb-4">Upcoming ({upcoming.length})</h2>
          {upcoming.length === 0 ? (
            <Card><p className="text-gray-400 text-center py-4">No upcoming events.</p></Card>
          ) : (
            <div className="space-y-3">
              {upcoming.map((event: any) => (
                <Card key={event.id}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-secondary">{event.title}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          event.type === 'GAME' ? 'bg-primary/10 text-primary' :
                          event.type === 'PRACTICE' ? 'bg-green-50 text-green-700' : 'bg-accent/10 text-accent-dark'
                        }`}>{event.type}</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{event.team?.name} · {new Date(event.startTime).toLocaleString()}</p>
                      {event.location && <p className="text-sm text-gray-400">📍 {event.location}</p>}
                      {event.description && <p className="text-sm text-gray-500 mt-2">{event.description}</p>}
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => handleRsvp(event.id, 'GOING')} className="px-3 py-1 text-xs bg-green-50 text-green-700 rounded-full hover:bg-green-100">Going</button>
                      <button onClick={() => handleRsvp(event.id, 'MAYBE')} className="px-3 py-1 text-xs bg-yellow-50 text-yellow-700 rounded-full hover:bg-yellow-100">Maybe</button>
                      <button onClick={() => handleRsvp(event.id, 'NOT_GOING')} className="px-3 py-1 text-xs bg-red-50 text-red-700 rounded-full hover:bg-red-100">Can't Go</button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {past.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-secondary mb-4">Past Events ({past.length})</h2>
            <div className="space-y-3 opacity-60">
              {past.map((event: any) => (
                <Card key={event.id}>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-secondary">{event.title}</h3>
                    <span className="text-xs text-gray-400">{event.type}</span>
                  </div>
                  <p className="text-sm text-gray-500">{event.team?.name} · {new Date(event.startTime).toLocaleString()}</p>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
