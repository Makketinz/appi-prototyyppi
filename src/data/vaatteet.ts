import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/data/supabase";
import type { Kategoria, KokoRivi, Tila, VaateRivi } from "@/data/tyypit";

/** Vaate ja sen koko, merkki ja säilytyspaikka yhdellä kyselyllä (PostgREST-upotus). */
const VALINTA =
  "*, koko:koko(id,nimi,ryhma,jarjestys), merkki:merkki(id,nimi), sailytyspaikka:sailytyspaikka(id,nimi)";

export type Nimetty = { id: string; nimi: string };

export type VaateNakyma = VaateRivi & {
  koko: Pick<KokoRivi, "id" | "nimi" | "ryhma" | "jarjestys">;
  merkki: Nimetty | null;
  sailytyspaikka: Nimetty | null;
};

/** Listan suodattimet. Avaimet ovat vaate-taulun sarakkeita. */
export type VaateSuodatin = {
  tila?: Tila;
  kategoria?: Kategoria;
  koko_id?: string;
  merkki_id?: string;
  sailytyspaikka_id?: string;
};

export const JARJESTYKSET = ["muokattu", "koko", "kategoria", "lisatty"] as const;
export type Jarjestys = (typeof JARJESTYKSET)[number];

export const JARJESTYS_SELITE: Record<Jarjestys, string> = {
  muokattu: "Viimeksi muokattu",
  koko: "Koko",
  kategoria: "Kategoria",
  lisatty: "Lisäyspäivä",
};

export function onJarjestys(arvo: unknown): arvo is Jarjestys {
  return typeof arvo === "string" && (JARJESTYKSET as readonly string[]).includes(arvo);
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function onUuid(arvo: unknown): arvo is string {
  return typeof arvo === "string" && UUID.test(arvo);
}

export const VAATTEET_AVAIN = ["vaatteet"] as const;
const vaateAvain = (id: string) => ["vaate", id] as const;

/** Lapsen vaatteet suodatettuna ja järjestettynä. RLS rajaa rivit omaan perheeseen. */
export async function haeVaatteet(
  lapsiId: string,
  suodatin: VaateSuodatin,
  jarjestys: Jarjestys,
): Promise<VaateNakyma[]> {
  let kysely = supabase().from("vaate").select(VALINTA).eq("lapsi_id", lapsiId);
  for (const [sarake, arvo] of Object.entries(suodatin)) {
    if (arvo) kysely = kysely.eq(sarake, arvo);
  }

  switch (jarjestys) {
    case "koko":
      // Koon järjestys tulee kokotaulusta (50, 56, …, XS, S, …), ei nimen aakkosista.
      kysely = kysely
        .order("koko(jarjestys)", { ascending: true })
        .order("kategoria", { ascending: true })
        .order("muokattu", { ascending: false });
      break;
    case "kategoria":
      // Enum järjestyy määrittelyn järjestykseen: Paidat, Housut, Mekot ja hameet, …
      kysely = kysely.order("kategoria", { ascending: true }).order("muokattu", { ascending: false });
      break;
    case "lisatty":
      kysely = kysely.order("luotu", { ascending: false });
      break;
    case "muokattu":
      kysely = kysely.order("muokattu", { ascending: false });
      break;
  }
  // Tasatilanteissa vakaa järjestys, jotta rivit eivät hypi päivitysten välillä.
  kysely = kysely.order("id", { ascending: true });

  const { data, error } = await kysely;
  if (error) throw new Error(error.message);
  return data as unknown as VaateNakyma[];
}

export function useVaatteet(lapsiId: string | undefined, suodatin: VaateSuodatin, jarjestys: Jarjestys) {
  return useQuery({
    queryKey: [...VAATTEET_AVAIN, lapsiId, suodatin, jarjestys],
    queryFn: () => haeVaatteet(lapsiId as string, suodatin, jarjestys),
    enabled: Boolean(lapsiId),
  });
}

/** Yksi vaate. null, jos vaatetta ei ole tai se kuuluu toiselle perheelle. */
export async function haeVaate(id: string): Promise<VaateNakyma | null> {
  if (!onUuid(id)) return null;
  const { data, error } = await supabase().from("vaate").select(VALINTA).eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return (data as unknown as VaateNakyma | null) ?? null;
}

export function useVaate(id: string | undefined, kaytossa: boolean) {
  return useQuery({
    queryKey: vaateAvain(id ?? ""),
    queryFn: () => haeVaate(id as string),
    enabled: kaytossa && Boolean(id),
  });
}

/**
 * Sarakkeet, joita käyttäjä saa muokata suoraan. Tila, jemma-tyyppi ja myyntitiedot
 * muuttuvat vain siirra_tila-funktiolla (vaihe 7); tietokanta ei salli niiden suoraa päivitystä.
 */
export type VaateMuutokset = Partial<
  Pick<
    VaateRivi,
    | "kategoria"
    | "koko_id"
    | "nimi"
    | "kappalemaara"
    | "merkki_id"
    | "hankintatapa"
    | "ostohinta"
    | "ostopaiva"
    | "kunto"
    | "huomiot"
    | "sailytyspaikka_id"
    | "sesongit"
  >
>;

export async function paivitaVaate(id: string, muutokset: VaateMuutokset): Promise<VaateNakyma> {
  const { data, error } = await supabase().from("vaate").update(muutokset).eq("id", id).select(VALINTA).single();
  if (error) throw new Error(suomennaTallennusvirhe(error.message));
  return data as unknown as VaateNakyma;
}

export function usePaivitaVaate(id: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (muutokset: VaateMuutokset) => paivitaVaate(id, muutokset),
    onSuccess: (vaate) => {
      client.setQueryData(vaateAvain(id), vaate);
      void client.invalidateQueries({ queryKey: VAATTEET_AVAIN });
    },
  });
}

function suomennaTallennusvirhe(viesti: string): string {
  if (viesti.includes("vaate_lahja_ostohinta_check")) return "Lahjaksi saadun vaatteen ostohinta on 0 €.";
  if (viesti.includes("kappalemaara")) return "Kappalemäärän pitää olla vähintään 1.";
  if (viesti.includes("ostohinta")) return "Ostohinta ei voi olla negatiivinen.";
  if (viesti.includes("merkki_id_perhe_id_fkey")) return "Merkkiä ei löydy. Päivitä sivu.";
  if (viesti.includes("sailytyspaikka_id_perhe_id_fkey")) return "Säilytyspaikkaa ei löydy. Päivitä sivu.";
  if (viesti.includes("permission denied")) return "Ei oikeutta muuttaa tätä kenttää.";
  if (viesti.toLowerCase().includes("failed to fetch")) return "Yhteys epäonnistui. Tarkista verkko ja yritä uudelleen.";
  return viesti;
}
