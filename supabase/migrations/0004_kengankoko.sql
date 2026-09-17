-- 0004 Lapsen nykyinen kengänkoko omana kenttänä.
-- Lapsella on samaan aikaan vaatekoko (esim. 110 tai XL) ja kengänkoko (esim. 25),
-- joten yksi "nykyinen koko" ei riitä. nykyinen_koko_id on jatkossa vaatekoko.

alter table public.lapsi
  add column nykyinen_kenkakoko_id uuid references public.koko (id) on delete set null;

comment on column public.lapsi.nykyinen_koko_id is 'Nykyinen vaatekoko (kokoryhmä sentti, kirjain tai yleinen)';
comment on column public.lapsi.nykyinen_kenkakoko_id is 'Nykyinen kengänkoko (kokoryhmä kenka)';

-- Sama perhetarkistus kuin vaatekoolle: järjestelmän koko tai oman perheen koko.
create trigger lapsi_kenkakoko_perhe before insert or update of nykyinen_kenkakoko_id, perhe_id on public.lapsi
  for each row execute function public.tarkista_koon_perhe('nykyinen_kenkakoko_id');

-- Kokoryhmän tarkistus: vaatekoko ei voi olla kengänkoko eikä päinvastoin.
create function public.tarkista_lapsen_kokoryhmat()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_ryhma public.kokoryhma;
begin
  if new.nykyinen_koko_id is not null then
    select ryhma into v_ryhma from public.koko where id = new.nykyinen_koko_id;
    if v_ryhma = 'kenka' then
      raise exception 'Vaatekooksi ei voi valita kengänkokoa' using errcode = 'check_violation';
    end if;
  end if;
  if new.nykyinen_kenkakoko_id is not null then
    select ryhma into v_ryhma from public.koko where id = new.nykyinen_kenkakoko_id;
    if v_ryhma is distinct from 'kenka' then
      raise exception 'Kengänkooksi pitää valita kengänkoko' using errcode = 'check_violation';
    end if;
  end if;
  return new;
end;
$$;

create trigger lapsi_kokoryhmat before insert or update of nykyinen_koko_id, nykyinen_kenkakoko_id on public.lapsi
  for each row execute function public.tarkista_lapsen_kokoryhmat();
