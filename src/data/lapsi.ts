import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/data/supabase";
import type { LapsiRivi } from "@/data/tyypit";

export const LAPSI_AVAIN = ["lapsi", "oma"] as const;

/** Perheen lapsi (MVP:ssä yksi). RLS rajaa rivit omaan perheeseen. */
export async function haeOmaLapsi(): Promise<LapsiRivi | null> {
  const { data, error } = await supabase()
    .from("lapsi")
    .select("*")
    .order("luotu", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as LapsiRivi | null) ?? null;
}

export function useOmaLapsi(kaytossa: boolean) {
  return useQuery({
    queryKey: LAPSI_AVAIN,
    queryFn: haeOmaLapsi,
    enabled: kaytossa,
  });
}

export type UusiLapsi = { nimi: string; nykyinen_koko_id: string | null };

/** Onboarding: luo lapsen. perhe_id täyttyy tietokannassa oletuksesta oma_perhe_id(). */
export async function luoLapsi(lapsi: UusiLapsi): Promise<LapsiRivi> {
  const { data, error } = await supabase()
    .from("lapsi")
    .insert({ nimi: lapsi.nimi.trim(), nykyinen_koko_id: lapsi.nykyinen_koko_id })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as LapsiRivi;
}

export function useLuoLapsi() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: luoLapsi,
    onSuccess: (lapsi) => {
      client.setQueryData(LAPSI_AVAIN, lapsi);
    },
  });
}
