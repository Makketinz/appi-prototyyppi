# Tietokanta (Supabase)

Vaiheen 2 tulos: taulut, enumit, oletuskoot, rivitason turvallisuus (RLS) ja `siirra_tila`-funktio.
Migraatiot ovat `migrations/`-hakemistossa numerojärjestyksessä ja ne ajetaan kerran uuteen Supabase-projektiin.

## Rakenne

| Tiedosto | Sisältö |
| --- | --- |
| `migrations/0001_perusrakenne.sql` | Enumit, taulut `perhe`, `kayttaja`, `koko`, `lapsi`, `merkki`, `sailytyspaikka`, `vaate`, `kuva`, `tilamuutos`; yhdistelmäviiteavaimet `(x_id, perhe_id)`; koon perhetarkistus triggerissä; 52 oletuskokoa |
| `migrations/0002_rls.sql` | RLS päälle kaikkiin tauluihin; oikeudet vain `authenticated`-roolille; `perhe`, `kayttaja` ja `tilamuutos` vain luku; `vaate.tila` ja myyntisarakkeet eivät ole suoraan päivitettävissä |
| `migrations/0003_funktiot.sql` | Rekisteröinti luo perheen ja käyttäjän (trigger `auth.users`-tauluun); vaatteen alkutila kirjautuu historiaan; `siirra_tila(...)` ja `muokkaa_tilamuutoksen_paivamaara(...)` |
| `tests/hyvaksymistesti.sql` | Hyväksymistesti: ajetaan SQL-editorissa, peruu omat muutoksensa |
| `tests/00_supabase_emulaatio.sql`, `tests/aja_paikallisesti.sh` | Vain paikalliseen PostgreSQL-testaukseen, ei Supabaseen |

Tietoturvan periaatteet:

- Käyttäjä näkee ja muokkaa vain oman perheensä rivejä (`perhe_id = oma_perhe_id()`).
- `kayttaja.perhe_id` ei ole käyttäjän päivitettävissä (taululle ei ole update-oikeutta).
- `perhe`-riviä ei voi luoda eikä poistaa asiakkaasta; se syntyy rekisteröinnin triggerissä.
- Ristiviittaukset perheiden välillä ovat mahdottomia: `vaate → lapsi / merkki / sailytyspaikka` ja `kuva / tilamuutos → vaate` viittaavat pariin `(id, perhe_id)`. Koko tarkistetaan triggerissä (järjestelmän koko tai oma).
- `vaate.tila`, `jemma_tyyppi`, `myyntihinta` ja `myyntipaiva` muuttuvat vain `siirra_tila`-funktiolla, joka tarkistaa perheen itse ja kirjoittaa historian samassa transaktiossa. `tilamuutos`-tauluun ei ole kirjoitusoikeutta.
- Kaikissa `security definer` -funktioissa on `set search_path = ''`.
- `anon`-roolilla ei ole oikeuksia mihinkään.

## Ajo Supabase-projektiin

1. Luo projekti osoitteessa supabase.com (ilmaistaso riittää).
2. Avaa **SQL Editor** ja aja tiedostot järjestyksessä: `0001_perusrakenne.sql`, `0002_rls.sql`, `0003_funktiot.sql`. Liitä kunkin tiedoston sisältö editoriin ja paina Run.
3. Aja `tests/hyvaksymistesti.sql` samassa editorissa. Tulosteen Messages-välilehdellä pitää näkyä rivejä `OK ...` ja lopussa `HYVÄKSYMISTESTI LÄPI`. Testi luo kaksi tilapäistä käyttäjää ja peruu kaiken lopussa (`rollback`).

Vaihtoehtoisesti Supabase CLI:llä: `supabase link --project-ref <ref>` ja `supabase db push` (CLI lukee `migrations/`-hakemiston).

## Hyväksymistestin tapaukset

Testi vastaa suunnitelman vaiheen 2 ehtoon "SQL-editorista lisätty vaate näkyy vain oman perheen käyttäjälle" ja tarkistaa lisäksi:

| Tapaus | Odotus |
| --- | --- |
| Kaksi käyttäjää rekisteröityy | Kummallekin oma perhe ja `kayttaja`-rivi |
| A lisää lapsen, merkin, oman koon ja vaatteen | `perhe_id` täyttyy oletuksesta; alkutila kirjautuu historiaan; jemma-tyyppi täydentyy |
| B lukee tauluja | Ei näe A:n vaatetta, lasta, merkkiä, kokoa, historiaa eikä perhettä |
| Käyttäjä yrittää vaihtaa oman `perhe_id`:n | Epäonnistuu (permission denied) |
| Vaate toisen perheen lapselle, merkille tai koolle; vaate toisen perheen `perhe_id`:llä | Epäonnistuu (viiteavain, trigger tai RLS) |
| Tilan tai myyntihinnan suora päivitys; tilamuutoksen suora lisäys tai poisto | Epäonnistuu (permission denied) |
| Vaatteen alkutila `myyty`; lahjaksi saadulle ostohinta | Epäonnistuu (tarkistus) |
| `perhe`-rivin luonti tai poisto | Epäonnistuu |
| `siirra_tila`: jemmassa → käytössä → myyntiin → myyty → myyntiin → jemmassa | Onnistuu, historia oikeassa järjestyksessä, myyntitiedot tallentuvat ja tyhjenevät |
| `siirra_tila`: käytössä → myyty, myyty → käytössä, myyty ilman hintaa | Epäonnistuu |
| B kutsuu `siirra_tila` A:n vaatteelle | Epäonnistuu ("Vaatetta ei löydy") |
| Tilamuutoksen päivämäärän korjaus | Onnistuu omalle, epäonnistuu toisen perheen riville |
| Merkit `Reima ` ja `reima` | Sama merkki (uniikkirikkomus) |
| `anon` lukee tauluja tai kutsuu funktiota | Epäonnistuu |

## Paikallinen testaus (valinnainen)

Jos koneella on PostgreSQL 15 tai uudempi, koko ketju voidaan ajaa ilman Supabase-projektia:

```bash
createdb testi
supabase/tests/aja_paikallisesti.sh "postgresql://postgres@localhost:5432/testi"
```

Skripti luo Supabasen roolit ja `auth`-skeeman emulaationa, ajaa migraatiot ja hyväksymistestin.

## Sallitut tilasiirtymät

| Josta | Johon |
| --- | --- |
| jemmassa | kaytossa, myyntiin, lahjoitettu |
| kaytossa | jemmassa, myyntiin, lahjoitettu |
| myyntiin | jemmassa, myyty, lahjoitettu |
| myyty | myyntiin (kauppa peruuntui) |
| lahjoitettu | jemmassa (virheen korjaus) |

Vaatteen alkutila on `jemmassa` (oletus) tai `kaytossa`. Myyty-siirto vaatii myyntihinnan; myyntipäivä on oletuksena siirron päivämäärä. Jemmassa-siirto ilman jemma-tyyppiä saa tyypin `jaanyt_pieneksi`, lisäyksessä `tulossa_kayttoon`.
