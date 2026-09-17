import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/data/supabase";
import { KOKORYHMAT, type KokoRivi, type Kokoryhma } from "@/data/tyypit";

export const KOOT_AVAIN = ["koot"] as const;

/** Järjestelmän oletuskoot ja perheen omat koot järjestyksessä. */
export async function haeKoot(): Promise<KokoRivi[]> {
  const { data, error } = await supabase().from("koko").select("*").order("jarjestys", { ascending: true });
  if (error) throw new Error(error.message);
  return data as KokoRivi[];
}

export function useKoot(kaytossa = true) {
  return useQuery({ queryKey: KOOT_AVAIN, queryFn: haeKoot, enabled: kaytossa, staleTime: 5 * 60_000 });
}

/** Ryhmittelee koot kokoryhmittäin määrittelyn järjestyksessä. */
export function ryhmittele(koot: KokoRivi[]): { ryhma: Kokoryhma; koot: KokoRivi[] }[] {
  return KOKORYHMAT.map((ryhma) => ({ ryhma, koot: koot.filter((k) => k.ryhma === ryhma) })).filter(
    (r) => r.koot.length > 0,
  );
}

/** Vaatekoot: kaikki muut ryhmät kuin kengät. */
export function vaatekoot(koot: KokoRivi[]): KokoRivi[] {
  return koot.filter((k) => k.ryhma !== "kenka");
}

/** Kengänkoot. */
export function kenkakoot(koot: KokoRivi[]): KokoRivi[] {
  return koot.filter((k) => k.ryhma === "kenka");
}

/** Lyhyt kuvaus lapsen nykyisistä ko'oista, esim. "vaatekoko 110, kengänkoko 25". */
export function kokoKuvaus(
  koot: KokoRivi[] | undefined,
  lapsi: { nykyinen_koko_id: string | null; nykyinen_kenkakoko_id: string | null } | null | undefined,
): string | null {
  if (!koot || !lapsi) return null;
  const vaate = koot.find((k) => k.id === lapsi.nykyinen_koko_id);
  const kenka = koot.find((k) => k.id === lapsi.nykyinen_kenkakoko_id);
  const osat = [vaate ? `vaatekoko ${vaate.nimi}` : null, kenka ? `kengänkoko ${kenka.nimi}` : null].filter(
    (o): o is string => o !== null,
  );
  return osat.length > 0 ? osat.join(", ") : null;
}
