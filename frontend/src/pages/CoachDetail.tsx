import { useParams } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import Card from '../components/Card';
import ReviewSection from '../components/ReviewSection';
import { StarDisplay } from '../components/StarRating';

const SPORT_LABELS: Record<string, string> = {
  BASEBALL: '⚾ Baseball', SOFTBALL: '🥎 Softball', BASKETBALL: '🏀 Basketball',
  SOCCER: '⚽ Soccer', FLAG_FOOTBALL: '🏈 Flag Football', OTHER: '🏅 Other',
};

export default function CoachDetail() {
  const { id } = useParams();
  const { data: coach, loading, refetch } = useApi<any>(`/coach-profiles/${id}`, [id]);

  if (loading) return <div className="text-center py-12 text-gray-400">Loading...</div>;
  if (!coach) return <div className="text-center py-12 text-gray-400">Coach not found.</div>;

  return (
    <div className="px-1 sm:px-0 max-w-3xl">
      <Card>
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-3xl shrink-0">🏋️</div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-secondary">{coach.user?.firstName} {coach.user?.lastName}</h1>
            {!coach.acceptingClients && <span className="inline-block mt-1 text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">Not accepting clients</span>}
            <div className="mt-2">
              <StarDisplay avg={coach.rating?.avg} count={coach.rating?.count || 0} size="md" />
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          {coach.city && <div><span className="text-gray-500">Location:</span> 📍 {coach.city}{coach.state ? `, ${coach.state}` : ''} {coach.zipCode && coach.zipCode}</div>}
          {coach.hourlyRate && <div><span className="text-gray-500">Rate:</span> 💵 ${coach.hourlyRate}/hr</div>}
          {coach.yearsExperience && <div><span className="text-gray-500">Experience:</span> 🏆 {coach.yearsExperience} years</div>}
          {coach.contactEmail && <div><span className="text-gray-500">Email:</span> <a href={`mailto:${coach.contactEmail}`} className="text-primary hover:underline">{coach.contactEmail}</a></div>}
          {coach.contactPhone && <div><span className="text-gray-500">Phone:</span> <a href={`tel:${coach.contactPhone}`} className="text-primary hover:underline">{coach.contactPhone}</a></div>}
        </div>

        {coach.sports?.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-medium text-gray-500 mb-1">Sports</p>
            <div className="flex flex-wrap gap-1">
              {coach.sports.map((s: string) => (
                <span key={s} className="text-xs bg-slate px-2 py-0.5 rounded-full">{SPORT_LABELS[s] || s}</span>
              ))}
            </div>
          </div>
        )}

        {coach.specialties?.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-medium text-gray-500 mb-1">Specialties</p>
            <div className="flex flex-wrap gap-1">
              {coach.specialties.map((s: string) => (
                <span key={s} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{s}</span>
              ))}
            </div>
          </div>
        )}

        {coach.certifications?.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-medium text-gray-500 mb-1">Certifications</p>
            <div className="flex flex-wrap gap-1">
              {coach.certifications.map((s: string) => (
                <span key={s} className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">{s}</span>
              ))}
            </div>
          </div>
        )}

        {coach.bio && (
          <div className="mt-4">
            <p className="text-xs font-medium text-gray-500 mb-1">About</p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{coach.bio}</p>
          </div>
        )}
      </Card>

      <div className="mt-6">
        <ReviewSection targetType="COACH" targetId={coach.id} onReviewChange={refetch} />
      </div>
    </div>
  );
}
