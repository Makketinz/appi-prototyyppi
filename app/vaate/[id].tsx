import { Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { useAuth } from "@/data/AuthProvider";
import { useKoot } from "@/data/koot";
import { useMerkit, useSailytyspaikat } from "@/data/luettelot";
import {
  hintaKentaksi,
  jasennaHinta,
  jasennaKappalemaara,
  jasennaPaiva,
  muotoileAikaleima,
  muotoileHinta,
  muotoilePaiva,
  tanaanIso,
  tekstiTaiNull,
} from "@/data/muotoilu";
import {
  HANKINTATAPA_SELITE,
  HANKINTATAVAT,
  type Hankintatapa,
  JEMMA_TYYPPI_SELITE,
  KATEGORIA_SELITE,
  KATEGORIAT,
  type Kategoria,
  type KokoRivi,
  KUNNOT,
  KUNTO_SELITE,
  type Kunto,
  SESONGIT,
  SESONKI_SELITE,
  type Sesonki,
  TILA_SELITE,
} from "@/data/tyypit";
import { type Nimetty, usePaivitaVaate, useVaate, type VaateMuutokset, type VaateNakyma } from "@/data/vaatteet";
import { Ilmoitus } from "@/ui/Ilmoitus";
import { Kentta } from "@/ui/Kentta";
import { KokoValinta } from "@/ui/KokoValinta";
import { Maaravalitsin } from "@/ui/Maaravalitsin";
import { Nappi } from "@/ui/Nappi";
import { Osio } from "@/ui/Osio";
import { Ruutu } from "@/ui/Ruutu";
import { SiruMonivalinta, SiruValinta, vaihtoehdot } from "@/ui/SiruValinta";
import { sateet, valit, varit } from "@/ui/teema";
import { Tyhja } from "@/ui/Tyhja";

/** Vaatteen sivu: kaikki kentät muokattavina. Kuvat (vaihe 6), tilan vaihto ja historia (7) ja kova poisto (12) tulevat myöhemmin. */
export default function VaatteenSivu() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { sessio } = useAuth();
  const kirjautunut = sessio !== null;
  const vaate = useVaate(id, kirjautunut);
  const koot = useKoot(kirjautunut);
  const merkit = useMerkit(kirjautunut);
  const paikat = useSailytyspaikat(kirjautunut);

  if (vaate.isError) {
    return (
      <Ruutu>
        <Ilmoitus teksti={`Vaatteen haku epäonnistui: ${vaate.error.message}`} />
      </Ruutu>
    );
  }
  if (vaate.isPending || !koot.data) {
    return (
      <Ruutu>
        <ActivityIndicator color={varit.korostus} />
      </Ruutu>
    );
  }
  if (vaate.data === null) {
    return (
      <Ruutu>
        <Stack.Screen options={{ title: "Vaatetta ei löytynyt" }} />
        <Tyhja otsikko="Vaatetta ei löytynyt" teksti="Vaate on voitu poistaa, tai linkki on väärä." />
      </Ruutu>
    );
  }

  return <Muokkaus vaate={vaate.data} koot={koot.data} merkit={merkit.data ?? []} paikat={paikat.data ?? []} />;
}

type Lomake = {
  kategoria: Kategoria;
  koko_id: string;
  nimi: string;
  kappalemaara: string;
  merkki_id: string | null;
  hankintatapa: Hankintatapa | null;
  ostohinta: string;
  ostopaiva: string;
  kunto: Kunto | null;
  huomiot: string;
  sailytyspaikka_id: string | null;
  sesongit: Sesonki[];
};

type Virheet = Partial<Record<"kappalemaara" | "ostohinta" | "ostopaiva", string>>;

function lomakkeeksi(v: VaateNakyma): Lomake {
  return {
    kategoria: v.kategoria,
    koko_id: v.koko_id,
    nimi: v.nimi ?? "",
    kappalemaara: String(v.kappalemaara),
    merkki_id: v.merkki_id,
    hankintatapa: v.hankintatapa,
    ostohinta: hintaKentaksi(v.ostohinta === null ? null : Number(v.ostohinta)),
    ostopaiva: muotoilePaiva(v.ostopaiva),
    kunto: v.kunto,
    huomiot: v.huomiot ?? "",
    sailytyspaikka_id: v.sailytyspaikka_id,
    sesongit: SESONGIT.filter((s) => v.sesongit.includes(s)),
  };
}

/** Vertaa lomaketta tallennettuun vaatteeseen: vain muuttuneet sarakkeet lähetetään. */
function laskeMuutokset(v: VaateNakyma, l: Lomake): { muutokset: VaateMuutokset; virheet: Virheet } {
  const muutokset: VaateMuutokset = {};
  const virheet: Virheet = {};

  if (l.kategoria !== v.kategoria) muutokset.kategoria = l.kategoria;
  if (l.koko_id !== v.koko_id) muutokset.koko_id = l.koko_id;

  const nimi = tekstiTaiNull(l.nimi);
  if (nimi !== v.nimi) muutokset.nimi = nimi;

  const kpl = jasennaKappalemaara(l.kappalemaara);
  if (!kpl.ok) virheet.kappalemaara = kpl.virhe;
  else if (kpl.arvo !== v.kappalemaara) muutokset.kappalemaara = kpl.arvo;

  if (l.merkki_id !== v.merkki_id) muutokset.merkki_id = l.merkki_id;
  if (l.hankintatapa !== v.hankintatapa) muutokset.hankintatapa = l.hankintatapa;

  // Lahjaksi saadun ostohinta on aina 0 (tietokanta tarkistaa saman).
  const hinta = l.hankintatapa === "lahja" ? ({ ok: true, arvo: 0 } as const) : jasennaHinta(l.ostohinta);
  const vanhaHinta = v.ostohinta === null ? null : Number(v.ostohinta);
  if (!hinta.ok) virheet.ostohinta = hinta.virhe;
  else if (hinta.arvo !== vanhaHinta) muutokset.ostohinta = hinta.arvo;

  const paiva = jasennaPaiva(l.ostopaiva);
  if (!paiva.ok) virheet.ostopaiva = paiva.virhe;
  else if (paiva.arvo !== v.ostopaiva) muutokset.ostopaiva = paiva.arvo;

  if (l.kunto !== v.kunto) muutokset.kunto = l.kunto;

  const huomiot = tekstiTaiNull(l.huomiot);
  if (huomiot !== v.huomiot) muutokset.huomiot = huomiot;

  if (l.sailytyspaikka_id !== v.sailytyspaikka_id) muutokset.sailytyspaikka_id = l.sailytyspaikka_id;

  const vanhatSesongit = SESONGIT.filter((s) => v.sesongit.includes(s));
  if (l.sesongit.join() !== vanhatSesongit.join()) muutokset.sesongit = l.sesongit;

  return { muutokset, virheet };
}

type Viesti = { tyyppi: "tieto" | "virhe"; teksti: string };

function Muokkaus({ vaate, koot, merkit, paikat }: { vaate: VaateNakyma; koot: KokoRivi[]; merkit: Nimetty[]; paikat: Nimetty[] }) {
  const paivita = usePaivitaVaate(vaate.id);
  const alkuperainen = useMemo(() => lomakkeeksi(vaate), [vaate]);
  const [lomake, asetaLomake] = useState<Lomake>(alkuperainen);
  const [virheet, asetaVirheet] = useState<Virheet>({});
  const [viesti, asetaViesti] = useState<Viesti | null>(null);

  // Tallennuksen jälkeen (tai kun vaate muuttuu muualla) lomake alustetaan tallennetusta tilasta.
  useEffect(() => {
    asetaLomake(alkuperainen);
    asetaVirheet({});
  }, [alkuperainen]);

  const muuttunut = JSON.stringify(lomake) !== JSON.stringify(alkuperainen);
  const otsikko = vaate.nimi || KATEGORIA_SELITE[vaate.kategoria];

  function muuta<K extends keyof Lomake>(kentta: K, arvo: Lomake[K]) {
    asetaLomake((l) => ({ ...l, [kentta]: arvo }));
    asetaViesti(null);
  }

  function valitseHankintatapa(tapa: Hankintatapa | null) {
    asetaLomake((l) => ({ ...l, hankintatapa: tapa, ostohinta: tapa === "lahja" ? "0" : l.ostohinta }));
    asetaViesti(null);
  }

  function peru() {
    asetaLomake(alkuperainen);
    asetaVirheet({});
    asetaViesti(null);
  }

  async function tallenna() {
    const { muutokset, virheet: uudetVirheet } = laskeMuutokset(vaate, lomake);
    asetaVirheet(uudetVirheet);
    if (Object.keys(uudetVirheet).length > 0) {
      asetaViesti({ tyyppi: "virhe", teksti: "Korjaa merkityt kentät." });
      return;
    }
    if (Object.keys(muutokset).length === 0) {
      asetaLomake(alkuperainen);
      return;
    }
    try {
      await paivita.mutateAsync(muutokset);
      asetaViesti({ tyyppi: "tieto", teksti: "Tallennettu." });
    } catch (e) {
      asetaViesti({ tyyppi: "virhe", teksti: e instanceof Error ? e.message : "Tallennus epäonnistui." });
    }
  }

  const alaosa =
    muuttunut || viesti ? (
      <>
        {viesti ? <Ilmoitus teksti={viesti.teksti} tyyppi={viesti.tyyppi} /> : null}
        {muuttunut ? (
          <View style={tyylit.napit}>
            <View style={tyylit.nappi}>
              <Nappi teksti="Peru" toissijainen onPress={peru} disabled={paivita.isPending} />
            </View>
            <View style={[tyylit.nappi, tyylit.paanappi]}>
              <Nappi teksti="Tallenna muutokset" onPress={tallenna} odottaa={paivita.isPending} />
            </View>
          </View>
        ) : null}
      </>
    ) : null;

  return (
    <Ruutu alaosa={alaosa}>
      <Stack.Screen options={{ title: otsikko }} />

      <View style={tyylit.tilakortti}>
        <Text style={tyylit.tilaOtsikko}>Tila</Text>
        <Text style={tyylit.tila} testID="vaate-tila">
          {TILA_SELITE[vaate.tila]}
          {vaate.jemma_tyyppi ? ` · ${JEMMA_TYYPPI_SELITE[vaate.jemma_tyyppi]}` : ""}
        </Text>
        {vaate.tila === "myyty" && vaate.myyntihinta !== null ? (
          <Text style={tyylit.himmea}>
            Myyty {muotoilePaiva(vaate.myyntipaiva)} hintaan {muotoileHinta(Number(vaate.myyntihinta))}
          </Text>
        ) : null}
        <Text style={tyylit.himmea}>Tilan vaihto ja tilahistoria tulevat vaiheessa 7.</Text>
      </View>

      <Osio otsikko="Kategoria">
        <SiruValinta
          vaihtoehdot={vaihtoehdot(KATEGORIAT, KATEGORIA_SELITE)}
          valittu={lomake.kategoria}
          onValitse={(k) => (k ? muuta("kategoria", k) : undefined)}
          pakollinen
        />
      </Osio>

      <Osio otsikko="Koko">
        <KokoValinta
          koot={koot}
          valittuId={lomake.koko_id}
          onValitse={(k) => (k ? muuta("koko_id", k) : undefined)}
          pakollinen
          tiivis
          kengatEnsin={lomake.kategoria === "kengat"}
        />
      </Osio>

      <Kentta
        otsikko="Nimi / kuvaus"
        value={lomake.nimi}
        onChangeText={(t) => muuta("nimi", t)}
        placeholder="esim. sininen dinohaalari"
        maxLength={120}
      />

      <Osio otsikko="Kappalemäärä" lisatieto="Sukat, bodyt ja pipot voi kirjata yhtenä rivinä." virhe={virheet.kappalemaara}>
        <Maaravalitsin otsikko="Kappalemäärä" arvo={lomake.kappalemaara} onMuuta={(t) => muuta("kappalemaara", t)} />
      </Osio>

      <Osio otsikko="Merkki" lisatieto={merkit.length === 0 ? "Merkkejä ei ole vielä. Uuden merkin lisäys tulee vaiheessa 5." : undefined}>
        <SiruValinta
          vaihtoehdot={merkit.map((m) => ({ arvo: m.id, teksti: m.nimi }))}
          valittu={lomake.merkki_id}
          onValitse={(m) => muuta("merkki_id", m)}
          tyhjaTeksti="Ei merkkiä / tuntematon"
        />
      </Osio>

      <Osio otsikko="Hankintatapa">
        <SiruValinta
          vaihtoehdot={vaihtoehdot(HANKINTATAVAT, HANKINTATAPA_SELITE)}
          valittu={lomake.hankintatapa}
          onValitse={valitseHankintatapa}
        />
      </Osio>

      <Kentta
        otsikko="Ostohinta (€)"
        value={lomake.ostohinta}
        onChangeText={(t) => muuta("ostohinta", t)}
        placeholder="esim. 4,50"
        keyboardType="decimal-pad"
        inputMode="decimal"
        editable={lomake.hankintatapa !== "lahja"}
        virhe={virheet.ostohinta}
        lisatieto={lomake.hankintatapa === "lahja" ? "Lahjaksi saadun hinta on 0 €." : "Koko rivin hinta, ei kappalehinta."}
      />

      <View style={tyylit.paivaRivi}>
        <View style={tyylit.paivaKentta}>
          <Kentta
            otsikko="Ostopäivä"
            value={lomake.ostopaiva}
            onChangeText={(t) => muuta("ostopaiva", t)}
            placeholder="pp.kk.vvvv"
            inputMode="decimal"
            maxLength={10}
            virhe={virheet.ostopaiva}
          />
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={() => muuta("ostopaiva", muotoilePaiva(tanaanIso()))}
          style={tyylit.tanaan}
        >
          <Text style={tyylit.tanaanTeksti}>Tänään</Text>
        </Pressable>
      </View>

      <Osio otsikko="Kunto">
        <SiruValinta vaihtoehdot={vaihtoehdot(KUNNOT, KUNTO_SELITE)} valittu={lomake.kunto} onValitse={(k) => muuta("kunto", k)} />
      </Osio>

      <Kentta
        otsikko="Mainittavat asiat"
        value={lomake.huomiot}
        onChangeText={(t) => muuta("huomiot", t)}
        placeholder="tahrat, kuluma, puuttuva nappi…"
        multiline
        maxLength={1000}
      />

      <Osio
        otsikko="Säilytyspaikka"
        lisatieto={paikat.length === 0 ? "Säilytyspaikkoja ei ole vielä. Uuden paikan lisäys tulee vaiheessa 5." : undefined}
      >
        <SiruValinta
          vaihtoehdot={paikat.map((p) => ({ arvo: p.id, teksti: p.nimi }))}
          valittu={lomake.sailytyspaikka_id}
          onValitse={(p) => muuta("sailytyspaikka_id", p)}
        />
      </Osio>

      <Osio otsikko="Sesonki" lisatieto="Voit valita useita, esim. välikausitakki = Kevät + Syksy.">
        <SiruMonivalinta
          vaihtoehdot={vaihtoehdot(SESONGIT, SESONKI_SELITE)}
          valitut={lomake.sesongit}
          onMuuta={(s) => muuta("sesongit", s)}
        />
      </Osio>

      <Text style={tyylit.himmea}>
        Lisätty {muotoileAikaleima(vaate.luotu)} · Muokattu {muotoileAikaleima(vaate.muokattu)}
      </Text>
    </Ruutu>
  );
}

const tyylit = StyleSheet.create({
  tilakortti: {
    backgroundColor: varit.pinta,
    borderRadius: sateet.m,
    borderWidth: 1,
    borderColor: varit.reuna,
    padding: valit.m,
    gap: valit.xs,
  },
  tilaOtsikko: {
    fontSize: 13,
    fontWeight: "600",
    color: varit.tekstiHimmea,
    textTransform: "uppercase",
  },
  tila: {
    fontSize: 17,
    fontWeight: "600",
    color: varit.teksti,
  },
  himmea: {
    fontSize: 13,
    color: varit.tekstiHimmea,
  },
  paivaRivi: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: valit.s,
  },
  paivaKentta: {
    flex: 1,
  },
  tanaan: {
    marginTop: 26,
    minHeight: 48,
    justifyContent: "center",
    paddingHorizontal: valit.m,
    borderRadius: sateet.s,
    borderWidth: 1,
    borderColor: varit.korostus,
  },
  tanaanTeksti: {
    color: varit.korostus,
    fontWeight: "600",
  },
  napit: {
    flexDirection: "row",
    gap: valit.s,
  },
  nappi: {
    flex: 1,
  },
  paanappi: {
    flex: 2,
  },
});
