// Puhtaat muotoilu- ja jäsennysfunktiot lomakkeille ja listoille.
// Tiedostolla ei ole riippuvuuksia, jotta sen voi yksikkötestata suoraan Nodella (npm test).

/** Jäsennyksen tulos: arvo tai suomenkielinen virheilmoitus. */
export type Jasennys<T> = { ok: true; arvo: T } | { ok: false; virhe: string };

const EURO = new Intl.NumberFormat("fi-FI", { style: "currency", currency: "EUR" });

/** 4.5 → "4,50 €". Tyhjä, jos hintaa ei ole. */
export function muotoileHinta(hinta: number | null | undefined): string {
  if (hinta === null || hinta === undefined) return "";
  return EURO.format(hinta);
}

/** Hinta lomakkeen kenttään: 4.5 → "4,50", 12 → "12", null → "". */
export function hintaKentaksi(hinta: number | null | undefined): string {
  if (hinta === null || hinta === undefined) return "";
  return Number.isInteger(hinta) ? String(hinta) : hinta.toFixed(2).replace(".", ",");
}

/** Käyttäjän syöttämä hinta: "4,50", "4.5", "12 €" tai tyhjä (= ei hintaa). */
export function jasennaHinta(teksti: string): Jasennys<number | null> {
  const t = teksti.replace(/\s/g, "").replace("€", "").replace(",", ".");
  if (t === "") return { ok: true, arvo: null };
  if (!/^\d{1,8}(\.\d{1,2})?$/.test(t)) {
    return { ok: false, virhe: "Anna hinta euroina, esim. 4,50." };
  }
  return { ok: true, arvo: Number(t) };
}

const kaksi = (n: number) => String(n).padStart(2, "0");

/** "2026-09-17" → "17.9.2026". Tyhjä, jos päivää ei ole. */
export function muotoilePaiva(iso: string | null | undefined): string {
  if (!iso) return "";
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso;
  return `${Number(m[3])}.${Number(m[2])}.${m[1]}`;
}

/** Aikaleima paikallisena päivänä: "2026-09-17T21:30:00Z" → "18.9.2026" Suomen ajassa. */
export function muotoileAikaleima(aikaleima: string | null | undefined): string {
  if (!aikaleima) return "";
  const d = new Date(aikaleima);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}`;
}

/**
 * Käyttäjän syöttämä päivämäärä: "17.9.2026", "17.09.2026", "17.9.26" tai "2026-09-17".
 * Tulos ISO-muodossa ("2026-09-17"); tyhjä syöte = ei päivämäärää.
 */
export function jasennaPaiva(teksti: string): Jasennys<string | null> {
  const t = teksti.trim();
  if (t === "") return { ok: true, arvo: null };

  let vuosi: number;
  let kuukausi: number;
  let paiva: number;
  const suomi = /^(\d{1,2})\.(\d{1,2})\.(\d{2}|\d{4})$/.exec(t);
  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(t);
  if (suomi) {
    paiva = Number(suomi[1]);
    kuukausi = Number(suomi[2]);
    vuosi = suomi[3].length === 2 ? 2000 + Number(suomi[3]) : Number(suomi[3]);
  } else if (iso) {
    vuosi = Number(iso[1]);
    kuukausi = Number(iso[2]);
    paiva = Number(iso[3]);
  } else {
    return { ok: false, virhe: "Anna päivämäärä muodossa pp.kk.vvvv, esim. 17.9.2026." };
  }

  if (vuosi < 1990 || vuosi > 2100) return { ok: false, virhe: "Tarkista vuosi." };
  const d = new Date(Date.UTC(vuosi, kuukausi - 1, paiva));
  if (d.getUTCFullYear() !== vuosi || d.getUTCMonth() !== kuukausi - 1 || d.getUTCDate() !== paiva) {
    return { ok: false, virhe: "Päivämäärää ei ole olemassa." };
  }
  return { ok: true, arvo: `${vuosi}-${kaksi(kuukausi)}-${kaksi(paiva)}` };
}

/** Tämä päivä paikallisessa ajassa ISO-muodossa, esim. "2026-09-28" (ei UTC-päivä). */
export function tanaanIso(nyt: Date = new Date()): string {
  return `${nyt.getFullYear()}-${kaksi(nyt.getMonth() + 1)}-${kaksi(nyt.getDate())}`;
}

export const KAPPALEMAARA_MAX = 999;

/** Kappalemäärä: kokonaisluku 1–999. */
export function jasennaKappalemaara(teksti: string): Jasennys<number> {
  const t = teksti.trim();
  const n = Number(t);
  if (!/^\d{1,3}$/.test(t) || n < 1) {
    return { ok: false, virhe: `Kappalemäärän pitää olla kokonaisluku 1–${KAPPALEMAARA_MAX}.` };
  }
  return { ok: true, arvo: n };
}

/** Vapaa teksti tietokantaan: ylimääräiset välilyönnit reunoilta pois, tyhjä → null. */
export function tekstiTaiNull(teksti: string): string | null {
  const t = teksti.trim();
  return t === "" ? null : t;
}

/** Suomen monikko lukumäärälle: (1, "rivi", "riviä") → "1 rivi", (3, …) → "3 riviä". */
export function lukumaara(n: number, yksikko: string, monikko: string): string {
  return `${n} ${n === 1 ? yksikko : monikko}`;
}
