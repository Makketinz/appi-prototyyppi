import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { KAPPALEMAARA_MAX } from "@/data/muotoilu";
import { sateet, valit, varit } from "@/ui/teema";

type Props = {
  /** Kentän teksti; jäsennys ja tarkistus tehdään tallennettaessa. */
  arvo: string;
  onMuuta: (arvo: string) => void;
  otsikko: string;
};

/** Kappalemäärä: − / + -napit ja suora syöttö (esim. 12 paria sukkia). */
export function Maaravalitsin({ arvo, onMuuta, otsikko }: Props) {
  const nykyinen = /^\d+$/.test(arvo.trim()) ? Number(arvo.trim()) : 1;
  return (
    <View style={tyylit.rivi}>
      <Nappula
        merkki="−"
        nimi={`${otsikko}: yksi vähemmän`}
        disabled={nykyinen <= 1}
        onPress={() => onMuuta(String(Math.max(1, nykyinen - 1)))}
      />
      <TextInput
        accessibilityLabel={otsikko}
        value={arvo}
        onChangeText={onMuuta}
        keyboardType="number-pad"
        inputMode="numeric"
        maxLength={3}
        selectTextOnFocus
        style={tyylit.kentta}
      />
      <Nappula
        merkki="+"
        nimi={`${otsikko}: yksi lisää`}
        disabled={nykyinen >= KAPPALEMAARA_MAX}
        onPress={() => onMuuta(String(Math.min(KAPPALEMAARA_MAX, nykyinen + 1)))}
      />
    </View>
  );
}

function Nappula({ merkki, nimi, disabled, onPress }: { merkki: string; nimi: string; disabled: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={nimi}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [tyylit.nappula, disabled && tyylit.passiivinen, pressed && tyylit.painettu]}
    >
      <Text style={tyylit.nappulaTeksti}>{merkki}</Text>
    </Pressable>
  );
}

const tyylit = StyleSheet.create({
  rivi: {
    flexDirection: "row",
    alignItems: "center",
    gap: valit.s,
  },
  kentta: {
    width: 72,
    minHeight: 48,
    textAlign: "center",
    fontSize: 18,
    color: varit.teksti,
    backgroundColor: varit.pinta,
    borderWidth: 1,
    borderColor: varit.reuna,
    borderRadius: sateet.s,
  },
  nappula: {
    width: 48,
    height: 48,
    borderRadius: sateet.s,
    borderWidth: 1,
    borderColor: varit.korostus,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: varit.pinta,
  },
  nappulaTeksti: {
    fontSize: 22,
    lineHeight: 24,
    color: varit.korostus,
    fontWeight: "600",
  },
  passiivinen: {
    opacity: 0.4,
  },
  painettu: {
    opacity: 0.7,
  },
});
