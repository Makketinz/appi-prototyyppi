import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { ryhmittele } from "@/data/koot";
import { KOKORYHMA_SELITE, type KokoRivi } from "@/data/tyypit";
import { SiruValinta } from "@/ui/SiruValinta";
import { valit, varit } from "@/ui/teema";

type Props = {
  koot: KokoRivi[];
  valittuId: string | null;
  onValitse: (id: string | null) => void;
  pakollinen?: boolean;
  /** Näytä kengänkoot ensin (kun kategoria on Kengät). */
  kengatEnsin?: boolean;
  /**
   * Tiivis tila: näytetään vain valitun koon ryhmä ja linkki muihin. Pitää pitkän
   * lomakkeen luettavana; ilman valintaa kaikki ryhmät näkyvät.
   */
  tiivis?: boolean;
};

/** Koon valinta kokoryhmittäin (senttikoot, kirjainkoot, kengät, yleiset). */
export function KokoValinta({ koot, valittuId, onValitse, pakollinen = false, kengatEnsin = false, tiivis = false }: Props) {
  const [kaikki, asetaKaikki] = useState(false);
  const ryhmat = ryhmittele(koot);
  const jarjestetyt = kengatEnsin
    ? [...ryhmat.filter((r) => r.ryhma === "kenka"), ...ryhmat.filter((r) => r.ryhma !== "kenka")]
    : ryhmat;
  const valitunRyhma = koot.find((k) => k.id === valittuId)?.ryhma;
  const naytettavat =
    tiivis && !kaikki && valitunRyhma ? jarjestetyt.filter((r) => r.ryhma === valitunRyhma) : jarjestetyt;

  return (
    <View style={tyylit.kehys}>
      {naytettavat.map((ryhma) => (
        <View key={ryhma.ryhma} style={tyylit.ryhma}>
          <Text style={tyylit.ryhmaOtsikko}>{KOKORYHMA_SELITE[ryhma.ryhma]}</Text>
          <SiruValinta
            vaihtoehdot={ryhma.koot.map((k) => ({ arvo: k.id, teksti: k.nimi }))}
            valittu={valittuId}
            onValitse={onValitse}
            pakollinen={pakollinen}
          />
        </View>
      ))}
      {tiivis && valitunRyhma ? (
        <Pressable accessibilityRole="button" onPress={() => asetaKaikki(!kaikki)} style={tyylit.linkki}>
          <Text style={tyylit.linkkiTeksti}>{kaikki ? "Näytä vain valitun koon ryhmä" : "Näytä kaikki koot"}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const tyylit = StyleSheet.create({
  kehys: {
    gap: valit.m,
  },
  ryhma: {
    gap: valit.s,
  },
  ryhmaOtsikko: {
    fontSize: 13,
    color: varit.tekstiHimmea,
  },
  linkki: {
    alignSelf: "flex-start",
    paddingVertical: valit.xs,
  },
  linkkiTeksti: {
    fontSize: 14,
    color: varit.korostus,
    fontWeight: "600",
  },
});
