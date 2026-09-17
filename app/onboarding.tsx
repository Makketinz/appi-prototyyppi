import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { kenkakoot, ryhmittele, useKoot, vaatekoot } from "@/data/koot";
import { useLuoLapsi } from "@/data/lapsi";
import { KOKORYHMA_SELITE, type KokoRivi } from "@/data/tyypit";
import { Ilmoitus } from "@/ui/Ilmoitus";
import { Kentta } from "@/ui/Kentta";
import { Nappi } from "@/ui/Nappi";
import { Ruutu } from "@/ui/Ruutu";
import { Siru } from "@/ui/Siru";
import { valit, varit } from "@/ui/teema";

/** Ensikäynnistys: lapsen nimi, nykyinen vaatekoko ja nykyinen kengänkoko (molemmat valinnaisia). */
export default function Onboarding() {
  const router = useRouter();
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
      await luoLapsi.mutateAsync({ nimi, nykyinen_koko_id: vaatekokoId, nykyinen_kenkakoko_id: kenkakokoId });
      router.replace("/");
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
          <Text style={tyylit.otsikko}>Nykyinen vaatekoko (valinnainen)</Text>
          {ryhmittele(vaatekoot(koot.data)).map((ryhma) => (
            <View key={ryhma.ryhma} style={tyylit.ryhma}>
              <Text style={tyylit.ryhmaOtsikko}>{KOKORYHMA_SELITE[ryhma.ryhma]}</Text>
              <Sirurivi koot={ryhma.koot} valittuId={vaatekokoId} onValitse={asetaVaatekokoId} />
            </View>
          ))}

          <Text style={tyylit.otsikko}>Nykyinen kengänkoko (valinnainen)</Text>
          <Sirurivi koot={kenkakoot(koot.data)} valittuId={kenkakokoId} onValitse={asetaKenkakokoId} />
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

/** Yksi valinta rivistä: sama siru uudelleen painettuna poistaa valinnan. */
function Sirurivi({
  koot,
  valittuId,
  onValitse,
}: {
  koot: KokoRivi[];
  valittuId: string | null;
  onValitse: (id: string | null) => void;
}) {
  return (
    <View style={tyylit.sirut}>
      {koot.map((k) => (
        <Siru
          key={k.id}
          teksti={k.nimi}
          valittu={k.id === valittuId}
          onPress={() => onValitse(k.id === valittuId ? null : k.id)}
        />
      ))}
    </View>
  );
}

const tyylit = StyleSheet.create({
  kuvaus: {
    fontSize: 15,
    lineHeight: 22,
    color: varit.tekstiHimmea,
  },
  otsikko: {
    fontSize: 14,
    fontWeight: "600",
    color: varit.teksti,
    marginTop: valit.s,
  },
  ryhma: {
    gap: valit.s,
  },
  ryhmaOtsikko: {
    fontSize: 13,
    color: varit.tekstiHimmea,
  },
  sirut: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: valit.s,
  },
  pienteksti: {
    fontSize: 13,
    lineHeight: 18,
    color: varit.tekstiHimmea,
  },
});
