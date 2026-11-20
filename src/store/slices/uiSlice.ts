import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Language } from '../../utils/nepal';

export interface ToastItem {
  id: string;
  variant: 'success' | 'error' | 'info';
  title: string;
  description?: string;
}

interface UiState {
  language: Language;
  showBikramSambat: boolean;
  preselectedServiceId: number | null;
  preselectedStaffId: number | null;
  toasts: ToastItem[];
}

const initialState: UiState = {
  language: 'en',
  showBikramSambat: true,
  preselectedServiceId: null,
  preselectedStaffId: null,
  toasts: [],
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setLanguage(state, action: PayloadAction<Language>) {
      state.language = action.payload;
    },
    toggleBikramSambat(state) {
      state.showBikramSambat = !state.showBikramSambat;
    },
    setBookingPreselection(
      state,
      action: PayloadAction<{ serviceId?: number | null; staffId?: number | null }>
    ) {
      if (action.payload.serviceId !== undefined) {
        state.preselectedServiceId = action.payload.serviceId;
      }
      if (action.payload.staffId !== undefined) {
        state.preselectedStaffId = action.payload.staffId;
      }
    },
    clearBookingPreselection(state) {
      state.preselectedServiceId = null;
      state.preselectedStaffId = null;
    },
    pushToast(state, action: PayloadAction<ToastItem>) {
      state.toasts = [...state.toasts.slice(-3), action.payload];
    },
    dismissToast(state, action: PayloadAction<string>) {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload);
    },
  },
});

export const {
  setLanguage,
  toggleBikramSambat,
  setBookingPreselection,
  clearBookingPreselection,
  pushToast,
  dismissToast,
} = uiSlice.actions;
export default uiSlice.reducer;
