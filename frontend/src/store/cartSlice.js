import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../api/client';

const emptyCart = { items: [], grandTotal: 0 };

export const fetchCart = createAsyncThunk('cart/fetchCart', async (_, { getState, rejectWithValue }) => {
  const user = getState().auth.user;
  if (!user) return emptyCart;
  try {
    const { data } = await api.get('/cart');
    return data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Could not load cart.');
  }
});

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    cart: emptyCart,
    status: 'idle',
    error: '',
  },
  reducers: {
    setCart(state, action) {
      state.cart = action.payload || emptyCart;
      state.error = '';
    },
    clearCart(state) {
      state.cart = emptyCart;
      state.error = '';
      state.status = 'idle';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCart.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.cart = action.payload || emptyCart;
        state.error = '';
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.status = 'failed';
        state.cart = emptyCart;
        state.error = action.payload || 'Could not load cart.';
      });
  },
});

export const { setCart, clearCart } = cartSlice.actions;

export const selectCart = (state) => state.cart.cart;
export const selectCartCount = (state) =>
  state.cart.cart.items.reduce((sum, item) => sum + item.quantity, 0);

export default cartSlice.reducer;
