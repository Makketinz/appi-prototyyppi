-- Vaiheen 2 hyväksymistesti. Ajetaan migraatioiden jälkeen joko paikallisesti
-- (supabase/tests/aja_paikallisesti.sh) tai Supabasen SQL-editorissa postgres-roolilla.
-- Koko testi on yksi transaktio, joka perutaan lopussa: tietokantaan ei jää testidataa.
--
-- Tarkistettavat asiat:
--   1. Rekisteröinti luo perheen ja kayttaja-rivin.
--   2. SQL:llä lisätty vaate näkyy vain oman perheen käyttäjälle.
--   3. Käyttäjä ei voi vaihtaa omaa perhe_id:tään.
--   4. Vaatetta ei voi lisätä toisen perheen lapselle, merkille tai koolle.
--   5. Tilaa ei voi päivittää suoraan eikä tilamuutosta kirjoittaa suoraan.
--   6. siirra_tila toimii sallituilla siirtymillä ja estää kielletyt.
--   7. Perhe-riviä ei voi luoda tai poistaa asiakkaasta.
--   8. Merkin nimi normalisoidaan ("Reima " = "reima").
--   9. anon ei näe mitään.

begin;

-- Apufunktiot testin ajaksi (poistuvat rollbackissa).
create function pg_temp.kirjaudu(p_id uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', p_id, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', p_id::text, true);
  execute 'set local role authenticated';
end;
$$;

create function pg_temp.kirjaudu_ulos() returns void language plpgsql as $$
begin
  execute 'reset role';
  perform set_config('request.jwt.claims', '', true);
  perform set_config('request.jwt.claim.sub', '', true);
end;
$$;

create function pg_temp.odota_virhetta(p_nimi text, p_sql text) returns void language plpgsql as $$
begin
  execute p_sql;
  raise exception 'ODOTETTU VIRHE PUUTTUU: %', p_nimi;
exception
  when raise_exception then
    raise;
  when others then
    raise notice 'OK   % (esti: %)', p_nimi, sqlerrm;
end;
$$;

create function pg_temp.vaadi(p_nimi text, p_ehto boolean) returns void language plpgsql as $$
begin
  if p_ehto is not true then
    raise exception 'EPÄONNISTUI: %', p_nimi;
  end if;
  raise notice 'OK   %', p_nimi;
end;
$$;

-- ---------------------------------------------------------------------------
-- 1. Kaksi käyttäjää rekisteröityy → kaksi eri perhettä
-- ---------------------------------------------------------------------------
create temp table t (avain text primary key, arvo uuid);
grant all on t to authenticated, anon;
insert into t values ('a', gen_random_uuid()), ('b', gen_random_uuid());

insert into auth.users (id, email) select arvo, 'a@esimerkki.fi' from t where avain = 'a';
insert into auth.users (id, email) select arvo, 'b@esimerkki.fi' from t where avain = 'b';

insert into t select 'perhe_a', perhe_id from public.kayttaja where id = (select arvo from t where avain = 'a');
insert into t select 'perhe_b', perhe_id from public.kayttaja where id = (select arvo from t where avain = 'b');

select pg_temp.vaadi('rekisteröinti loi perheen molemmille',
  (select count(*) from public.kayttaja where id in (select arvo from t where avain in ('a', 'b'))) = 2);
select pg_temp.vaadi('perheet ovat eri',
  (select arvo from t where avain = 'perhe_a') <> (select arvo from t where avain = 'perhe_b'));

-- ---------------------------------------------------------------------------
-- 2. A lisää lapsen, merkin ja vaatteen; B ei näe niitä
-- ---------------------------------------------------------------------------
select pg_temp.kirjaudu((select arvo from t where avain = 'a'));

select pg_temp.vaadi('A näkee oman perheensä', (select count(*) from public.perhe) = 1);
select pg_temp.vaadi('A näkee vain oman kayttaja-rivinsä', (select count(*) from public.kayttaja) = 1);
select pg_temp.vaadi('A näkee järjestelmän oletuskoot', (select count(*) from public.koko where perhe_id is null) = 52);

with x as (
  insert into public.lapsi (nimi, nykyinen_koko_id, nykyinen_kenkakoko_id)
  values (
    'Aino',
    (select id from public.koko where perhe_id is null and nimi = '110'),
    (select id from public.koko where perhe_id is null and ryhma = 'kenka' and nimi = '25')
  )
  returning id
) insert into t select 'lapsi_a', id from x;
select pg_temp.vaadi('lapsella on sekä vaatekoko että kengänkoko',
  (select nykyinen_koko_id is not null and nykyinen_kenkakoko_id is not null from public.lapsi));
select pg_temp.odota_virhetta('kengänkoko vaatekooksi',
  format($q$ update public.lapsi set nykyinen_koko_id = %L $q$,
    (select id from public.koko where perhe_id is null and ryhma = 'kenka' and nimi = '25')));
select pg_temp.odota_virhetta('vaatekoko kengänkooksi',
  format($q$ update public.lapsi set nykyinen_kenkakoko_id = %L $q$,
    (select id from public.koko where perhe_id is null and nimi = '110')));
with x as (insert into public.merkki (nimi) values ('Reima ') returning id) insert into t select 'merkki_a', id from x;
with x as (
  insert into public.koko (perhe_id, ryhma, nimi, jarjestys)
  values ((select arvo from t where avain = 'perhe_a'), 'sentti', '92/98', 175)
  returning id
) insert into t select 'koko_a', id from x;
with x as (
  insert into public.vaate (lapsi_id, kategoria, koko_id, tila, merkki_id, hankintatapa, ostohinta, kappalemaara)
  values (
    (select arvo from t where avain = 'lapsi_a'),
    'housut',
    (select id from public.koko where perhe_id is null and nimi = '110'),
    'jemmassa',
    (select arvo from t where avain = 'merkki_a'),
    'kaytettyna', 4.50, 2
  )
  returning id
) insert into t select 'vaate_a', id from x;

select pg_temp.vaadi('A näkee vaatteensa', (select count(*) from public.vaate) = 1);
select pg_temp.vaadi('vaatteen perhe_id täyttyi oletuksesta',
  (select perhe_id from public.vaate) = (select arvo from t where avain = 'perhe_a'));
select pg_temp.vaadi('jemma-tyyppi täydentyi lisäyksessä',
  (select jemma_tyyppi from public.vaate) = 'tulossa_kayttoon');
select pg_temp.vaadi('alkutila kirjautui historiaan',
  (select count(*) from public.tilamuutos where tila_josta is null and tila_johon = 'jemmassa') = 1);

-- 8. Normalisointi
select pg_temp.vaadi('merkin nimi normalisoitui', (select nimi_norm from public.merkki) = 'reima');
select pg_temp.odota_virhetta('sama merkki eri kirjoitusasulla estetään',
  $q$ insert into public.merkki (nimi) values ('reima') $q$);

-- 3. Oma perhe_id ei ole vaihdettavissa
select pg_temp.odota_virhetta('käyttäjä yrittää vaihtaa perhe_id:n',
  format($q$ update public.kayttaja set perhe_id = %L $q$, (select arvo from t where avain = 'perhe_b')));

-- 5. Tilaa ei voi päivittää suoraan, tilamuutosta ei voi kirjoittaa suoraan
select pg_temp.odota_virhetta('tilan suora päivitys',
  $q$ update public.vaate set tila = 'kaytossa', jemma_tyyppi = null $q$);
select pg_temp.odota_virhetta('myyntihinnan suora päivitys',
  $q$ update public.vaate set myyntihinta = 10 $q$);
select pg_temp.odota_virhetta('tilamuutoksen suora lisäys',
  format($q$ insert into public.tilamuutos (vaate_id, perhe_id, tila_johon) values (%L, %L, 'myyty') $q$,
    (select arvo from t where avain = 'vaate_a'), (select arvo from t where avain = 'perhe_a')));
select pg_temp.odota_virhetta('tilamuutoksen suora poisto',
  $q$ delete from public.tilamuutos $q$);
select pg_temp.odota_virhetta('vaatteen alkutila myyty',
  format($q$ insert into public.vaate (lapsi_id, kategoria, koko_id, tila) values (%L, 'sukat', %L, 'myyty') $q$,
    (select arvo from t where avain = 'lapsi_a'), (select id from public.koko where perhe_id is null and nimi = '110')));
select pg_temp.odota_virhetta('lahjaksi saadulla ostohinta',
  format($q$ insert into public.vaate (lapsi_id, kategoria, koko_id, hankintatapa, ostohinta) values (%L, 'sukat', %L, 'lahja', 5) $q$,
    (select arvo from t where avain = 'lapsi_a'), (select id from public.koko where perhe_id is null and nimi = '110')));

-- 7. Perhe-riviä ei voi luoda eikä poistaa
select pg_temp.odota_virhetta('perheen luonti asiakkaasta', $q$ insert into public.perhe default values $q$);
select pg_temp.odota_virhetta('perheen poisto asiakkaasta', $q$ delete from public.perhe $q$);

-- 6. siirra_tila
select pg_temp.vaadi('siirto käyttöön',
  (select tila_johon from public.siirra_tila((select arvo from t where avain = 'vaate_a'), 'kaytossa', date '2026-09-01')) = 'kaytossa');
select pg_temp.vaadi('vaatteen tila päivittyi ja jemma-tyyppi tyhjeni',
  (select tila = 'kaytossa' and jemma_tyyppi is null from public.vaate));
select pg_temp.odota_virhetta('kielletty siirtymä käytössä → myyty',
  format($q$ select public.siirra_tila(%L, 'myyty', current_date, null, 5, null) $q$, (select arvo from t where avain = 'vaate_a')));
select pg_temp.vaadi('siirto myyntiin',
  (select tila_johon from public.siirra_tila((select arvo from t where avain = 'vaate_a'), 'myyntiin')) = 'myyntiin');
select pg_temp.odota_virhetta('myyty ilman hintaa',
  format($q$ select public.siirra_tila(%L, 'myyty') $q$, (select arvo from t where avain = 'vaate_a')));
select pg_temp.vaadi('myyty hinnalla',
  (select tila_johon from public.siirra_tila((select arvo from t where avain = 'vaate_a'), 'myyty', date '2026-09-10', null, 3.00)) = 'myyty');
select pg_temp.vaadi('myyntihinta ja -päivä tallentuivat',
  (select myyntihinta = 3.00 and myyntipaiva = date '2026-09-10' from public.vaate));
select pg_temp.odota_virhetta('kielletty siirtymä myyty → käytössä',
  format($q$ select public.siirra_tila(%L, 'kaytossa') $q$, (select arvo from t where avain = 'vaate_a')));
select pg_temp.vaadi('kauppa peruuntui: myyty → myyntiin',
  (select tila_johon from public.siirra_tila((select arvo from t where avain = 'vaate_a'), 'myyntiin')) = 'myyntiin');
select pg_temp.vaadi('myyntitiedot tyhjenivät',
  (select myyntihinta is null and myyntipaiva is null from public.vaate));
select pg_temp.vaadi('takaisin jemmaan oletustyypillä jäänyt pieneksi',
  (select jemma_tyyppi_johon from public.siirra_tila((select arvo from t where avain = 'vaate_a'), 'jemmassa')) = 'jaanyt_pieneksi');
select pg_temp.vaadi('historiassa 6 riviä oikeassa järjestyksessä',
  (select array_agg(tila_johon order by kirjattu, paivamaara)::text from public.tilamuutos)
    = '{jemmassa,kaytossa,myyntiin,myyty,myyntiin,jemmassa}');
select pg_temp.vaadi('päivämäärän korjaus jälkikäteen',
  (select paivamaara from public.muokkaa_tilamuutoksen_paivamaara(
    (select id from public.tilamuutos where tila_johon = 'kaytossa'), date '2026-08-15')) = date '2026-08-15');

select pg_temp.kirjaudu_ulos();

-- ---------------------------------------------------------------------------
-- B: ei näe A:n rivejä eikä voi viitata niihin
-- ---------------------------------------------------------------------------
select pg_temp.kirjaudu((select arvo from t where avain = 'b'));

select pg_temp.vaadi('B ei näe A:n vaatetta', (select count(*) from public.vaate) = 0);
select pg_temp.vaadi('B ei näe A:n lasta', (select count(*) from public.lapsi) = 0);
select pg_temp.vaadi('B ei näe A:n merkkiä', (select count(*) from public.merkki) = 0);
select pg_temp.vaadi('B ei näe A:n omaa kokoa', (select count(*) from public.koko where perhe_id is not null) = 0);
select pg_temp.vaadi('B ei näe A:n historiaa', (select count(*) from public.tilamuutos) = 0);
select pg_temp.vaadi('B ei näe A:n perhettä', (select count(*) from public.perhe) = 1);

with x as (insert into public.lapsi (nimi) values ('Beata') returning id) insert into t select 'lapsi_b', id from x;

-- 4. Ristiviittaukset
select pg_temp.odota_virhetta('vaate toisen perheen lapselle',
  format($q$ insert into public.vaate (lapsi_id, kategoria, koko_id) values (%L, 'paidat', %L) $q$,
    (select arvo from t where avain = 'lapsi_a'), (select id from public.koko where perhe_id is null and nimi = '110')));
select pg_temp.odota_virhetta('vaate toisen perheen merkillä',
  format($q$ insert into public.vaate (lapsi_id, kategoria, koko_id, merkki_id) values (%L, 'paidat', %L, %L) $q$,
    (select arvo from t where avain = 'lapsi_b'), (select id from public.koko where perhe_id is null and nimi = '110'),
    (select arvo from t where avain = 'merkki_a')));
select pg_temp.odota_virhetta('vaate toisen perheen koolla',
  format($q$ insert into public.vaate (lapsi_id, kategoria, koko_id) values (%L, 'paidat', %L) $q$,
    (select arvo from t where avain = 'lapsi_b'), (select arvo from t where avain = 'koko_a')));
select pg_temp.odota_virhetta('vaate toisen perheen perhe_id:llä',
  format($q$ insert into public.vaate (perhe_id, lapsi_id, kategoria, koko_id) values (%L, %L, 'paidat', %L) $q$,
    (select arvo from t where avain = 'perhe_a'), (select arvo from t where avain = 'lapsi_a'),
    (select id from public.koko where perhe_id is null and nimi = '110')));
select pg_temp.odota_virhetta('B siirtää A:n vaatteen tilaa',
  format($q$ select public.siirra_tila(%L, 'kaytossa') $q$, (select arvo from t where avain = 'vaate_a')));
select pg_temp.odota_virhetta('B muokkaa A:n tilamuutoksen päivämäärää',
  format($q$ select public.muokkaa_tilamuutoksen_paivamaara(%L, current_date) $q$,
    (select id from public.tilamuutos where vaate_id = (select arvo from t where avain = 'vaate_a') limit 1)));
-- RLS ei heitä virhettä vaan suodattaa rivit pois: poisto ja päivitys eivät osu mihinkään.
delete from public.koko where perhe_id is null and nimi = '110';
update public.koko set nimi = '111' where perhe_id is null and nimi = '110';
select pg_temp.vaadi('B ei voi poistaa tai muuttaa järjestelmän oletuskokoa',
  (select count(*) from public.koko where perhe_id is null and nimi = '110') = 1);

select pg_temp.kirjaudu_ulos();

-- Tarkistus postgres-roolilla: A:n vaate ja historia ovat yhä tallessa (B:n yritykset eivät muuttaneet mitään).
select pg_temp.vaadi('A:n vaate on tallessa',
  (select count(*) from public.vaate where id = (select arvo from t where avain = 'vaate_a')) = 1);
select pg_temp.vaadi('A:n historia on tallessa',
  (select count(*) from public.tilamuutos where vaate_id = (select arvo from t where avain = 'vaate_a')) = 6);

-- ---------------------------------------------------------------------------
-- 9. anon ei näe mitään
-- ---------------------------------------------------------------------------
set local role anon;
select pg_temp.odota_virhetta('anon lukee vaatteita', $q$ select count(*) from public.vaate $q$);
select pg_temp.odota_virhetta('anon lukee kokoja', $q$ select count(*) from public.koko $q$);
select pg_temp.odota_virhetta('anon kutsuu siirra_tila-funktiota',
  $q$ select public.siirra_tila(gen_random_uuid(), 'kaytossa') $q$);
reset role;

do $$ begin raise notice 'HYVÄKSYMISTESTI LÄPI'; end $$;

rollback;
