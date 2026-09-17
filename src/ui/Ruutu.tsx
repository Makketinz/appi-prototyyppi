import type { PropsWithChildren } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { RUUDUN_MAX_LEVEYS, valit, varit } from "@/ui/teema";

type Props = PropsWithChildren<{
  otsikko: string;
  /** Vierittyvä sisältö (oletus). Lomakkeet ja listat käyttävät tätä. */
  vieritettava?: boolean;
}>;

/**
 * Yhteinen näkymäkehys: otsikko ylhäällä, sisältö keskitettynä mobiilileveyteen.
 */
export function Ruutu({ otsikko, vieritettava = true, children }: Props) {
  const sisalto = (
    <View style={tyylit.sisalto}>
      <Text style={tyylit.otsikko} accessibilityRole="header">
        {otsikko}
      </Text>
      {children}
    </View>
  );

  return (
    <View style={tyylit.tausta}>
      {vieritettava ? (
        <ScrollView contentContainerStyle={tyylit.vieritys} keyboardShouldPersistTaps="handled">
          {sisalto}
        </ScrollView>
      ) : (
        sisalto
      )}
    </View>
  );
}

const tyylit = StyleSheet.create({
  tausta: {
    flex: 1,
    backgroundColor: varit.tausta,
    alignItems: "center",
  },
  vieritys: {
    flexGrow: 1,
    width: "100%",
    alignItems: "center",
  },
  sisalto: {
    flex: 1,
    width: "100%",
    maxWidth: RUUDUN_MAX_LEVEYS,
    padding: valit.m,
    gap: valit.m,
  },
  otsikko: {
    fontSize: 24,
    fontWeight: "700",
    color: varit.teksti,
    marginTop: valit.s,
  },
});
