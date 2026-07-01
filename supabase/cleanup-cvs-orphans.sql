-- =============================================================================
-- Nettoyage des délégués/suppléants CVS « fantômes »
-- =============================================================================
-- À exécuter UNE FOIS dans Supabase → SQL Editor.
--
-- Contexte : avant le correctif, supprimer une personne ne la retirait pas des
-- listes delegateIds / suppleantIds du groupe CVS. Ce script enlève de ces
-- listes tout id qui ne correspond plus à une personne existante.
--
-- 1) APERÇU (lecture seule) — voir quels ids seraient supprimés.
-- =============================================================================
select
  elem                              as orphan_id,
  case when d.key = 'delegateIds' then 'délégué' else 'suppléant' end as role
from groups g
cross join lateral (values ('delegateIds'), ('suppleantIds')) as d(key)
cross join lateral jsonb_array_elements_text(coalesce(g.data->d.key, '[]'::jsonb)) as elem
where (g.data->>'cvs') = 'true'
  and not exists (select 1 from people p where p.id = elem);

-- =============================================================================
-- 2) NETTOYAGE — décommentez et exécutez après avoir vérifié l'aperçu ci-dessus.
-- =============================================================================
-- update groups g
-- set data = jsonb_set(
--   jsonb_set(
--     g.data,
--     '{delegateIds}',
--     coalesce((
--       select jsonb_agg(elem)
--       from jsonb_array_elements_text(coalesce(g.data->'delegateIds', '[]'::jsonb)) as elem
--       where exists (select 1 from people p where p.id = elem)
--     ), '[]'::jsonb)
--   ),
--   '{suppleantIds}',
--   coalesce((
--     select jsonb_agg(elem)
--     from jsonb_array_elements_text(coalesce(g.data->'suppleantIds', '[]'::jsonb)) as elem
--     where exists (select 1 from people p where p.id = elem)
--   ), '[]'::jsonb)
-- )
-- where (g.data->>'cvs') = 'true';
