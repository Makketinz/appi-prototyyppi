import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/data/supabase";
import type { Nimetty } from "@/data/vaatteet";

// Perheen merkit ja säilytyspaikat valintalistoiksi. Uusien lisäys ja nimen
// normalisointi käyttöliittymässä tulevat vaiheessa 5 (tietokanta normalisoi jo nyt).

async function haeNimetyt(taulu: "merkki" | "sailytyspaikka"): Promise<Nimetty[]> {
  const { data, error } = await supabase().from(taulu).select("id,nimi").order("nimi_norm", { ascending: true });
  if (error) throw new Error(error.message);
  return data as Nimetty[];
}

export function useMerkit(kaytossa = true) {
  return useQuery({ queryKey: ["merkit"], queryFn: () => haeNimetyt("merkki"), enabled: kaytossa });
}

export function useSailytyspaikat(kaytossa = true) {
  return useQuery({ queryKey: ["sailytyspaikat"], queryFn: () => haeNimetyt("sailytyspaikka"), enabled: kaytossa });
}
