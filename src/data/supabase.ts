import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { Platform } from "react-native";

// Avaimet luetaan buildissa EXPO_PUBLIC_-ympäristömuuttujista (.env paikallisesti,
// GitHub-secretit Pages-buildissa). Anon-avain on tarkoitettu julkiseksi; tietoturva
// on tietokannan RLS-säännöissä (supabase/migrations/0002_rls.sql).
const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
const anonAvain = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const supabaseKonfiguroitu = url.startsWith("http") && anonAvain.length > 0;

let asiakas: SupabaseClient | null = null;

/** Supabase-asiakas. Heittää, jos asetukset puuttuvat; tarkista ensin supabaseKonfiguroitu. */
export function supabase(): SupabaseClient {
  if (!supabaseKonfiguroitu) {
    throw new Error("Supabase-asetukset puuttuvat (EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY).");
  }
  if (!asiakas) {
    asiakas = createClient(url, anonAvain, {
      auth: {
        // Selaimessa supabase-js käyttää localStoragea; puhelimessa AsyncStoragea.
        ...(Platform.OS === "web" ? {} : { storage: AsyncStorage }),
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: Platform.OS === "web",
      },
    });
  }
  return asiakas;
}
