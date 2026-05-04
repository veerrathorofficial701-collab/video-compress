import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
} from '@firebase/auth';
import { auth, googleProvider } from '../firebase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  // Listen to Firebase auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser ? {
        uid:       firebaseUser.uid,
        name:      firebaseUser.displayName || firebaseUser.email.split('@')[0],
        email:     firebaseUser.email,
        photoURL:  firebaseUser.photoURL,
        provider:  firebaseUser.providerData[0]?.providerId || 'password',
      } : null);
      setLoading(false);
    });
    return unsub;
  }, []);

  const signUp = useCallback(async (name, email, password) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name.trim() });
    // Trigger state update with display name
    setUser({
      uid:      cred.user.uid,
      name:     name.trim(),
      email:    cred.user.email,
      photoURL: null,
      provider: 'password',
    });
  }, []);

  const signIn = useCallback(async (email, password) => {
    await signInWithEmailAndPassword(auth, email, password);
  }, []);

  const signInWithGoogle = useCallback(async () => {
    await signInWithPopup(auth, googleProvider);
  }, []);

  const signOut = useCallback(async () => {
    await firebaseSignOut(auth);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signInWithGoogle, signOut }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() { return useContext(AuthContext); }
