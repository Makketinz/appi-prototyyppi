import { StyleSheet, View } from "react-native";

import { Siru } from "@/ui/Siru";
import { valit } from "@/ui/teema";

export type Vaihtoehto<T extends string> = { arvo: T; teksti: string };

/** Muuntaa selitetaulun (arvo → teksti) vaihtoehdoiksi annetussa järjestyksessä. */
export function vaihtoehdot<T extends string>(arvot: readonly T[], selitteet: Record<T, string>): Vaihtoehto<T>[] {
  return arvot.map((arvo) => ({ arvo, teksti: selitteet[arvo] }));
}

type Props<T extends string> = {
  vaihtoehdot: readonly Vaihtoehto<T>[];
  valittu: T | null;
  onValitse: (arvo: T | null) => void;
  /** Pakollinen kenttä: valintaa ei voi poistaa painamalla valittua sirua uudelleen. */
  pakollinen?: boolean;
  /** Ensimmäinen siru, joka tyhjentää valinnan (esim. "Ei merkkiä"). */
  tyhjaTeksti?: string;
};

/** Yksi valinta sirujen joukosta. */
export function SiruValinta<T extends string>({ vaihtoehdot, valittu, onValitse, pakollinen = false, tyhjaTeksti }: Props<T>) {
  return (
    <View style={tyylit.rivi}>
      {tyhjaTeksti ? <Siru teksti={tyhjaTeksti} valittu={valittu === null} onPress={() => onValitse(null)} /> : null}
      {vaihtoehdot.map((v) => (
        <Siru
          key={v.arvo}
          teksti={v.teksti}
          valittu={v.arvo === valittu}
          onPress={() => onValitse(v.arvo === valittu && !pakollinen ? null : v.arvo)}
        />
      ))}
    </View>
  );
}

type MoniProps<T extends string> = {
  vaihtoehdot: readonly Vaihtoehto<T>[];
  valitut: readonly T[];
  onMuuta: (valitut: T[]) => void;
};

/** Monivalinta: siru valitaan ja poistetaan painamalla. Tulos pysyy vaihtoehtojen järjestyksessä. */
export function SiruMonivalinta<T extends string>({ vaihtoehdot, valitut, onMuuta }: MoniProps<T>) {
  function vaihda(arvo: T) {
    const uusi = valitut.includes(arvo) ? valitut.filter((a) => a !== arvo) : [...valitut, arvo];
    onMuuta(vaihtoehdot.map((v) => v.arvo).filter((a) => uusi.includes(a)));
  }
  return (
    <View style={tyylit.rivi}>
      {vaihtoehdot.map((v) => (
        <Siru key={v.arvo} teksti={v.teksti} valittu={valitut.includes(v.arvo)} onPress={() => vaihda(v.arvo)} />
      ))}
    </View>
  );
}

const tyylit = StyleSheet.create({
  rivi: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: valit.s,
  },
});
