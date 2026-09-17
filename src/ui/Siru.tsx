import { Pressable, StyleSheet, Text } from "react-native";

import { sateet, valit, varit } from "@/ui/teema";

/** Valittava siru (chip), esim. koko- tai kategoriavalintaan. */
export function Siru({ teksti, valittu, onPress }: { teksti: string; valittu: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: valittu }}
      aria-pressed={valittu}
      onPress={onPress}
      style={({ pressed }) => [tyylit.siru, valittu && tyylit.valittu, pressed && tyylit.painettu]}
    >
      <Text style={[tyylit.teksti, valittu && tyylit.valittuTeksti]}>{teksti}</Text>
    </Pressable>
  );
}

const tyylit = StyleSheet.create({
  siru: {
    paddingHorizontal: valit.m - 2,
    paddingVertical: valit.s,
    borderRadius: sateet.l,
    borderWidth: 1,
    borderColor: varit.reuna,
    backgroundColor: varit.pinta,
    minHeight: 40,
    justifyContent: "center",
  },
  valittu: {
    backgroundColor: varit.korostus,
    borderColor: varit.korostus,
  },
  painettu: {
    opacity: 0.75,
  },
  teksti: {
    fontSize: 15,
    color: varit.teksti,
  },
  valittuTeksti: {
    color: varit.korostusTeksti,
    fontWeight: "600",
  },
});
