// app/(tabs)/_layout.tsx
import React from "react";
import { Tabs } from "expo-router";
import { View, Pressable, StyleSheet, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { colors } from "../../theme/colors";

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  const TAB_BAR_HEIGHT = 62 + Math.max(insets.bottom, 10);

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: "rgba(11,15,20,0.95)",
            borderTopColor: "rgba(255,255,255,0.08)",
            height: TAB_BAR_HEIGHT,
            paddingBottom: Math.max(insets.bottom, 10),
            paddingTop: 8,
          },
          tabBarActiveTintColor: colors.text,
          tabBarInactiveTintColor: "rgba(234,240,255,0.55)",
        }}
      >
        <Tabs.Screen
          name="dashboard"
          options={{
            title: "Home",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home-outline" size={size} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="transactions"
          options={{
            title: "Transactions",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="card-outline" size={size} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="recurrings"
          options={{
            title: "Recurrings",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="repeat-outline" size={size} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="trends"
          options={{
            title: "Trends",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="trending-up-outline" size={size} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="settings"
          options={{
            title: "Settings",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="settings-outline" size={size} color={color} />
            ),
          }}
        />

        {/* keep route, remove tab button */}
        <Tabs.Screen name="ai-chat" options={{ href: null }} />
        <Tabs.Screen name="recurrings-schedule" options={{ href: null }} />
        <Tabs.Screen name="bill-edit" options={{ href: null }} />
        <Tabs.Screen name="transaction-add" options={{ href: null }} />
        <Tabs.Screen name="next-steps" options={{ href: null }} />


      </Tabs>

      {/* Floating AI Chat button */}
      <Pressable
        onPress={() => router.push("/(tabs)/ai-chat")}
        style={({ pressed }) => [
          styles.fab,
          { bottom: TAB_BAR_HEIGHT + 14, right: 16 },
          pressed && styles.fabPressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel="Open AI chat"
      >
        <Ionicons name="chatbubble-ellipses" size={20} color="#EAF0FF" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(43, 91, 255, 0.92)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.25,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 10 },
      },
      android: { elevation: 8 },
    }),
  },
  fabPressed: { opacity: 0.92, transform: [{ scale: 0.98 }] },
});
