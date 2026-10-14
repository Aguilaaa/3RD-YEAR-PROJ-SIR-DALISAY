import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/client';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [cart, setCart] = useState({ items: [], grandTotal: 0 });

  const refresh = async () => {
    if (!user) {
      setCart({ items: [], grandTotal: 0 });
      return { items: [], grandTotal: 0 };
    }
    const { data } = await api.get('/cart');
    setCart(data);
    return data;
  };

  useEffect(() => {
    refresh().catch(() => setCart({ items: [], grandTotal: 0 }));
  }, [user?.id]);

  const count = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, setCart, refresh, count }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
