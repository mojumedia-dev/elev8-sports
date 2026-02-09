import { useState, FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../hooks/useApi';
import { api } from '../utils/api';
import Card from '../components/Card';

const sportEmoji: Record<string, string> = { BASEBALL:'⚾', SOFTBALL:'🥎', BASKETBALL:'🏀', SOCCER:'⚽', FLAG_FOOTBALL:'🏈', OTHER:'🏅' };

export default function OrgView() {
  const { id } = useParams();
  const { token } = useAuth();
  const { data: org, loading, refetch: refetchOrg } = useApi<any>(`/organizations/${id}`, [id]);
  const { data: announcements, refetch: refetchAnn } = useApi<any[]>(`/announcements/${id}`, [id]);
  const { data: events, refetch: refetchEvents } = useApi<any[]>('/events', []);

  // Announcement form
  const [showAnnouncement, setShowAnnouncement] = useState(false);
  const [editingAnnId, setEditingAnnId] = useState<string | null>(null);
  const [annForm, setAnnForm] = useState({ title: '', content: '' });

  // Event form
  const [showEvent, setShowEvent] = useState(false);
  const [eventForm, setEventForm] = useState({ title: '', type: 'GAME', startTime: '', endTime: '', location: '', description: '' });

  const handleCreateAnnouncement = async (e: FormEvent) => {
    e.preventDefault();
    await api(`/announcements/${id}`, { method: 'POST', token: token!, body: annForm });
    setAnnForm({ title: '', content: '' });
    setShowAnnouncement(false);
    refetchAnn();
  };

  const handleEditAnnouncement = async (e: FormEvent) => {
    e.preventDefault();
    await api(`/announcements/${id}/${editingAnnId}`, { method: 'PUT', token: token!, body: annForm });
    setEditingAnnId(null);
    setAnnForm({ title: '', content: '' });
    refetchAnn();
  };

  const handleDeleteAnnouncement = async (annId: string) => {
    if (!confirm('Delete this announcement?')) return;
    await api(`/announcements/${id}/${annId}`, { method: 'DELETE', token: token! });
    refetchAnn();
  };

  const handleCreateEvent = async (e: FormEvent) => {
    e.preventDefault();
    await api('/events', { method: 'POST', token: token!, body: { ...eventForm, organizationId: id } });
    setEventForm({ title: '', type: 'GAME', startTime: '', endTime: '', location: '', description: '' });
    setShowEvent(false);
    refetchEvents();
  };

  if (loading) return <div className="text-center py-12 text-gray-400">Loading...</div>;
  if (!org) return <div className="text-center py-12 text-gray-400">Organization not found.</div>;

  const orgEvents = events?.filter((e: any) => e.organizationId === id) || [];

  return (
    <div className="px-1 sm:px-0">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-secondary">{org.name}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-gray-500">
              {org.city && org.state && <span>📍 {org.city}, {org.state}</span>}
              {org.sports?.map((s: string) => <span key={s}>{sportEmoji[s] || '🏅'} {s.replace(/_/g, ' ')}</span>)}
            </div>
            {org.ageDivisions?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {org.ageDivisions.map((d: string) => (
                  <span key={d} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{d}</span>
                ))}
              </div>
            )}
          </div>
          {org.website && (
            <a href={org.website.startsWith('http') ? org.website : `https://${org.website}`} target="_blank" rel="noopener noreferrer"
              className="px-4 py-2.5 sm:py-2 bg-secondary text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition inline-flex items-center gap-2 w-full sm:w-auto justify-center">
              🌐 Visit Website ↗
            </a>
          )}
        </div>
        {org.description && <p className="text-gray-500 mt-2 text-sm">{org.description}</p>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Announcements */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-secondary">📢 Announcements</h2>
            <button onClick={() => { setShowAnnouncement(!showAnnouncement); setEditingAnnId(null); }}
              className="text-sm bg-primary text-white px-3 py-1.5 rounded-lg font-medium hover:bg-blue-700 transition">
              {showAnnouncement ? 'Cancel' : '+ New'}
            </button>
          </div>

          {showAnnouncement && (
            <form onSubmit={handleCreateAnnouncement} className="mb-4 p-3 bg-slate rounded-lg space-y-2">
              <input placeholder="Announcement Title" value={annForm.title} onChange={e => setAnnForm({ ...annForm, title: e.target.value })} required
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary/30 outline-none" />
              <textarea placeholder="Announcement content..." value={annForm.content} onChange={e => setAnnForm({ ...annForm, content: e.target.value })} required rows={3}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary/30 outline-none" />
              <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium">Post Announcement</button>
            </form>
          )}

          {!announcements || announcements.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-6">No announcements yet.</p>
          ) : (
            <div className="space-y-3">
              {announcements.map((ann: any) => (
                <div key={ann.id}>
                  {editingAnnId === ann.id ? (
                    <form onSubmit={handleEditAnnouncement} className="p-3 bg-blue-50 rounded-lg space-y-2">
                      <input value={annForm.title} onChange={e => setAnnForm({ ...annForm, title: e.target.value })} required
                        className="w-full px-3 py-2 border rounded-lg text-sm outline-none" />
                      <textarea value={annForm.content} onChange={e => setAnnForm({ ...annForm, content: e.target.value })} required rows={3}
                        className="w-full px-3 py-2 border rounded-lg text-sm outline-none" />
                      <div className="flex gap-2">
                        <button type="submit" className="px-3 py-1.5 bg-primary text-white rounded-lg text-sm font-medium">Save</button>
                        <button type="button" onClick={() => setEditingAnnId(null)} className="px-3 py-1.5 bg-gray-200 rounded-lg text-sm">Cancel</button>
                      </div>
                    </form>
                  ) : (
                    <div className="p-3 bg-slate rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-secondary">{ann.title}</h4>
                          <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{ann.content}</p>
                          <p className="text-xs text-gray-400 mt-2">{new Date(ann.createdAt).toLocaleString()}</p>
                        </div>
                        <div className="flex gap-1 shrink-0 ml-2">
                          <button onClick={() => { setEditingAnnId(ann.id); setAnnForm({ title: ann.title, content: ann.content }); }}
                            className="p-1 text-gray-400 hover:text-primary transition text-sm">✏️</button>
                          <button onClick={() => handleDeleteAnnouncement(ann.id)}
                            className="p-1 text-gray-300 hover:text-red-500 transition text-sm">✕</button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Events */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-secondary">📅 Events</h2>
            <button onClick={() => setShowEvent(!showEvent)}
              className="text-sm bg-primary text-white px-3 py-1.5 rounded-lg font-medium hover:bg-blue-700 transition">
              {showEvent ? 'Cancel' : '+ Schedule Event'}
            </button>
          </div>

          {showEvent && (
            <form onSubmit={handleCreateEvent} className="mb-4 p-3 bg-slate rounded-lg space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input placeholder="Event Title" value={eventForm.title} onChange={e => setEventForm({ ...eventForm, title: e.target.value })} required
                  className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary/30 outline-none" />
                <select value={eventForm.type} onChange={e => setEventForm({ ...eventForm, type: e.target.value })}
                  className="px-3 py-2 border rounded-lg text-sm outline-none bg-white">
                  <option value="GAME">Game</option>
                  <option value="PRACTICE">Practice</option>
                  <option value="TRYOUT">Tryout</option>
                </select>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Start Time *</label>
                  <input type="datetime-local" value={eventForm.startTime} onChange={e => setEventForm({ ...eventForm, startTime: e.target.value })} required
                    className="w-full px-3 py-2 border rounded-lg text-sm outline-none" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">End Time</label>
                  <input type="datetime-local" value={eventForm.endTime} onChange={e => setEventForm({ ...eventForm, endTime: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm outline-none" />
                </div>
              </div>
              <input placeholder="Location" value={eventForm.location} onChange={e => setEventForm({ ...eventForm, location: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm outline-none" />
              <textarea placeholder="Description (optional)" value={eventForm.description} onChange={e => setEventForm({ ...eventForm, description: e.target.value })} rows={2}
                className="w-full px-3 py-2 border rounded-lg text-sm outline-none" />
              <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium">Schedule Event</button>
            </form>
          )}

          {orgEvents.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-6">No events scheduled.</p>
          ) : (
            <div className="space-y-2">
              {orgEvents.map((event: any) => (
                <div key={event.id} className="p-3 bg-slate rounded-lg">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-secondary">{event.title}</h4>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
                      event.type === 'GAME' ? 'bg-primary/10 text-primary' :
                      event.type === 'PRACTICE' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
                    }`}>{event.type}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{new Date(event.startTime).toLocaleString()}</p>
                  {event.location && <p className="text-sm text-gray-400">📍 {event.location}</p>}
                  {event.description && <p className="text-sm text-gray-500 mt-1">{event.description}</p>}
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Teams */}
        <Card className="lg:col-span-2">
          <h2 className="text-lg font-semibold text-secondary mb-4">👥 Teams ({org.teams?.length || 0})</h2>
          {!org.teams || org.teams.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">No teams in this organization yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {org.teams.map((team: any) => (
                <div key={team.id} className="p-3 bg-slate rounded-lg">
                  <h4 className="font-medium text-secondary">{team.name}</h4>
                  <p className="text-sm text-gray-500">{sportEmoji[team.sport] || '🏅'} {team.sport?.replace(/_/g, ' ')}</p>
                  {team.season && <p className="text-xs text-gray-400">{team.season} {team.ageGroup && `· ${team.ageGroup}`}</p>}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
