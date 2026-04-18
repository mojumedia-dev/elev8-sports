import { useApi } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import Card from './Card';

export default function LocalFeed() {
  const { user } = useAuth();
  const { data: feed } = useApi<any[]>('/announcements/feed');

  if (!user?.city) {
    return (
      <Card>
        <h2 className="text-lg font-semibold text-secondary mb-2">📢 Local Announcements</h2>
        <p className="text-sm text-gray-400">Set your city above to see announcements from orgs near you.</p>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-secondary">📢 Announcements in {user.city}</h2>
      </div>
      {!feed || feed.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-4">No local announcements yet.</p>
      ) : (
        <div className="space-y-3">
          {feed.slice(0, 8).map((ann: any) => (
            <div key={ann.id} className="p-3 bg-slate rounded-lg">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-secondary">{ann.title}</h4>
                  <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{ann.content}</p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                    <Link to={`/organizations/${ann.organization?.id}`} className="text-primary hover:underline">
                      {ann.organization?.name}
                    </Link>
                    <span>·</span>
                    <span>{new Date(ann.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
