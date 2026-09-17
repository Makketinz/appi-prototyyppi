import { StyleSheet, Text, View } from "react-native";

import { sateet, valit, varit } from "@/ui/teema";

/** Virhe- tai tiedoteilmoitus lomakkeen yhteyteen. */
export function Ilmoitus({ teksti, tyyppi = "virhe" }: { teksti: string; tyyppi?: "virhe" | "tieto" }) {
  const virhe = tyyppi === "virhe";
  return (
    <View
      accessibilityRole="alert"
      style={[tyylit.kehys, virhe ? tyylit.virhe : tyylit.tieto]}
    >
      <Text style={[tyylit.teksti, virhe ? tyylit.virheTeksti : null]}>{teksti}</Text>
    </View>
  );
}

const tyylit = StyleSheet.create({
  kehys: {
    borderRadius: sateet.s,
    padding: valit.m,
    borderWidth: 1,
  },
  virhe: {
    backgroundColor: varit.virheTausta,
    borderColor: varit.virhe,
  },
  tieto: {
    backgroundColor: varit.pinta,
    borderColor: varit.reuna,
  },
  teksti: {
    fontSize: 14,
    lineHeight: 20,
    color: varit.teksti,
  },
  virheTeksti: {
    color: varit.virhe,
  },
});
