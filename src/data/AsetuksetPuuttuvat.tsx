import { StyleSheet, Text, View } from "react-native";

import { Ruutu } from "@/ui/Ruutu";
import { sateet, valit, varit } from "@/ui/teema";

/** Näytetään, kun Supabase-avaimia ei ole annettu buildille. */
export function AsetuksetPuuttuvat() {
  return (
    <Ruutu otsikko="Supabase-asetukset puuttuvat">
      <Text style={tyylit.teksti}>
        Sovellus tarvitsee Supabase-projektin osoitteen ja anon-avaimen. Paikallisesti ne annetaan
        .env-tiedostossa, GitHub Pagesissa repon secreteinä.
      </Text>
      <View style={tyylit.koodi}>
        <Text style={tyylit.koodiTeksti}>EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co</Text>
        <Text style={tyylit.koodiTeksti}>EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...</Text>
      </View>
      <Text style={tyylit.teksti}>Ohjeet: README.md, kohta "Supabase-projektin luonti".</Text>
    </Ruutu>
  );
}

const tyylit = StyleSheet.create({
  teksti: {
    fontSize: 15,
    lineHeight: 22,
    color: varit.teksti,
  },
  koodi: {
    backgroundColor: varit.pinta,
    borderWidth: 1,
    borderColor: varit.reuna,
    borderRadius: sateet.s,
    padding: valit.m,
    gap: valit.xs,
  },
  koodiTeksti: {
    fontFamily: "monospace",
    fontSize: 13,
    color: varit.teksti,
  },
});
