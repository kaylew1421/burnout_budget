import { Redirect } from "expo-router";
import React from "react";
import { useAuth } from "../hooks/useAuth";
import { useOnboarding } from "../hooks/useOnboarding";

export default function Index() {
  const auth = useAuth();
  const { hasOnboarded } = useOnboarding();

  if (auth.isBooting) return null;

  if (!auth.user) {
    return <Redirect href="/(auth)/login" />;
  }

  if (!hasOnboarded) {
    return <Redirect href="/(auth)/onboarding" />;
  }

  return <Redirect href="/(tabs)/dashboard" />;
}
