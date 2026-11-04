import { useDispatch, useSelector } from 'react-redux';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { adoptUser, clearUser, selectAuth, setNotice } from './authSlice';
import { clearCart, fetchCart, selectCart, selectCartCount, setCart } from './cartSlice';
import { bumpAuthTicket } from './authSync';

export function useAuth() {
  const dispatch = useDispatch();
  const { user, loading, notice } = useSelector(selectAuth);

  return {
    user,
    loading,
    notice,
    firebaseReady: Boolean(auth),
    setNotice: (value) => dispatch(setNotice(value)),
    adoptUser: (nextUser) => {
      bumpAuthTicket();
      dispatch(adoptUser(nextUser));
      dispatch(fetchCart());
    },
    logout: async () => {
      bumpAuthTicket();
      if (auth) await signOut(auth);
      dispatch(clearUser());
      dispatch(clearCart());
    },
  };
}

export function useCart() {
  const dispatch = useDispatch();
  const cart = useSelector(selectCart);
  const count = useSelector(selectCartCount);

  return {
    cart,
    count,
    setCart: (next) => dispatch(setCart(next)),
    refresh: async () => {
      const result = await dispatch(fetchCart());
      if (fetchCart.fulfilled.match(result)) return result.payload;
      return { items: [], grandTotal: 0 };
    },
  };
}
