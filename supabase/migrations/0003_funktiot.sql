-- 0003 Funktiot ja triggerit: rekisteröinti luo perheen, vaatteen alkutila kirjautuu
-- historiaan, tilamuutokset tehdään siirra_tila-funktiolla.

-- ---------------------------------------------------------------------------
-- Rekisteröinti: uusi auth-käyttäjä saa oman perheen ja kayttaja-rivin.
-- ---------------------------------------------------------------------------
create function public.kasittele_uusi_kayttaja()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_perhe_id uuid;
begin
  insert into public.perhe default values returning id into v_perhe_id;
  insert into public.kayttaja (id, perhe_id, sahkoposti)
  values (new.id, v_perhe_id, new.email);
  return new;
end;
$$;
revoke execute on function public.kasittele_uusi_kayttaja() from public, anon, authenticated;

create trigger auth_uusi_kayttaja after insert on auth.users
  for each row execute function public.kasittele_uusi_kayttaja();

-- ---------------------------------------------------------------------------
-- Sallitut tilasiirtymät (määrittelyn tilakaavio). Lahjoitettu → Jemmassa on sallittu
-- vain virheen korjaukseen, samoin Myyty → Myyntiin ("kauppa peruuntui").
-- ---------------------------------------------------------------------------
create function public.siirtyma_sallittu(p_josta public.tila, p_johon public.tila)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select case p_josta
    when 'jemmassa'    then p_johon in ('kaytossa', 'myyntiin', 'lahjoitettu')
    when 'kaytossa'    then p_johon in ('jemmassa', 'myyntiin', 'lahjoitettu')
    when 'myyntiin'    then p_johon in ('jemmassa', 'myyty', 'lahjoitettu')
    when 'myyty'       then p_johon in ('myyntiin')
    when 'lahjoitettu' then p_johon in ('jemmassa')
  end;
$$;

-- ---------------------------------------------------------------------------
-- Vaatteen lisäys: alkutila on Jemmassa tai Käytössä, jemma-tyyppi täydennetään,
-- ja ensimmäinen tilamuutos (tila_josta = null) kirjataan historiaan.
-- ---------------------------------------------------------------------------
create function public.vaate_ennen_lisaysta()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.tila not in ('jemmassa', 'kaytossa') then
    raise exception 'Vaatteen alkutila voi olla vain Jemmassa tai Käytössä'
      using errcode = 'check_violation';
  end if;
  if new.tila = 'jemmassa' then
    new.jemma_tyyppi := coalesce(new.jemma_tyyppi, 'tulossa_kayttoon');
  else
    new.jemma_tyyppi := null;
  end if;
  new.myyntihinta := null;
  new.myyntipaiva := null;
  return new;
end;
$$;

create trigger vaate_ennen_lisaysta before insert on public.vaate
  for each row execute function public.vaate_ennen_lisaysta();

-- Security definer, koska authenticated-roolilla ei ole insert-oikeutta tilamuutos-tauluun.
create function public.vaate_lisayksen_jalkeen()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.tilamuutos (vaate_id, perhe_id, tila_josta, tila_johon, jemma_tyyppi_johon, paivamaara)
  values (new.id, new.perhe_id, null, new.tila, new.jemma_tyyppi, current_date);
  return new;
end;
$$;
revoke execute on function public.vaate_lisayksen_jalkeen() from public, anon, authenticated;

create trigger vaate_lisayksen_jalkeen after insert on public.vaate
  for each row execute function public.vaate_lisayksen_jalkeen();

-- ---------------------------------------------------------------------------
-- siirra_tila: ainoa tapa vaihtaa vaatteen tilaa. Kirjoittaa vaate-rivin ja
-- tilamuutos-rivin samassa transaktiossa. Tarkistaa perheen itse (security definer).
-- ---------------------------------------------------------------------------
create function public.siirra_tila(
  p_vaate_id uuid,
  p_tila_johon public.tila,
  p_paivamaara date default current_date,
  p_jemma_tyyppi public.jemma_tyyppi default null,
  p_myyntihinta numeric default null,
  p_myyntipaiva date default null
)
returns public.tilamuutos
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_perhe_id uuid := public.oma_perhe_id();
  v_vaate public.vaate;
  v_jemma_tyyppi public.jemma_tyyppi;
  v_myyntihinta numeric(10, 2);
  v_myyntipaiva date;
  v_muutos public.tilamuutos;
begin
  if v_perhe_id is null then
    raise exception 'Kirjautuminen vaaditaan' using errcode = 'insufficient_privilege';
  end if;

  select * into v_vaate from public.vaate
  where id = p_vaate_id and perhe_id = v_perhe_id
  for update;
  if not found then
    raise exception 'Vaatetta ei löydy' using errcode = 'no_data_found';
  end if;

  if p_paivamaara is null then
    raise exception 'Päivämäärä puuttuu' using errcode = 'check_violation';
  end if;

  if not public.siirtyma_sallittu(v_vaate.tila, p_tila_johon) then
    raise exception 'Siirtymä % → % ei ole sallittu', v_vaate.tila, p_tila_johon
      using errcode = 'check_violation';
  end if;

  if p_tila_johon = 'jemmassa' then
    -- Oletus: käytöstä tai myynnistä jemmaan mennyt on jäänyt pieneksi.
    v_jemma_tyyppi := coalesce(p_jemma_tyyppi, 'jaanyt_pieneksi');
  end if;

  if p_tila_johon = 'myyty' then
    if p_myyntihinta is null or p_myyntihinta < 0 then
      raise exception 'Myyntihinta puuttuu' using errcode = 'check_violation';
    end if;
    v_myyntihinta := p_myyntihinta;
    v_myyntipaiva := coalesce(p_myyntipaiva, p_paivamaara);
  end if;

  update public.vaate
  set tila = p_tila_johon,
      jemma_tyyppi = v_jemma_tyyppi,
      myyntihinta = v_myyntihinta,
      myyntipaiva = v_myyntipaiva
  where id = p_vaate_id;

  insert into public.tilamuutos (vaate_id, perhe_id, tila_josta, tila_johon, jemma_tyyppi_johon, paivamaara)
  values (p_vaate_id, v_perhe_id, v_vaate.tila, p_tila_johon, v_jemma_tyyppi, p_paivamaara)
  returning * into v_muutos;

  return v_muutos;
end;
$$;
revoke execute on function public.siirra_tila(uuid, public.tila, date, public.jemma_tyyppi, numeric, date) from public, anon;
grant execute on function public.siirra_tila(uuid, public.tila, date, public.jemma_tyyppi, numeric, date) to authenticated;

-- ---------------------------------------------------------------------------
-- Tilamuutoksen päivämäärän korjaus jälkikäteen (käyttäjä siirtää tilan usein myöhässä).
-- ---------------------------------------------------------------------------
create function public.muokkaa_tilamuutoksen_paivamaara(p_tilamuutos_id uuid, p_paivamaara date)
returns public.tilamuutos
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_perhe_id uuid := public.oma_perhe_id();
  v_muutos public.tilamuutos;
begin
  if v_perhe_id is null then
    raise exception 'Kirjautuminen vaaditaan' using errcode = 'insufficient_privilege';
  end if;
  if p_paivamaara is null then
    raise exception 'Päivämäärä puuttuu' using errcode = 'check_violation';
  end if;

  update public.tilamuutos
  set paivamaara = p_paivamaara
  where id = p_tilamuutos_id and perhe_id = v_perhe_id
  returning * into v_muutos;
  if not found then
    raise exception 'Tilamuutosta ei löydy' using errcode = 'no_data_found';
  end if;

  return v_muutos;
end;
$$;
revoke execute on function public.muokkaa_tilamuutoksen_paivamaara(uuid, date) from public, anon;
grant execute on function public.muokkaa_tilamuutoksen_paivamaara(uuid, date) to authenticated;
