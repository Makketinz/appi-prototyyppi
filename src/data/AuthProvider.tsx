import type { Session } from "@supabase/supabase-js";
import { createContext, type PropsWithChildren, useContext, useEffect, useState } from "react";

import { supabase } from "@/data/supabase";

type AuthTila = {
  /** Kirjautuneen käyttäjän sessio tai null. */
  sessio: Session | null;
  /** True, kun alkutila on luettu tallennuksesta (vasta sitten voidaan ohjata). */
  ladattu: boolean;
};

const AuthKonteksti = createContext<AuthTila>({ sessio: null, ladattu: false });

/** Pitää Supabase-session Reactin tilassa ja kuuntelee kirjautumisen muutoksia. */
export function AuthProvider({ children }: PropsWithChildren) {
  const [tila, asetaTila] = useState<AuthTila>({ sessio: null, ladattu: false });

  useEffect(() => {
    const asiakas = supabase();
    let aktiivinen = true;

    asiakas.auth.getSession().then(({ data }) => {
      if (aktiivinen) asetaTila({ sessio: data.session, ladattu: true });
    });

    const { data: kuuntelija } = asiakas.auth.onAuthStateChange((_tapahtuma, sessio) => {
      if (aktiivinen) asetaTila({ sessio, ladattu: true });
    });

    return () => {
      aktiivinen = false;
      kuuntelija.subscription.unsubscribe();
    };
  }, []);

  return <AuthKonteksti.Provider value={tila}>{children}</AuthKonteksti.Provider>;
}

export function useAuth() {
  return useContext(AuthKonteksti);
}

/** Kirjautuminen sähköpostilla ja salasanalla. Virheet palautetaan suomeksi. */
export async function kirjaudu(sahkoposti: string, salasana: string): Promise<string | null> {
  const { error } = await supabase().auth.signInWithPassword({ email: sahkoposti.trim(), password: salasana });
  return error ? suomennaVirhe(error.message) : null;
}

export type RekisterointiTulos = { virhe: string } | { vahvistusTarvitaan: boolean };

/** Tilin luonti. Tietokannan trigger luo perheen ja kayttaja-rivin. */
export async function rekisteroidy(sahkoposti: string, salasana: string): Promise<RekisterointiTulos> {
  const { data, error } = await supabase().auth.signUp({ email: sahkoposti.trim(), password: salasana });
  if (error) return { virhe: suomennaVirhe(error.message) };
  // Kun sähköpostivahvistus on päällä, Supabase palauttaa jo rekisteröidylle osoitteelle
  // käyttäjän ilman identiteettejä eikä lähetä uutta viestiä.
  if (data.user && data.user.identities && data.user.identities.length === 0) {
    return { virhe: "Sähköposti on jo käytössä. Kirjaudu sisään." };
  }
  return { vahvistusTarvitaan: data.session === null };
}

export async function kirjauduUlos() {
  await supabase().auth.signOut();
}

function suomennaVirhe(viesti: string): string {
  const v = viesti.toLowerCase();
  if (v.includes("invalid login credentials")) return "Väärä sähköposti tai salasana.";
  if (v.includes("email not confirmed")) return "Vahvista sähköposti ensin. Linkki on lähetetty osoitteeseesi.";
  if (v.includes("already registered") || v.includes("already exists")) return "Sähköposti on jo käytössä. Kirjaudu sisään.";
  if (v.includes("password should be at least") || v.includes("password is too short")) {
    return "Salasanan pitää olla vähintään 6 merkkiä.";
  }
  if (v.includes("unable to validate email") || v.includes("invalid email")) return "Tarkista sähköpostiosoite.";
  if (v.includes("rate limit") || v.includes("too many requests")) return "Liian monta yritystä. Odota hetki.";
  if (v.includes("failed to fetch") || v.includes("network")) return "Yhteys Supabaseen epäonnistui. Tarkista verkko ja asetukset.";
  return viesti;
}
