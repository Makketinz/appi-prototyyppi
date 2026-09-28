import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useMemo } from "react";

import { useAuth } from "@/data/AuthProvider";
import { useKoot } from "@/data/koot";
import { useOmaLapsi } from "@/data/lapsi";
import { useMerkit, useSailytyspaikat } from "@/data/luettelot";
import { KATEGORIA_SELITE, KATEGORIAT, type Kategoria, TILA_SELITE, TILAT, type Tila } from "@/data/tyypit";
import { type Jarjestys, onJarjestys, onUuid, type VaateSuodatin } from "@/data/vaatteet";
import { Ruutu } from "@/ui/Ruutu";
import { VaateLista } from "@/ui/VaateLista";

type Parametrit = {
  tila?: string;
  kategoria?: string;
  koko?: string;
  merkki?: string;
  sailytyspaikka?: string;
  jarjestys?: string;
};

/**
 * Suodatettu vaatelista: /vaatteet?tila=jemmassa, ?kategoria=housut&koko=<id>, … Tuntemattomat
 * tai virheelliset parametrit ohitetaan. Järjestys pysyy osoitteessa, joten Takaisin muistaa sen.
 */
export default function Vaatteet() {
  const parametrit = useLocalSearchParams<Parametrit>();
  const router = useRouter();
  const { sessio } = useAuth();
  const kirjautunut = sessio !== null;
  const lapsi = useOmaLapsi(kirjautunut);
  const koot = useKoot(kirjautunut);
  const merkit = useMerkit(kirjautunut);
  const paikat = useSailytyspaikat(kirjautunut);

  const { tila, kategoria, koko, merkki, sailytyspaikka } = parametrit;
  const suodatin = useMemo<VaateSuodatin>(() => {
    const s: VaateSuodatin = {};
    if ((TILAT as readonly string[]).includes(tila ?? "")) s.tila = tila as Tila;
    if ((KATEGORIAT as readonly string[]).includes(kategoria ?? "")) s.kategoria = kategoria as Kategoria;
    if (onUuid(koko)) s.koko_id = koko;
    if (onUuid(merkki)) s.merkki_id = merkki;
    if (onUuid(sailytyspaikka)) s.sailytyspaikka_id = sailytyspaikka;
    return s;
  }, [tila, kategoria, koko, merkki, sailytyspaikka]);
  const jarjestys: Jarjestys = onJarjestys(parametrit.jarjestys) ? parametrit.jarjestys : "muokattu";

  const osat = [
    suodatin.tila ? TILA_SELITE[suodatin.tila] : null,
    suodatin.kategoria ? KATEGORIA_SELITE[suodatin.kategoria] : null,
    suodatin.koko_id ? `koko ${koot.data?.find((k) => k.id === suodatin.koko_id)?.nimi ?? "…"}` : null,
    suodatin.merkki_id ? (merkit.data?.find((m) => m.id === suodatin.merkki_id)?.nimi ?? "…") : null,
    suodatin.sailytyspaikka_id ? (paikat.data?.find((p) => p.id === suodatin.sailytyspaikka_id)?.nimi ?? "…") : null,
  ].filter((o): o is string => o !== null);
  const otsikko = osat.length > 0 ? osat.join(" · ") : "Kaikki vaatteet";

  return (
    <>
      <Stack.Screen options={{ title: otsikko }} />
      <Ruutu>
        <VaateLista
          lapsiId={lapsi.data?.id}
          suodatin={suodatin}
          jarjestys={jarjestys}
          onJarjestys={(j) => router.setParams({ jarjestys: j })}
          tyhja={{ otsikko: "Ei vaatteita", teksti: `Valinnalla "${otsikko}" ei löytynyt yhtään vaatetta.` }}
        />
      </Ruutu>
    </>
  );
}
