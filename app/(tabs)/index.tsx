import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { useAuth } from "@/data/AuthProvider";
import { kokoKuvaus, useKoot } from "@/data/koot";
import { useOmaLapsi } from "@/data/lapsi";
import { TILA_SELITE, TILAT } from "@/data/tyypit";
import type { Jarjestys } from "@/data/vaatteet";
import { Osio } from "@/ui/Osio";
import { Ruutu } from "@/ui/Ruutu";
import { LinkkiSiru } from "@/ui/Siru";
import { valit, varit } from "@/ui/teema";
import { VaateLista } from "@/ui/VaateLista";

/**
 * Etusivu: tilat linkkeinä ja Kaikki vaatteet -lista. Tilakortit lukumäärineen, haku ja
 * suodattimet tulevat vaiheessa 8.
 */
export default function Etusivu() {
  const { sessio } = useAuth();
  const kirjautunut = sessio !== null;
  const lapsi = useOmaLapsi(kirjautunut);
  const koot = useKoot(kirjautunut);
  const [jarjestys, asetaJarjestys] = useState<Jarjestys>("muokattu");
  const kuvaus = kokoKuvaus(koot.data, lapsi.data);
  const nimi = lapsi.data?.nimi;

  return (
    <Ruutu otsikko={nimi ? `${nimi}n vaatteet` : "Etusivu"}>
      {lapsi.data ? (
        <Text style={tyylit.kuvaus}>{kuvaus ? `Nykyinen ${kuvaus}.` : "Nykyisiä kokoja ei ole annettu."}</Text>
      ) : null}

      <Osio otsikko="Tilat">
        <View style={tyylit.sirut}>
          {TILAT.map((tila) => (
            <LinkkiSiru key={tila} teksti={TILA_SELITE[tila]} href={{ pathname: "/vaatteet", params: { tila } }} />
          ))}
        </View>
      </Osio>

      <Text style={tyylit.osioOtsikko} accessibilityRole="header">
        Kaikki vaatteet
      </Text>
      <VaateLista
        lapsiId={lapsi.data?.id}
        suodatin={{}}
        jarjestys={jarjestys}
        onJarjestys={asetaJarjestys}
        tyhja={{
          otsikko: "Ei vielä vaatteita",
          teksti:
            "Vaatteen lisäys tulee vaiheessa 5. Siihen asti vaatteita voi lisätä esimerkkidatalla (README, kohta Esimerkkidata).",
        }}
      />
    </Ruutu>
  );
}

const tyylit = StyleSheet.create({
  kuvaus: {
    fontSize: 15,
    lineHeight: 22,
    color: varit.tekstiHimmea,
  },
  sirut: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: valit.s,
  },
  osioOtsikko: {
    fontSize: 18,
    fontWeight: "700",
    color: varit.teksti,
    marginTop: valit.s,
  },
});
