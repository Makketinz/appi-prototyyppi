import { useState } from "react";
import { ActivityIndicator, StyleSheet, Text } from "react-native";

import { kenkakoot, useKoot, vaatekoot } from "@/data/koot";
import { useLuoLapsi } from "@/data/lapsi";
import { Ilmoitus } from "@/ui/Ilmoitus";
import { Kentta } from "@/ui/Kentta";
import { KokoValinta } from "@/ui/KokoValinta";
import { Nappi } from "@/ui/Nappi";
import { Osio } from "@/ui/Osio";
import { Ruutu } from "@/ui/Ruutu";
import { varit } from "@/ui/teema";

/** Ensikäynnistys: lapsen nimi, nykyinen vaatekoko ja nykyinen kengänkoko (molemmat valinnaisia). */
export default function Onboarding() {
  const koot = useKoot();
  const luoLapsi = useLuoLapsi();
  const [nimi, asetaNimi] = useState("");
  const [vaatekokoId, asetaVaatekokoId] = useState<string | null>(null);
  const [kenkakokoId, asetaKenkakokoId] = useState<string | null>(null);
  const [virhe, asetaVirhe] = useState<string | null>(null);

  async function tallenna() {
    if (nimi.trim() === "") {
      asetaVirhe("Anna lapsen nimi.");
      return;
    }
    asetaVirhe(null);
    try {
      // Onnistunut tallennus päivittää lapsen välimuistiin; Vartija ohjaa silloin etusivulle.
      await luoLapsi.mutateAsync({ nimi, nykyinen_koko_id: vaatekokoId, nykyinen_kenkakoko_id: kenkakokoId });
    } catch (e) {
      asetaVirhe(e instanceof Error ? e.message : "Tallennus epäonnistui.");
    }
  }

  return (
    <Ruutu otsikko="Kenen vaatteita?">
      <Text style={tyylit.kuvaus}>
        Lapsesta tallennetaan vain nimi sekä nykyinen vaatekoko ja kengänkoko. Koot voi jättää tyhjäksi ja lisätä
        myöhemmin.
      </Text>

      <Kentta
        otsikko="Lapsen nimi"
        value={nimi}
        onChangeText={asetaNimi}
        placeholder="esim. Aino"
        autoFocus
        onSubmitEditing={tallenna}
      />

      {koot.isPending ? <ActivityIndicator color={varit.korostus} /> : null}
      {koot.isError ? <Ilmoitus teksti={`Kokojen haku epäonnistui: ${koot.error.message}`} /> : null}

      {koot.data ? (
        <>
          <Osio otsikko="Nykyinen vaatekoko (valinnainen)">
            <KokoValinta koot={vaatekoot(koot.data)} valittuId={vaatekokoId} onValitse={asetaVaatekokoId} />
          </Osio>
          <Osio otsikko="Nykyinen kengänkoko (valinnainen)">
            <KokoValinta koot={kenkakoot(koot.data)} valittuId={kenkakokoId} onValitse={asetaKenkakokoId} />
          </Osio>
        </>
      ) : null}

      {virhe ? <Ilmoitus teksti={virhe} /> : null}

      <Nappi teksti="Tallenna ja aloita" onPress={tallenna} odottaa={luoLapsi.isPending} />
      <Text style={tyylit.pienteksti}>
        Sarjalisäys alkusyöttöä varten tulee vaiheessa 9; sitä ennen etusivu on tyhjä.
      </Text>
    </Ruutu>
  );
}

const tyylit = StyleSheet.create({
  kuvaus: {
    fontSize: 15,
    lineHeight: 22,
    color: varit.tekstiHimmea,
  },
  pienteksti: {
    fontSize: 13,
    lineHeight: 18,
    color: varit.tekstiHimmea,
  },
});
