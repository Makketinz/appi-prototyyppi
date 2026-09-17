import { StyleSheet, Text, View } from "react-native";

import { sateet, valit, varit } from "@/ui/teema";

/** Tyhjän tilan kortti: kertoo, mitä näkymässä on tulossa tai miten aloittaa. */
export function Tyhja({ otsikko, teksti }: { otsikko: string; teksti: string }) {
  return (
    <View style={tyylit.kortti}>
      <Text style={tyylit.otsikko}>{otsikko}</Text>
      <Text style={tyylit.teksti}>{teksti}</Text>
    </View>
  );
}

const tyylit = StyleSheet.create({
  kortti: {
    backgroundColor: varit.pinta,
    borderRadius: sateet.m,
    borderWidth: 1,
    borderColor: varit.reuna,
    padding: valit.m,
    gap: valit.s,
  },
  otsikko: {
    fontSize: 16,
    fontWeight: "600",
    color: varit.teksti,
  },
  teksti: {
    fontSize: 14,
    color: varit.tekstiHimmea,
    lineHeight: 20,
  },
});
