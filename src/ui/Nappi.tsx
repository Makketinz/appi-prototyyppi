import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";

import { sateet, valit, varit } from "@/ui/teema";

type Props = {
  teksti: string;
  onPress: () => void;
  /** Toissijainen nappi: ääriviiva, ei täyttöä. */
  toissijainen?: boolean;
  disabled?: boolean;
  odottaa?: boolean;
};

export function Nappi({ teksti, onPress, toissijainen = false, disabled = false, odottaa = false }: Props) {
  const passiivinen = disabled || odottaa;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: passiivinen }}
      disabled={passiivinen}
      onPress={onPress}
      style={({ pressed }) => [
        tyylit.nappi,
        toissijainen && tyylit.toissijainen,
        passiivinen && tyylit.passiivinen,
        pressed && tyylit.painettu,
      ]}
    >
      {odottaa ? (
        <ActivityIndicator color={toissijainen ? varit.korostus : varit.korostusTeksti} />
      ) : (
        <Text style={[tyylit.teksti, toissijainen && tyylit.toissijainenTeksti]}>{teksti}</Text>
      )}
    </Pressable>
  );
}

const tyylit = StyleSheet.create({
  nappi: {
    backgroundColor: varit.korostus,
    borderRadius: sateet.m,
    paddingVertical: valit.m - 2,
    paddingHorizontal: valit.l,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
  },
  toissijainen: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: varit.korostus,
  },
  passiivinen: {
    opacity: 0.5,
  },
  painettu: {
    opacity: 0.75,
  },
  teksti: {
    color: varit.korostusTeksti,
    fontSize: 16,
    fontWeight: "600",
  },
  toissijainenTeksti: {
    color: varit.korostus,
  },
});
