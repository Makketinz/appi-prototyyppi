# Lastenvaatteiden hallintasovellus – prototyyppi

Mobiilisovellus, jolla vanhempi hallitsee yhden lapsen vaatevarastoa: mitä on käytössä, mitä jemmassa, missä laatikossa ja mitä voi laittaa myyntiin. Määrittely on tiedostossa [maarittely.md](maarittely.md) ja toteutussuunnitelma tiedostossa [suunnitelma.md](suunnitelma.md).

Prototyyppi on rakennettu suunnitelman vaiheissa. Tässä versiossa ovat valmiina **vaiheet 1–3**:

| Vaihe | Sisältö | Miten näkyy |
| --- | --- | --- |
| 1 Projektin runko | Expo + TypeScript + Expo Router, alapalkki Etusivu · **+ Lisää vaate** · Koonnit · Asetukset, GitHub Pages -julkaisu | Sovellus käynnistyy selaimessa ja tabit vaihtuvat |
| 2 Tietokanta | Supabase-migraatiot: taulut, enumit, oletuskoot, rivitason turvallisuus, `siirra_tila`-funktio, hyväksymistesti | `supabase/`-hakemisto, ks. [supabase/README.md](supabase/README.md) |
| 3 Kirjautuminen ja perhe | Sähköposti + salasana, rekisteröinti luo perheen ja käyttäjän, ensikäynnistys kysyy lapsen nimen ja koon | Uusi käyttäjä pääsee tyhjälle etusivulle, lapsen nimi tallessa |

Vaatteiden lisäys, listat, kuvat, tilamuutokset, haku ja koonnit tulevat vaiheissa 4–12.

Tekniikka: Expo SDK 57 (React Native + TypeScript, Expo Router) ja Supabase (Postgres, Auth). Sovellus web-exportataan staattisiksi tiedostoiksi ja julkaistaan GitHub Pagesiin; sama koodi rakentuu myös iOS- ja Android-sovellukseksi EAS Buildilla.

## Kokeilu nopeimmin: julkaistu versio

Kun GitHub Pages on otettu käyttöön (ohje alla), sovellus on osoitteessa

**https://makketinz.github.io/appi-prototyyppi/**

1. Avaa osoite puhelimella tai selaimella (näkymä on rajattu mobiilileveyteen).
2. Valitse **Luo tili**, anna sähköposti ja vähintään 6 merkin salasana.
3. Jos Supabase-projektissa on sähköpostivahvistus päällä, avaa sähköpostiin tullut linkki ja kirjaudu sitten sisään.
4. Anna lapsen nimi ja halutessasi nykyinen koko → **Tallenna ja aloita**.
5. Etusivu näyttää lapsen nimen ja koon. Asetuksista voi kirjautua ulos. Tabit ja **+ Lisää vaate** avaavat vaiheiden 4+ paikat.

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

Muut komennot: `npm run typecheck` (TypeScript), `npm run export:web` (staattinen build `dist/`-hakemistoon).

## Supabase-projektin luonti

1. Luo projekti osoitteessa [supabase.com](https://supabase.com) (ilmaistaso riittää). Kirjoita talteen **Project Settings → API**: Project URL ja anon public key.
2. Aja migraatiot **SQL Editorissa** järjestyksessä: `supabase/migrations/0001_perusrakenne.sql`, `0002_rls.sql`, `0003_funktiot.sql`. Aja sitten `supabase/tests/hyvaksymistesti.sql`; lopussa pitää lukea `HYVÄKSYMISTESTI LÄPI`. Tarkemmin: [supabase/README.md](supabase/README.md).
3. **Authentication → URL Configuration**:
   - Site URL: `https://makketinz.github.io/appi-prototyyppi/` (alipolku mukaan, jotta vahvistuslinkit palaavat sovellukseen).
   - Redirect URLs: lisää `http://localhost:8081/**` paikallista kehitystä varten.
4. **Authentication → Providers → Email**: prototyypissä voi kytkeä "Confirm email" pois, jolloin tili on käytössä heti ilman sähköpostivahvistusta. Tuotannossa vahvistus pidetään päällä.
5. Anna avaimet sovellukselle: paikallisesti `.env`-tiedostoon (`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`), Pages-buildille repon secreteinä (alla).

Anon-avain on tarkoitettu julkiseksi. Tietoturva on tietokannan RLS-säännöissä: käyttäjä näkee vain oman perheensä rivit, eikä tilaa tai historiaa voi muuttaa ohi `siirra_tila`-funktion.

## GitHub Pages -julkaisun käyttöönotto

Työnkulku `.github/workflows/pages.yml` rakentaa web-exportin ja julkaisee sen jokaisesta `main`-haaran pushista (tai käsin **Actions → Julkaise GitHub Pagesiin → Run workflow**).

1. **Settings → Pages → Build and deployment → Source: GitHub Actions.**
2. **Settings → Secrets and variables → Actions → New repository secret**: `EXPO_PUBLIC_SUPABASE_URL` ja `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
3. Yhdistä muutokset `main`-haaraan (tai aja työnkulku käsin). Julkaisu kestää pari minuuttia; osoite näkyy työnkulun `deploy`-vaiheessa.

Huomioita:

- GitHubin luoma `github-pages`-ympäristö sallii julkaisun oletuksena vain `main`-haarasta (Settings → Environments → github-pages → Deployment branches). Muusta haarasta ajettu työnkulku epäonnistuu deploy-vaiheessa, ellei sääntöä muuteta.
- Jos secretit puuttuvat, build onnistuu mutta sivu näyttää ilmoituksen "Supabase-asetukset puuttuvat".
- Sovellus toimii alipolussa `/appi-prototyyppi/`; `404.html` on kopio `index.html`:stä, jotta suorat linkit (`/koonnit`, `/auth`) toimivat.

## Mitä testata (vaiheet 1–3)

- [ ] Tabit vaihtuvat ja **+ Lisää vaate** avaa lisäyssivun, josta pääsee takaisin.
- [ ] Tilin luonti onnistuu; väärä salasana antaa suomenkielisen virheen.
- [ ] Ensimmäinen kirjautuminen kysyy lapsen nimen; tyhjä nimi estetään; koon voi valita tai jättää tyhjäksi.
- [ ] Etusivu näyttää lapsen nimen ja koon; sivun uudelleenlataus ei kirjaa ulos.
- [ ] Asetukset näyttää sähköpostin ja lapsen; **Kirjaudu ulos** palauttaa kirjautumissivulle.
- [ ] Supabasen Table Editorissa `perhe`, `kayttaja` ja `lapsi` sisältävät rivin; toinen käyttäjä ei näe niitä (hyväksymistesti).

## Hakemistorakenne

```
app/                 Expo Router -reitit: (tabs)/, auth, onboarding, lisaa/
src/ui/              Yhteiset komponentit: Ruutu, AlaPalkki, Nappi, Kentta, Siru, Ilmoitus, Tyhja, teema
src/data/            Supabase-asiakas, tyypit, AuthProvider, QueryProvider, Vartija, lapsi- ja koko-kyselyt
supabase/migrations/ SQL-migraatiot 0001–0003
supabase/tests/      Hyväksymistesti ja paikallinen ajoskripti
.github/workflows/   GitHub Pages -julkaisu
app.config.ts        Expo-konfiguraatio (web output single, baseUrl ympäristömuuttujasta)
eas.json             EAS Build -profiilit
```
