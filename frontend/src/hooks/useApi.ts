import { useState, useEffect, useCallback } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';

export function useApi<T>(path: string, deps: unknown[] = []) {
  const { token } = useAuth();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(() => {
    if (!token) return;
    setLoading(true);
    api<T>(path, { token })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [path, token, ...deps]);

  useEffect(() => { refetch(); }, [refetch]);

  return { data, loading, error, refetch };
}
