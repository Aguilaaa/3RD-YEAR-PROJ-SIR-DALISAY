import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: null,
  loading: true,
  notice: '',
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuthLoading(state, action) {
      state.loading = action.payload;
    },
    setUser(state, action) {
      state.user = action.payload;
      state.loading = false;
    },
    clearUser(state) {
      state.user = null;
      state.loading = false;
    },
    setNotice(state, action) {
      state.notice = action.payload;
    },
    adoptUser(state, action) {
      state.user = action.payload;
      state.loading = false;
    },
  },
});

export const { setAuthLoading, setUser, clearUser, setNotice, adoptUser } = authSlice.actions;

export const selectAuth = (state) => state.auth;
export const selectUser = (state) => state.auth.user;
export const selectAuthLoading = (state) => state.auth.loading;
export const selectNotice = (state) => state.auth.notice;

export default authSlice.reducer;
