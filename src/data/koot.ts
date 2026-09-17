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
