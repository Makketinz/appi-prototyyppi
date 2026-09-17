import { usePathname, useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ALAPALKIN_KORKEUS, RUUDUN_MAX_LEVEYS, sateet, valit, varit } from "@/ui/teema";

type Kohde = {
  nimi: string;
  otsikko: string;
  polku: "/" | "/koonnit" | "/asetukset";
};

const KOHTEET: Kohde[] = [
  { nimi: "index", otsikko: "Etusivu", polku: "/" },
  { nimi: "koonnit", otsikko: "Koonnit", polku: "/koonnit" },
  { nimi: "asetukset", otsikko: "Asetukset", polku: "/asetukset" },
];

/**
 * Alareunan navigaatio: Etusivu · + Lisää vaate · Koonnit · Asetukset.
 * Oma komponentti, koska korostettu Lisää-nappi ei ole tabi vaan avaa lisäyssivun.
 */
export function AlaPalkki() {
  const router = useRouter();
  const polku = usePathname();
  const insets = useSafeAreaInsets();
  // Tabien alla polku on "/", "/koonnit" tai "/asetukset".
  const aktiivinen = polku === "/" ? "index" : polku.replace(/^\//, "");

  return (
    <View style={[tyylit.tausta, { paddingBottom: insets.bottom }]}>
      <View style={tyylit.palkki}>
        <Kohta kohde={KOHTEET[0]} aktiivinen={aktiivinen} onPress={() => router.navigate(KOHTEET[0].polku)} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Lisää vaate"
          onPress={() => router.push("/lisaa")}
          style={({ pressed }) => [tyylit.lisaa, pressed && tyylit.painettu]}
        >
          <Text style={tyylit.lisaaPlus}>+</Text>
          <Text style={tyylit.lisaaTeksti}>Lisää vaate</Text>
        </Pressable>
        <Kohta kohde={KOHTEET[1]} aktiivinen={aktiivinen} onPress={() => router.navigate(KOHTEET[1].polku)} />
        <Kohta kohde={KOHTEET[2]} aktiivinen={aktiivinen} onPress={() => router.navigate(KOHTEET[2].polku)} />
      </View>
    </View>
  );
}

function Kohta({ kohde, aktiivinen, onPress }: { kohde: Kohde; aktiivinen: string; onPress: () => void }) {
  const valittu = aktiivinen === kohde.nimi;
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: valittu }}
      onPress={onPress}
      style={({ pressed }) => [tyylit.kohta, pressed && tyylit.painettu]}
    >
      <Text style={[tyylit.kohtaTeksti, valittu && tyylit.kohtaValittu]}>{kohde.otsikko}</Text>
    </Pressable>
  );
}

const tyylit = StyleSheet.create({
  tausta: {
    backgroundColor: varit.pinta,
    borderTopWidth: 1,
    borderTopColor: varit.reuna,
    alignItems: "center",
  },
  palkki: {
    width: "100%",
    maxWidth: RUUDUN_MAX_LEVEYS,
    height: ALAPALKIN_KORKEUS,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: valit.s,
  },
  kohta: {
    flex: 1,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  kohtaTeksti: {
    fontSize: 14,
    color: varit.tekstiHimmea,
  },
  kohtaValittu: {
    color: varit.korostus,
    fontWeight: "700",
  },
  lisaa: {
    flex: 1.3,
    height: ALAPALKIN_KORKEUS - valit.m,
    backgroundColor: varit.korostus,
    borderRadius: sateet.m,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: valit.xs,
  },
  lisaaPlus: {
    fontSize: 20,
    lineHeight: 22,
    fontWeight: "700",
    color: varit.korostusTeksti,
  },
  lisaaTeksti: {
    fontSize: 12,
    color: varit.korostusTeksti,
  },
  painettu: {
    opacity: 0.7,
  },
});
