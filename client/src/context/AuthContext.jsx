import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import api from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');
  const ticket = useRef(0);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return undefined;
    }

    return onAuthStateChanged(auth, async (firebaseUser) => {
      const current = ++ticket.current;
      if (!firebaseUser) {
        if (current === ticket.current) {
          setUser(null);
          setLoading(false);
        }
        return;
      }

      try {
        const { data } = await api.get('/auth/me');
        if (current !== ticket.current) return;
        setUser(data.user);
      } catch (error) {
        if (current !== ticket.current) return;
        if (error.response?.status === 403) {
          setNotice(error.response?.data?.message || 'This account has been deactivated.');
          setUser(null);
          await signOut(auth);
        } else {
          setUser(null);
        }
      } finally {
        if (current === ticket.current) setLoading(false);
      }
    });
  }, []);

  const adoptUser = (nextUser) => {
    ticket.current += 1;
    setUser(nextUser);
    setLoading(false);
  };

  const logout = async () => {
    ticket.current += 1;
    if (auth) await signOut(auth);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, notice, setNotice, adoptUser, logout, firebaseReady: Boolean(auth) }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
