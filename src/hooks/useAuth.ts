import { useState, useEffect, useCallback } from 'react';
import { auth, googleProvider } from '@/lib/firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import type { User } from '@/types';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          created_at: firebaseUser.metadata.creationTime || new Date().toISOString(),
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    }, (error) => {
      console.error('[useAuth] onAuthStateChanged error:', error);
      setLoading(false);
    });

    // Fallback: if onAuthStateChanged doesn't fire within 5s, stop loading
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 5000);

    return () => {
      clearTimeout(timeout);
      unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { user: firebaseUser } = await signInWithEmailAndPassword(auth, email, password);
    return firebaseUser;
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const { user: firebaseUser } = await createUserWithEmailAndPassword(auth, email, password);
    return firebaseUser;
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const { user: firebaseUser } = await signInWithPopup(auth, googleProvider);
    return firebaseUser;
  }, []);

  const signOut = useCallback(async () => {
    await firebaseSignOut(auth);
    setUser(null);
  }, []);

  return { user, loading, signIn, signUp, signInWithGoogle, signOut };
}
