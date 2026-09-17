import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AsetuksetPuuttuvat } from "@/data/AsetuksetPuuttuvat";
import { supabaseKonfiguroitu } from "@/data/supabase";
import { varit } from "@/ui/teema";

export default function JuuriAsettelu() {
  if (!supabaseKonfiguroitu) {
    return (
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <AsetuksetPuuttuvat />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: varit.pinta },
          headerTintColor: varit.teksti,
          contentStyle: { backgroundColor: varit.tausta },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="lisaa/index" options={{ title: "Lisää vaate", presentation: "modal" }} />
      </Stack>
    </SafeAreaProvider>
  );
}
