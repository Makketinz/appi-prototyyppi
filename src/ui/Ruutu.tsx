import type { PropsWithChildren, ReactNode } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { RUUDUN_MAX_LEVEYS, valit, varit } from "@/ui/teema";

type Props = PropsWithChildren<{
  /** Iso otsikko. Jätetään pois sivuilla, joilla otsikko on jo yläpalkissa. */
  otsikko?: string;
  /** Vierittyvä sisältö (oletus). Lomakkeet ja listat käyttävät tätä. */
  vieritettava?: boolean;
  /** Ruudun alareunaan kiinnitetty sisältö, esim. lomakkeen Tallenna-nappi. */
  alaosa?: ReactNode;
}>;

/**
 * Yhteinen näkymäkehys: otsikko ylhäällä, sisältö keskitettynä mobiilileveyteen.
 */
export function Ruutu({ otsikko, vieritettava = true, alaosa, children }: Props) {
  const insets = useSafeAreaInsets();
  const sisalto = (
    <View style={tyylit.sisalto}>
      {otsikko ? (
        <Text style={tyylit.otsikko} accessibilityRole="header">
          {otsikko}
        </Text>
      ) : null}
      {children}
    </View>
  );

  return (
    <View style={tyylit.tausta}>
      {vieritettava ? (
        <ScrollView style={tyylit.taysi} contentContainerStyle={tyylit.vieritys} keyboardShouldPersistTaps="handled">
          {sisalto}
        </ScrollView>
      ) : (
        sisalto
      )}
      {alaosa ? (
        <View style={[tyylit.alaosa, { paddingBottom: valit.s + insets.bottom }]}>
          <View style={tyylit.alaosaSisalto}>{alaosa}</View>
        </View>
      ) : null}
    </View>
  );
}

const tyylit = StyleSheet.create({
  tausta: {
    flex: 1,
    backgroundColor: varit.tausta,
    alignItems: "center",
  },
  taysi: {
    width: "100%",
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
  alaosa: {
    width: "100%",
    alignItems: "center",
    backgroundColor: varit.pinta,
    borderTopWidth: 1,
    borderTopColor: varit.reuna,
    paddingTop: valit.s,
  },
  alaosaSisalto: {
    width: "100%",
    maxWidth: RUUDUN_MAX_LEVEYS,
    paddingHorizontal: valit.m,
    gap: valit.s,
  },
});
