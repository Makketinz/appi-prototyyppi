import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AsetuksetPuuttuvat } from "@/data/AsetuksetPuuttuvat";
import { AuthProvider } from "@/data/AuthProvider";
import { QueryProvider } from "@/data/QueryProvider";
import { supabaseKonfiguroitu } from "@/data/supabase";
import { Vartija } from "@/data/Vartija";
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
      <QueryProvider>
        <AuthProvider>
          <Vartija>
            <Stack
              screenOptions={{
                headerStyle: { backgroundColor: varit.pinta },
                headerTintColor: varit.teksti,
                contentStyle: { backgroundColor: varit.tausta },
              }}
            >
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="auth" options={{ headerShown: false }} />
              <Stack.Screen name="onboarding" options={{ headerShown: false }} />
              <Stack.Screen name="lisaa/index" options={{ title: "Lisää vaate", presentation: "modal" }} />
            </Stack>
          </Vartija>
        </AuthProvider>
      </QueryProvider>
    </SafeAreaProvider>
  );
}
