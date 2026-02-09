import { useState, FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../hooks/useApi';
import { api } from '../utils/api';
import Card from '../components/Card';

interface EventForm { title: string; type: string; startTime: string; endTime: string; location: string; teamId: string; description: string }

const emptyForm: EventForm = { title: '', type: 'PRACTICE', startTime: '', endTime: '', location: '', teamId: '', description: '' };

function EventFormFields({ form, setForm, teams, onSubmit, onCancel, submitLabel }: {
  form: EventForm; setForm: (f: EventForm) => void; teams: any[]; onSubmit: (e: FormEvent) => void; onCancel: () => void; submitLabel: string;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input placeholder="Event Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required
          className="px-4 py-2.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none text-base sm:text-sm" />
        <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
          className="px-4 py-2.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none bg-white text-base sm:text-sm">
          <option value="PRACTICE">Practice</option>
          <option value="GAME">Game</option>
          <option value="TRYOUT">Tryout</option>
        </select>
        <select value={form.teamId} onChange={(e) => setForm({ ...form, teamId: e.target.value })} required
          className="px-4 py-2.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none bg-white text-base sm:text-sm">
          <option value="">Select Team</option>
          {teams?.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <input placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}
          className="px-4 py-2.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none text-base sm:text-sm" />
        <div>
          <label className="block text-xs text-gray-500 mb-1">Start Time *</label>
          <input type="datetime-local" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} required
            className="w-full px-4 py-2.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none text-base sm:text-sm" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">End Time</label>
          <input type="datetime-local" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })}
            className="w-full px-4 py-2.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none text-base sm:text-sm" />
        </div>
      </div>
      <textarea placeholder="Description (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
        className="w-full px-4 py-2.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none text-base sm:text-sm" rows={2} />
      <div className="flex flex-col sm:flex-row gap-2">
        <button type="submit" className="px-4 py-2.5 sm:py-2 bg-primary text-white rounded-lg text-sm font-medium w-full sm:w-auto">{submitLabel}</button>
        <button type="button" onClick={onCancel} className="px-4 py-2.5 sm:py-2 bg-gray-200 rounded-lg text-sm w-full sm:w-auto">Cancel</button>
      </div>
    </form>
  );
}

export default function Schedule() {
  const { token, user } = useAuth();
  const { data: events, refetch } = useApi<any[]>('/events');
  const { data: teams } = useApi<any[]>('/teams');
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<EventForm>({ ...emptyForm });
  const [editForm, setEditForm] = useState<EventForm>({ ...emptyForm });

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    await api('/events', { method: 'POST', body: form, token: token! });
    setForm({ ...emptyForm });
    setShowCreate(false);
    refetch();
  };

  const startEdit = (event: any) => {
    setEditingId(event.id);
    setEditForm({
      title: event.title || '',
      type: event.type || 'PRACTICE',
      startTime: event.startTime ? new Date(event.startTime).toISOString().slice(0, 16) : '',
      endTime: event.endTime ? new Date(event.endTime).toISOString().slice(0, 16) : '',
      location: event.location || '',
      teamId: event.teamId || event.team?.id || '',
      description: event.description || '',
    });
    setShowCreate(false);
  };

  const handleEdit = async (e: FormEvent) => {
    e.preventDefault();
    await api(`/events/${editingId}`, { method: 'PUT', body: editForm, token: token! });
    setEditingId(null);
    refetch();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this event?')) return;
    await api(`/events/${id}`, { method: 'DELETE', token: token! });
    refetch();
  };

  const handleRsvp = async (eventId: string, status: string) => {
    await api('/rsvps', { method: 'POST', body: { eventId, status }, token: token! });
    refetch();
  };

  const now = new Date();
  const upcoming = events?.filter((e: any) => new Date(e.startTime) >= now) || [];
  const past = events?.filter((e: any) => new Date(e.startTime) < now) || [];

  const renderEvent = (event: any) => (
    <Card key={event.id}>
      {editingId === event.id ? (
        <div>
          <h3 className="text-lg font-semibold text-secondary mb-3">Edit Event</h3>
          <EventFormFields form={editForm} setForm={setEditForm} teams={teams || []} onSubmit={handleEdit} onCancel={() => setEditingId(null)} submitLabel="Save Changes" />
        </div>
      ) : (
        <div>
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-secondary">{event.title}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
                  event.type === 'GAME' ? 'bg-primary/10 text-primary' :
                  event.type === 'PRACTICE' ? 'bg-green-50 text-green-700' : 'bg-accent/10 text-amber-700'
                }`}>{event.type}</span>
              </div>
              <p className="text-sm text-gray-500 mt-1">{event.team?.name} · {new Date(event.startTime).toLocaleString()}</p>
              {event.location && <p className="text-sm text-gray-400">📍 {event.location}</p>}
              {event.description && <p className="text-sm text-gray-500 mt-2">{event.description}</p>}
            </div>
            <div className="flex gap-1 shrink-0">
              <button onClick={() => startEdit(event)} className="p-1.5 text-gray-400 hover:text-primary transition text-sm">✏️</button>
              <button onClick={() => handleDelete(event.id)} className="p-1.5 text-gray-300 hover:text-red-500 transition text-sm">✕</button>
            </div>
          </div>

          {/* RSVP buttons */}
          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t">
            <button onClick={() => handleRsvp(event.id, 'GOING')}
              className="px-3 py-1.5 text-xs bg-green-50 text-green-700 rounded-full hover:bg-green-100 active:scale-95 transition font-medium">
              ✅ Going
            </button>
            <button onClick={() => handleRsvp(event.id, 'MAYBE')}
              className="px-3 py-1.5 text-xs bg-yellow-50 text-yellow-700 rounded-full hover:bg-yellow-100 active:scale-95 transition font-medium">
              🤔 Maybe
            </button>
            <button onClick={() => handleRsvp(event.id, 'NOT_GOING')}
              className="px-3 py-1.5 text-xs bg-red-50 text-red-700 rounded-full hover:bg-red-100 active:scale-95 transition font-medium">
              ❌ Can't Go
            </button>
          </div>
        </div>
      )}
    </Card>
  );

  return (
    <div className="px-1 sm:px-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-secondary">Schedule</h1>
          <p className="text-gray-500 mt-1 text-sm sm:text-base">View and manage all events.</p>
        </div>
        <button onClick={() => { setShowCreate(!showCreate); setEditingId(null); }}
          className="px-5 py-2.5 bg-primary hover:bg-blue-700 text-white font-medium rounded-lg transition w-full sm:w-auto">
          {showCreate ? 'Cancel' : '+ Create Event'}
        </button>
      </div>

      {showCreate && (
        <Card className="mb-6">
          <h2 className="text-lg font-semibold mb-4">Create Event</h2>
          <EventFormFields form={form} setForm={setForm} teams={teams || []} onSubmit={handleCreate} onCancel={() => setShowCreate(false)} submitLabel="Create Event" />
        </Card>
      )}

      <div className="space-y-6">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-secondary mb-4">Upcoming ({upcoming.length})</h2>
          {upcoming.length === 0 ? (
            <Card><p className="text-gray-400 text-center py-4 text-sm">No upcoming events.</p></Card>
          ) : (
            <div className="space-y-3">{upcoming.map(renderEvent)}</div>
          )}
        </div>

        {past.length > 0 && (
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-secondary mb-4">Past Events ({past.length})</h2>
            <div className="space-y-3 opacity-60">{past.map(renderEvent)}</div>
          </div>
        )}
      </div>
    </div>
  );
}
