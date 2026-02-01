// hooks/useAuth.ts
import { useEffect } from "react";
import { create } from "zustand";
import { onAuthStateChanged, User, signOut as fbSignOut } from "firebase/auth";
import { auth as fbAuth } from "../lib/firebase";

type AuthState = {
  user: User | null;
  isBooting: boolean;
  /**
   * Starts the Firebase auth listener.
   * Returns an unsubscribe function (or undefined if already initialized).
   */
  initAuthListener: () => (() => void) | undefined;
  signOut: () => Promise<void>;
};

const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isBooting: true,

  initAuthListener: () => {
    // ✅ Prevent double listeners: if we're already booted, do nothing.
    if (!get().isBooting) return undefined;

    const unsub = onAuthStateChanged(fbAuth, (u) => {
      set({ user: u, isBooting: false });
    });

    return unsub;
  },

  signOut: async () => {
    await fbSignOut(fbAuth);
    set({ user: null, isBooting: false });
  },
}));

export function useAuth() {
  const s = useAuthStore();

  // ✅ Auto-init once, and cleanup on unmount (prevents leaks in dev / fast refresh)
  useEffect(() => {
    if (!s.isBooting) return;

    const unsub = s.initAuthListener();
    return () => {
      if (typeof unsub === "function") unsub();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return s;
}
