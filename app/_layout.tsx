import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AsetuksetPuuttuvat } from "@/data/AsetuksetPuuttuvat";
import { AuthProvider } from "@/data/AuthProvider";
import { QueryProvider } from "@/data/QueryProvider";
import { supabaseKonfiguroitu } from "@/data/supabase";
import { Vartija } from "@/data/Vartija";
import { varit } from "@/ui/teema";

// Suora linkki alasivulle (esim. /vaate/…) avaa tabit sen alle, jotta Takaisin vie etusivulle.
export const unstable_settings = {
  initialRouteName: "(tabs)",
};

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
                headerBackTitle: "Takaisin",
                contentStyle: { backgroundColor: varit.tausta },
              }}
            >
              <Stack.Screen name="(tabs)" options={{ headerShown: false, title: "Etusivu" }} />
              <Stack.Screen name="auth" options={{ headerShown: false }} />
              <Stack.Screen name="onboarding" options={{ headerShown: false }} />
              <Stack.Screen name="vaatteet" options={{ title: "Vaatteet" }} />
              <Stack.Screen name="vaate/[id]" options={{ title: "Vaate" }} />
              <Stack.Screen name="lisaa/index" options={{ title: "Lisää vaate", presentation: "modal" }} />
            </Stack>
          </Vartija>
        </AuthProvider>
      </QueryProvider>
    </SafeAreaProvider>
  );
}
