import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import api from '../api/client';
import { authTicket } from './authSync';
import { clearUser, setAuthLoading, setNotice, setUser } from './authSlice';
import { clearCart, fetchCart } from './cartSlice';

/** Syncs Firebase session changes into the Redux store. */
export function AuthListener({ children }) {
  const dispatch = useDispatch();

  useEffect(() => {
    if (!auth) {
      dispatch(setAuthLoading(false));
      return undefined;
    }

    return onAuthStateChanged(auth, async (firebaseUser) => {
      const current = ++authTicket.current;
      if (!firebaseUser) {
        if (current === authTicket.current) {
          dispatch(clearUser());
          dispatch(clearCart());
        }
        return;
      }

      try {
        const { data } = await api.get('/auth/me');
        if (current !== authTicket.current) return;
        dispatch(setUser(data.user));
        dispatch(fetchCart());
      } catch (error) {
        if (current !== authTicket.current) return;
        if (error.response?.status === 403) {
          dispatch(setNotice(error.response?.data?.message || 'This account has been deactivated.'));
          dispatch(clearUser());
          dispatch(clearCart());
          await signOut(auth);
        } else {
          dispatch(clearUser());
          dispatch(clearCart());
        }
      }
    });
  }, [dispatch]);

  return children;
}
