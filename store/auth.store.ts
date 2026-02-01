import { create } from "zustand";
import { onAuthStateChanged, signOut as fbSignOut, User } from "firebase/auth";
import { auth } from "../lib/firebase";

type AuthState = {
  initializing: boolean;
  user: User | null;
  isAuthed: boolean;
  email: string | null;

  initAuthListener: () => () => void;
  signOut: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  initializing: true,
  user: null,
  isAuthed: false,
  email: null,

  initAuthListener: () => {
    const unsub = onAuthStateChanged(auth, (u) => {
      set({
        initializing: false,
        user: u,
        isAuthed: !!u,
        email: u?.email ?? null,
      });
    });
    return unsub;
  },

  signOut: async () => {
    await fbSignOut(auth);
    set({ user: null, isAuthed: false, email: null });
  },
}));
