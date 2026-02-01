// app/_layout.tsx
import React, { useEffect } from "react";
import { Stack } from "expo-router";
import { useAuth } from "../hooks/useAuth";
import { ThemeProvider } from "../theme/ThemeProvider";

export default function RootLayout() {
  const auth = useAuth();

  useEffect(() => {
    const unsub = auth.initAuthListener?.();
    return () => unsub?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ThemeProvider>
      <Stack screenOptions={{ headerShown: false }}>
        {/* Gate (redirects to login or tabs) */}
        <Stack.Screen name="index" />

        {/* Auth screens */}
        <Stack.Screen name="(auth)" />

        {/* Main app */}
        <Stack.Screen name="(tabs)" />

        {/* Other screens */}
        <Stack.Screen
          name="transaction/[id]"
          options={{
            headerShown: false, // you render your own sticky header
            presentation: "card",
          }}
        />
      </Stack>
    </ThemeProvider>
  );
}
