import { StyleSheet, Text } from "react-native";

import { useAuth } from "@/data/AuthProvider";
import { useKoot } from "@/data/koot";
import { useOmaLapsi } from "@/data/lapsi";
import { Ruutu } from "@/ui/Ruutu";
import { varit } from "@/ui/teema";
import { Tyhja } from "@/ui/Tyhja";

export default function Etusivu() {
  const { sessio } = useAuth();
  const kirjautunut = sessio !== null;
  const lapsi = useOmaLapsi(kirjautunut);
  const koot = useKoot(kirjautunut);
  const koko = koot.data?.find((k) => k.id === lapsi.data?.nykyinen_koko_id);
  const nimi = lapsi.data?.nimi;

  return (
    <Ruutu otsikko={nimi ? `${nimi}n vaatteet` : "Etusivu"}>
      {lapsi.data ? (
        <Text style={tyylit.tila}>
          {koko ? `Nykyinen koko ${koko.nimi}.` : "Nykyistä kokoa ei ole annettu."} Vaatteita ei ole vielä kirjattu.
        </Text>
      ) : null}
      <Tyhja
        otsikko="Ei vielä vaatteita"
        teksti="Haku, suodattimet ja tilakortit lukumäärineen tulevat vaiheessa 8. Lisää ensimmäinen vaate + -napista, kun lisäys on valmis (vaihe 5)."
      />
    </Ruutu>
  );
}

const tyylit = StyleSheet.create({
  tila: {
    fontSize: 15,
    lineHeight: 22,
    color: varit.tekstiHimmea,
  },
});
