import { useState, useCallback } from 'react';
import type { User } from '@/types';

// Local-only auth: no backend required. Always authenticated as a local user.
export function useAuth() {
  const [user] = useState<User | null>({
    id: 'local-user',
    email: 'local@metronome.app',
    created_at: new Date().toISOString(),
  });
  const [loading] = useState(false);

  const signIn = useCallback(async () => {
    // No-op: always authenticated locally
  }, []);

  const signInWithGoogle = useCallback(async () => {
    // No-op: always authenticated locally
  }, []);

  const signOut = useCallback(async () => {
    // No-op: keep local user
  }, []);

  return { user, loading, signIn, signInWithGoogle, signOut };
}
