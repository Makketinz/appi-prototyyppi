-- Esimerkkidata vaiheen 4 kokeiluun: 14 vaateriviä (29 kpl), 5 merkkiä ja 3 säilytyspaikkaa.
-- Vaatteen lisäys sovelluksessa tulee vaiheessa 5; siihen asti vaatteet lisätään tällä.
--
-- Käyttö:
--   1. Luo tili sovelluksessa ja tee ensikäynnistys (lapsen nimi).
--   2. Supabase → SQL Editor: liitä tämä tiedosto, vaihda alle oma sähköpostisi ja paina Run.
--
-- Skripti lisää dataa vain, jos perheellä ei vielä ole yhtään vaatetta. Mukana on määrittelyn
-- esimerkki: 6 kpl koon 110 housuja, joista 3 käytössä ja 3 jemmassa sinisessä laatikossa.
-- Poisto-ohje on tiedoston lopussa.

do $$
declare
  v_sahkoposti constant text := 'oma@sahkoposti.fi';  -- ← vaihda tähän tilisi sähköposti
  v_kayttaja uuid;
  v_perhe uuid;
  v_lapsi uuid;
begin
  select id, perhe_id into v_kayttaja, v_perhe
  from public.kayttaja
  where lower(sahkoposti) = lower(btrim(v_sahkoposti));
  if v_perhe is null then
    raise exception 'Käyttäjää % ei löydy. Vaihda skriptin alkuun oma sähköpostisi ja luo tili sovelluksessa.', v_sahkoposti;
  end if;

  select id into v_lapsi from public.lapsi where perhe_id = v_perhe order by luotu limit 1;
  if v_lapsi is null then
    raise exception 'Lasta ei löydy. Kirjaudu sovellukseen ja tee ensikäynnistys ennen esimerkkidataa.';
  end if;

  if exists (select 1 from public.vaate where perhe_id = v_perhe) then
    raise exception 'Perheellä on jo vaatteita. Esimerkkidata lisätään vain tyhjään varastoon.';
  end if;

  insert into public.merkki (perhe_id, nimi)
  values (v_perhe, 'Reima'), (v_perhe, 'Lindex'), (v_perhe, 'Polarn O. Pyret'), (v_perhe, 'Molo'), (v_perhe, 'Kavat')
  on conflict (perhe_id, nimi_norm) do nothing;

  insert into public.sailytyspaikka (perhe_id, nimi)
  values (v_perhe, 'Sininen laatikko'), (v_perhe, 'Vaatekaappi'), (v_perhe, 'Ullakko')
  on conflict (perhe_id, nimi_norm) do nothing;

  -- Lisäysajat porrastetaan (minuutteja sitten), jotta "viimeksi muokattu" -järjestys on selkeä.
  insert into public.vaate (
    perhe_id, lapsi_id, kategoria, koko_id, tila, jemma_tyyppi, nimi, kappalemaara, merkki_id,
    hankintatapa, ostohinta, ostopaiva, kunto, huomiot, sailytyspaikka_id, sesongit, luotu, muokattu
  )
  select
    v_perhe, v_lapsi, d.kategoria::public.kategoria, k.id, d.tila::public.tila, d.jemma::public.jemma_tyyppi,
    d.nimi, d.kpl, m.id, d.hankinta::public.hankintatapa, d.hinta, current_date - d.ostettu, d.kunto::public.kunto,
    d.huomiot, s.id, d.sesongit::public.sesonki[],
    now() - make_interval(mins => d.minuuttia), now() - make_interval(mins => d.minuuttia)
  from (values
    ('housut',       '110',     'kaytossa', null,               'Farkut',                2, 'Lindex',          'uutena',     29.90,                39, 'hyva',        null,                     'Vaatekaappi',      '{ympari_vuoden}', 140),
    ('housut',       '110',     'kaytossa', null,               'Collegehousut',         1, 'Polarn O. Pyret', 'kaytettyna',  6.00,                57, 'hyva',        null,                     'Vaatekaappi',      '{ympari_vuoden}', 130),
    ('housut',       '110',     'jemmassa', 'tulossa_kayttoon', 'Välikausihousut',       3, 'Reima',           'kaytettyna', 18.00,               106, 'erinomainen', null,                     'Sininen laatikko', '{kevat,syksy}',   120),
    ('haalarit',     '110',     'jemmassa', 'tulossa_kayttoon', 'Sininen dinohaalari',   1, 'Reima',           'kaytettyna', 25.00,               121, 'hyva',        'Pieni tahra polvessa',   'Sininen laatikko', '{talvi}',         110),
    ('haalarit',     '104',     'jemmassa', 'jaanyt_pieneksi',  'Punainen talvihaalari', 1, 'Reima',           'lahja',       0.00, null,               'erinomainen', null,                     'Ullakko',          '{talvi}',         100),
    ('paidat',       '110',     'kaytossa', null,               null,                    4, 'Lindex',          'uutena',     20.00,                39, 'uusi',        null,                     'Vaatekaappi',      '{ympari_vuoden}',  90),
    ('paidat',       '104',     'jemmassa', 'jaanyt_pieneksi',  'Raitapaidat',           3, 'Polarn O. Pyret', 'kaytettyna',  9.00,               392, 'tyydyttava',  'Nukkaa hihoissa',        'Ullakko',          '{ympari_vuoden}',  80),
    ('mekot_hameet', '104',     'jemmassa', 'jaanyt_pieneksi',  'Kukkamekko',            1, 'Molo',            'lahja',       0.00, null,               'hyva',        null,                     'Ullakko',          '{kesa}',           70),
    ('takit',        '116',     'jemmassa', 'tulossa_kayttoon', 'Välikausitakki',        1, 'Molo',            'kaytettyna', 35.00,                80, 'erinomainen', null,                     'Sininen laatikko', '{kevat,syksy}',    60),
    ('yovaatteet',   '110',     'kaytossa', null,               'Pyjamat',               3, 'Lindex',          'uutena',     24.00,                39, 'hyva',        null,                     'Vaatekaappi',      '{ympari_vuoden}',  50),
    ('sukat',        '25',      'kaytossa', null,               'Villasukat',            5, null,              'lahja',       0.00, null,               'hyva',        'Mummon neulomat',        'Vaatekaappi',      '{talvi}',          40),
    ('kengat',       '25',      'kaytossa', null,               'Talvikengät',           1, 'Kavat',           'uutena',     79.00,                23, 'uusi',        null,                     null,               '{talvi}',          30),
    ('kengat',       '24',      'jemmassa', 'jaanyt_pieneksi',  'Sandaalit',             1, 'Kavat',           'kaytettyna', 15.00,               496, 'hyva',        'Tarranauha kulunut',     'Ullakko',          '{kesa}',           20),
    ('asusteet',     'Onesize', 'kaytossa', null,               'Pipo',                  2, 'Reima',           'uutena',     19.90,                23, 'uusi',        null,                     'Vaatekaappi',      '{talvi}',          10)
  ) as d (kategoria, koko, tila, jemma, nimi, kpl, merkki, hankinta, hinta, ostettu, kunto, huomiot, paikka, sesongit, minuuttia)
  join public.koko k on k.perhe_id is null and k.nimi = d.koko
  left join public.merkki m on m.perhe_id = v_perhe and m.nimi_norm = public.normalisoi_nimi(d.merkki)
  left join public.sailytyspaikka s on s.perhe_id = v_perhe and s.nimi_norm = public.normalisoi_nimi(d.paikka);

  -- Alkutilan päivämääräksi ostopäivä (tai kaksi kuukautta sitten), jotta historia etenee ajassa.
  update public.tilamuutos t
  set paivamaara = coalesce(v.ostopaiva, current_date - 60)
  from public.vaate v
  where v.id = t.vaate_id and v.perhe_id = v_perhe and t.tila_josta is null;

  -- Muutama tilasiirto siirra_tila-funktiolla, jotta mukana on myös Myyntiin-, Myyty- ja
  -- Lahjoitettu-vaatteita historioineen. Funktio tunnistaa käyttäjän JWT-tiedoista, joten
  -- ne asetetaan tämän transaktion ajaksi.
  perform set_config('request.jwt.claims', json_build_object('sub', v_kayttaja, 'role', 'authenticated')::text, true);
  perform public.siirra_tila(id, 'myyntiin', current_date - 14)
  from public.vaate where perhe_id = v_perhe and nimi in ('Raitapaidat', 'Kukkamekko');
  perform public.siirra_tila(id, 'myyty', current_date - 7, null, 12.00)
  from public.vaate where perhe_id = v_perhe and nimi = 'Kukkamekko';
  perform public.siirra_tila(id, 'lahjoitettu', current_date - 20)
  from public.vaate where perhe_id = v_perhe and nimi = 'Sandaalit';
  perform set_config('request.jwt.claims', '', true);

  raise notice 'Esimerkkidata lisätty: % vaateriviä.', (select count(*) from public.vaate where perhe_id = v_perhe);
end;
$$;

-- Esimerkkidatan (ja kaikkien perheen vaatteiden) poisto. Aja erikseen, jos haluat aloittaa alusta:
--
-- delete from public.vaate
-- where perhe_id = (select perhe_id from public.kayttaja where lower(sahkoposti) = lower('oma@sahkoposti.fi'));
