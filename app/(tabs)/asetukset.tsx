import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { kirjauduUlos, useAuth } from "@/data/AuthProvider";
import { useKoot } from "@/data/koot";
import { useOmaLapsi } from "@/data/lapsi";
import { Nappi } from "@/ui/Nappi";
import { Ruutu } from "@/ui/Ruutu";
import { sateet, valit, varit } from "@/ui/teema";
import { Tyhja } from "@/ui/Tyhja";

export default function Asetukset() {
  const { sessio } = useAuth();
  const kirjautunut = sessio !== null;
  const lapsi = useOmaLapsi(kirjautunut);
  const koot = useKoot(kirjautunut);
  const koko = koot.data?.find((k) => k.id === lapsi.data?.nykyinen_koko_id);
  const [odottaa, asetaOdottaa] = useState(false);

  async function ulos() {
    asetaOdottaa(true);
    try {
      await kirjauduUlos();
    } finally {
      asetaOdottaa(false);
    }
  }

  return (
    <Ruutu otsikko="Asetukset">
      <View style={tyylit.kortti}>
        <Text style={tyylit.otsikko}>Lapsi</Text>
        <Text style={tyylit.rivi}>{lapsi.data?.nimi ?? "–"}</Text>
        <Text style={tyylit.himmea}>{koko ? `Nykyinen koko ${koko.nimi}` : "Nykyistä kokoa ei ole annettu"}</Text>
        <Text style={tyylit.himmea}>Muokkaus tulee vaiheessa 11.</Text>
      </View>

      <View style={tyylit.kortti}>
        <Text style={tyylit.otsikko}>Tili</Text>
        <Text style={tyylit.rivi}>{sessio?.user.email ?? "–"}</Text>
        <Nappi teksti="Kirjaudu ulos" toissijainen onPress={ulos} odottaa={odottaa} />
      </View>

      <Tyhja
        otsikko="Tulee vaiheessa 11–12"
        teksti="Merkkien ja säilytyspaikkojen uudelleennimeys, talouskortti, tietojen vienti ja tilin poisto."
      />
    </Ruutu>
  );
}

const tyylit = StyleSheet.create({
  kortti: {
    backgroundColor: varit.pinta,
    borderRadius: sateet.m,
    borderWidth: 1,
    borderColor: varit.reuna,
    padding: valit.m,
    gap: valit.s,
  },
  otsikko: {
    fontSize: 13,
    fontWeight: "600",
    color: varit.tekstiHimmea,
    textTransform: "uppercase",
  },
  rivi: {
    fontSize: 17,
    color: varit.teksti,
  },
  himmea: {
    fontSize: 14,
    color: varit.tekstiHimmea,
  },
});
