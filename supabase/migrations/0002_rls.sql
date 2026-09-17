-- 0002 Rivitason turvallisuus ja oikeudet.
-- Periaate: käyttäjä näkee ja muokkaa vain oman perheensä rivejä. Lisäksi:
--   * perhe: vain luku; riviä ei luoda eikä poisteta asiakkaasta (luodaan rekisteröinnin triggerissä).
--   * kayttaja: vain luku; perhe_id ei ole käyttäjän vaihdettavissa.
--   * vaate.tila, jemma_tyyppi, myyntihinta, myyntipaiva: muutetaan vain siirra_tila-funktiolla (0003).
--   * tilamuutos: vain luku; kirjoitetaan vain funktioiden kautta.
--   * anon ei näe mitään.

-- Supabase antaa oletuksena kaikki oikeudet anon- ja authenticated-rooleille public-skeeman
-- tauluihin. Perutaan ne ja annetaan vain tarvittavat.
revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke all on all functions in schema public from anon;

alter table public.perhe enable row level security;
alter table public.kayttaja enable row level security;
alter table public.koko enable row level security;
alter table public.lapsi enable row level security;
alter table public.merkki enable row level security;
alter table public.sailytyspaikka enable row level security;
alter table public.vaate enable row level security;
alter table public.kuva enable row level security;
alter table public.tilamuutos enable row level security;

-- ---------------------------------------------------------------------------
-- perhe: vain oma rivi, vain luku
-- ---------------------------------------------------------------------------
grant select on public.perhe to authenticated;
create policy perhe_lue on public.perhe for select to authenticated
  using (id = public.oma_perhe_id());

-- ---------------------------------------------------------------------------
-- kayttaja: vain oma rivi, vain luku (perhe_id ei muutettavissa)
-- ---------------------------------------------------------------------------
grant select on public.kayttaja to authenticated;
create policy kayttaja_lue on public.kayttaja for select to authenticated
  using (id = auth.uid());

-- ---------------------------------------------------------------------------
-- koko: järjestelmän oletukset kaikille luettavissa, omat koot muokattavissa
-- ---------------------------------------------------------------------------
grant select, insert, update, delete on public.koko to authenticated;
create policy koko_lue on public.koko for select to authenticated
  using (perhe_id is null or perhe_id = public.oma_perhe_id());
create policy koko_lisaa on public.koko for insert to authenticated
  with check (perhe_id = public.oma_perhe_id());
create policy koko_paivita on public.koko for update to authenticated
  using (perhe_id = public.oma_perhe_id())
  with check (perhe_id = public.oma_perhe_id());
create policy koko_poista on public.koko for delete to authenticated
  using (perhe_id = public.oma_perhe_id());

-- ---------------------------------------------------------------------------
-- lapsi, merkki, sailytyspaikka, kuva: oma perhe, kaikki toiminnot
-- ---------------------------------------------------------------------------
grant select, insert, update, delete on public.lapsi to authenticated;
create policy lapsi_oma on public.lapsi for all to authenticated
  using (perhe_id = public.oma_perhe_id())
  with check (perhe_id = public.oma_perhe_id());

grant select, insert, update, delete on public.merkki to authenticated;
create policy merkki_oma on public.merkki for all to authenticated
  using (perhe_id = public.oma_perhe_id())
  with check (perhe_id = public.oma_perhe_id());

grant select, insert, update, delete on public.sailytyspaikka to authenticated;
create policy sailytyspaikka_oma on public.sailytyspaikka for all to authenticated
  using (perhe_id = public.oma_perhe_id())
  with check (perhe_id = public.oma_perhe_id());

grant select, insert, update, delete on public.kuva to authenticated;
create policy kuva_oma on public.kuva for all to authenticated
  using (perhe_id = public.oma_perhe_id())
  with check (perhe_id = public.oma_perhe_id());

-- ---------------------------------------------------------------------------
-- vaate: oma perhe; tila- ja myyntisarakkeet vain siirra_tila-funktion kautta
-- ---------------------------------------------------------------------------
grant select, delete on public.vaate to authenticated;
grant insert (
  id, perhe_id, lapsi_id, kategoria, koko_id, tila, jemma_tyyppi, nimi, kappalemaara, merkki_id,
  hankintatapa, ostohinta, ostopaiva, kunto, huomiot, sailytyspaikka_id, sesongit
) on public.vaate to authenticated;
grant update (
  lapsi_id, kategoria, koko_id, nimi, kappalemaara, merkki_id,
  hankintatapa, ostohinta, ostopaiva, kunto, huomiot, sailytyspaikka_id, sesongit
) on public.vaate to authenticated;
create policy vaate_oma on public.vaate for all to authenticated
  using (perhe_id = public.oma_perhe_id())
  with check (perhe_id = public.oma_perhe_id());

-- ---------------------------------------------------------------------------
-- tilamuutos: oma perhe, vain luku
-- ---------------------------------------------------------------------------
grant select on public.tilamuutos to authenticated;
create policy tilamuutos_lue on public.tilamuutos for select to authenticated
  using (perhe_id = public.oma_perhe_id());

-- Vain kirjautunut voi kysyä omaa perhettään.
revoke execute on function public.oma_perhe_id() from public, anon;
grant execute on function public.oma_perhe_id() to authenticated;
