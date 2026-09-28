# Lastenvaatteiden hallintasovellus – prototyyppi

Mobiilisovellus, jolla vanhempi hallitsee yhden lapsen vaatevarastoa: mitä on käytössä, mitä jemmassa, missä laatikossa ja mitä voi laittaa myyntiin. Määrittely on tiedostossa [maarittely.md](maarittely.md) ja toteutussuunnitelma tiedostossa [suunnitelma.md](suunnitelma.md).

Prototyyppi on rakennettu suunnitelman vaiheissa. Tässä versiossa ovat valmiina **vaiheet 1–4**:

| Vaihe | Sisältö | Miten näkyy |
| --- | --- | --- |
| 1 Projektin runko | Expo + TypeScript + Expo Router, alapalkki Etusivu · **+ Lisää vaate** · Koonnit · Asetukset, GitHub Pages -julkaisu | Sovellus käynnistyy selaimessa ja tabit vaihtuvat |
| 2 Tietokanta | Supabase-migraatiot: taulut, enumit, oletuskoot, rivitason turvallisuus, `siirra_tila`-funktio, hyväksymistesti | `supabase/`-hakemisto, ks. [supabase/README.md](supabase/README.md) |
| 3 Kirjautuminen ja perhe | Sähköposti + salasana, rekisteröinti luo perheen ja käyttäjän, ensikäynnistys kysyy lapsen nimen, vaatekoon ja kengänkoon | Uusi käyttäjä pääsee tyhjälle etusivulle, lapsen nimi tallessa |
| 4 Vaatelista ja vaatteen sivu | Yksi lista-komponentti kaikkiin listoihin (järjestys: viimeksi muokattu, koko, kategoria, lisäyspäivä), tilakohtaiset listat, vaatteen sivu kaikkine kenttineen muokattavana | Esimerkkidatan vaatteet listautuvat ja muokkaus tallentuu |

Vaatteen lisäys sovelluksessa (vaihe 5), kuvat (6), tilan vaihto ja historia (7), haku, suodattimet ja tilakortit lukumäärineen (8) sekä koonnit (10) tulevat myöhemmissä vaiheissa. Siihen asti vaatteet lisätään [esimerkkidatalla](#esimerkkidata).

Tekniikka: Expo SDK 57 (React Native + TypeScript, Expo Router) ja Supabase (Postgres, Auth). Sovellus web-exportataan staattisiksi tiedostoiksi ja julkaistaan GitHub Pagesiin; sama koodi rakentuu myös iOS- ja Android-sovellukseksi EAS Buildilla.

## Kokeilu nopeimmin: julkaistu versio

Kun GitHub Pages on otettu käyttöön (ohje alla), sovellus on osoitteessa

**https://makketinz.github.io/appi-prototyyppi/**

1. Avaa osoite puhelimella tai selaimella (näkymä on rajattu mobiilileveyteen).
2. Valitse **Luo tili**, anna sähköposti ja vähintään 6 merkin salasana.
3. Jos Supabase-projektissa on sähköpostivahvistus päällä, avaa sähköpostiin tullut linkki ja kirjaudu sitten sisään.
4. Anna lapsen nimi ja halutessasi nykyinen vaatekoko ja kengänkoko → **Tallenna ja aloita**.
5. Etusivu näyttää lapsen nimen ja koot. Vaatteita ei vielä ole: lisää ne [esimerkkidatalla](#esimerkkidata) ja päivitä sivu.
6. Etusivulla on Kaikki vaatteet -lista ja linkit tiloihin (Käytössä, Jemmassa, …). Rivin napautus avaa vaatteen sivun, jossa kaikki kentät ovat muokattavissa; **Tallenna muutokset** ilmestyy alareunaan, kun jotain on muutettu.

## Kokeilu omalla koneella

Tarvitaan Node.js 22 ja Supabase-projekti (alla).

```bash
git clone https://github.com/Makketinz/appi-prototyyppi.git
cd appi-prototyyppi
npm install
cp .env.example .env      # täytä oman Supabase-projektin URL ja anon-avain
npm run web               # avaa http://localhost:8081
```

Puhelimessa: `npm start` ja lue QR-koodi Expo Go -sovelluksella (sama verkko). Natiivibuildit: `npx eas build --profile preview` (vaatii Expo-tilin; profiilit ovat `eas.json`-tiedostossa).

Muut komennot: `npm run typecheck` (TypeScript), `npm test` (yksikkötestit hinnan, päivämäärän ja kappalemäärän jäsennykselle), `npm run export:web` (staattinen build `dist/`-hakemistoon).

## Supabase-projektin luonti

1. Luo projekti osoitteessa [supabase.com](https://supabase.com) (ilmaistaso riittää). Kirjoita talteen **Project Settings → API**: Project URL ja anon public key.
2. Aja migraatiot **SQL Editorissa** järjestyksessä: `supabase/migrations/0001_perusrakenne.sql`, `0002_rls.sql`, `0003_funktiot.sql`, `0004_kengankoko.sql`. Aja sitten `supabase/tests/hyvaksymistesti.sql`; lopussa pitää lukea `HYVÄKSYMISTESTI LÄPI`. Tarkemmin: [supabase/README.md](supabase/README.md).
3. **Authentication → URL Configuration**:
   - Site URL: `https://makketinz.github.io/appi-prototyyppi/` (alipolku mukaan, jotta vahvistuslinkit palaavat sovellukseen).
   - Redirect URLs: lisää `http://localhost:8081/**` paikallista kehitystä varten.
4. **Authentication → Providers → Email**: prototyypissä voi kytkeä "Confirm email" pois, jolloin tili on käytössä heti ilman sähköpostivahvistusta. Tuotannossa vahvistus pidetään päällä.
5. Anna avaimet sovellukselle: paikallisesti `.env`-tiedostoon (`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`), Pages-buildille repon secreteinä (alla).

Anon-avain on tarkoitettu julkiseksi. Tietoturva on tietokannan RLS-säännöissä: käyttäjä näkee vain oman perheensä rivit, eikä tilaa tai historiaa voi muuttaa ohi `siirra_tila`-funktion.

## Esimerkkidata

Vaatteen lisäys sovelluksessa tulee vaiheessa 5. Vaiheen 4 listoja ja vaatteen sivua kokeillaan esimerkkidatalla, joka lisätään SQL Editorissa:

1. Luo tili sovelluksessa ja tee ensikäynnistys (lapsen nimi).
2. Avaa Supabasessa **SQL Editor**, liitä tiedoston [supabase/esimerkkidata.sql](supabase/esimerkkidata.sql) sisältö ja vaihda sen alkuun oma sähköpostisi rivillä `v_sahkoposti`.
3. Paina **Run** ja päivitä sovellus selaimessa.

Data sisältää 14 vaateriviä (29 kpl), viisi merkkiä ja kolme säilytyspaikkaa. Mukana on määrittelyn esimerkki: 6 kpl koon 110 housuja, joista 3 käytössä ja 3 jemmassa sinisessä laatikossa. Muutama vaate on siirretty Myyntiin-, Myyty- ja Lahjoitettu-tiloihin historioineen. Skripti lisää dataa vain tyhjään varastoon; poisto-ohje on tiedoston lopussa.

## GitHub Pages -julkaisun käyttöönotto

Työnkulku `.github/workflows/pages.yml` rakentaa web-exportin ja julkaisee sen jokaisesta `main`-haaran pushista (tai käsin **Actions → Julkaise GitHub Pagesiin → Run workflow**).

1. **Settings → Pages → Build and deployment → Source: GitHub Actions.**
2. **Settings → Secrets and variables → Actions → New repository secret**: `EXPO_PUBLIC_SUPABASE_URL` ja `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
3. Yhdistä muutokset `main`-haaraan (tai aja työnkulku käsin). Julkaisu kestää pari minuuttia; osoite näkyy työnkulun `deploy`-vaiheessa.

Huomioita:

- GitHubin luoma `github-pages`-ympäristö sallii julkaisun oletuksena vain `main`-haarasta (Settings → Environments → github-pages → Deployment branches). Muusta haarasta ajettu työnkulku epäonnistuu deploy-vaiheessa, ellei sääntöä muuteta.
- Jos secretit puuttuvat, build onnistuu mutta sivu näyttää ilmoituksen "Supabase-asetukset puuttuvat".
- Sovellus toimii alipolussa `/appi-prototyyppi/`; `404.html` on kopio `index.html`:stä, jotta suorat linkit (`/koonnit`, `/auth`) toimivat.

## Mitä testata (vaiheet 1–4)

- [ ] Tabit vaihtuvat ja **+ Lisää vaate** avaa lisäyssivun, josta pääsee takaisin.
- [ ] Tilin luonti onnistuu; väärä salasana antaa suomenkielisen virheen.
- [ ] Ensimmäinen kirjautuminen kysyy lapsen nimen; tyhjä nimi estetään; vaatekoon ja kengänkoon voi valita molemmat tai jättää tyhjäksi.
- [ ] Etusivu näyttää lapsen nimen ja koot; sivun uudelleenlataus ei kirjaa ulos.
- [ ] Asetukset näyttää sähköpostin ja lapsen; **Kirjaudu ulos** palauttaa kirjautumissivulle.
- [ ] Supabasen Table Editorissa `perhe`, `kayttaja` ja `lapsi` sisältävät rivin; toinen käyttäjä ei näe niitä (hyväksymistesti).
- [ ] Esimerkkidatan jälkeen etusivun lista näyttää 29 kpl · 14 riviä; rivillä on nimi tai kategoria, merkki, säilytyspaikka, koko ja kappalemäärä, jos se on yli 1.
- [ ] Järjestys vaihtuu: Viimeksi muokattu, Koko (104 → 110 → 116 → kengät → Onesize), Kategoria, Lisäyspäivä.
- [ ] Tilalinkki (esim. Jemmassa) avaa vain sen tilan vaatteet; järjestys säilyy, kun palaat vaatteen sivulta.
- [ ] Vaatteen sivulla kaikki kentät muuttuvat ja tallentuvat; **Peru** palauttaa tallennetut arvot. Muokattu vaate nousee listan kärkeen.
- [ ] Virheellinen kappalemäärä (0), hinta (abc) tai päivä (31.2.2026) näyttää virheen eikä tallennu. Lahjaksi saadun hinta on 0 € eikä sitä voi muuttaa.
- [ ] Toinen käyttäjä ei näe ensimmäisen vaatteita eikä avaa niitä suoralla linkillä.

## Hakemistorakenne

```
app/                 Expo Router -reitit: (tabs)/, auth, onboarding, vaatteet, vaate/[id], lisaa/
src/ui/              Yhteiset komponentit: VaateLista, VaateRivi, KokoValinta, SiruValinta, Maaravalitsin, Ruutu, …
src/data/            Supabase-asiakas, tyypit, kyselyt (vaatteet, lapsi, koot, luettelot), muotoilu, AuthProvider, Vartija
supabase/migrations/ SQL-migraatiot 0001–0004
supabase/tests/      Hyväksymistesti ja paikallinen ajoskripti
supabase/esimerkkidata.sql  Esimerkkivaatteet vaiheen 4 kokeiluun
tests/               Yksikkötestit (npm test)
.github/workflows/   GitHub Pages -julkaisu
app.config.ts        Expo-konfiguraatio (web output single, baseUrl ympäristömuuttujasta)
eas.json             EAS Build -profiilit
```
