import { StyleSheet, Text, TextInput, type TextInputProps, View } from "react-native";

import { sateet, valit, varit } from "@/ui/teema";

type Props = TextInputProps & {
  otsikko: string;
  virhe?: string | null;
  /** Pieni selite kentän alla. */
  lisatieto?: string | null;
};

/** Otsikoitu tekstikenttä. */
export function Kentta({ otsikko, virhe, lisatieto, style, ...props }: Props) {
  const lukittu = props.editable === false;
  return (
    <View style={tyylit.kehys}>
      <Text style={tyylit.otsikko}>{otsikko}</Text>
      <TextInput
        accessibilityLabel={otsikko}
        placeholderTextColor={varit.tekstiHimmea}
        style={[
          tyylit.kentta,
          props.multiline ? tyylit.monirivi : null,
          lukittu ? tyylit.lukittu : null,
          virhe ? tyylit.kenttaVirhe : null,
          style,
        ]}
        {...props}
      />
      {virhe ? (
        <Text style={tyylit.virhe} accessibilityRole="alert">
          {virhe}
        </Text>
      ) : null}
      {lisatieto ? <Text style={tyylit.lisatieto}>{lisatieto}</Text> : null}
    </View>
  );
}

const tyylit = StyleSheet.create({
  kehys: {
    gap: valit.xs,
  },
  otsikko: {
    fontSize: 14,
    fontWeight: "600",
    color: varit.teksti,
  },
  kentta: {
    backgroundColor: varit.pinta,
    borderWidth: 1,
    borderColor: varit.reuna,
    borderRadius: sateet.s,
    paddingHorizontal: valit.m,
    paddingVertical: valit.s + 4,
    fontSize: 16,
    color: varit.teksti,
    minHeight: 48,
  },
  monirivi: {
    minHeight: 96,
    textAlignVertical: "top",
  },
  lukittu: {
    backgroundColor: varit.tausta,
    color: varit.tekstiHimmea,
  },
  kenttaVirhe: {
    borderColor: varit.virhe,
  },
  lisatieto: {
    fontSize: 13,
    color: varit.tekstiHimmea,
  },
  virhe: {
    fontSize: 13,
    color: varit.virhe,
  },
});
