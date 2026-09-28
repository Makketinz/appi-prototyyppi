import { Link } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { KATEGORIA_SELITE, type Kategoria, TILA_SELITE } from "@/data/tyypit";
import type { VaateNakyma } from "@/data/vaatteet";
import { sateet, valit, varit } from "@/ui/teema";

type Props = {
  vaate: VaateNakyma;
  /** Näytä tila rivillä (kun lista ei ole jo rajattu yhteen tilaan). */
  naytaTila: boolean;
};

/**
 * Vaatelistan rivi: kuva (vaiheeseen 6 asti paikanpitäjä), nimi tai kategoria, merkki,
 * säilytyspaikka, koko ja kappalemäärä, jos se on yli 1. Rivi avaa vaatteen sivun.
 */
export function VaateRivi({ vaate, naytaTila }: Props) {
  const otsikko = vaate.nimi?.trim() || KATEGORIA_SELITE[vaate.kategoria];
  const lisat = [vaate.merkki?.nimi, vaate.sailytyspaikka?.nimi].filter((x): x is string => Boolean(x));

  return (
    // Link + asChild ei välitä Pressablen funktiotyyliä, joten tyyli on sisemmällä näkymällä.
    <Link href={{ pathname: "/vaate/[id]", params: { id: vaate.id } }} asChild>
      <Pressable testID="vaaterivi">
        {({ pressed }) => (
          <View style={[tyylit.rivi, pressed && tyylit.painettu]}>
            <View style={tyylit.kuva} aria-hidden>
              <Text style={tyylit.kuvaTeksti}>{lyhenne(vaate.kategoria)}</Text>
            </View>
            <View style={tyylit.keski}>
              <Text style={tyylit.otsikko} numberOfLines={1} testID="vaaterivi-otsikko">
                {otsikko}
              </Text>
              {lisat.length > 0 ? (
                <Text style={tyylit.lisat} numberOfLines={1}>
                  {lisat.join(" · ")}
                </Text>
              ) : null}
              {naytaTila ? <Text style={tyylit.tila}>{TILA_SELITE[vaate.tila]}</Text> : null}
            </View>
            <View style={tyylit.oikea}>
              <Text style={tyylit.koko} testID="vaaterivi-koko">
                {vaate.koko.nimi}
              </Text>
              {vaate.kappalemaara > 1 ? <Text style={tyylit.kpl}>{vaate.kappalemaara} kpl</Text> : null}
            </View>
          </View>
        )}
      </Pressable>
    </Link>
  );
}

/** Kategorian kaksikirjaiminen tunnus kuvan paikalle, esim. Haalarit → "Ha". */
function lyhenne(kategoria: Kategoria): string {
  return KATEGORIA_SELITE[kategoria].slice(0, 2);
}

const tyylit = StyleSheet.create({
  rivi: {
    flexDirection: "row",
    alignItems: "center",
    gap: valit.m,
    paddingVertical: valit.s + 2,
    paddingHorizontal: valit.m,
    backgroundColor: varit.pinta,
    borderRadius: sateet.m,
    borderWidth: 1,
    borderColor: varit.reuna,
  },
  painettu: {
    opacity: 0.7,
  },
  kuva: {
    width: 48,
    height: 48,
    borderRadius: sateet.s,
    backgroundColor: varit.tausta,
    alignItems: "center",
    justifyContent: "center",
  },
  kuvaTeksti: {
    fontSize: 15,
    fontWeight: "600",
    color: varit.tekstiHimmea,
  },
  keski: {
    flex: 1,
    gap: 2,
  },
  otsikko: {
    fontSize: 16,
    fontWeight: "600",
    color: varit.teksti,
  },
  lisat: {
    fontSize: 14,
    color: varit.tekstiHimmea,
  },
  tila: {
    fontSize: 12,
    color: varit.korostus,
    fontWeight: "600",
  },
  oikea: {
    alignItems: "flex-end",
    minWidth: 48,
  },
  koko: {
    fontSize: 18,
    fontWeight: "700",
    color: varit.teksti,
  },
  kpl: {
    fontSize: 13,
    color: varit.tekstiHimmea,
  },
});
