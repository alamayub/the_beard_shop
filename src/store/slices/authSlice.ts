import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { AuthUser } from '../../types/salon';

interface AuthState {
  user: AuthUser | null;
  token: string | null; // Kept strictly in memory (never localStorage)
  isHydrated: boolean;
}

const initialState: AuthState = {
  user: null,
  token: null,
  isHydrated: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<{ user: AuthUser; token: string }>) {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isHydrated = true;
    },
    clearCredentials(state) {
      state.user = null;
      state.token = null;
      state.isHydrated = true;
    },
    setHydrated(state) {
      state.isHydrated = true;
    },
    updateAuthUser(state, action: PayloadAction<Partial<AuthUser>>) {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
  },
});

export const { setCredentials, clearCredentials, setHydrated, updateAuthUser } = authSlice.actions;
export default authSlice.reducer;
