import { StyleSheet, Text, TextInput, type TextInputProps, View } from "react-native";

import { sateet, valit, varit } from "@/ui/teema";

type Props = TextInputProps & {
  otsikko: string;
  virhe?: string | null;
};

/** Otsikoitu tekstikenttä. */
export function Kentta({ otsikko, virhe, style, ...props }: Props) {
  return (
    <View style={tyylit.kehys}>
      <Text style={tyylit.otsikko}>{otsikko}</Text>
      <TextInput
        accessibilityLabel={otsikko}
        placeholderTextColor={varit.tekstiHimmea}
        style={[tyylit.kentta, virhe ? tyylit.kenttaVirhe : null, style]}
        {...props}
      />
      {virhe ? <Text style={tyylit.virhe}>{virhe}</Text> : null}
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
  kenttaVirhe: {
    borderColor: varit.virhe,
  },
  virhe: {
    fontSize: 13,
    color: varit.virhe,
  },
});
