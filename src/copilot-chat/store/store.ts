import { create } from 'zustand'
import { AuthSlice, createAuthSlice } from './slices/auth'

export const useAuthStore = create<AuthSlice>()((...a) => ({
  ...createAuthSlice(...a),
}))
