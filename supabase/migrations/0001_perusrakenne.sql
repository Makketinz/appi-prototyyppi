-- 0001 Perusrakenne: enumit, taulut, oletuskoot.
-- Suunnitelman "Tietorakenne"-osion mukaan. Kaikki taulut rajataan perheeseen (perhe_id),
-- ja ristiviittaukset perheiden välillä estetään yhdistelmäviiteavaimilla (x_id, perhe_id).

-- ---------------------------------------------------------------------------
-- Enumit
-- ---------------------------------------------------------------------------
create type public.tila as enum ('kaytossa', 'jemmassa', 'myyntiin', 'myyty', 'lahjoitettu');
create type public.jemma_tyyppi as enum ('tulossa_kayttoon', 'jaanyt_pieneksi');
create type public.kategoria as enum (
  'paidat', 'housut', 'mekot_hameet', 'haalarit', 'takit', 'ulkovaatteet', 'yovaatteet',
  'alusvaatteet', 'sukat', 'asusteet', 'kengat', 'uima_harrastus', 'muu'
);
create type public.hankintatapa as enum ('uutena', 'kaytettyna', 'lahja');
create type public.kunto as enum ('uusi', 'erinomainen', 'hyva', 'tyydyttava', 'huono');
create type public.sesonki as enum ('kevat', 'kesa', 'syksy', 'talvi', 'ympari_vuoden');
create type public.kokoryhma as enum ('sentti', 'kirjain', 'kenka', 'yleinen');

-- ---------------------------------------------------------------------------
-- Apufunktiot
-- ---------------------------------------------------------------------------

-- Merkin ja säilytyspaikan nimen normalisointi: ylimääräiset välilyönnit pois, pienaakkosin.
-- "Reima " ja "reima" ovat sama merkki.
create function public.normalisoi_nimi(p_nimi text)
returns text
language sql
immutable
set search_path = ''
as $$
  select lower(btrim(regexp_replace(p_nimi, '\s+', ' ', 'g')));
$$;

-- muokattu-aikaleima päivittyy automaattisesti.
create function public.aseta_muokattu()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.muokattu := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Perhe ja käyttäjä
-- ---------------------------------------------------------------------------
create table public.perhe (
  id uuid primary key default gen_random_uuid(),
  luotu timestamptz not null default now()
);

create table public.kayttaja (
  id uuid primary key references auth.users (id) on delete cascade,
  perhe_id uuid not null references public.perhe (id) on delete cascade,
  sahkoposti text,
  luotu timestamptz not null default now()
);
create index kayttaja_perhe_idx on public.kayttaja (perhe_id);

-- Kirjautuneen käyttäjän perhe. Security definer, jotta funktio ei riipu kayttaja-taulun
-- RLS:stä; search_path tyhjä, jotta kutsuja ei voi vaihtaa viitattuja objekteja.
create function public.oma_perhe_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select perhe_id from public.kayttaja where id = auth.uid();
$$;

-- ---------------------------------------------------------------------------
-- Koko (järjestelmän oletukset perhe_id = null, käyttäjän omat perhe_id = oma perhe)
-- ---------------------------------------------------------------------------
create table public.koko (
  id uuid primary key default gen_random_uuid(),
  perhe_id uuid references public.perhe (id) on delete cascade,
  ryhma public.kokoryhma not null,
  nimi text not null check (btrim(nimi) <> ''),
  jarjestys integer not null,
  luotu timestamptz not null default now(),
  unique nulls not distinct (perhe_id, ryhma, nimi)
);
create index koko_jarjestys_idx on public.koko (jarjestys);

-- ---------------------------------------------------------------------------
-- Lapsi
-- ---------------------------------------------------------------------------
create table public.lapsi (
  id uuid primary key default gen_random_uuid(),
  perhe_id uuid not null default public.oma_perhe_id() references public.perhe (id) on delete cascade,
  nimi text not null check (btrim(nimi) <> ''),
  nykyinen_koko_id uuid references public.koko (id) on delete set null,
  luotu timestamptz not null default now(),
  muokattu timestamptz not null default now(),
  unique (id, perhe_id)
);
create index lapsi_perhe_idx on public.lapsi (perhe_id);
create trigger lapsi_muokattu before update on public.lapsi
  for each row execute function public.aseta_muokattu();

-- ---------------------------------------------------------------------------
-- Merkki ja säilytyspaikka (perheen omaisuutta, normalisoitu nimi uniikki per perhe)
-- ---------------------------------------------------------------------------
create table public.merkki (
  id uuid primary key default gen_random_uuid(),
  perhe_id uuid not null default public.oma_perhe_id() references public.perhe (id) on delete cascade,
  nimi text not null check (btrim(nimi) <> ''),
  nimi_norm text generated always as (public.normalisoi_nimi(nimi)) stored,
  luotu timestamptz not null default now(),
  unique (perhe_id, nimi_norm),
  unique (id, perhe_id)
);

create table public.sailytyspaikka (
  id uuid primary key default gen_random_uuid(),
  perhe_id uuid not null default public.oma_perhe_id() references public.perhe (id) on delete cascade,
  nimi text not null check (btrim(nimi) <> ''),
  nimi_norm text generated always as (public.normalisoi_nimi(nimi)) stored,
  luotu timestamptz not null default now(),
  unique (perhe_id, nimi_norm),
  unique (id, perhe_id)
);

-- ---------------------------------------------------------------------------
-- Vaate
-- ---------------------------------------------------------------------------
create table public.vaate (
  id uuid primary key default gen_random_uuid(),
  perhe_id uuid not null default public.oma_perhe_id() references public.perhe (id) on delete cascade,
  lapsi_id uuid not null,
  kategoria public.kategoria not null,
  koko_id uuid not null references public.koko (id),
  tila public.tila not null default 'jemmassa',
  jemma_tyyppi public.jemma_tyyppi,
  nimi text,
  kappalemaara integer not null default 1 check (kappalemaara >= 1),
  merkki_id uuid,
  hankintatapa public.hankintatapa,
  ostohinta numeric(10, 2) check (ostohinta is null or ostohinta >= 0),
  ostopaiva date,
  kunto public.kunto,
  huomiot text,
  sailytyspaikka_id uuid,
  sesongit public.sesonki[] not null default '{}',
  myyntihinta numeric(10, 2) check (myyntihinta is null or myyntihinta >= 0),
  myyntipaiva date,
  luotu timestamptz not null default now(),
  muokattu timestamptz not null default now(),
  unique (id, perhe_id),
  -- Yhdistelmä-FK:t: viitattu rivi on pakko olla samassa perheessä.
  foreign key (lapsi_id, perhe_id) references public.lapsi (id, perhe_id) on delete cascade,
  foreign key (merkki_id, perhe_id) references public.merkki (id, perhe_id) on delete set null (merkki_id),
  foreign key (sailytyspaikka_id, perhe_id) references public.sailytyspaikka (id, perhe_id) on delete set null (sailytyspaikka_id),
  -- Jemma-tyyppi on annettu täsmälleen silloin, kun tila on jemmassa.
  constraint vaate_jemma_tyyppi_check check ((tila = 'jemmassa') = (jemma_tyyppi is not null)),
  -- Lahjaksi saadun ostohinta on 0.
  constraint vaate_lahja_ostohinta_check check (hankintatapa is distinct from 'lahja' or coalesce(ostohinta, 0) = 0),
  -- Myyntitiedot vain myydyllä.
  constraint vaate_myyntitiedot_check check (tila = 'myyty' or (myyntihinta is null and myyntipaiva is null))
);
create index vaate_perhe_lapsi_idx on public.vaate (perhe_id, lapsi_id);
create index vaate_perhe_tila_idx on public.vaate (perhe_id, tila);
create index vaate_perhe_koko_idx on public.vaate (perhe_id, koko_id);
create index vaate_muokattu_idx on public.vaate (perhe_id, muokattu desc);
create trigger vaate_muokattu before update on public.vaate
  for each row execute function public.aseta_muokattu();

-- Koko ei ole viiteavaimessa perheeseen sidottu (järjestelmäkoot ovat yhteisiä),
-- joten tarkistus tehdään triggerissä: koko on joko järjestelmän tai saman perheen.
create function public.tarkista_koon_perhe()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_koko_id uuid;
  v_perhe_id uuid;
  v_koon_perhe uuid;
begin
  v_koko_id := (to_jsonb(new) ->> tg_argv[0])::uuid;
  if v_koko_id is null then
    return new;
  end if;
  v_perhe_id := (to_jsonb(new) ->> 'perhe_id')::uuid;
  select k.perhe_id into v_koon_perhe from public.koko k where k.id = v_koko_id;
  if not found then
    raise exception 'Kokoa ei löydy' using errcode = 'foreign_key_violation';
  end if;
  if v_koon_perhe is not null and v_koon_perhe is distinct from v_perhe_id then
    raise exception 'Koko kuuluu toiselle perheelle' using errcode = 'foreign_key_violation';
  end if;
  return new;
end;
$$;

create trigger vaate_koko_perhe before insert or update of koko_id, perhe_id on public.vaate
  for each row execute function public.tarkista_koon_perhe('koko_id');
create trigger lapsi_koko_perhe before insert or update of nykyinen_koko_id, perhe_id on public.lapsi
  for each row execute function public.tarkista_koon_perhe('nykyinen_koko_id');

-- ---------------------------------------------------------------------------
-- Kuva
-- ---------------------------------------------------------------------------
create table public.kuva (
  id uuid primary key default gen_random_uuid(),
  vaate_id uuid not null,
  perhe_id uuid not null default public.oma_perhe_id() references public.perhe (id) on delete cascade,
  polku_iso text not null,
  polku_pikku text,
  jarjestys integer not null default 0 check (jarjestys between 0 and 4),
  luotu timestamptz not null default now(),
  foreign key (vaate_id, perhe_id) references public.vaate (id, perhe_id) on delete cascade,
  unique (vaate_id, jarjestys)
);

-- ---------------------------------------------------------------------------
-- Tilamuutos (historia; kirjoitetaan vain funktioiden kautta, ks. 0003)
-- ---------------------------------------------------------------------------
create table public.tilamuutos (
  id uuid primary key default gen_random_uuid(),
  vaate_id uuid not null,
  perhe_id uuid not null,
  tila_josta public.tila,
  tila_johon public.tila not null,
  jemma_tyyppi_johon public.jemma_tyyppi,
  paivamaara date not null default current_date,
  -- clock_timestamp, jotta samassa transaktiossa kirjatut muutokset säilyttävät järjestyksensä.
  kirjattu timestamptz not null default clock_timestamp(),
  foreign key (vaate_id, perhe_id) references public.vaate (id, perhe_id) on delete cascade
);
create index tilamuutos_vaate_idx on public.tilamuutos (vaate_id, paivamaara, kirjattu);

-- ---------------------------------------------------------------------------
-- Oletuskoot (perhe_id = null). Järjestys välein 10, jotta oma koko mahtuu väliin.
-- ---------------------------------------------------------------------------
insert into public.koko (perhe_id, ryhma, nimi, jarjestys)
select null, 'sentti', s::text, 100 + (rn - 1) * 10
from unnest(array[50, 56, 62, 68, 74, 80, 86, 92, 98, 104, 110, 116, 122, 128, 134, 140, 146, 152, 158, 164, 170])
  with ordinality as t (s, rn);

insert into public.koko (perhe_id, ryhma, nimi, jarjestys)
select null, 'kirjain', s, 500 + (rn - 1) * 10
from unnest(array['XS', 'S', 'M', 'L', 'XL']) with ordinality as t (s, rn);

insert into public.koko (perhe_id, ryhma, nimi, jarjestys)
select null, 'kenka', s::text, 700 + (rn - 1) * 10
from generate_series(16, 40) with ordinality as t (s, rn);

insert into public.koko (perhe_id, ryhma, nimi, jarjestys)
values (null, 'yleinen', 'Onesize', 1000);
