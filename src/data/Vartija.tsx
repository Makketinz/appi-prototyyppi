import { useRouter, useSegments } from "expo-router";
import { type PropsWithChildren, useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { useAuth } from "@/data/AuthProvider";
import { useOmaLapsi } from "@/data/lapsi";
import { valit, varit } from "@/ui/teema";

/**
 * Reitinvartija: ei sessiota → /auth; sessio ilman lasta → /onboarding; muuten sovellus.
 * Sisältö renderöidään aina (navigaattorin pitää olla olemassa ohjausta varten), mutta
 * latauksen ajan sen päällä on peittävä latausnäkymä.
 */
export function Vartija({ children }: PropsWithChildren) {
  const { sessio, ladattu } = useAuth();
  const lapsi = useOmaLapsi(sessio !== null);
  const segmentit = useSegments();
  const router = useRouter();

  const authissa = segmentit[0] === "auth";
  const onboardingissa = segmentit[0] === "onboarding";
  const lataa = !ladattu || (sessio !== null && lapsi.isPending);

  useEffect(() => {
    if (!ladattu) return;
    if (sessio === null) {
      if (!authissa) router.replace("/auth");
      return;
    }
    if (lapsi.isPending) return;
    if (lapsi.isError) return; // virhe näytetään alla, ei ohjata
    if (lapsi.data === null) {
      if (!onboardingissa) router.replace("/onboarding");
      return;
    }
    if (authissa || onboardingissa) router.replace("/");
  }, [ladattu, sessio, lapsi.isPending, lapsi.isError, lapsi.data, authissa, onboardingissa, router]);

  return (
    <View style={tyylit.kehys}>
      {children}
      {lataa ? (
        <View style={tyylit.peite} accessibilityLabel="Ladataan">
          <ActivityIndicator size="large" color={varit.korostus} />
        </View>
      ) : null}
      {sessio !== null && lapsi.isError ? (
        <View style={tyylit.peite}>
          <Text style={tyylit.virhe}>Lapsen tietojen haku epäonnistui: {lapsi.error.message}</Text>
          <Text style={tyylit.vihje}>Tarkista, että migraatiot on ajettu Supabase-projektiin (supabase/README.md).</Text>
        </View>
      ) : null}
    </View>
  );
}

const tyylit = StyleSheet.create({
  kehys: {
    flex: 1,
  },
  peite: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: varit.tausta,
    alignItems: "center",
    justifyContent: "center",
    padding: valit.l,
    gap: valit.s,
  },
  virhe: {
    color: varit.virhe,
    fontSize: 15,
    textAlign: "center",
  },
  vihje: {
    color: varit.tekstiHimmea,
    fontSize: 13,
    textAlign: "center",
  },
});
