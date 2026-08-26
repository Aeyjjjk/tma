-- ============================================================
-- FTLMS — migration 0002: admin-editable dropdown lists
-- ============================================================
-- Adds a config_lists column to the shared app_state row, holding the
-- four dropdown lists admins can edit from the app (tyre brands,
-- equipment types, inspection observation options, action-taken
-- options) instead of them being hardcoded in the frontend.
--
-- Unlike the rest of app_state (which any authenticated user can write —
-- see 0001_init.sql), changes to config_lists specifically are restricted
-- to admins, enforced by a trigger below — not just by hiding the button
-- in the UI. Row Level Security in Postgres is row-level, not
-- column-level, so a BEFORE UPDATE trigger is the correct tool for
-- "everyone can update this row, but only admins can touch this one key."

alter table public.app_state
    add column if not exists config_lists jsonb not null default jsonb_build_object(
        'tyreBrands', '["Bridgestone","Continental","Michelin","Yokohama","Goodyear","Pirelli"]'::jsonb,
        'equipmentTypes', '["Tractor","Trailer","MHC","Forklift","Empty Handler","Reach Stacker","Light Vehicles","Crane","Truck","Other"]'::jsonb,
        'observationOptions', '[
            {"value":"good","label":"Good / Even Wear","severity":"good"},
            {"value":"uneven","label":"Uneven Wear","severity":"warning"},
            {"value":"lowtread","label":"Low Tread Depth","severity":"warning"},
            {"value":"cracking","label":"Cracking / Weathering","severity":"warning"},
            {"value":"underinflated","label":"Underinflated","severity":"warning"},
            {"value":"overinflated","label":"Overinflated","severity":"warning"},
            {"value":"bulge","label":"Bulge / Sidewall Damage","severity":"critical"},
            {"value":"puncture","label":"Puncture / Cut","severity":"critical"},
            {"value":"replace","label":"Needs Replacement","severity":"critical"}
        ]'::jsonb,
        'actionTakenOptions', '[
            {"value":"inflate","label":"Inflate Tyre"},
            {"value":"replace","label":"Replace Tyre"},
            {"value":"patch","label":"Patch Tyre"},
            {"value":"rotate","label":"Rotate Tyre"},
            {"value":"pressure_correct","label":"Pressure Correct"},
            {"value":"pressure_check","label":"Pressure Check"},
            {"value":"terminate","label":"Terminate Tyre"},
            {"value":"change_rim","label":"Change Rim"},
            {"value":"retighten_nut","label":"Retighten Nut"}
        ]'::jsonb
    );

create or replace function public.enforce_config_lists_admin_only()
returns trigger
language plpgsql
as $$
begin
    if new.config_lists is distinct from old.config_lists then
        if not exists (
            select 1 from public.profiles p
            where p.id = auth.uid() and p.is_admin = true and p.deleted = false
        ) then
            raise exception 'Only an administrator can change the dropdown lists';
        end if;
    end if;
    return new;
end;
$$;

drop trigger if exists trg_config_lists_admin_only on public.app_state;
create trigger trg_config_lists_admin_only
    before update on public.app_state
    for each row execute function public.enforce_config_lists_admin_only();
