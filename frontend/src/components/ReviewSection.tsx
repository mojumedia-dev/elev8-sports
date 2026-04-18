import { useState, FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../hooks/useApi';
import { api } from '../utils/api';
import Card from './Card';
import { StarDisplay, StarInput } from './StarRating';

type TargetType = 'TEAM' | 'ORGANIZATION' | 'COACH';

export default function ReviewSection({ targetType, targetId, onReviewChange }: {
  targetType: TargetType; targetId: string; onReviewChange?: () => void;
}) {
  const { user, token } = useAuth();
  const { data, refetch } = useApi<any>(`/reviews/${targetType}/${targetId}`, [targetType, targetId]);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);

  const myReview = data?.reviews?.find((r: any) => r.reviewerId === user?.id);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (rating < 1) return;
    setSaving(true);
    try {
      await api(`/reviews/${targetType}/${targetId}`, { method: 'POST', token: token!, body: { rating, comment: comment.trim() } });
      setShowForm(false);
      setComment('');
      setRating(0);
      refetch();
      onReviewChange?.();
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!confirm('Delete your review?')) return;
    await api(`/reviews/${targetType}/${targetId}`, { method: 'DELETE', token: token! });
    refetch();
    onReviewChange?.();
  };

  const startEdit = () => {
    setRating(myReview?.rating || 0);
    setComment(myReview?.comment || '');
    setShowForm(true);
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h2 className="text-lg font-semibold text-secondary">Reviews</h2>
          <StarDisplay avg={data?.avg ?? null} count={data?.count || 0} />
        </div>
        {!showForm && (
          myReview ? (
            <div className="flex gap-2">
              <button onClick={startEdit} className="text-sm text-primary hover:underline">Edit my review</button>
              <button onClick={remove} className="text-sm text-red-500 hover:underline">Delete</button>
            </div>
          ) : (
            <button onClick={() => setShowForm(true)} className="px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition">
              + Write a Review
            </button>
          )
        )}
      </div>

      {showForm && (
        <form onSubmit={submit} className="mb-4 p-3 bg-slate rounded-lg space-y-3">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">Your Rating</p>
            <StarInput value={rating} onChange={setRating} />
          </div>
          <textarea value={comment} onChange={e => setComment(e.target.value)} rows={3} placeholder="Share details about your experience..."
            maxLength={2000}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/30" />
          <div className="flex gap-2">
            <button type="submit" disabled={saving || rating < 1}
              className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium disabled:opacity-50">
              {saving ? 'Saving...' : 'Submit Review'}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setRating(0); setComment(''); }}
              className="px-3 py-2 bg-gray-200 rounded-lg text-sm">Cancel</button>
          </div>
        </form>
      )}

      {!data?.reviews || data.reviews.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-4">No reviews yet. Be the first!</p>
      ) : (
        <div className="space-y-3">
          {data.reviews.map((r: any) => (
            <div key={r.id} className="p-3 bg-slate rounded-lg">
              <div className="flex items-center justify-between">
                <p className="font-medium text-sm text-secondary">{r.reviewer?.firstName} {r.reviewer?.lastName?.[0]}.</p>
                <StarDisplay avg={r.rating} count={1} />
              </div>
              {r.comment && <p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap">{r.comment}</p>}
              <p className="text-xs text-gray-400 mt-2">{new Date(r.createdAt).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
