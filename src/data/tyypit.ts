// Tietokannan enumit ja rivityypit TypeScriptille. Pidetään linjassa
// supabase/migrations/0001_perusrakenne.sql:n kanssa.

export const TILAT = ["kaytossa", "jemmassa", "myyntiin", "myyty", "lahjoitettu"] as const;
export type Tila = (typeof TILAT)[number];

export const JEMMA_TYYPIT = ["tulossa_kayttoon", "jaanyt_pieneksi"] as const;
export type JemmaTyyppi = (typeof JEMMA_TYYPIT)[number];

export const KATEGORIAT = [
  "paidat",
  "housut",
  "mekot_hameet",
  "haalarit",
  "takit",
  "ulkovaatteet",
  "yovaatteet",
  "alusvaatteet",
  "sukat",
  "asusteet",
  "kengat",
  "uima_harrastus",
  "muu",
] as const;
export type Kategoria = (typeof KATEGORIAT)[number];

export const HANKINTATAVAT = ["uutena", "kaytettyna", "lahja"] as const;
export type Hankintatapa = (typeof HANKINTATAVAT)[number];

export const KUNNOT = ["uusi", "erinomainen", "hyva", "tyydyttava", "huono"] as const;
export type Kunto = (typeof KUNNOT)[number];

export const SESONGIT = ["kevat", "kesa", "syksy", "talvi", "ympari_vuoden"] as const;
export type Sesonki = (typeof SESONGIT)[number];

export const KOKORYHMAT = ["sentti", "kirjain", "kenka", "yleinen"] as const;
export type Kokoryhma = (typeof KOKORYHMAT)[number];

// Suomenkieliset selitteet käyttöliittymään.
export const TILA_SELITE: Record<Tila, string> = {
  kaytossa: "Käytössä",
  jemmassa: "Jemmassa",
  myyntiin: "Myyntiin",
  myyty: "Myyty",
  lahjoitettu: "Lahjoitettu / poistettu",
};

export const JEMMA_TYYPPI_SELITE: Record<JemmaTyyppi, string> = {
  tulossa_kayttoon: "Tulossa käyttöön",
  jaanyt_pieneksi: "Jäänyt pieneksi",
};

export const KATEGORIA_SELITE: Record<Kategoria, string> = {
  paidat: "Paidat",
  housut: "Housut",
  mekot_hameet: "Mekot ja hameet",
  haalarit: "Haalarit",
  takit: "Takit",
  ulkovaatteet: "Ulkovaatteet",
  yovaatteet: "Yövaatteet",
  alusvaatteet: "Alusvaatteet",
  sukat: "Sukat",
  asusteet: "Asusteet",
  kengat: "Kengät",
  uima_harrastus: "Uima- ja harrastusvaatteet",
  muu: "Muu",
};

export const HANKINTATAPA_SELITE: Record<Hankintatapa, string> = {
  uutena: "Uutena",
  kaytettyna: "Käytettynä",
  lahja: "Lahjaksi saatu",
};

export const KUNTO_SELITE: Record<Kunto, string> = {
  uusi: "Uusi",
  erinomainen: "Erinomainen",
  hyva: "Hyvä",
  tyydyttava: "Tyydyttävä",
  huono: "Huono",
};

export const SESONKI_SELITE: Record<Sesonki, string> = {
  kevat: "Kevät",
  kesa: "Kesä",
  syksy: "Syksy",
  talvi: "Talvi",
  ympari_vuoden: "Ympärivuotinen",
};

export const KOKORYHMA_SELITE: Record<Kokoryhma, string> = {
  sentti: "Senttikoot",
  kirjain: "Kirjainkoot",
  kenka: "Kengät",
  yleinen: "Yleiset",
};

// Rivityypit (select *). Päivämäärät ja aikaleimat tulevat merkkijonoina.
export type PerheRivi = { id: string; luotu: string };

export type KayttajaRivi = { id: string; perhe_id: string; sahkoposti: string | null; luotu: string };

export type KokoRivi = {
  id: string;
  perhe_id: string | null;
  ryhma: Kokoryhma;
  nimi: string;
  jarjestys: number;
  luotu: string;
};

export type LapsiRivi = {
  id: string;
  perhe_id: string;
  nimi: string;
  /** Nykyinen vaatekoko (sentti, kirjain tai yleinen). */
  nykyinen_koko_id: string | null;
  /** Nykyinen kengänkoko (ryhmä kenka). */
  nykyinen_kenkakoko_id: string | null;
  luotu: string;
  muokattu: string;
};

export type MerkkiRivi = { id: string; perhe_id: string; nimi: string; nimi_norm: string; luotu: string };
export type SailytyspaikkaRivi = MerkkiRivi;

export type VaateRivi = {
  id: string;
  perhe_id: string;
  lapsi_id: string;
  kategoria: Kategoria;
  koko_id: string;
  tila: Tila;
  jemma_tyyppi: JemmaTyyppi | null;
  nimi: string | null;
  kappalemaara: number;
  merkki_id: string | null;
  hankintatapa: Hankintatapa | null;
  ostohinta: number | null;
  ostopaiva: string | null;
  kunto: Kunto | null;
  huomiot: string | null;
  sailytyspaikka_id: string | null;
  sesongit: Sesonki[];
  myyntihinta: number | null;
  myyntipaiva: string | null;
  luotu: string;
  muokattu: string;
};

export type KuvaRivi = {
  id: string;
  vaate_id: string;
  perhe_id: string;
  polku_iso: string;
  polku_pikku: string | null;
  jarjestys: number;
  luotu: string;
};

export type TilamuutosRivi = {
  id: string;
  vaate_id: string;
  perhe_id: string;
  tila_josta: Tila | null;
  tila_johon: Tila;
  jemma_tyyppi_johon: JemmaTyyppi | null;
  paivamaara: string;
  kirjattu: string;
};

/** Parametrit tietokantafunktiolle siirra_tila (supabase.rpc). */
export type SiirraTilaParametrit = {
  p_vaate_id: string;
  p_tila_johon: Tila;
  p_paivamaara?: string;
  p_jemma_tyyppi?: JemmaTyyppi | null;
  p_myyntihinta?: number | null;
  p_myyntipaiva?: string | null;
};
