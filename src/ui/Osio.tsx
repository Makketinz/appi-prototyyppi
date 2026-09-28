import type { PropsWithChildren } from "react";
import { StyleSheet, Text, View } from "react-native";

import { valit, varit } from "@/ui/teema";

type Props = PropsWithChildren<{
  otsikko: string;
  /** Pieni selite otsikon alla, esim. "valinnainen" tai rajoitus. */
  lisatieto?: string;
  virhe?: string | null;
}>;

/** Lomakkeen otsikoitu osio valintasiruille ja muille kentille. */
export function Osio({ otsikko, lisatieto, virhe, children }: Props) {
  return (
    <View style={tyylit.osio} role="group" aria-label={otsikko}>
      <Text style={tyylit.otsikko}>{otsikko}</Text>
      {lisatieto ? <Text style={tyylit.lisatieto}>{lisatieto}</Text> : null}
      {children}
      {virhe ? (
        <Text style={tyylit.virhe} accessibilityRole="alert">
          {virhe}
        </Text>
      ) : null}
    </View>
  );
}

const tyylit = StyleSheet.create({
  osio: {
    gap: valit.s,
  },
  otsikko: {
    fontSize: 14,
    fontWeight: "600",
    color: varit.teksti,
  },
  lisatieto: {
    fontSize: 13,
    color: varit.tekstiHimmea,
    marginTop: -valit.xs,
  },
  virhe: {
    fontSize: 13,
    color: varit.virhe,
  },
});
