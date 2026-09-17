import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { useKoot, ryhmittele } from "@/data/koot";
import { useLuoLapsi } from "@/data/lapsi";
import { KOKORYHMA_SELITE } from "@/data/tyypit";
import { Ilmoitus } from "@/ui/Ilmoitus";
import { Kentta } from "@/ui/Kentta";
import { Nappi } from "@/ui/Nappi";
import { Ruutu } from "@/ui/Ruutu";
import { Siru } from "@/ui/Siru";
import { valit, varit } from "@/ui/teema";

/** Ensikäynnistys: lapsen nimi ja nykyinen koko (valinnainen). */
export default function Onboarding() {
  const router = useRouter();
  const koot = useKoot();
  const luoLapsi = useLuoLapsi();
  const [nimi, asetaNimi] = useState("");
  const [kokoId, asetaKokoId] = useState<string | null>(null);
  const [virhe, asetaVirhe] = useState<string | null>(null);

  async function tallenna() {
    if (nimi.trim() === "") {
      asetaVirhe("Anna lapsen nimi.");
      return;
    }
    asetaVirhe(null);
    try {
      await luoLapsi.mutateAsync({ nimi, nykyinen_koko_id: kokoId });
      router.replace("/");
    } catch (e) {
      asetaVirhe(e instanceof Error ? e.message : "Tallennus epäonnistui.");
    }
  }

  return (
    <Ruutu otsikko="Kenen vaatteita?">
      <Text style={tyylit.kuvaus}>
        Lapsesta tallennetaan vain nimi ja nykyinen koko. Koon voi jättää tyhjäksi ja lisätä myöhemmin.
      </Text>

      <Kentta
        otsikko="Lapsen nimi"
        value={nimi}
        onChangeText={asetaNimi}
        placeholder="esim. Aino"
        autoFocus
        onSubmitEditing={tallenna}
      />

      <Text style={tyylit.otsikko}>Nykyinen koko (valinnainen)</Text>
      {koot.isPending ? <ActivityIndicator color={varit.korostus} /> : null}
      {koot.isError ? <Ilmoitus teksti={`Kokojen haku epäonnistui: ${koot.error.message}`} /> : null}
      {koot.data
        ? ryhmittele(koot.data).map((ryhma) => (
            <View key={ryhma.ryhma} style={tyylit.ryhma}>
              <Text style={tyylit.ryhmaOtsikko}>{KOKORYHMA_SELITE[ryhma.ryhma]}</Text>
              <View style={tyylit.sirut}>
                {ryhma.koot.map((k) => (
                  <Siru
                    key={k.id}
                    teksti={k.nimi}
                    valittu={k.id === kokoId}
                    onPress={() => asetaKokoId(k.id === kokoId ? null : k.id)}
                  />
                ))}
              </View>
            </View>
          ))
        : null}

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
  otsikko: {
    fontSize: 14,
    fontWeight: "600",
    color: varit.teksti,
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
