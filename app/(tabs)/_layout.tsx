import { Tabs } from "expo-router";

import { AlaPalkki } from "@/ui/AlaPalkki";

export default function TabiAsettelu() {
  return (
    <Tabs tabBar={() => <AlaPalkki />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: "Etusivu" }} />
      <Tabs.Screen name="koonnit" options={{ title: "Koonnit" }} />
      <Tabs.Screen name="asetukset" options={{ title: "Asetukset" }} />
    </Tabs>
  );
}
